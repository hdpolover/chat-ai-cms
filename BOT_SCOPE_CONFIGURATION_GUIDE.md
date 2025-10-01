# Bot Scope Restrictions and Knowledge Boundaries Guide

This guide explains how to configure your chatbot to only use its knowledge base and maintain conversation context while restricting responses to specific topics or domains.

## Overview

The system provides three main mechanisms for controlling bot behavior:

1. **Guardrails**: Topic restrictions and validation rules
2. **Knowledge Boundaries**: Control over information sources
3. **Conversation Context**: Maintains session history while respecting boundaries

## Configuration Components

### 1. Scope Configuration

Scopes define the boundaries and rules for your bot. Each bot can have multiple scopes, and each scope contains guardrails.

#### Creating a Scope via API

```bash
POST /v1/bots/{bot_id}/scopes
Content-Type: application/json

{
  "name": "mathematics_only",
  "description": "Restricts bot to mathematics topics only",
  "guardrails": {
    "allowed_topics": [
      "mathematics", "algebra", "geometry", "calculus", 
      "arithmetic", "statistics", "equations", "math"
    ],
    "forbidden_topics": [
      "biology", "chemistry", "history", "politics", "sports"
    ],
    "knowledge_boundaries": {
      "strict_mode": true,
      "allowed_sources": ["textbooks", "educational_materials"],
      "context_preference": "exclusive"
    },
    "response_guidelines": {
      "max_response_length": 500,
      "require_citations": true,
      "step_by_step": true
    },
    "refusal_message": "I can only help with mathematics. Please ask me a math-related question!"
  },
  "is_active": true
}
```

### 2. Guardrail Configuration Options

#### Topic Restrictions

- **`allowed_topics`**: List of topics the bot can discuss
- **`forbidden_topics`**: List of topics the bot must refuse
- **`refusal_message`**: Custom message when refusing queries

```json
{
  "allowed_topics": ["math", "mathematics", "algebra", "calculus"],
  "forbidden_topics": ["politics", "religion", "medical_advice"],
  "refusal_message": "I'm a math tutor and can only help with mathematical topics."
}
```

#### Knowledge Boundaries

Control how the bot uses information sources:

```json
{
  "knowledge_boundaries": {
    "strict_mode": true,           // Only use provided context
    "allowed_sources": [           // Preferred information sources
      "textbooks", 
      "educational_materials", 
      "official_documentation"
    ],
    "context_preference": "exclusive"  // "exclusive", "supplement", "prefer"
  }
}
```

**Context Preference Options:**
- `"exclusive"`: Only use provided context, ignore general knowledge
- `"supplement"`: Use context to supplement general knowledge
- `"prefer"`: Prefer context but fall back to general knowledge if needed

#### Response Guidelines

```json
{
  "response_guidelines": {
    "max_response_length": 400,    // Maximum words in response
    "require_citations": true,     // Always cite sources when using context
    "step_by_step": true,         // Provide step-by-step explanations
    "mathematical_notation": true  // Use proper mathematical notation
  }
}
```

### 3. Bot System Prompt

Configure your bot's base system prompt to establish its role and expertise:

```json
{
  "system_prompt": "You are MathBot, an expert mathematics tutor. Help users with mathematical concepts, problem-solving, and step-by-step solutions. Focus on clarity and accuracy in all mathematical explanations."
}
```

## Complete Example Configurations

### Example 1: Strict Math Bot (Knowledge Base Only)

This bot will ONLY use information from uploaded documents and refuse non-math topics:

```json
{
  "bot": {
    "name": "Strict Math Tutor",
    "system_prompt": "You are a mathematics tutor. Only answer questions using the provided mathematical references. If the context doesn't contain enough information, say so explicitly.",
    "model": "gpt-3.5-turbo",
    "temperature": 0.2
  },
  "scope": {
    "name": "strict_mathematics",
    "guardrails": {
      "allowed_topics": [
        "mathematics", "math", "algebra", "geometry", "calculus",
        "arithmetic", "statistics", "probability", "trigonometry"
      ],
      "knowledge_boundaries": {
        "strict_mode": true,
        "context_preference": "exclusive"
      },
      "response_guidelines": {
        "require_citations": true,
        "max_response_length": 400
      },
      "refusal_message": "I can only answer mathematics questions using my reference materials. Please ask about a math topic covered in my knowledge base."
    }
  }
}
```

### Example 2: Flexible Math Bot (Knowledge Base + General Knowledge)

This bot uses uploaded documents but can supplement with general math knowledge:

```json
{
  "bot": {
    "name": "Math Helper",
    "system_prompt": "You are a helpful math tutor. Use the provided context when available, and supplement with your mathematical knowledge when needed.",
    "model": "gpt-3.5-turbo",
    "temperature": 0.3
  },
  "scope": {
    "name": "flexible_mathematics", 
    "guardrails": {
      "allowed_topics": [
        "mathematics", "math", "algebra", "geometry", "calculus"
      ],
      "forbidden_topics": [
        "biology", "chemistry", "physics", "history", "politics"
      ],
      "knowledge_boundaries": {
        "strict_mode": false,
        "context_preference": "supplement"
      },
      "refusal_message": "I specialize in mathematics. Let me help you with a math problem or concept!"
    }
  }
}
```

### Example 3: Domain-Specific Expert (e.g., Legal Assistant)

```json
{
  "bot": {
    "name": "Legal Research Assistant",
    "system_prompt": "You are a legal research assistant. Provide information based on legal documents and precedents. Always cite sources and remind users to consult qualified attorneys.",
    "temperature": 0.1
  },
  "scope": {
    "name": "legal_only",
    "guardrails": {
      "allowed_topics": [
        "law", "legal", "contracts", "litigation", "regulations",
        "statutes", "case law", "legal precedents", "legal research"
      ],
      "forbidden_topics": [
        "medical advice", "financial advice", "tax preparation",
        "personal legal advice", "entertainment", "sports"
      ],
      "knowledge_boundaries": {
        "strict_mode": true,
        "allowed_sources": ["legal_documents", "case_law", "statutes"],
        "context_preference": "exclusive"
      },
      "response_guidelines": {
        "require_citations": true,
        "max_response_length": 600,
        "disclaimer_required": true
      },
      "refusal_message": "I can only assist with legal research questions based on my legal document database. Please consult a qualified attorney for specific legal advice."
    }
  }
}
```

## How It Works

### 1. Query Validation

When a user sends a message:

1. **Topic Check**: The system checks if the query matches allowed topics and doesn't contain forbidden topics
2. **Early Refusal**: If validation fails, the bot immediately returns a refusal message
3. **Context Retrieval**: If validation passes, the system retrieves relevant context from the knowledge base
4. **Response Generation**: The AI generates a response using the configured system prompt and guardrails

### 2. System Prompt Enhancement

The system automatically enhances your bot's system prompt with:

- **Knowledge boundary instructions** (strict mode, context preferences)
- **Topic restriction reminders** (allowed/forbidden topics)
- **Response formatting guidelines** (citations, length limits)
- **Context usage instructions** (how to use provided documents)

### 3. Conversation Context Maintenance

The system maintains conversation history while respecting boundaries:

- **Previous messages** are included in context (configurable limit)
- **Topic validation** is applied to each new user message
- **Context consistency** is maintained throughout the conversation
- **Scope restrictions** are enforced at each turn

## API Endpoints for Scope Management

### List Bot Scopes
```bash
GET /v1/bots/{bot_id}/scopes
```

### Create Scope
```bash
POST /v1/bots/{bot_id}/scopes
```

### Update Scope
```bash
PUT /v1/bots/{bot_id}/scopes/{scope_id}
```

### Delete Scope
```bash
DELETE /v1/bots/{bot_id}/scopes/{scope_id}
```

## Testing Your Configuration

Use the provided example script to test your bot:

```bash
cd api-server
python create_math_bot_example.py
```

This script will:
1. Create a math-focused bot with restrictions
2. Test various queries (allowed and forbidden)
3. Show how the guardrails work in practice
4. Display the enhanced system prompt

## Best Practices

### 1. Topic Definition
- **Be specific** with allowed topics (include variations and synonyms)
- **Use broad terms** for forbidden topics to catch edge cases
- **Test thoroughly** with real user queries

### 2. Knowledge Boundaries
- **Strict mode** for compliance-critical domains (legal, medical, financial)
- **Supplement mode** for educational bots that benefit from general knowledge
- **Always require citations** when using strict mode

### 3. Response Guidelines
- **Set reasonable length limits** to keep responses focused
- **Require step-by-step explanations** for educational content
- **Use clear refusal messages** that guide users toward appropriate topics

### 4. System Prompts
- **Clearly define the bot's role** and expertise area
- **Include behavioral guidelines** (tone, style, approach)
- **Mention source requirements** if using strict mode

## Troubleshooting

### Bot Refuses Valid Questions
- Check `allowed_topics` list for missing terms/synonyms
- Verify topic matching logic (case-insensitive, substring matching)
- Test with different phrasings of the same question

### Bot Answers Forbidden Topics
- Add more specific terms to `forbidden_topics`
- Check for topic overlap between allowed/forbidden lists
- Verify scope is active and properly configured

### Inconsistent Context Usage
- Review `knowledge_boundaries` configuration
- Check if `strict_mode` matches your requirements
- Verify document upload and processing status

### Poor Response Quality
- Adjust `temperature` setting (lower for consistency)
- Review system prompt clarity and specificity
- Check `max_response_length` settings
- Ensure proper context retrieval from documents