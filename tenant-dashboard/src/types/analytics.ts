/**
 * Analytics-related types for tenant dashboard
 */

export interface TenantAnalytics {
  total_bots: number;
  active_bots: number;
  total_chats: number;
  total_messages: number;
  monthly_messages: number;
  avg_response_time: number;
  usage_by_bot: Array<{
    bot_id: string;
    bot_name: string;
    message_count: number;
  }>;
  daily_usage: Array<{
    date: string;
    message_count: number;
  }>;
}