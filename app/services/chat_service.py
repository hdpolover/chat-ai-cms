"""Chat service for handling AI model interactions."""
import os
from typing import AsyncGenerator, List

import openai
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Bot
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
        # Build system prompt with context
        system_prompt = await self._build_system_prompt(bot, context_citations)
        
        # Prepare messages for API
        api_messages = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})
        
        try:
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
        # Build system prompt with context
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
        
        # Add context from citations
        if context_citations:
            context_parts = [
                "Here is relevant context to help answer the user's question:",
                "",
            ]
            
            for i, citation in enumerate(context_citations, 1):
                context_parts.append(f"Source {i}: {citation.document_title}")
                context_parts.append(citation.content)
                context_parts.append("")
            
            context_parts.append(
                "Please use this context to provide accurate and helpful responses. "
                "Always cite your sources when using information from the context."
            )
            
            parts.append("\n".join(context_parts))
        
        return "\n\n".join(parts) if parts else ""