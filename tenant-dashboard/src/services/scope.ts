import { apiClient } from './api';
import { CreateScopeRequest, UpdateScopeRequest, ScopeResponse } from '@/types';

export class ScopeService {
  /**
   * Get all scopes for a bot
   */
  static async getBotScopes(botId: string): Promise<ScopeResponse[]> {
    try {
      const response = await apiClient.get<ScopeResponse[]>(`/v1/tenant/bots/${botId}/scopes`);
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
      const response = await apiClient.get<ScopeResponse>(`/v1/tenant/bots/${botId}/scopes/${scopeId}`);
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
      const response = await apiClient.post<ScopeResponse>(`/v1/tenant/bots/${botId}/scopes`, scopeData);
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
      const response = await apiClient.put<ScopeResponse>(`/v1/tenant/bots/${botId}/scopes/${scopeId}`, scopeData);
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
      await apiClient.delete(`/v1/tenant/bots/${botId}/scopes/${scopeId}`);
    } catch (error) {
      console.error('Failed to delete bot scope:', error);
      throw error;
    }
  }

  /**
   * Get predefined scope templates for common use cases
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
}

export { ScopeService as default };