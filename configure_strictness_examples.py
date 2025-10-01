#!/usr/bin/env python3
"""
Configuration Examples for Bot Strictness Levels

This script demonstrates how to configure different strictness levels
for your bots to control how they handle off-topic questions.

Strictness Levels:
- STRICT: Firmly redirects off-topic questions
- MODERATE: Politely guides back to topic with some flexibility
- LENIENT: Gently suggests staying on topic but maintains friendly tone

Usage: python configure_strictness_examples.py
"""

import requests
import json

API_BASE = "http://localhost:8000"

def update_bot_strictness(bot_id, strictness_level, allowed_topics=None, forbidden_topics=None):
    """Update bot's strictness level and scope configuration"""
    
    # Get current scope configuration
    response = requests.get(f"{API_BASE}/api/admin/bots/{bot_id}/scopes")
    if response.status_code != 200:
        print(f"❌ Failed to get current scope: {response.text}")
        return False
    
    current_scopes = response.json()
    
    # Update the first scope (or create if none exists)
    if current_scopes:
        scope_data = {
            "strictness_level": strictness_level,
            "allowed_topics": allowed_topics or current_scopes[0].get("allowed_topics", []),
            "forbidden_topics": forbidden_topics or [],
            "refusal_message": None  # Use smart responses instead
        }
        
        # Update existing scope
        response = requests.put(
            f"{API_BASE}/api/admin/bots/{bot_id}/scopes/{current_scopes[0]['id']}",
            json=scope_data
        )
    else:
        # Create new scope
        scope_data = {
            "strictness_level": strictness_level,
            "allowed_topics": allowed_topics or [],
            "forbidden_topics": forbidden_topics or [],
            "refusal_message": None
        }
        
        response = requests.post(
            f"{API_BASE}/api/admin/bots/{bot_id}/scopes",
            json=scope_data
        )
    
    if response.status_code in [200, 201]:
        print(f"✅ Updated bot {bot_id} to {strictness_level} strictness")
        return True
    else:
        print(f"❌ Failed to update strictness: {response.text}")
        return False

def test_bot_response(bot_id, question, description):
    """Test how bot responds to a specific question"""
    print(f"\n🧪 Testing: {description}")
    print(f"Question: {question}")
    
    response = requests.post(
        f"{API_BASE}/v1/chat/public",
        json={
            "bot_id": bot_id,
            "messages": [{"role": "user", "content": question}],
            "session_id": None,
            "metadata": {"source": "test"}
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {data['message']['content'][:200]}...")
    else:
        print(f"❌ Error: {response.text}")

def demonstrate_strictness_levels():
    """Demonstrate different strictness levels with examples"""
    
    # Example bot IDs (replace with your actual bot IDs)
    MATH_BOT_ID = "760f0f2b-5f67-48a9-940a-870f94a3c2f3"  # Your math bot
    
    print("🎯 Bot Strictness Level Configuration Examples")
    print("=" * 60)
    
    # 1. STRICT Configuration
    print("\n📋 1. STRICT Configuration (Firm Boundaries)")
    print("   - Use for: Professional/specialized bots")
    print("   - Behavior: Firmly redirects off-topic questions")
    
    if input("Configure math bot as STRICT? (y/n): ").lower() == 'y':
        update_bot_strictness(
            MATH_BOT_ID,
            strictness_level="strict",
            allowed_topics=["mathematics", "algebra", "geometry", "calculus", "statistics"],
            forbidden_topics=["politics", "medical advice", "financial advice"]
        )
        
        test_bot_response(MATH_BOT_ID, "What do you think about politics?", "Off-topic question")
        test_bot_response(MATH_BOT_ID, "Solve: x² + 5x + 6 = 0", "Math question")
    
    # 2. MODERATE Configuration  
    print("\n📋 2. MODERATE Configuration (Balanced Approach)")
    print("   - Use for: Customer service, general assistance bots")
    print("   - Behavior: Politely guides back with some flexibility")
    
    if input("Configure math bot as MODERATE? (y/n): ").lower() == 'y':
        update_bot_strictness(
            MATH_BOT_ID,
            strictness_level="moderate",
            allowed_topics=["mathematics", "algebra", "geometry", "calculus", "statistics", "physics"],
            forbidden_topics=["politics", "medical advice"]
        )
        
        test_bot_response(MATH_BOT_ID, "Can you help with chemistry?", "Related topic")
        test_bot_response(MATH_BOT_ID, "What's 15% of 240?", "Math question")
    
    # 3. LENIENT Configuration
    print("\n📋 3. LENIENT Configuration (Friendly Guidance)")
    print("   - Use for: Educational, conversational bots")
    print("   - Behavior: Gently suggests staying on topic")
    
    if input("Configure math bot as LENIENT? (y/n): ").lower() == 'y':
        update_bot_strictness(
            MATH_BOT_ID,
            strictness_level="lenient",
            allowed_topics=["mathematics", "algebra", "geometry", "calculus", "statistics"],
            forbidden_topics=[]  # No hard forbidden topics
        )
        
        test_bot_response(MATH_BOT_ID, "I love science, can you help with biology?", "Science question")
        test_bot_response(MATH_BOT_ID, "What's the area of a circle?", "Math question")

def show_configuration_guidelines():
    """Display guidelines for choosing strictness levels"""
    
    print("\n📚 Strictness Level Guidelines")
    print("=" * 40)
    
    print("""
🔴 STRICT - Use When:
   • Professional/specialized services (legal, medical, financial)
   • Brand reputation is critical
   • Compliance requirements are strict
   • Clear expertise boundaries needed
   
   Example Response: "I'm specifically designed for mathematical assistance. 
   For biology questions, please consult an appropriate biology resource."

🟡 MODERATE - Use When:
   • General customer service
   • Educational assistance
   • Mixed-topic environments
   • Some topic flexibility desired
   
   Example Response: "While I focus on mathematics, I can see you're interested 
   in science! For biology, I'd recommend our science bot, but I'm here for 
   any math questions you might have."

🟢 LENIENT - Use When:
   • Conversational/friendly bots
   • Educational exploration encouraged
   • User experience over strict boundaries
   • Building rapport is important
   
   Example Response: "That's interesting! While I'm best at mathematics, 
   I'd love to help you with any math-related aspects of biology, like 
   statistical analysis or mathematical modeling."
    """)

if __name__ == "__main__":
    print("🤖 Bot Strictness Configuration Tool")
    print("This tool helps you configure how strict your bots should be")
    print("when users ask questions outside their designated topics.\n")
    
    while True:
        print("\nOptions:")
        print("1. Show strictness level guidelines")
        print("2. Demonstrate strictness levels with examples")
        print("3. Exit")
        
        choice = input("\nChoose an option (1-3): ").strip()
        
        if choice == "1":
            show_configuration_guidelines()
        elif choice == "2":
            demonstrate_strictness_levels()
        elif choice == "3":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")