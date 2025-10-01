#!/usr/bin/env python3
"""
Bot Strictness Configuration Tool

This tool allows you to easily configure different strictness levels for your bots.
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select

from app.db import async_session
from app.models import Bot, Scope


STRICTNESS_CONFIGS = {
    "strict": {
        "description": "Very strict - Only exact topic matches allowed",
        "use_case": "High-security environments, compliance-critical bots",
        "behavior": "Refuses anything not directly related to allowed topics"
    },
    "moderate": {
        "description": "Balanced - Smart redirection with some flexibility",
        "use_case": "Most customer-facing bots, educational assistants", 
        "behavior": "Allows related topics, redirects unrelated ones nicely"
    },
    "lenient": {
        "description": "Flexible - Very permissive with gentle guidance",
        "use_case": "General conversation bots, exploratory learning",
        "behavior": "Only blocks clearly harmful or completely unrelated topics"
    }
}


async def get_bot_by_name_or_id(identifier: str) -> Bot:
    """Get bot by name or ID."""
    async with async_session() as db:
        # Try by ID first
        result = await db.execute(
            select(Bot)
            .options(selectinload(Bot.scopes))
            .where(Bot.id == identifier)
        )
        bot = result.scalar_one_or_none()
        
        if not bot:
            # Try by name
            result = await db.execute(
                select(Bot)
                .options(selectinload(Bot.scopes))
                .where(Bot.name.ilike(f"%{identifier}%"))
            )
            bot = result.scalar_one_or_none()
        
        return bot


async def list_bots():
    """List all available bots."""
    async with async_session() as db:
        result = await db.execute(
            select(Bot)
            .options(selectinload(Bot.scopes))
            .where(Bot.is_active == True)
        )
        bots = result.scalars().all()
        
        print("Available Bots:")
        print("=" * 50)
        for bot in bots:
            scope_info = ""
            if bot.scopes:
                scope = bot.scopes[0]
                strictness = scope.guardrails.get("strictness_level", "not set") if scope.guardrails else "not set"
                scope_info = f" (Strictness: {strictness})"
            
            print(f"• {bot.name}{scope_info}")
            print(f"  ID: {bot.id}")
            if bot.description:
                print(f"  Description: {bot.description}")
            print()


async def configure_bot_strictness(bot_identifier: str, strictness_level: str):
    """Configure bot strictness level."""
    if strictness_level not in STRICTNESS_CONFIGS:
        print(f"❌ Invalid strictness level. Choose from: {', '.join(STRICTNESS_CONFIGS.keys())}")
        return
    
    bot = await get_bot_by_name_or_id(bot_identifier)
    if not bot:
        print(f"❌ Bot not found: {bot_identifier}")
        return
    
    if not bot.scopes:
        print(f"❌ Bot '{bot.name}' has no scopes configured. Please add scopes first.")
        return
    
    async with async_session() as db:
        # Refresh the bot in this session
        result = await db.execute(
            select(Bot)
            .options(selectinload(Bot.scopes))
            .where(Bot.id == bot.id)
        )
        bot = result.scalar_one_or_none()
        
        # Update the first active scope
        scope = next((s for s in bot.scopes if s.is_active), None)
        if not scope:
            print(f"❌ Bot '{bot.name}' has no active scopes.")
            return
        
        # Update guardrails
        if not scope.guardrails:
            scope.guardrails = {}
        
        old_strictness = scope.guardrails.get("strictness_level", "not set")
        scope.guardrails["strictness_level"] = strictness_level
        
        # Add response guidelines for friendly tone
        if "response_guidelines" not in scope.guardrails:
            scope.guardrails["response_guidelines"] = {}
        scope.guardrails["response_guidelines"]["maintain_friendly_tone"] = True
        
        # Remove rigid refusal message to allow smart responses
        scope.guardrails.pop("refusal_message", None)
        
        await db.commit()
        
        config = STRICTNESS_CONFIGS[strictness_level]
        print(f"✅ Updated '{bot.name}' strictness: {old_strictness} → {strictness_level}")
        print(f"📋 {config['description']}")
        print(f"🎯 Use case: {config['use_case']}")
        print(f"🤖 Behavior: {config['behavior']}")


async def show_strictness_options():
    """Show available strictness levels."""
    print("Available Strictness Levels:")
    print("=" * 40)
    for level, config in STRICTNESS_CONFIGS.items():
        print(f"🔒 {level.upper()}")
        print(f"   {config['description']}")
        print(f"   Use case: {config['use_case']}")
        print(f"   Behavior: {config['behavior']}")
        print()


async def main():
    """Main function."""
    print("🎛️  Bot Strictness Configuration Tool")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python configure_bot_strictness.py list                    # List all bots")
        print("  python configure_bot_strictness.py levels                  # Show strictness levels")
        print("  python configure_bot_strictness.py <bot_name> <level>      # Configure bot")
        print()
        print("Examples:")
        print("  python configure_bot_strictness.py list")
        print("  python configure_bot_strictness.py levels")
        print("  python configure_bot_strictness.py 'Customer Support' moderate")
        print("  python configure_bot_strictness.py 'd23ebf61-221a-4da8-b441-c3db418848ed' lenient")
        return
    
    command = sys.argv[1].lower()
    
    try:
        if command == "list":
            await list_bots()
        elif command == "levels":
            await show_strictness_options()
        elif len(sys.argv) >= 3:
            bot_identifier = sys.argv[1]
            strictness_level = sys.argv[2].lower()
            await configure_bot_strictness(bot_identifier, strictness_level)
        else:
            print("❌ Invalid command. Use 'list', 'levels', or provide bot and strictness level.")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())