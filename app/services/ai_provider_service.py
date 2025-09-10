"""AI Provider service for handling multiple AI providers."""
from typing import AsyncGenerator, Dict, List, Optional

import openai
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import AIProvider, Bot
from ..schemas import ChatMessage, TokenUsage

logger = structlog.get_logger()


class AIProviderService:
    """Service for managing different AI providers."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_client(self, ai_provider: AIProvider):
        """Get the appropriate AI client based on provider."""
        if ai_provider.provider_name == "openai":
            return openai.AsyncOpenAI(
                api_key=ai_provider.api_key,
                base_url=ai_provider.base_url,
                organization=ai_provider.settings.get("organization")
            )
        elif ai_provider.provider_name == "anthropic":
            # TODO: Implement Anthropic client
            # import anthropic
            # return anthropic.AsyncAnthropic(
            #     api_key=ai_provider.api_key,
            #     base_url=ai_provider.base_url
            # )
            raise NotImplementedError("Anthropic provider not implemented yet")
        elif ai_provider.provider_name == "google":
            # TODO: Implement Google/Gemini client
            raise NotImplementedError("Google provider not implemented yet")
        else:
            raise ValueError(f"Unsupported AI provider: {ai_provider.provider_name}")

    async def generate_response(
        self,
        bot: Bot,
        messages: List[ChatMessage],
        context_citations: List = None,
        metadata: dict = None,
    ) -> tuple[ChatMessage, TokenUsage]:
        """Generate response using the bot's AI provider."""
        if not bot.ai_provider:
            raise ValueError(f"Bot {bot.id} has no AI provider configured")

        ai_provider = bot.ai_provider
        client = await self.get_client(ai_provider)

        # Build system prompt
        system_prompt = await self._build_system_prompt(bot, context_citations)

        # Prepare messages for API
        api_messages = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})

        try:
            if ai_provider.provider_name == "openai":
                return await self._generate_openai_response(
                    client, bot, api_messages, ai_provider
                )
            # Add other providers here
            else:
                raise ValueError(f"Unsupported provider: {ai_provider.provider_name}")

        except Exception as e:
            logger.error(
                "Failed to generate response",
                error=str(e),
                bot_id=bot.id,
                provider=ai_provider.provider_name,
            )
            raise

    async def generate_response_stream(
        self,
        bot: Bot,
        messages: List[ChatMessage],
        context_citations: List = None,
        metadata: dict = None,
    ) -> AsyncGenerator:
        """Generate streaming response using the bot's AI provider."""
        if not bot.ai_provider:
            raise ValueError(f"Bot {bot.id} has no AI provider configured")

        ai_provider = bot.ai_provider
        client = await self.get_client(ai_provider)

        # Build system prompt
        system_prompt = await self._build_system_prompt(bot, context_citations)

        # Prepare messages for API
        api_messages = []
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})

        try:
            if ai_provider.provider_name == "openai":
                async for chunk in self._generate_openai_stream(
                    client, bot, api_messages, ai_provider
                ):
                    yield chunk
            else:
                raise ValueError(f"Unsupported provider: {ai_provider.provider_name}")

        except Exception as e:
            logger.error(
                "Failed to generate streaming response",
                error=str(e),
                bot_id=bot.id,
                provider=ai_provider.provider_name,
            )
            raise

    async def _generate_openai_response(
        self, client: openai.AsyncOpenAI, bot: Bot, api_messages: List[Dict], ai_provider: AIProvider
    ) -> tuple[ChatMessage, TokenUsage]:
        """Generate response using OpenAI."""
        logger.info(
            "Making OpenAI API call",
            model=bot.model,
            message_count=len(api_messages),
            provider_id=ai_provider.id,
        )

        response = await client.chat.completions.create(
            model=bot.model,
            messages=api_messages,
            temperature=bot.temperature,
            max_tokens=bot.max_tokens or ai_provider.settings.get("max_tokens", 4000),
        )

        assistant_message = response.choices[0].message.content
        usage = TokenUsage(
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            total_tokens=response.usage.total_tokens,
        )

        logger.info(
            "Generated OpenAI response",
            bot_id=bot.id,
            model=bot.model,
            provider=ai_provider.provider_name,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
        )

        return ChatMessage(role="assistant", content=assistant_message), usage

    async def _generate_openai_stream(
        self, client: openai.AsyncOpenAI, bot: Bot, api_messages: List[Dict], ai_provider: AIProvider
    ):
        """Generate streaming response using OpenAI."""
        from .chat_service import ChatStreamChunk

        logger.info(
            "Making OpenAI streaming API call",
            model=bot.model,
            message_count=len(api_messages),
            provider_id=ai_provider.id,
        )

        stream = await client.chat.completions.create(
            model=bot.model,
            messages=api_messages,
            temperature=bot.temperature,
            max_tokens=bot.max_tokens or ai_provider.settings.get("max_tokens", 4000),
            stream=True,
        )

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

    async def _build_system_prompt(
        self, bot: Bot, context_citations: List = None
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