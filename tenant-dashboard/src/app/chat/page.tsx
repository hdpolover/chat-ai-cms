'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  AttachFile,
  Refresh,
  Clear,
  OpenInNew,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { apiClient } from '@/services/api';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sequence_number: number;
  created_at: string;
  citations?: Citation[];
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface Citation {
  source: string;
  url?: string;
  chunk_id?: string;
}

interface Bot {
  id: string;
  name: string;
  description?: string;
  model: string;
  is_active: boolean;
}

interface Conversation {
  id: string;
  bot_id: string;
  title?: string;
  session_id?: string;
  is_active: boolean;
  message_count: number;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

interface ChatResponse {
  // For new conversations: {conversation_id, message: {...}}
  conversation_id?: string;
  message?: {
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    sequence_number: number;
    created_at: string;
    citations?: Citation[];
    token_usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  
  // For follow-up messages: message fields directly in response
  id?: string;
  role?: string;
  content?: string;
  sequence_number?: number;
  created_at?: string;
  citations?: Citation[];
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  
  // Legacy fields
  response?: string;
  metadata?: {
    token_usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
}

export default function ChatPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [botsLoading, setBotsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load bots on component mount
  useEffect(() => {
    loadBots();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations when bot changes
  useEffect(() => {
    if (selectedBot) {
      loadBotConversations();
    }
  }, [selectedBot]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBots = async () => {
    try {
      setBotsLoading(true);
      const botsData = await apiClient.get<Bot[]>('/v1/tenant/bots');
      setBots(botsData);
      
      // Auto-select first active bot
      const activeBot = botsData.find(bot => bot.is_active);
      if (activeBot) {
        setSelectedBot(activeBot);
      }
    } catch (err) {
      console.error('Error loading bots:', err);
      setError('Failed to load bots');
    } finally {
      setBotsLoading(false);
    }
  };

  const loadBotConversations = async () => {
    if (!selectedBot) return;

    try {
      // Load recent conversations for this bot
      const conversationsData = await apiClient.get<Conversation[]>(
        `/v1/tenant/bots/${selectedBot.id}/conversations`
      );
      setConversations(conversationsData);
      
      // Only auto-select if no current conversation exists
      if (!currentConversation && conversationsData.length > 0) {
        const firstConversation = conversationsData[0];
        setCurrentConversation(firstConversation);
        // Load messages for the selected conversation
        loadConversationMessages(firstConversation.id);
      } else if (conversationsData.length === 0 && !currentConversation) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      // If conversations don't exist, start a new one
      if (!currentConversation) {
        startNewConversation();
      }
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const messagesData = await apiClient.get<Message[]>(
        `/v1/tenant/conversations/${conversationId}/messages`
      );
      setMessages(messagesData);
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      setMessages([]);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
  };

  const sendMessage = async () => {
    if (!selectedBot || !newMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: currentConversation?.id || '',
      role: 'user',
      content: newMessage.trim(),
      sequence_number: messages.length + 1,
      created_at: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      let response: ChatResponse;
      
      if (currentConversation) {
        // Continue existing conversation
        response = await apiClient.post<ChatResponse>(
          `/v1/tenant/conversations/${currentConversation.id}/messages`,
          { message: userMessage.content }
        );
      } else {
        // Start new conversation
        response = await apiClient.post<ChatResponse>(
          `/v1/tenant/bots/${selectedBot.id}/conversations`,
          { 
            message: userMessage.content,
            metadata: {
              source: 'dashboard'
            }
          }
        );
        
        // Update conversation ID for future messages
        if (response.conversation_id) {
          const newConversation: Conversation = {
            id: response.conversation_id,
            bot_id: selectedBot.id,
            title: `Chat with ${selectedBot.name}`,
            session_id: response.conversation_id,
            is_active: true,
            message_count: 2, // User message + bot response
            last_message: response.message?.content || response.response || 'New conversation',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCurrentConversation(newConversation);
          
          // Update conversations list with new conversation
          setConversations(prev => [newConversation, ...prev]);
        }
      }

      // Add bot response to messages - handle different response formats
      let botMessage: Message | null = null;
      
      if (response.message) {
        // New conversation format: {conversation_id, message: {...}}
        const msg = response.message;
        botMessage = {
          id: msg.id,
          conversation_id: msg.conversation_id,
          role: 'assistant',
          content: msg.content,
          sequence_number: msg.sequence_number,
          created_at: msg.created_at,
          citations: msg.citations || [],
          token_usage: msg.token_usage,
        };
      } else if (response.id && response.content) {
        // Follow-up message format: message fields directly in response
        botMessage = {
          id: response.id,
          conversation_id: response.conversation_id || currentConversation?.id || '',
          role: 'assistant',
          content: response.content,
          sequence_number: response.sequence_number || messages.length + 2,
          created_at: response.created_at || new Date().toISOString(),
          citations: response.citations || [],
          token_usage: response.token_usage,
        };
      } else if (response.response) {
        // Legacy format fallback
        botMessage = {
          id: Date.now().toString() + '_bot',
          conversation_id: response.conversation_id || currentConversation?.id || '',
          role: 'assistant',
          content: response.response,
          sequence_number: messages.length + 2,
          created_at: new Date().toISOString(),
          citations: response.citations || [],
          token_usage: response.metadata?.token_usage,
        };
      }
      
      if (botMessage) {
        setMessages(prev => [...prev, botMessage!]);
        
        // Update current conversation's message count and last message
        if (currentConversation) {
          setCurrentConversation(prev => prev ? {
            ...prev,
            message_count: prev.message_count + 2,
            last_message: botMessage!.content.slice(0, 100),
            updated_at: new Date().toISOString()
          } : null);
        }
      }

      // Update conversations list without resetting current conversation
      if (selectedBot && !currentConversation) {
        // Only reload if we don't have a current conversation
        loadBotConversations();
      }

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(
        err.response?.data?.message || 
        'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (botsLoading) {
    return (
      <ProtectedRoute>
        <TenantLayout>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Live Chat
            </Typography>
            
            {/* Bot Selector */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Bot</InputLabel>
              <Select
                value={selectedBot?.id || ''}
                onChange={(e) => {
                  const bot = bots.find(b => b.id === e.target.value);
                  setSelectedBot(bot || null);
                }}
                label="Select Bot"
              >
                {bots.map(bot => (
                  <MenuItem key={bot.id} value={bot.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmartToy fontSize="small" />
                      {bot.name}
                      {!bot.is_active && (
                        <Chip label="Inactive" size="small" color="warning" />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Conversation Selector */}
            {conversations.length > 0 && (
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Select Conversation</InputLabel>
                <Select
                  value={currentConversation?.id || ''}
                  onChange={(e) => {
                    const conversation = conversations.find(c => c.id === e.target.value);
                    if (conversation) {
                      setCurrentConversation(conversation);
                      loadConversationMessages(conversation.id);
                    }
                  }}
                  label="Select Conversation"
                >
                  {conversations.map(conv => (
                    <MenuItem key={conv.id} value={conv.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {conv.title || `Conversation ${conv.id.slice(0, 8)}...`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={startNewConversation}
              disabled={!selectedBot}
            >
              New Chat
            </Button>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                if (selectedBot) {
                  if (currentConversation) {
                    // Reload messages for current conversation
                    loadConversationMessages(currentConversation.id);
                  } else {
                    // Load conversations if no current conversation
                    loadBotConversations();
                  }
                }
              }}
              disabled={!selectedBot}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!selectedBot ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a bot to start chatting
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from your available bots above
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Chat Messages Area */}
              <Paper 
                sx={{ 
                  flex: 1, 
                  p: 2, 
                  overflow: 'auto', 
                  minHeight: 400,
                  maxHeight: 600,
                  mb: 2 
                }}
                ref={chatContainerRef}
              >
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                      <SmartToy />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      Start a conversation with {selectedBot.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedBot.description || 'This bot is ready to help you!'}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {messages.map((message, index) => (
                      <ListItem key={message.id} sx={{ 
                        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: 1,
                        px: 0,
                        py: 1
                      }}>
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                              ml: message.role === 'user' ? 1 : 0,
                              mr: message.role === 'user' ? 0 : 1,
                            }}
                          >
                            {message.role === 'user' ? <Person /> : <SmartToy />}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <Box sx={{ 
                          maxWidth: '70%',
                          textAlign: message.role === 'user' ? 'right' : 'left'
                        }}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              bgcolor: message.role === 'user' ? 'primary.50' : 'grey.50',
                              borderRadius: 2,
                              mb: 0.5
                            }}
                          >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </Typography>
                            
                            {/* Citations */}
                            {message.citations && message.citations.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {message.citations.map((citation, idx) => (
                                  <Chip
                                    key={idx}
                                    label={citation.source}
                                    size="small"
                                    variant="outlined"
                                    clickable={!!citation.url}
                                    onClick={citation.url ? () => window.open(citation.url, '_blank') : undefined}
                                    icon={citation.url ? <OpenInNew fontSize="small" /> : undefined}
                                  />
                                ))}
                              </Box>
                            )}
                          </Paper>
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(message.created_at)}
                            {message.token_usage?.total_tokens && (
                              <> • {message.token_usage.total_tokens} tokens</>
                            )}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                    
                    {/* Streaming Indicator */}
                    {isStreaming && (
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <SmartToy />
                          </Avatar>
                        </ListItemAvatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {selectedBot.name} is typing...
                          </Typography>
                          <LinearProgress sx={{ width: 100, mt: 0.5 }} />
                        </Box>
                      </ListItem>
                    )}
                  </List>
                )}
                <div ref={messagesEndRef} />
              </Paper>

              {/* Message Input */}
              <Paper sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedBot.name}...`}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={sendMessage}
                          disabled={loading || !newMessage.trim()}
                          color="primary"
                          sx={{ ml: 1 }}
                        >
                          {loading ? <CircularProgress size={20} /> : <Send />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Press Enter to send, Shift+Enter for new line
                  </Typography>
                  
                  {currentConversation && (
                    <Typography variant="caption" color="text.secondary">
                      Conversation ID: {currentConversation.id.slice(0, 8)}...
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </TenantLayout>
    </ProtectedRoute>
  );
}