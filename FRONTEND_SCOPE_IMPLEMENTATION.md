# Bot Scope Management - Frontend Implementation

This document describes the frontend implementation for managing bot scopes and restrictions in the tenant dashboard.

## 🎯 Overview

The scope management system allows tenants to configure their bots with:

- **Topic Restrictions**: Define allowed and forbidden topics
- **Knowledge Boundaries**: Control how bots use information sources
- **Response Guidelines**: Set formatting and citation requirements
- **Refusal Messages**: Custom messages for out-of-scope queries

## 🧩 Components

### ScopeManager Component

**Location**: `src/components/bots/ScopeManager.tsx`

**Features**:
- ✅ Create, edit, and delete scopes
- ✅ Template-based scope creation
- ✅ Tabbed configuration interface
- ✅ Real-time validation
- ✅ Visual scope status indicators

**Usage**:
```tsx
import ScopeManager from '@/components/bots/ScopeManager';

<ScopeManager
  botId="bot-id-here"
  scopes={scopes}
  onScopesChange={setScopes}
/>
```

### Configuration Tabs

#### 1. **Basic Info**
- Scope name and description
- Active/inactive toggle

#### 2. **Topic Restrictions**
- Allowed topics (whitelist)
- Forbidden topics (blacklist)
- Custom refusal message

#### 3. **Knowledge Boundaries**
- Strict mode toggle
- Context preference settings
- Allowed information sources

#### 4. **Response Guidelines**
- Maximum response length
- Citation requirements
- Step-by-step explanations
- Mathematical notation

## 🎨 UI Features

### Scope Cards
Each scope displays:
- **Status Icon**: Security/Info/Disabled
- **Topic Chips**: Visual representation of restrictions
- **Strict Mode Indicator**: Special alert for knowledge boundaries

### Templates
Pre-configured templates for common use cases:
- **Mathematics Only**: Educational math bot
- **Legal Research**: Document-based legal assistant
- **Customer Support**: Company knowledge-restricted support
- **Medical Research**: Research-only medical assistant
- **General Knowledge**: Flexible general-purpose bot

### Visual Indicators
- 🟢 **Protected**: Has active restrictions
- 🔵 **Open**: No restrictions configured
- ⚫ **Inactive**: Scope disabled

## 🔧 Service Layer

### ScopeService

**Location**: `src/services/scope.ts`

**Methods**:
```typescript
// CRUD operations
ScopeService.getBotScopes(botId)
ScopeService.createBotScope(botId, scopeData)
ScopeService.updateBotScope(botId, scopeId, updates)
ScopeService.deleteBotScope(botId, scopeId)

// Templates
ScopeService.getScopeTemplates()
```

### API Integration
- **GET** `/v1/bots/{botId}/scopes` - List scopes
- **POST** `/v1/bots/{botId}/scopes` - Create scope
- **PUT** `/v1/bots/{botId}/scopes/{scopeId}` - Update scope
- **DELETE** `/v1/bots/{botId}/scopes/{scopeId}` - Delete scope

## 📋 Type Definitions

### Core Types

```typescript
interface GuardrailConfig {
  allowed_topics?: string[];
  forbidden_topics?: string[];
  knowledge_boundaries?: {
    strict_mode?: boolean;
    allowed_sources?: string[];
    context_preference?: 'exclusive' | 'supplement' | 'prefer';
  };
  response_guidelines?: {
    max_response_length?: number;
    require_citations?: boolean;
    step_by_step?: boolean;
    mathematical_notation?: boolean;
  };
  refusal_message?: string;
}

interface Scope {
  id: string;
  bot_id: string;
  name: string;
  description?: string;
  dataset_filters?: Record<string, any>;
  guardrails?: GuardrailConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## 🚀 Integration Points

### Bot Details Page
**File**: `src/app/bots/[id]/page.tsx`

The ScopeManager is integrated into the bot details page as a dedicated section:

```tsx
{/* Bot Scopes & Restrictions */}
<Box sx={{ mt: 3 }}>
  <Card>
    <CardContent>
      <ScopeManager
        botId={botId}
        scopes={scopes}
        onScopesChange={setScopes}
      />
    </CardContent>
  </Card>
</Box>
```

### Bot Creation Form
**File**: `src/app/bots/create/page.tsx`

The scope configuration can be integrated into the bot creation wizard as an additional step.

## 🎛️ Configuration Examples

### Example 1: Math Tutor Bot
```json
{
  "name": "mathematics_only",
  "guardrails": {
    "allowed_topics": ["math", "algebra", "calculus", "geometry"],
    "forbidden_topics": ["politics", "religion", "medical advice"],
    "knowledge_boundaries": {
      "strict_mode": false,
      "context_preference": "supplement"
    },
    "response_guidelines": {
      "max_response_length": 500,
      "step_by_step": true,
      "mathematical_notation": true
    },
    "refusal_message": "I can only help with math questions!"
  }
}
```

### Example 2: Strict Legal Research
```json
{
  "name": "legal_research_strict",
  "guardrails": {
    "allowed_topics": ["law", "legal research", "contracts"],
    "knowledge_boundaries": {
      "strict_mode": true,
      "context_preference": "exclusive",
      "allowed_sources": ["legal_documents", "case_law"]
    },
    "response_guidelines": {
      "require_citations": true,
      "max_response_length": 600
    },
    "refusal_message": "I can only provide legal research based on provided documents. Please consult an attorney for legal advice."
  }
}
```

## 🎨 Styling & Theming

The component uses Material-UI theming and follows the existing design system:

- **Colors**: Success (allowed), Error (forbidden), Info (general)
- **Typography**: Consistent with dashboard typography scale
- **Spacing**: Uses theme spacing units
- **Responsive**: Grid layouts adapt to screen size

## 🔧 Customization

### Adding New Templates
To add new scope templates, update the `getScopeTemplates()` method in `ScopeService`:

```typescript
{
  name: 'Custom Template',
  description: 'Description of the template',
  category: 'Custom',
  config: {
    // Your configuration here
  }
}
```

### Custom Validation
Add custom validation logic in the `ScopeManager` component's `handleSaveScope` method.

### Styling Overrides
Use the `sx` prop or custom CSS to override component styles:

```tsx
<ScopeManager
  botId={botId}
  scopes={scopes}
  onScopesChange={setScopes}
  sx={{ 
    '& .scope-card': { 
      border: '2px solid primary.main' 
    } 
  }}
/>
```

## 🧪 Testing

### Manual Testing
1. Create a new bot
2. Add multiple scopes with different configurations
3. Test topic restrictions with various query types
4. Verify knowledge boundaries work as expected
5. Check response guidelines are applied

### Automated Testing
Test files should be placed in `src/__tests__/components/bots/`:
- `ScopeManager.test.tsx` - Component testing
- `scope.service.test.ts` - Service testing

## 🚀 Deployment Notes

### Environment Variables
No additional environment variables required for the frontend components.

### Build Considerations
The scope management components are included in the main bundle. Consider code-splitting if the component becomes large.

### Performance
- Scopes are loaded once per bot and cached
- Template data is static and doesn't require API calls
- Form validation is performed client-side for better UX

## 🔄 Future Enhancements

### Planned Features
1. **Import/Export**: Allow exporting scope configurations
2. **Scope Sharing**: Share scope templates across bots
3. **Advanced Validation**: Real-time query testing within the UI
4. **Analytics**: Track scope effectiveness and usage
5. **Bulk Operations**: Apply scopes to multiple bots

### Integration Opportunities
1. **A/B Testing**: Test different scope configurations
2. **Analytics Dashboard**: Monitor scope performance
3. **Compliance Tools**: Automated compliance checking
4. **User Feedback**: Collect feedback on bot responses

This completes the frontend implementation for bot scope management, providing a comprehensive and user-friendly interface for configuring bot restrictions and guardrails.