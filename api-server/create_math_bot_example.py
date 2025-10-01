#!/usr/bin/env python3
"""
Example script for creating a math-focused bot with scope restrictions.

This script demonstrates how to:
1. Create a bot specialized in mathematics
2. Configure guardrails to restrict topics to math-related queries only
3. Set up knowledge boundaries to use only provided context
4. Test the bot's responses to different types of questions
"""
import asyncio
import json
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select

from app.db import async_session
from app.models import Bot, Scope, TenantAIProvider, Tenant
from app.services.guardrail_service import GuardrailService
from app.schemas import ChatMessage


async def create_math_bot_with_restrictions():
    """Create a math-focused bot with proper scope restrictions."""
    
    async with async_session() as db:
        # Find first available tenant and AI provider
        result = await db.execute(
            select(Tenant).limit(1)
        )
        tenant = result.scalar_one_or_none()
        
        if not tenant:
            print("No tenant found. Please create a tenant first.")
            return None
        
        # Find AI provider for tenant
        result = await db.execute(
            select(TenantAIProvider).where(
                TenantAIProvider.tenant_id == tenant.id,
                TenantAIProvider.is_active == True
            ).limit(1)
        )
        ai_provider = result.scalar_one_or_none()
        
        if not ai_provider:
            print("No active AI provider found for tenant. Please configure one first.")
            return None
        
        # Create math bot
        math_bot = Bot(
            tenant_id=tenant.id,
            tenant_ai_provider_id=ai_provider.id,
            name="MathTutor Pro",
            description="A specialized math tutor that helps with mathematical concepts, problems, and explanations",
            system_prompt="""You are MathTutor Pro, an expert mathematics assistant. Your primary role is to help users with:

- Arithmetic operations (addition, subtraction, multiplication, division)
- Algebra (equations, inequalities, polynomials)
- Geometry (shapes, theorems, proofs)
- Calculus (limits, derivatives, integrals)
- Statistics and probability
- Mathematical problem solving and step-by-step solutions
- Mathematical concepts and explanations

Always provide clear, step-by-step explanations for mathematical problems. Use proper mathematical notation when helpful. If asked about topics outside mathematics, politely redirect the conversation back to math-related topics.""",
            model="gpt-3.5-turbo",
            temperature=0.3,  # Lower temperature for more consistent math responses
            max_tokens=1000,
            is_active=True,
            is_public=True,
            settings={
                "specialty": "mathematics",
                "education_level": "all_levels"
            }
        )
        
        db.add(math_bot)
        await db.commit()
        await db.refresh(math_bot)
        
        # Create scope with guardrails
        math_scope = Scope(
            bot_id=math_bot.id,
            name="mathematics_only",
            description="Restricts bot to mathematics topics only",
            guardrails={
                "allowed_topics": [
                    "mathematics", "math", "algebra", "geometry", "calculus", 
                    "arithmetic", "statistics", "probability", "equations", 
                    "numbers", "fractions", "decimals", "percentages",
                    "trigonometry", "logarithms", "linear algebra", "matrices",
                    "mathematical proofs", "mathematical theorems", 
                    "problem solving", "word problems", "mathematical concepts"
                ],
                "forbidden_topics": [
                    "biology", "chemistry", "physics", "history", "geography",
                    "literature", "politics", "religion", "philosophy",
                    "sports", "entertainment", "cooking", "travel", "business",
                    "technology", "programming", "medicine", "law", "art"
                ],
                "knowledge_boundaries": {
                    "strict_mode": False,  # Allow general math knowledge beyond just context
                    "allowed_sources": ["textbooks", "mathematical references", "educational materials"],
                    "context_preference": "supplement"  # Use context to supplement, not replace knowledge
                },
                "response_guidelines": {
                    "max_response_length": 800,
                    "require_citations": False,  # Math explanations don't always need citations
                    "step_by_step": True,
                    "mathematical_notation": True
                },
                "refusal_message": "I'm MathTutor Pro, and I specialize in mathematics. I can help you with math problems, concepts, and explanations. Please ask me something related to mathematics, such as algebra, geometry, calculus, statistics, or any mathematical problem you'd like to solve!"
            },
            is_active=True
        )
        
        db.add(math_scope)
        await db.commit()
        await db.refresh(math_scope)
        
        print(f"✅ Created math bot: {math_bot.id}")
        print(f"✅ Created math scope: {math_scope.id}")
        
        return math_bot.id, math_scope.id


async def test_math_bot_restrictions(bot_id: str):
    """Test the math bot with various queries to verify restrictions work."""
    
    async with async_session() as db:
        # Load bot with scopes
        result = await db.execute(
            select(Bot)
            .options(selectinload(Bot.scopes))
            .where(Bot.id == bot_id)
        )
        bot = result.scalar_one_or_none()
        
        if not bot:
            print("Bot not found!")
            return
        
        guardrail_service = GuardrailService(db)
        
        # Test queries
        test_queries = [
            # These should be ALLOWED (math-related)
            ("What is the derivative of x^2?", True),
            ("How do I solve quadratic equations?", True),
            ("Explain the Pythagorean theorem", True),
            ("What is 15% of 200?", True),
            ("Help me understand limits in calculus", True),
            
            # These should be BLOCKED (non-math topics)
            ("What is the capital of France?", False),
            ("How do I cook pasta?", False),
            ("Tell me about World War II", False),
            ("What's the weather like today?", False),
            ("How do I start a business?", False),
        ]
        
        print(f"\n🧪 Testing Math Bot Restrictions for Bot: {bot.name}")
        print("=" * 60)
        
        for query, should_be_allowed in test_queries:
            is_allowed, refusal_message = await guardrail_service.validate_query(bot, query)
            
            status = "✅ ALLOWED" if is_allowed else "❌ BLOCKED"
            expected = "✅ Expected" if (is_allowed == should_be_allowed) else "❌ Unexpected"
            
            print(f"\nQuery: '{query}'")
            print(f"Result: {status} | {expected}")
            
            if not is_allowed:
                print(f"Refusal: {refusal_message}")
        
        print("\n" + "=" * 60)
        
        # Test system prompt generation
        system_prompt_additions = guardrail_service.build_knowledge_restriction_prompt(bot)
        print(f"\n📝 Generated System Prompt Additions:")
        print(system_prompt_additions)


async def main():
    """Main function to demonstrate math bot configuration."""
    print("🚀 Creating Math Bot with Scope Restrictions")
    print("=" * 50)
    
    try:
        # Create the math bot
        result = await create_math_bot_with_restrictions()
        
        if result:
            bot_id, scope_id = result
            print(f"\n📋 Configuration Summary:")
            print(f"Bot ID: {bot_id}")
            print(f"Scope ID: {scope_id}")
            
            # Test the restrictions
            await test_math_bot_restrictions(bot_id)
            
            print(f"\n🎯 Next Steps:")
            print(f"1. Use Bot ID '{bot_id}' in your chat requests")
            print(f"2. The bot will only respond to math-related questions")
            print(f"3. Non-math queries will be politely refused")
            print(f"4. You can modify the scope via the API at /v1/bots/{bot_id}/scopes/{scope_id}")
            
        else:
            print("Failed to create math bot. Check the requirements above.")
            
    except Exception as e:
        print(f"Error creating math bot: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())