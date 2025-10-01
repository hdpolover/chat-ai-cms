"""Chat service for handling AI model interactions."""
import os
from typing import AsyncGenerator, List

import openai
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Bot, Scope
from ..schemas import ChatMessage, Citation, TokenUsage

logger = structlog.get_logger()

# OpenAI client
openai_client = openai.AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


class ChatStreamChunk:
    """Represents a chunk in streaming response."""
    def __init__(self, content: str = "", usage: TokenUsage = None):
        self.content = content
        self.usage = usage


class ChatService:
    """Service for handling chat interactions with AI models."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_response(
        self,
        bot: Bot,
        messages: List[ChatMessage],
        context_citations: List[Citation] = None,
        metadata: dict = None,
    ) -> tuple[ChatMessage, TokenUsage]:
        """Generate a single response from the AI model."""
        # Only check scope enforcement if no context found AND query seems out of scope
        # Math questions without citations should still be allowed for math bots
        if not context_citations or len(context_citations) == 0:
            user_query = messages[-1].content if messages else ""
            logger.info(
                "No citations found, checking scope enforcement",
                bot_id=bot.id,
                query=user_query,
                citations_count=len(context_citations) if context_citations else 0
            )
            
            # Only check scope enforcement for queries that seem clearly out of domain
            if await self._is_query_out_of_scope(bot, user_query):
                refusal_message = await self._get_scope_refusal_message(bot)
                if refusal_message:
                    logger.info(
                        "Query determined out of scope, sending refusal",
                        bot_id=bot.id,
                        query=user_query
                    )
                    # Return refusal message instead of AI response
                    return ChatMessage(role="assistant", content=refusal_message), TokenUsage(
                        prompt_tokens=0, completion_tokens=len(refusal_message.split()), total_tokens=len(refusal_message.split())
                    )
            else:
                logger.info(
                    "Query determined in scope, allowing AI response",
                    bot_id=bot.id,
                    query=user_query
                )
        
        # Build system prompt with context and scope awareness
        system_prompt = await self._build_system_prompt(bot, context_citations)
        
        # Prepare messages for API
        api_messages = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})
        
        try:
            # Log the API call details
            logger.info(
                "Making OpenAI API call",
                model=bot.model,
                message_count=len(api_messages),
                api_key_prefix=openai_client.api_key[:20] + "..." if openai_client.api_key else "None"
            )
            
            # Call OpenAI API
            response = await openai_client.chat.completions.create(
                model=bot.model,
                messages=api_messages,
                temperature=bot.temperature,
                max_tokens=bot.max_tokens,
            )
            
            # Extract response
            assistant_message = response.choices[0].message.content
            usage = TokenUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens,
            )
            
            logger.info(
                "Generated chat response",
                bot_id=bot.id,
                model=bot.model,
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
            )
            
            return ChatMessage(role="assistant", content=assistant_message), usage
            
        except openai.RateLimitError as e:
            # Log the actual OpenAI error and re-raise to see it
            logger.error("OpenAI RateLimitError", error=str(e), full_error=repr(e))
            raise
        except openai.AuthenticationError as e:
            # Log authentication errors
            logger.error("OpenAI AuthenticationError", error=str(e), full_error=repr(e))
            raise
        except openai.APIError as e:
            # Log other API errors
            logger.error("OpenAI APIError", error=str(e), full_error=repr(e))
            raise
            
        except Exception as e:
            logger.error("Failed to generate response", error=str(e), bot_id=bot.id)
            raise
    
    async def generate_response_stream(
        self,
        bot: Bot,
        messages: List[ChatMessage],
        context_citations: List[Citation] = None,
        metadata: dict = None,
    ) -> AsyncGenerator[ChatStreamChunk, None]:
        """Generate streaming response from the AI model."""
        # Only check scope enforcement if no context found AND query seems out of scope
        if not context_citations or len(context_citations) == 0:
            user_query = messages[-1].content if messages else ""
            # Only check scope enforcement for queries that seem clearly out of domain
            if await self._is_query_out_of_scope(bot, user_query):
                refusal_message = await self._get_scope_refusal_message(bot)
                if refusal_message:
                    # Yield refusal message as single chunk
                    yield ChatStreamChunk(content=refusal_message)
                    yield ChatStreamChunk(usage=TokenUsage(
                        prompt_tokens=0, completion_tokens=len(refusal_message.split()), total_tokens=len(refusal_message.split())
                    ))
                    return
        
        # Build system prompt with context and scope awareness
        system_prompt = await self._build_system_prompt(bot, context_citations)
        
        # Prepare messages for API
        api_messages = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})
        
        try:
            # Call OpenAI streaming API
            stream = await openai_client.chat.completions.create(
                model=bot.model,
                messages=api_messages,
                temperature=bot.temperature,
                max_tokens=bot.max_tokens,
                stream=True,
            )
            
            total_tokens = 0
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield ChatStreamChunk(content=content)
                
                # Handle usage info in final chunk
                if chunk.usage:
                    usage = TokenUsage(
                        prompt_tokens=chunk.usage.prompt_tokens,
                        completion_tokens=chunk.usage.completion_tokens,
                        total_tokens=chunk.usage.total_tokens,
                    )
                    yield ChatStreamChunk(usage=usage)
            
            logger.info(
                "Generated streaming chat response",
                bot_id=bot.id,
                model=bot.model,
            )
            
        except Exception as e:
            logger.error("Failed to generate streaming response", error=str(e), bot_id=bot.id)
            raise
    
    async def _build_system_prompt(
        self,
        bot: Bot,
        context_citations: List[Citation] = None,
    ) -> str:
        """Build system prompt with context and bot configuration."""
        parts = []
        
        # Add bot's system prompt
        if bot.system_prompt:
            parts.append(bot.system_prompt)
        
        # Add scope-specific instructions
        scope_instructions = await self._get_scope_instructions(bot)
        if scope_instructions:
            parts.append(scope_instructions)
        
        # Add context from citations
        if context_citations:
            context_parts = [
                "Here is relevant context from your knowledge base to help answer the user's question:",
                "",
            ]
            
            for i, citation in enumerate(context_citations, 1):
                context_parts.append(f"Source {i}: {citation.document_title}")
                context_parts.append(citation.content)
                context_parts.append("")
            
            context_parts.append(
                "Please use this context to provide accurate and helpful responses. "
                "Always cite your sources when using information from the context. "
                "Stay within the boundaries of the provided knowledge."
            )
            
            parts.append("\n".join(context_parts))
        
        return "\n\n".join(parts) if parts else ""
    
    async def _is_query_out_of_scope(self, bot: Bot, user_query: str) -> bool:
        """Check if a query is clearly outside the bot's configured scope."""
        try:
            # Load bot's scopes to check allowed topics
            result = await self.db.execute(
                select(Scope)
                .where(Scope.bot_id == bot.id, Scope.is_active == True)
            )
            scopes = result.scalars().all()
            
            if not scopes:
                # No scopes configured - allow all questions
                return False
            
            query_lower = user_query.lower()
            
            # Check if query matches any allowed topics
            for scope in scopes:
                guardrails = scope.guardrails or {}
                
                # Check allowed topics from guardrails
                allowed_topics = guardrails.get("allowed_topics", [])
                for topic in allowed_topics:
                    if topic.lower() in query_lower:
                        return False  # Query is within scope
                
                # Check forbidden topics from guardrails
                forbidden_topics = guardrails.get("forbidden_topics", [])
                for topic in forbidden_topics:
                    if topic.lower() in query_lower:
                        return True  # Query is explicitly forbidden
            
            # Check for clearly out-of-domain topics
            clearly_out_of_scope = [
                "weather", "forecast", "temperature", "rain", "snow",
                "cooking", "recipe", "food", "restaurant", 
                "sports", "game", "score", "team",
                "movie", "film", "actor", "cinema",
                "politics", "election", "government", "president",
                "medical", "doctor", "health", "medicine", "symptom",
                "legal", "law", "lawyer", "court", "lawsuit"
            ]
            
            # Check for math-related follow-up phrases (should be allowed for math bots)
            math_follow_up_phrases = [
                "show me", "example", "how do", "can you", "what if",
                "explain", "tell me", "help me", "demonstrate"
            ]
            
            # If it's a clearly out-of-scope topic, block it
            for indicator in clearly_out_of_scope:
                if indicator in query_lower:
                    return True
            
            # For math bots, allow common follow-up questions even without specific math terms
            bot_name_lower = bot.name.lower()
            logger.info(
                "Checking bot name for math terms",
                bot_id=bot.id,
                bot_name=bot.name,
                bot_name_lower=bot_name_lower,
                query=user_query
            )
            
            if any(term in bot_name_lower for term in ["math", "tutor", "algebra", "calculus"]):
                # Allow common follow-up phrases for math bots
                for phrase in math_follow_up_phrases:
                    if phrase in query_lower:
                        logger.info(
                            "Allowing math follow-up question",
                            bot_id=bot.id,
                            query=user_query,
                            phrase_matched=phrase
                        )
                        return False
                
                # If no specific phrases matched, log this
                logger.info(
                    "Math bot but no follow-up phrase matched",
                    bot_id=bot.id,
                    query=user_query,
                    query_lower=query_lower,
                    follow_up_phrases=math_follow_up_phrases
                )
            
            # If we can't determine and no clear out-of-scope indicators, assume in scope
            return False
            
        except Exception as e:
            logger.error("Error checking if query is out of scope", error=str(e), bot_id=bot.id)
            return False  # On error, assume in scope to avoid blocking
    
    async def _get_scope_refusal_message(self, bot: Bot) -> str:
        """Get the configured refusal message for out-of-scope queries."""
        try:
            # Load bot's scopes with guardrails
            result = await self.db.execute(
                select(Scope)
                .where(Scope.bot_id == bot.id, Scope.is_active == True)
            )
            scopes = result.scalars().all()
            
            # Look for a configured refusal message
            for scope in scopes:
                if scope.guardrails and scope.guardrails.get("refusal_message"):
                    return scope.guardrails["refusal_message"]
            
            # Default refusal message if none configured
            return "I can help with questions related to my knowledge base. For other matters, please contact support or ask to speak with a human agent."
            
        except Exception as e:
            logger.error("Error getting scope refusal message", error=str(e), bot_id=bot.id)
            return "I can help with questions related to my knowledge base. For other matters, please contact support or ask to speak with a human agent."
    
    async def _get_scope_instructions(self, bot: Bot) -> str:
        """Get scope-specific instructions for the system prompt."""
        try:
            # Load bot's scopes
            result = await self.db.execute(
                select(Scope)
                .where(Scope.bot_id == bot.id, Scope.is_active == True)
            )
            scopes = result.scalars().all()
            
            if not scopes:
                return ""
            
            instructions = []
            instructions.append("IMPORTANT GUIDELINES:")
            instructions.append("- Only answer questions that relate to your configured knowledge domains")
            instructions.append("- Use ONLY the information provided in your knowledge base context")
            instructions.append("- If no relevant context is provided, politely decline to answer")
            instructions.append("- Always stay within your defined scope boundaries")
            
            # Add scope-specific instructions
            scope_areas = []
            for scope in scopes:
                if scope.description:
                    scope_areas.append(f"- {scope.description}")
                elif scope.name:
                    scope_areas.append(f"- {scope.name}")
            
            if scope_areas:
                instructions.append("\nYour expertise areas include:")
                instructions.extend(scope_areas)
            
            return "\n".join(instructions)
            
        except Exception as e:
            logger.error("Error getting scope instructions", error=str(e), bot_id=bot.id)
            return ""