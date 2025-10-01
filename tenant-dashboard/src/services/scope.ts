import { apiClient } from './api';
import { CONFIG } from '@/config';
import { CreateScopeRequest, UpdateScopeRequest, ScopeResponse } from '@/types';

export class ScopeService {
  /**
   * Get all scopes for a bot
   */
  static async getBotScopes(botId: string): Promise<ScopeResponse[]> {
    try {
      const response = await apiClient.get<ScopeResponse[]>(CONFIG.API.TENANT_BOT_SCOPES(botId));
      return response || [];
    } catch (error) {
      console.error('Failed to fetch bot scopes:', error);
      // Return empty array if scopes endpoint fails
      return [];
    }
  }

  /**
   * Get a specific scope for a bot
   */
  static async getBotScope(botId: string, scopeId: string): Promise<ScopeResponse> {
    try {
      const response = await apiClient.get<ScopeResponse>(CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId));
      return response;
    } catch (error) {
      console.error('Failed to fetch bot scope:', error);
      throw error;
    }
  }

  /**
   * Create a new scope for a bot
   */
  static async createBotScope(botId: string, scopeData: CreateScopeRequest): Promise<ScopeResponse> {
    try {
      const response = await apiClient.post<ScopeResponse>(CONFIG.API.TENANT_BOT_SCOPES(botId), scopeData);
      return response;
    } catch (error) {
      console.error('Failed to create bot scope:', error);
      throw error;
    }
  }

  /**
   * Update a bot scope
   */
  static async updateBotScope(
    botId: string, 
    scopeId: string, 
    scopeData: UpdateScopeRequest
  ): Promise<ScopeResponse> {
    try {
      const response = await apiClient.put<ScopeResponse>(CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId), scopeData);
      return response;
    } catch (error) {
      console.error('Failed to update bot scope:', error);
      throw error;
    }
  }

  /**
   * Delete a bot scope
   */
  static async deleteBotScope(botId: string, scopeId: string): Promise<void> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId));
    } catch (error) {
      console.error('Failed to delete bot scope:', error);
      throw error;
    }
  }

  /**
   * Batch create multiple scopes for a bot
   */
  static async createBotScopes(
    botId: string, 
    scopes: CreateScopeRequest[]
  ): Promise<ScopeResponse[]> {
    try {
      const createdScopes = [];
      for (const scope of scopes) {
        const created = await this.createBotScope(botId, scope);
        createdScopes.push(created);
      }
      return createdScopes;
    } catch (error) {
      console.error('Failed to create bot scopes in batch:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple scopes for a bot
   */
  static async updateBotScopes(
    botId: string, 
    updates: Array<{ scopeId: string; data: UpdateScopeRequest }>
  ): Promise<ScopeResponse[]> {
    try {
      const updatedScopes = [];
      for (const update of updates) {
        const updated = await this.updateBotScope(botId, update.scopeId, update.data);
        updatedScopes.push(updated);
      }
      return updatedScopes;
    } catch (error) {
      console.error('Failed to update bot scopes in batch:', error);
      throw error;
    }
  }

  /**
   * Create scope from template
   */
  static async createScopeFromTemplate(
    botId: string, 
    templateName: string,
    customizations?: Partial<CreateScopeRequest>
  ): Promise<ScopeResponse> {
    try {
      const templates = this.getScopeTemplates();
      const template = templates.find(t => t.config.name === templateName);
      
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const scopeData = {
        ...template.config,
        ...customizations,
        // Ensure guardrails are properly merged
        guardrails: {
          ...template.config.guardrails,
          ...customizations?.guardrails,
        },
      };

      return await this.createBotScope(botId, scopeData);
    } catch (error) {
      console.error('Failed to create scope from template:', error);
      throw error;
    }
  }

  /**
   * Get enhanced scope templates with better organization and dataset filters
   */
  static getScopeTemplates(): Array<{
    name: string;
    description: string;
    category: string;
    config: CreateScopeRequest;
  }> {
    return [
      {
        name: 'Customer Support Agent',
        description: 'Handles customer inquiries, troubleshooting, and support questions with professional tone',
        category: 'Support',
        config: {
          name: 'customer_support_agent',
          description: 'Professional customer support assistant for handling user inquiries',
          dataset_filters: {
            tags: ['support', 'faq', 'documentation', 'policies'],
            categories: ['customer_service', 'troubleshooting'],
            include_patterns: ['*support*', '*faq*', '*help*', '*guide*'],
            exclude_patterns: ['*internal*', '*confidential*', '*employee*']
          },
          guardrails: {
            allowed_topics: [
              'product information', 'troubleshooting', 'account help', 'billing questions',
              'feature explanations', 'how-to guides', 'technical support', 'order status',
              'shipping information', 'return policy', 'warranty information'
            ],
            forbidden_topics: [
              'competitor information', 'internal company data', 'employee details',
              'confidential information', 'personal user data', 'medical advice',
              'financial advice', 'legal advice'
            ],
            knowledge_boundaries: {
              strict_mode: true,
              allowed_sources: ['product_docs', 'support_articles', 'faq', 'policies'],
              context_preference: 'exclusive'
            },
            response_guidelines: {
              max_response_length: 400,
              require_citations: true
            },
            refusal_message: 'I can help with product support questions. For other matters, please contact our support team directly or ask to speak with a human agent.'
          },
          is_active: true
        }
      },
      {
        name: 'Sales Assistant',
        description: 'Assists with product information, pricing, and sales inquiries to help customers make decisions',
        category: 'Sales',
        config: {
          name: 'sales_assistant',
          description: 'Friendly sales assistant for product recommendations and inquiries',
          dataset_filters: {
            tags: ['sales', 'products', 'pricing', 'features', 'benefits'],
            categories: ['sales_materials', 'product_catalog', 'testimonials'],
            include_patterns: ['*product*', '*price*', '*feature*', '*benefit*', '*testimonial*'],
            exclude_patterns: ['*internal_cost*', '*competitor*', '*confidential*']
          },
          guardrails: {
            allowed_topics: [
              'product features', 'pricing information', 'product comparisons',
              'recommendations', 'promotions', 'discounts', 'package deals',
              'product benefits', 'use cases', 'testimonials', 'demo requests'
            ],
            forbidden_topics: [
              'competitor pricing', 'internal costs', 'confidential roadmaps',
              'employee information', 'financial advice', 'medical claims',
              'legal guarantees', 'unauthorized discounts'
            ],
            knowledge_boundaries: {
              strict_mode: true,
              allowed_sources: ['product_catalog', 'pricing_sheets', 'sales_materials', 'testimonials'],
              context_preference: 'exclusive'
            },
            response_guidelines: {
              max_response_length: 350,
              require_citations: false
            },
            refusal_message: 'I can help with product information and sales questions. For custom pricing or special deals, please contact our sales team.'
          },
          is_active: true
        }
      },
      {
        name: 'Event Admin Assistant',
        description: 'Manages event-related questions, schedules, registration info, and attendee support',
        category: 'Events',
        config: {
          name: 'event_admin_assistant',
          description: 'Organized assistant for event management and attendee support',
          dataset_filters: {
            tags: ['events', 'schedule', 'venue', 'logistics'],
            categories: ['event_management', 'attendee_support'],
            include_patterns: ['*event*', '*schedule*', '*venue*', '*agenda*'],
            exclude_patterns: ['*personal*', '*payment*', '*internal*']
          },
          guardrails: {
            allowed_topics: [
              'event schedule', 'registration information', 'venue details', 'speaker information',
              'agenda', 'session times', 'location directions', 'parking information',
              'dress code', 'meal information', 'networking sessions', 'materials needed'
            ],
            forbidden_topics: [
              'personal attendee information', 'payment processing', 'refunds',
              'speaker personal details', 'internal event costs', 'staff schedules',
              'security information', 'vendor details'
            ],
            knowledge_boundaries: {
              strict_mode: true,
              allowed_sources: ['event_agenda', 'venue_info', 'speaker_bios', 'logistics_info'],
              context_preference: 'exclusive'
            },
            response_guidelines: {
              max_response_length: 300,
              require_citations: false
            },
            refusal_message: 'I can help with event information and logistics. For registration changes or personal account issues, please contact the event organizers.'
          },
          is_active: true
        }
      },
      {
        name: 'Product Expert',
        description: 'Provides detailed technical information, specifications, and usage guidance for products',
        category: 'Technical',
        config: {
          name: 'product_expert',
          description: 'Technical expert for detailed product information and guidance',
          dataset_filters: {
            tags: ['technical', 'specifications', 'documentation', 'guides'],
            categories: ['technical_docs', 'user_manuals', 'specifications'],
            include_patterns: ['*technical*', '*spec*', '*manual*', '*guide*'],
            exclude_patterns: ['*unreleased*', '*internal*', '*confidential*']
          },
          guardrails: {
            allowed_topics: [
              'technical specifications', 'product features', 'compatibility information',
              'installation guides', 'setup instructions', 'configuration options',
              'best practices', 'maintenance tips', 'troubleshooting', 'performance optimization'
            ],
            forbidden_topics: [
              'unreleased features', 'internal development', 'security vulnerabilities',
              'competitor analysis', 'pricing strategies', 'medical applications',
              'safety liability', 'warranty claims'
            ],
            knowledge_boundaries: {
              strict_mode: true,
              allowed_sources: ['technical_docs', 'user_manuals', 'spec_sheets', 'best_practices'],
              context_preference: 'exclusive'
            },
            response_guidelines: {
              max_response_length: 500,
              step_by_step: true,
              require_citations: true
            },
            refusal_message: 'I can provide technical product information based on our documentation. For issues not covered in our materials, please contact technical support.'
          },
          is_active: true
        }
      },
      {
        name: 'Program Coordinator',
        description: 'Assists with program information, requirements, enrollment, and participant guidance',
        category: 'Education',
        config: {
          name: 'program_coordinator',
          description: 'Helpful coordinator for program information and participant support',
          dataset_filters: {
            tags: ['education', 'program', 'curriculum', 'requirements'],
            categories: ['educational_programs', 'curriculum', 'student_resources'],
            include_patterns: ['*program*', '*curriculum*', '*course*', '*requirement*'],
            exclude_patterns: ['*grade*', '*personal*', '*internal*', '*confidential*']
          },
          guardrails: {
            allowed_topics: [
              'program requirements', 'curriculum information', 'schedule details',
              'enrollment process', 'prerequisites', 'certification information',
              'program benefits', 'learning outcomes', 'resource materials',
              'assignment deadlines', 'assessment criteria'
            ],
            forbidden_topics: [
              'individual grades', 'personal student information', 'instructor evaluations',
              'internal program decisions', 'budget information', 'staff personal details',
              'admission decisions', 'grade changes'
            ],
            knowledge_boundaries: {
              strict_mode: true,
              allowed_sources: ['program_catalog', 'curriculum_guide', 'requirements_docs', 'schedules'],
              context_preference: 'exclusive'
            },
            response_guidelines: {
              max_response_length: 400,
              require_citations: false
            },
            refusal_message: 'I can help with general program information. For personal academic matters or specific enrollment questions, please contact the program office.'
          },
          is_active: true
        }
      }
    ];
  }

  /**
   * Validate scope configuration for completeness and consistency
   */
  static validateScopeConfig(config: CreateScopeRequest | UpdateScopeRequest): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check basic requirements
    if ('name' in config && (!config.name || config.name.trim().length === 0)) {
      errors.push('Scope name is required');
    }

    // Validate guardrails
    if (config.guardrails) {
      const { guardrails } = config;
      
      // Check for conflicts between allowed and forbidden topics
      if (guardrails.allowed_topics && guardrails.forbidden_topics) {
        const conflicts = guardrails.allowed_topics.filter(topic => 
          guardrails.forbidden_topics?.some(forbidden => 
            topic.toLowerCase().includes(forbidden.toLowerCase()) ||
            forbidden.toLowerCase().includes(topic.toLowerCase())
          )
        );
        
        if (conflicts.length > 0) {
          warnings.push(`Potential conflicts between allowed and forbidden topics: ${conflicts.join(', ')}`);
        }
      }

      // Check response length limits
      if (guardrails.response_guidelines?.max_response_length) {
        const maxLength = guardrails.response_guidelines.max_response_length;
        if (maxLength < 50) {
          warnings.push('Very short response limit may result in incomplete answers');
        }
        if (maxLength > 2000) {
          warnings.push('Very long response limit may result in verbose answers');
        }
      }

      // Check knowledge boundary consistency
      if (guardrails.knowledge_boundaries?.strict_mode && 
          !guardrails.knowledge_boundaries?.allowed_sources?.length) {
        warnings.push('Strict mode enabled but no allowed sources specified');
      }
    }

    // Validate dataset filters
    if (config.dataset_filters) {
      const dataset_filters = config.dataset_filters;
      
      if (dataset_filters.include_patterns?.length && dataset_filters.exclude_patterns?.length) {
        // Check for pattern conflicts
        const conflictingPatterns = dataset_filters.include_patterns.filter((include: string) =>
          dataset_filters.exclude_patterns?.some((exclude: string) => 
            include === exclude || 
            (include.includes('*') && exclude.includes('*') && 
             include.replace(/\*/g, '') === exclude.replace(/\*/g, ''))
          )
        );
        
        if (conflictingPatterns.length > 0) {
          warnings.push(`Conflicting include/exclude patterns: ${conflictingPatterns.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get scope usage analytics (placeholder for future implementation)
   */
  static async getScopeAnalytics(_botId: string, _scopeId: string): Promise<{
    usage_count: number;
    success_rate: number;
    common_queries: string[];
    blocked_queries: string[];
  }> {
    // This would be implemented with actual analytics data in the future
    return {
      usage_count: 0,
      success_rate: 0.95,
      common_queries: [],
      blocked_queries: []
    };
  }
}

export { ScopeService as default };