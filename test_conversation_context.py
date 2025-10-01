#!/usr/bin/env python3
"""
Test Conversation Context System

This script demonstrates how the chatbot maintains conversation context
across multiple messages, allowing for natural follow-up questions.

Example Flow:
1. User: "What is World War II?"
2. Bot: [Detailed explanation about WWII]
3. User: "Who won it?" 
4. Bot: [Understands "it" refers to WWII from previous context]

The key is that all messages in a conversation are sent with each request,
allowing the AI to understand references to previous parts of the conversation.
"""

import json
import requests
import uuid

API_BASE = "http://localhost:8000"

def chat_with_context(bot_id, messages, session_id=None):
    """Send a chat request with full conversation context"""
    
    response = requests.post(
        f"{API_BASE}/v1/chat/public",
        json={
            "bot_id": bot_id,
            "messages": messages,  # All previous messages for context
            "session_id": session_id,
            "metadata": {"source": "context_test"}
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return data["message"]["content"], data["session_id"]
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None, None

def demonstrate_conversation_context():
    """Demonstrate how conversation context works"""
    
    # Use math bot for demonstration
    MATH_BOT_ID = "760f0f2b-5f67-48a9-940a-870f94a3c2f3"
    
    print("🤖 Conversation Context Demonstration")
    print("=" * 50)
    
    # Start conversation - this will be our message history
    conversation_messages = []
    session_id = None
    
    # Message 1: Initial math question
    print("\n👤 User: What is the quadratic formula?")
    conversation_messages.append({
        "role": "user", 
        "content": "What is the quadratic formula?"
    })
    
    response1, session_id = chat_with_context(MATH_BOT_ID, conversation_messages, session_id)
    if response1:
        print(f"🤖 Bot: {response1[:200]}...")
        conversation_messages.append({
            "role": "assistant",
            "content": response1
        })
    
    # Message 2: Follow-up question using "it"
    print("\n👤 User: Can you show me an example of how to use it?")
    conversation_messages.append({
        "role": "user",
        "content": "Can you show me an example of how to use it?"
    })
    
    response2, session_id = chat_with_context(MATH_BOT_ID, conversation_messages, session_id)
    if response2:
        print(f"🤖 Bot: {response2[:300]}...")
        conversation_messages.append({
            "role": "assistant",
            "content": response2
        })
    
    # Message 3: Another contextual follow-up
    print("\n👤 User: What if the discriminant is negative?")
    conversation_messages.append({
        "role": "user",
        "content": "What if the discriminant is negative?"
    })
    
    response3, session_id = chat_with_context(MATH_BOT_ID, conversation_messages, session_id)
    if response3:
        print(f"🤖 Bot: {response3[:300]}...")
    
    print(f"\n✅ Session ID: {session_id}")
    print(f"✅ Total conversation turns: {len([m for m in conversation_messages if m['role'] == 'user'])}")
    
    return conversation_messages, session_id

def show_how_context_works():
    """Explain how the context system works technically"""
    
    print("\n📚 How Conversation Context Works")
    print("=" * 40)
    
    print("""
🔄 Message Flow:

1. FIRST MESSAGE:
   Request: [{"role": "user", "content": "What is World War II?"}]
   → Bot learns about WWII topic
   
2. SECOND MESSAGE:
   Request: [
     {"role": "user", "content": "What is World War II?"},
     {"role": "assistant", "content": "World War II was..."},
     {"role": "user", "content": "Who won it?"}
   ]
   → Bot sees "it" refers to WWII from previous context

🔑 Key Points:

• Each request includes ALL previous messages
• AI model uses full conversation history to understand context
• Session ID tracks the conversation in the database
• Messages are stored and can be retrieved for longer conversations

💾 Database Storage:

• Conversations table: Tracks each chat session
• Messages table: Stores individual messages with sequence numbers
• Citations: Relevant knowledge base context for each response
• Token usage: Tracks API usage per message
    """)

def test_history_teacher_example():
    """Test the exact scenario you described with a history teacher bot"""
    
    print("\n📚 History Teacher Bot Example")
    print("=" * 40)
    
    # You'll need to create a history teacher bot or use an existing one
    # For now, let's use the math bot to show the concept
    BOT_ID = "760f0f2b-5f67-48a9-940a-870f94a3c2f3"  # Replace with history bot ID
    
    conversation = []
    session_id = None
    
    # Question 1: Ask about WWII
    print("\n👤 User: What is World War II?")
    conversation.append({"role": "user", "content": "What is World War II?"})
    
    # Since we're using math bot, it will redirect, but the concept is the same
    response1, session_id = chat_with_context(BOT_ID, conversation, session_id)
    print(f"🤖 Bot: {response1}")
    
    if response1:
        conversation.append({"role": "assistant", "content": response1})
    
    # Question 2: Follow-up using "it"
    print("\n👤 User: Who won it?")
    conversation.append({"role": "user", "content": "Who won it?"})
    
    response2, session_id = chat_with_context(BOT_ID, conversation, session_id)
    print(f"🤖 Bot: {response2}")
    
    print(f"""
🔍 Context Analysis:
   
The bot receives this complete message history:
{json.dumps(conversation, indent=2)}

This allows it to understand that "it" in "Who won it?" 
refers to World War II from the previous question.
    """)

if __name__ == "__main__":
    print("🧠 Conversation Context System Test")
    print("This demonstrates how bots remember previous messages")
    print("and maintain context throughout a conversation.\n")
    
    while True:
        print("\nOptions:")
        print("1. Demonstrate conversation context with math bot")
        print("2. Explain how the context system works")
        print("3. Test history teacher example (concept)")
        print("4. Exit")
        
        choice = input("\nChoose an option (1-4): ").strip()
        
        if choice == "1":
            demonstrate_conversation_context()
        elif choice == "2":
            show_how_context_works()
        elif choice == "3":
            test_history_teacher_example()
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")