#!/usr/bin/env python3
"""
Test script to verify the scope system is working correctly.

This script:
1. Creates a test bot with scope restrictions
2. Tests various queries to verify guardrails work
3. Shows the enhanced system prompt
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
from app.services.ai_provider_service import AIProviderService
from app.schemas import ChatMessage


async def test_scope_system():
    """Test the complete scope system."""
    
    async with async_session() as db:
        # Find the math bot created by our example script
        result = await db.execute(
            select(Bot)
            .options(selectinload(Bot.scopes), selectinload(Bot.ai_provider))
            .where(Bot.name == "MathTutor Pro")
        )
        math_bot = result.scalar_one_or_none()
        
        if not math_bot:
            print("❌ MathTutor Pro bot not found. Run create_math_bot_example.py first.")
            return
        
        print(f"✅ Found MathTutor Pro bot: {math_bot.id}")
        print(f"📊 Bot has {len(math_bot.scopes)} scopes configured")
        
        # Test guardrail service
        guardrail_service = GuardrailService(db)
        ai_provider_service = AIProviderService(db)
        
        # Test system prompt generation
        enhanced_prompt = await ai_provider_service._build_system_prompt(math_bot, [])
        print(f"\n📝 Enhanced System Prompt:")
        print("=" * 80)
        print(enhanced_prompt)
        print("=" * 80)
        
        # Test queries
        test_queries = [
            # Math queries (should pass)
            ("What is the derivative of x^3?", True),
            ("Solve: 2x + 5 = 15", True),
            ("Explain the Pythagorean theorem", True),
            ("How do I calculate compound interest?", True),
            
            # Non-math queries (should be blocked)
            ("What is the capital of Germany?", False),
            ("How do I cook spaghetti?", False),
            ("Tell me about the Civil War", False),
            ("What's the weather forecast?", False),
        ]
        
        print(f"\n🧪 Testing Guardrail System:")
        print("=" * 60)
        
        correct_predictions = 0
        total_tests = len(test_queries)
        
        for query, should_pass in test_queries:
            is_allowed, refusal_message = await guardrail_service.validate_query(math_bot, query)
            
            result_icon = "✅" if is_allowed else "❌"
            prediction_icon = "✅" if (is_allowed == should_pass) else "❌"
            
            print(f"\n{prediction_icon} Query: '{query}'")
            print(f"   Expected: {'ALLOW' if should_pass else 'BLOCK'}")
            print(f"   Actual: {result_icon} {'ALLOWED' if is_allowed else 'BLOCKED'}")
            
            if not is_allowed and refusal_message:
                print(f"   Refusal: {refusal_message}")
            
            if is_allowed == should_pass:
                correct_predictions += 1
        
        print(f"\n📈 Test Results:")
        print(f"   Correct predictions: {correct_predictions}/{total_tests}")
        print(f"   Accuracy: {(correct_predictions/total_tests)*100:.1f}%")
        
        if correct_predictions == total_tests:
            print("🎉 All tests passed! Scope system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check scope configuration.")
        
        # Show scope configuration details
        print(f"\n🔧 Scope Configuration Details:")
        for scope in math_bot.scopes:
            if scope.is_active:
                guardrails = scope.guardrails or {}
                print(f"\n   Scope: {scope.name}")
                
                if guardrails.get('allowed_topics'):
                    print(f"   ✅ Allowed topics: {len(guardrails['allowed_topics'])} configured")
                    print(f"      Sample: {', '.join(guardrails['allowed_topics'][:3])}...")
                
                if guardrails.get('forbidden_topics'):
                    print(f"   ❌ Forbidden topics: {len(guardrails['forbidden_topics'])} configured")
                    print(f"      Sample: {', '.join(guardrails['forbidden_topics'][:3])}...")
                
                kb = guardrails.get('knowledge_boundaries', {})
                if kb:
                    print(f"   🧠 Knowledge boundaries:")
                    print(f"      Strict mode: {kb.get('strict_mode', False)}")
                    print(f"      Context preference: {kb.get('context_preference', 'supplement')}")
                
                rg = guardrails.get('response_guidelines', {})
                if rg:
                    print(f"   📏 Response guidelines:")
                    print(f"      Max length: {rg.get('max_response_length', 'not set')}")
                    print(f"      Require citations: {rg.get('require_citations', False)}")
                    print(f"      Step-by-step: {rg.get('step_by_step', False)}")


async def main():
    """Main function."""
    print("🚀 Testing Scope & Guardrail System")
    print("=" * 50)
    
    try:
        await test_scope_system()
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())