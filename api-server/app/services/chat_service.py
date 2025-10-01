"""Chat service for handling AI model interactions."""
import os
import random
from typing import AsyncGenerator, List

import openai
import structlog
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Bot, Scope, Dataset, Document
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
                refusal_message = await self._get_scope_refusal_message(bot, user_query)
                if refusal_message:
                    logger.info(
                        "Query determined out of scope, sending dynamic refusal",
                        bot_id=bot.id,
                        query=user_query,
                        refusal_preview=refusal_message[:100] + "..." if len(refusal_message) > 100 else refusal_message
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
                refusal_message = await self._get_scope_refusal_message(bot, user_query)
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
    
    async def _get_scope_refusal_message(self, bot: Bot, user_query: str = "") -> str:
        """Generate an AI-powered, contextual refusal message for out-of-scope queries."""
        try:
            # Load bot's scopes with guardrails
            result = await self.db.execute(
                select(Scope)
                .where(Scope.bot_id == bot.id, Scope.is_active == True)
            )
            scopes = result.scalars().all()
            
            # Collect scope information
            allowed_topics = []
            scope_descriptions = []
            custom_refusal = None
            
            for scope in scopes:
                if scope.guardrails:
                    if scope.guardrails.get("refusal_message"):
                        custom_refusal = scope.guardrails["refusal_message"]
                    if scope.guardrails.get("allowed_topics"):
                        allowed_topics.extend(scope.guardrails["allowed_topics"])
                
                if scope.description:
                    scope_descriptions.append(scope.description)
                elif scope.name:
                    scope_descriptions.append(scope.name)
            
            # Generate AI-powered refusal message with knowledge base context
            return await self._generate_ai_refusal_message(
                bot, user_query, allowed_topics, scope_descriptions, custom_refusal
            )
            
        except Exception as e:
            logger.error("Error getting AI scope refusal message", error=str(e), bot_id=bot.id)
            return self._generate_fallback_refusal(bot)
    
    async def _generate_ai_refusal_message(
        self, 
        bot: Bot, 
        user_query: str, 
        allowed_topics: List[str], 
        scope_descriptions: List[str], 
        custom_refusal: str = None
    ) -> str:
        """Generate an AI-powered, contextual refusal message with knowledge base awareness."""
        try:
            # Build context for the AI
            context_parts = []
            context_parts.append(f"Bot Name: {bot.name}")
            
            if bot.system_prompt:
                context_parts.append(f"Bot Description: {bot.system_prompt[:200]}")
            
            if allowed_topics:
                context_parts.append(f"Allowed Topics: {', '.join(allowed_topics)}")
            
            if scope_descriptions:
                context_parts.append(f"Expertise Areas: {', '.join(scope_descriptions)}")
            
            # Add knowledge base information
            # Knowledge base context will be added in future enhancement
            
            # Create a prompt for generating the refusal message
            refusal_prompt = f"""You are {bot.name}, a helpful AI assistant with a specialized knowledge base. A user asked: "{user_query}"

This question is outside your scope of expertise or not found in your knowledge base. Generate a friendly, helpful refusal message that:
1. Politely declines to answer the out-of-scope question
2. Clearly explains what you CAN help with based on your expertise and knowledge base
3. Suggests specific types of questions the user could ask instead
4. Maintains a warm, professional tone
5. Keeps the response concise (under 120 words)

Context about your capabilities:
{chr(10).join(context_parts)}

{f'Base refusal guidance: {custom_refusal}' if custom_refusal else ''}

Generate a natural, conversational refusal message that guides the user toward your areas of expertise:"""

            # Call OpenAI to generate the refusal message
            response = await openai_client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use faster model for refusal messages
                messages=[
                    {"role": "user", "content": refusal_prompt}
                ],
                temperature=0.7,  # Add some creativity
                max_tokens=200
            )
            
            ai_refusal = response.choices[0].message.content.strip()
            
            logger.info(
                "Generated AI refusal message",
                bot_id=bot.id,
                query=user_query[:50],
                response_length=len(ai_refusal)
            )
            
            return ai_refusal
            
        except Exception as e:
            logger.error("Failed to generate AI refusal message", error=str(e), bot_id=bot.id)
            # Fallback to enhanced static message
            return self._enhance_refusal_message_fallback(custom_refusal or "I can help with my specialized areas.", allowed_topics)
    
    def _enhance_refusal_message_fallback(self, base_message: str, allowed_topics: List[str]) -> str:
        """Fallback enhancement for when AI generation fails."""
        enhanced = base_message
        
        if allowed_topics:
            # Add some topic suggestions
            num_suggestions = min(3, len(allowed_topics))
            suggestions = random.sample(allowed_topics, num_suggestions)
            
            if len(suggestions) == 1:
                enhanced += f" I can help with {suggestions[0]}."
            elif len(suggestions) == 2:
                enhanced += f" I can help with {suggestions[0]} and {suggestions[1]}."
            else:
                enhanced += f" I can help with {', '.join(suggestions[:-1])}, and {suggestions[-1]}."
        
        enhanced += " How can I assist you?"
        return enhanced
    
    async def _get_knowledge_base_summary(self, bot: Bot) -> str:
        
        # Look for related topics
        for topic in allowed_topics:
            topic_lower = topic.lower()
            # Check if there's any word similarity or if it might be related
            if any(keyword in query_lower for keyword in query_keywords):
                suggestions.append(f"Ask me about {topic}")
        
        # Limit to 3 suggestions to avoid overwhelming
        return suggestions[:3]
    
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