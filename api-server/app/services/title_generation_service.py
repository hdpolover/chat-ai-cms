"""Title generation service for automatic conversation titles."""
import asyncio
from typing import List, Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select

from ..models import Conversation, Message, Bot
from ..schemas import ChatMessage, TokenUsage
from .ai_provider_service import AIProviderService

logger = structlog.get_logger()


class TitleGenerationService:
    """Service for generating contextual conversation titles using AI."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_provider_service = AIProviderService(db)

    async def generate_title_for_conversation(
        self, 
        conversation_id: str,
        force_regenerate: bool = False
    ) -> Optional[str]:
        """
        Generate a contextual title for a conversation based on its messages.
        
        Args:
            conversation_id: The conversation ID to generate title for
            force_regenerate: Whether to regenerate title even if one exists
            
        Returns:
            Generated title string or None if generation failed
        """
        try:
            # Get conversation with bot and messages
            result = await self.db.execute(
                select(Conversation)
                .where(Conversation.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                logger.warning("Conversation not found for title generation", conversation_id=conversation_id)
                return None
            
            # Skip if title already exists and not forcing regeneration
            if conversation.title and not force_regenerate:
                logger.debug("Title already exists, skipping generation", conversation_id=conversation_id)
                return conversation.title
            
            # Get bot information with AI provider
            from sqlalchemy.orm import selectinload
            result = await self.db.execute(
                select(Bot)
                .options(selectinload(Bot.ai_provider))
                .where(Bot.id == conversation.bot_id)
            )
            bot = result.scalar_one_or_none()
            
            if not bot:
                logger.warning("Bot not found for title generation", 
                             bot_id=conversation.bot_id, conversation_id=conversation_id)
                return None
                
            if not bot.ai_provider:
                logger.warning("AI provider not found for bot", 
                             bot_id=conversation.bot_id, conversation_id=conversation_id)
                return None
            
            # Get conversation messages (first few exchanges to determine topic)
            result = await self.db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.sequence_number.asc())
                .limit(6)  # First 3 exchanges (user + assistant pairs)
            )
            messages = result.scalars().all()
            
            if len(messages) < 2:  # Need at least user + assistant message
                logger.debug("Not enough messages for title generation", 
                           conversation_id=conversation_id, message_count=len(messages))
                return None
            
            # Generate title using AI
            generated_title = await self._generate_title_from_messages(bot, messages)
            
            if generated_title:
                # Update conversation with generated title
                conversation.title = generated_title
                try:
                    await self.db.commit()
                    logger.info("Generated conversation title", 
                              conversation_id=conversation_id, title=generated_title)
                    return generated_title
                except Exception as commit_error:
                    logger.error("Failed to save generated title to database", 
                               conversation_id=conversation_id, error=str(commit_error))
                    await self.db.rollback()
                    return None
                
        except Exception as e:
            logger.error("Failed to generate conversation title", 
                        conversation_id=conversation_id, error=str(e))
            return None

    async def _generate_title_from_messages(
        self, 
        bot: Bot, 
        messages: List[Message]
    ) -> Optional[str]:
        """
        Generate a concise title from conversation messages using AI.
        
        Args:
            bot: The bot instance with AI provider
            messages: List of conversation messages
            
        Returns:
            Generated title string or None if generation failed
        """
        try:
            # Build conversation context for title generation
            conversation_text = []
            for msg in messages[:4]:  # Use first 2 exchanges maximum
                if msg.role == "user":
                    conversation_text.append(f"User: {msg.content}")
                elif msg.role == "assistant":
                    conversation_text.append(f"Assistant: {msg.content}")
            
            context = "\n".join(conversation_text)
            
            # Create title generation prompt
            title_prompt = self._build_title_generation_prompt(context)
            
            # Prepare messages for AI provider
            title_messages = [
                ChatMessage(role="system", content=title_prompt),
                ChatMessage(role="user", content=f"Conversation to summarize:\n\n{context}")
            ]
            
            # Generate title using the bot's AI provider
            response_message, _ = await self.ai_provider_service.generate_response(
                bot=bot,
                messages=title_messages,
                context_citations=None,
                metadata={"task": "title_generation"}
            )
            
            # Clean and validate the generated title
            title = self._clean_generated_title(response_message.content)
            
            logger.debug("Generated raw title", raw_title=response_message.content, cleaned_title=title)
            
            return title
            
        except Exception as e:
            logger.error("Failed to generate title from messages", error=str(e))
            return None

    def _build_title_generation_prompt(self, context: str) -> str:
        """Build the system prompt for title generation."""
        return """You are a helpful assistant that generates concise, descriptive titles for conversations.

Your task is to analyze the conversation and create a short, meaningful title that captures the main topic or question being discussed.

Guidelines:
- Keep titles between 3-8 words
- Make titles descriptive and specific
- Avoid generic titles like "Chat" or "Conversation"
- Focus on the main topic, question, or problem being discussed
- Use title case (capitalize important words)
- Don't use quotes around the title
- If it's a question, you can include "About" or similar prepositions

Examples:
- "Python List Comprehension Help"
- "Database Query Optimization Tips"  
- "React Component State Management"
- "Travel Recommendations for Tokyo"
- "Recipe for Chocolate Cake"
- "Investment Portfolio Advice"

Respond with ONLY the title, nothing else."""

    def _clean_generated_title(self, raw_title: str) -> Optional[str]:
        """Clean and validate the generated title."""
        if not raw_title:
            return None
        
        # Clean the title
        title = raw_title.strip()
        
        # Remove quotes if present
        if title.startswith('"') and title.endswith('"'):
            title = title[1:-1]
        if title.startswith("'") and title.endswith("'"):
            title = title[1:-1]
        
        # Remove common prefixes that might be added
        prefixes_to_remove = [
            "Title: ", "TITLE: ", "title: ",
            "Generated title: ", "Conversation title: ",
            "Chat title: ", "Topic: ", "TOPIC: "
        ]
        
        for prefix in prefixes_to_remove:
            if title.startswith(prefix):
                title = title[len(prefix):].strip()
                break
        
        # Validate length and content
        if len(title) < 3 or len(title) > 100:
            logger.warning("Generated title length invalid", title=title, length=len(title))
            return None
        
        # Ensure it's not just generic text
        generic_titles = [
            "conversation", "chat", "discussion", "talk", 
            "question", "help", "assistance", "support"
        ]
        
        if title.lower().strip() in generic_titles:
            logger.warning("Generated title too generic", title=title)
            return None
        
        return title

    async def generate_title_async(self, conversation_id: str) -> None:
        """
        Generate title asynchronously without blocking the main request.
        This can be called from background tasks.
        """
        try:
            await self.generate_title_for_conversation(conversation_id)
        except Exception as e:
            logger.error("Background title generation failed", 
                        conversation_id=conversation_id, error=str(e))

    async def regenerate_titles_batch(
        self, 
        conversation_ids: List[str],
        max_concurrent: int = 3
    ) -> dict:
        """
        Regenerate titles for multiple conversations in batch with concurrency limit.
        
        Args:
            conversation_ids: List of conversation IDs to process
            max_concurrent: Maximum number of concurrent title generations
            
        Returns:
            Dictionary with results and statistics
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        results = {"success": [], "failed": [], "total": len(conversation_ids)}
        
        async def generate_single(conv_id: str):
            async with semaphore:
                try:
                    title = await self.generate_title_for_conversation(
                        conv_id, force_regenerate=True
                    )
                    if title:
                        results["success"].append({"conversation_id": conv_id, "title": title})
                    else:
                        results["failed"].append({"conversation_id": conv_id, "error": "No title generated"})
                except Exception as e:
                    results["failed"].append({"conversation_id": conv_id, "error": str(e)})
        
        # Execute batch generation with concurrency control
        await asyncio.gather(*[generate_single(conv_id) for conv_id in conversation_ids])
        
        logger.info("Batch title regeneration completed", 
                   total=results["total"], 
                   success=len(results["success"]), 
                   failed=len(results["failed"]))
        
        return results