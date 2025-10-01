'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Container,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  FormHelperText,
  Slider,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  SmartToy,
  Settings,
  Storage,
  Security,
  Language,
  Add,
  Remove,
  Info,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { BotService } from '@/services/bot';
import { DatasetService, Dataset } from '@/services/dataset';
import { Bot, UpdateBotRequest, TenantAIProvider } from '@/types';

const steps = [
  'Basic Information',
  'AI Configuration',
  'Knowledge & Datasets',
  'Access & Security',
  'Review & Save'
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EditBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const [bot, setBot] = useState<Bot | null>(null);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [availableScopes, setAvailableScopes] = useState<any[]>([]);
  const [customScopes, setCustomScopes] = useState<any[]>([]);
  const [showCustomScopeForm, setShowCustomScopeForm] = useState(false);
  const [customScopeName, setCustomScopeName] = useState('');
  const [customScopeDescription, setCustomScopeDescription] = useState('');
  
  // Form data
  const [botData, setBotData] = useState<UpdateBotRequest & { 
    dataset_ids?: string[];
    scope_ids?: string[];
  }>({});

  const [domainInput, setDomainInput] = useState('');

  useEffect(() => {
    if (botId) {
      loadData();
    }
  }, [botId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading bot edit data...');
      
      const [botResponse, providersData, datasetsData] = await Promise.all([
        BotService.getBot(botId),
        BotService.getTenantAIProviders(),
        DatasetService.getAvailableDatasets()
      ]);
      
      console.log('Loaded data:', {
        bot: botResponse?.name,
        providers: providersData?.length || 0,
        datasets: datasetsData?.length || 0
      });
      
      if (!botResponse) {
        throw new Error('Bot not found');
      }
      
      setBot(botResponse);
      setAiProviders(providersData || []);
      setAvailableDatasets(datasetsData || []);
      
      // Debug AI providers
      if (providersData?.length > 0) {
        console.log('AI Providers:', providersData.map(p => ({
          id: p.id,
          name: p.provider_name,
          settings: p.custom_settings
        })));
      }
      
      // Initialize form data with bot data
      setBotData({
        name: botResponse.name,
        description: botResponse.description,
        tenant_ai_provider_id: botResponse.tenant_ai_provider_id,
        model: botResponse.model,
        system_prompt: botResponse.system_prompt,
        temperature: botResponse.temperature,
        max_tokens: botResponse.max_tokens,
        settings: botResponse.settings,
        is_public: botResponse.is_public,
        allowed_domains: botResponse.allowed_domains || [],
        dataset_ids: botResponse.datasets?.map(d => d.id) || [],
        scope_ids: botResponse.scopes?.map(s => s.id) || [], // Keep existing scope IDs
      });
      
      // Load available scopes from templates
      try {
        // Import ScopeService to get templates
        const { ScopeService } = await import('@/services/scope');
        const scopeTemplates = ScopeService.getScopeTemplates();
        
        // Convert templates to available scopes format
        const availableScopes = scopeTemplates.map(template => ({
          id: template.config.name, // Use name as ID for templates
          name: template.name,
          description: template.description,
          category: template.category,
          is_active: true,
          template: true, // Mark as template
          config: template.config
        }));
        
        // Also load existing bot scopes
        const existingScopes = botResponse.scopes?.map(scope => ({
          id: scope.id,
          name: scope.name,
          description: scope.description,
          category: 'Existing',
          is_active: scope.is_active,
          template: false,
          existing: true,
          config: scope
        })) || [];
        
        // Combine templates and existing scopes
        const allScopes = [...existingScopes, ...availableScopes];
        setAvailableScopes(allScopes);
        console.log('Loaded scopes:', allScopes.length, '(', existingScopes.length, 'existing +', availableScopes.length, 'templates)');
      } catch (error) {
        console.error('Failed to load scope templates:', error);
        setAvailableScopes([]);
      }
    } catch (error) {
      console.error('Failed to load bot data:', error);
      setError(`Failed to load bot data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBot = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!botData.name || !botData.tenant_ai_provider_id || !botData.model) {
        setError('Please fill in all required fields');
        return;
      }

      // Handle scope creation from templates (only create new template scopes, not existing ones)
      if (botData.scope_ids && botData.scope_ids.length > 0) {
        try {
          const { ScopeService } = await import('@/services/scope');
          const scopeTemplates = ScopeService.getScopeTemplates();
          
          for (const scopeId of botData.scope_ids) {
            // Skip existing scopes (UUIDs) - only process template scopes
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scopeId);
            if (isUUID) {
              console.log(`Skipping existing scope: ${scopeId}`);
              continue;
            }
            
            // Check if this is a template scope (custom_ prefix or template name)
            const template = scopeTemplates.find(t => t.config.name === scopeId || t.name === scopeId);
            if (template) {
              // Create the scope from template
              try {
                await ScopeService.createBotScope(botId, {
                  name: template.name,
                  description: template.description,
                  guardrails: template.config.guardrails,
                  dataset_filters: {},
                  is_active: true
                });
                console.log(`Created scope from template: ${template.name}`);
              } catch (scopeError) {
                console.log(`Scope ${template.name} may already exist, continuing...`);
              }
            }
          }
        } catch (scopeError) {
          console.error('Error creating scopes:', scopeError);
          // Don't fail the bot update if scope creation fails
        }
      }

      // Get current bot scopes after creation to send actual scope IDs
      let actualScopeIds: string[] = [];
      try {
        const currentScopes = await BotService.getBotScopes(botId);
        actualScopeIds = currentScopes.map(scope => scope.id);
        console.log(`Current bot scopes after creation: ${actualScopeIds.length} scopes`);
      } catch (error) {
        console.error('Failed to get current scopes:', error);
      }

      // Prepare update data with actual scope IDs
      const updateData = {
        ...botData,
        scope_ids: actualScopeIds, // Use actual scope IDs instead of template names
        dataset_ids: botData.dataset_ids
      };

      console.log('Updating bot with data:', updateData);

      await BotService.updateBot(botId, updateData);
      setSuccess('Bot updated successfully');
      
      // Navigate back to bot details after a short delay
      setTimeout(() => {
        router.push(`/bots/${botId}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to update bot:', error);
      setError(`Failed to update bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getAvailableModels = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider?.custom_settings) return [];
    
    // Check for supported_models array first
    if (provider.custom_settings.supported_models && Array.isArray(provider.custom_settings.supported_models)) {
      return provider.custom_settings.supported_models;
    }
    
    // Fallback: get models from provider type
    const providerName = provider.provider_name?.toLowerCase();
    if (providerName === 'openai') {
      return [
        'gpt-4',
        'gpt-4-0613',
        'gpt-4-32k',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-0613',
        'gpt-3.5-turbo-16k'
      ];
    } else if (providerName === 'anthropic') {
      return [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0'
      ];
    } else if (providerName === 'google') {
      return [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-ultra'
      ];
    }
    
    // Last fallback: if there's a model field, use it
    if (provider.custom_settings.model) {
      return [provider.custom_settings.model];
    }
    
    return [];
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const addDomain = () => {
    if (domainInput.trim() && !botData.allowed_domains?.includes(domainInput.trim())) {
      setBotData({
        ...botData,
        allowed_domains: [...(botData.allowed_domains || []), domainInput.trim()]
      });
      setDomainInput('');
    }
  };

  const removeDomain = (domain: string) => {
    setBotData({
      ...botData,
      allowed_domains: botData.allowed_domains?.filter(d => d !== domain) || []
    });
  };

  const handleDatasetToggle = (datasetId: string) => {
    const currentDatasets = botData.dataset_ids || [];
    const newDatasets = currentDatasets.includes(datasetId)
      ? currentDatasets.filter(id => id !== datasetId)
      : [...currentDatasets, datasetId];
    
    setBotData({ ...botData, dataset_ids: newDatasets });
  };

  const handleScopeToggle = (scopeId: string) => {
    console.log('Toggling scope:', scopeId);
    
    const currentScopes = botData.scope_ids || [];
    const newScopes = currentScopes.includes(scopeId)
      ? currentScopes.filter(id => id !== scopeId)
      : [...currentScopes, scopeId];
    
    console.log('Updated scopes:', { from: currentScopes, to: newScopes });
    setBotData({ ...botData, scope_ids: newScopes });
  };

  const handleAddCustomScope = () => {
    if (!customScopeName.trim()) return;
    
    const newCustomScope = {
      id: `custom_${Date.now()}_${customScopeName.toLowerCase().replace(/\s+/g, '_')}`,
      name: customScopeName,
      description: customScopeDescription || `Custom scope: ${customScopeName}`,
      category: 'Custom',
      is_active: true,
      template: false,
      custom: true,
      config: {
        name: customScopeName.toLowerCase().replace(/\s+/g, '_'),
        description: customScopeDescription || `Custom scope: ${customScopeName}`,
        guardrails: {
          response_guidelines: {
            max_response_length: 400,
            require_citations: true
          }
        },
        is_active: true
      }
    };
    
    setCustomScopes(prev => [...prev, newCustomScope]);
    setCustomScopeName('');
    setCustomScopeDescription('');
    setShowCustomScopeForm(false);
    
    // Automatically select the new custom scope
    handleScopeToggle(newCustomScope.id);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return botData.name && botData.name.trim() !== '';
      case 1:
        return botData.tenant_ai_provider_id !== '' && botData.model !== '';
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return botData.name && botData.tenant_ai_provider_id && botData.model;
      default:
        return false;
    }
  };

  const hasChanges = () => {
    if (!bot) return false;
    
    return (
      botData.name !== bot.name ||
      botData.description !== bot.description ||
      botData.tenant_ai_provider_id !== bot.tenant_ai_provider_id ||
      botData.model !== bot.model ||
      botData.system_prompt !== bot.system_prompt ||
      botData.temperature !== bot.temperature ||
      botData.max_tokens !== bot.max_tokens ||
      botData.is_public !== bot.is_public ||
      JSON.stringify(botData.allowed_domains) !== JSON.stringify(bot.allowed_domains) ||
      JSON.stringify(botData.dataset_ids) !== JSON.stringify(bot.datasets?.map(d => d.id)) ||
      JSON.stringify(botData.scope_ids) !== JSON.stringify(bot.scopes?.map(s => s.id))
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading bot configuration..." />
      </ProtectedRoute>
    );
  }

  if (!bot) {
    return (
      <ProtectedRoute>
        <TenantLayout>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Bot Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The bot you're trying to edit doesn't exist or you don't have permission to edit it.
            </Typography>
            <Button variant="contained" onClick={() => router.push('/bots')}>
              Back to Bots
            </Button>
          </Box>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => router.push(`/bots/${botId}`)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <SmartToy sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Edit Bot: {bot.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Modify your chatbot configuration, datasets, and access controls
              </Typography>
            </Box>
            {hasChanges() && (
              <Chip 
                label="Unsaved Changes" 
                color="warning" 
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Stepper Sidebar */}
          <Box sx={{ width: { lg: 300 }, flexShrink: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Configuration
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label} completed={index < activeStep}>
                      <StepLabel
                        onClick={() => setActiveStep(index)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                {/* Step 0: Basic Information */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <SmartToy sx={{ mr: 1 }} />
                      Basic Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        label="Bot Name"
                        value={botData.name || ''}
                        onChange={(e) => setBotData({ ...botData, name: e.target.value })}
                        fullWidth
                        required
                        helperText="A unique name for your chatbot"
                      />
                      
                      <TextField
                        label="Description"
                        value={botData.description || ''}
                        onChange={(e) => setBotData({ ...botData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Describe what this bot does and its purpose"
                      />
                    </Box>
                  </Box>
                )}

                {/* Step 1: AI Configuration */}
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Settings sx={{ mr: 1 }} />
                      AI Configuration
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormControl fullWidth required>
                        <InputLabel>AI Provider</InputLabel>
                        <Select
                          value={botData.tenant_ai_provider_id || ''}
                          label="AI Provider"
                          onChange={(e) => {
                            const providerId = e.target.value;
                            setBotData({ 
                              ...botData, 
                              tenant_ai_provider_id: providerId,
                              model: ''
                            });
                          }}
                        >
                          {aiProviders.length > 0 ? aiProviders.map((provider) => {
                            const availableModels = getAvailableModels(provider.id);
                            return (
                              <MenuItem key={provider.id} value={provider.id}>
                                <Box>
                                  <Typography variant="body1">
                                    {provider.provider_name || 'Unknown Provider'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {availableModels.length} models available
                                    {provider.is_active ? '' : ' (Inactive)'}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            );
                          }) : (
                            <MenuItem disabled>
                              <Typography color="text.secondary">
                                No AI providers configured
                              </Typography>
                            </MenuItem>
                          )}
                        </Select>
                        <FormHelperText>Select the AI provider to power this bot</FormHelperText>
                      </FormControl>
                      
                      <FormControl fullWidth required disabled={!botData.tenant_ai_provider_id}>
                        <InputLabel>Model</InputLabel>
                        <Select
                          value={botData.model || ''}
                          label="Model"
                          onChange={(e) => setBotData({ ...botData, model: e.target.value })}
                        >
                          {botData.tenant_ai_provider_id ? (
                            getAvailableModels(botData.tenant_ai_provider_id).length > 0 ? (
                              getAvailableModels(botData.tenant_ai_provider_id).map((model: string) => (
                                <MenuItem key={model} value={model}>
                                  {model}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled>
                                <Typography color="text.secondary">
                                  No models available for selected provider
                                </Typography>
                              </MenuItem>
                            )
                          ) : (
                            <MenuItem disabled>
                              <Typography color="text.secondary">
                                Select an AI provider first
                              </Typography>
                            </MenuItem>
                          )}
                        </Select>
                        <FormHelperText>
                          {!botData.tenant_ai_provider_id 
                            ? 'Select an AI provider first to see available models'
                            : 'Choose the specific AI model for this bot'
                          }
                        </FormHelperText>
                      </FormControl>
                      
                      <TextField
                        label="System Prompt"
                        value={botData.system_prompt || ''}
                        onChange={(e) => setBotData({ ...botData, system_prompt: e.target.value })}
                        fullWidth
                        multiline
                        rows={6}
                        helperText="Instructions that define how the bot should behave and respond"
                        placeholder="You are a helpful assistant that..."
                      />

                      <Box>
                        <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          Temperature: {botData.temperature || 0.7}
                          <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </Typography>
                        <Slider
                          value={botData.temperature || 0.7}
                          onChange={(_, value) => setBotData({ ...botData, temperature: value as number })}
                          min={0}
                          max={2}
                          step={0.1}
                          marks={[
                            { value: 0, label: '0 (Focused)' },
                            { value: 1, label: '1 (Balanced)' },
                            { value: 2, label: '2 (Creative)' }
                          ]}
                        />
                        <FormHelperText>Controls randomness: lower = more focused, higher = more creative</FormHelperText>
                      </Box>

                      <TextField
                        label="Max Tokens"
                        type="number"
                        value={botData.max_tokens || 1000}
                        onChange={(e) => setBotData({ ...botData, max_tokens: parseInt(e.target.value) || 1000 })}
                        fullWidth
                        inputProps={{ min: 1, max: 4096 }}
                        helperText="Maximum length of bot responses (1-4096 tokens)"
                      />
                    </Box>
                  </Box>
                )}

                {/* Step 2: Knowledge & Datasets */}
                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Storage sx={{ mr: 1 }} />
                      Knowledge & Datasets
                    </Typography>
                    
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                      <Tab label={`Datasets (${botData.dataset_ids?.length || 0})`} />
                      <Tab label={`Scopes (${botData.scope_ids?.length || 0})`} />
                    </Tabs>

                    <TabPanel value={activeTab} index={0}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Select knowledge datasets to provide context and information to your bot
                      </Typography>
                      
                      {availableDatasets.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            No datasets available. Create datasets first to assign them to bots.
                          </Typography>
                          <Button variant="outlined" sx={{ mt: 2 }}>
                            Create Dataset
                          </Button>
                        </Paper>
                      ) : (
                        <List>
                          {availableDatasets.map((dataset) => (
                            <ListItem key={dataset.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                              <ListItemIcon>
                                <Checkbox
                                  checked={botData.dataset_ids?.includes(dataset.id) || false}
                                  onChange={() => handleDatasetToggle(dataset.id)}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={dataset.name}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {dataset.description || 'No description'}
                                    </Typography>
                                    {dataset.tags && dataset.tags.length > 0 && (
                                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {dataset.tags.map((tag) => (
                                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Configure access scopes to control what the bot can access and do
                      </Typography>
                      
                      {availableScopes.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Loading available scopes...
                          </Typography>
                          <CircularProgress size={24} sx={{ mt: 2 }} />
                        </Paper>
                      ) : (
                        <Box>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Select scope templates or create custom scopes to control bot behavior:
                              </Typography>
                              <Button
                                variant="outlined" 
                                size="small"
                                onClick={() => setShowCustomScopeForm(true)}
                                sx={{ ml: 2 }}
                              >
                                Add Custom Scope
                              </Button>
                            </Box>
                            
                            {showCustomScopeForm && (
                              <Paper sx={{ p: 3, mb: 3, border: 1, borderColor: 'primary.main' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Create Custom Scope</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <TextField
                                    label="Scope Name"
                                    value={customScopeName}
                                    onChange={(e) => setCustomScopeName(e.target.value)}
                                    placeholder="e.g., HR Assistant, Legal Support"
                                    required
                                  />
                                  <TextField
                                    label="Description"
                                    value={customScopeDescription}
                                    onChange={(e) => setCustomScopeDescription(e.target.value)}
                                    placeholder="Describe what this scope does..."
                                    multiline
                                    rows={2}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      variant="contained"
                                      onClick={handleAddCustomScope}
                                      disabled={!customScopeName.trim()}
                                    >
                                      Create Scope
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      onClick={() => {
                                        setShowCustomScopeForm(false);
                                        setCustomScopeName('');
                                        setCustomScopeDescription('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                </Box>
                              </Paper>
                            )}
                          </Box>
                          
                          <List>
                            {[...availableScopes, ...customScopes].map((scope) => (
                              <ListItem key={scope.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                                <ListItemIcon>
                                  <Checkbox
                                    checked={botData.scope_ids?.includes(scope.id) || false}
                                    onChange={() => {
                                      console.log('Checkbox clicked for scope:', scope.id);
                                      handleScopeToggle(scope.id);
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="subtitle2">{scope.name}</Typography>
                                      {scope.category && (
                                        <Chip 
                                          label={scope.category} 
                                          size="small" 
                                          variant="outlined"
                                          color="primary"
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {scope.description || 'No description'}
                                      </Typography>
                                      {scope.existing && (
                                        <Typography variant="caption" color="success.main">
                                          Existing Scope - Already configured for this bot
                                        </Typography>
                                      )}
                                      {scope.template && (
                                        <Typography variant="caption" color="primary">
                                          Template - Will be created when bot is saved
                                        </Typography>
                                      )}
                                      {scope.custom && (
                                        <Typography variant="caption" color="secondary">
                                          Custom Scope
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                          
                          {botData.scope_ids && botData.scope_ids.length > 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                {botData.scope_ids.length} scope(s) selected. These will be applied to restrict the bot's behavior according to the selected templates.
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      )}
                    </TabPanel>
                  </Box>
                )}

                {/* Step 3: Access & Security */}
                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ mr: 1 }} />
                      Access & Security
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <Security sx={{ mr: 1, fontSize: 20 }} />
                          Visibility Settings
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={botData.is_public || false}
                              onChange={(e) => setBotData({ ...botData, is_public: e.target.checked })}
                            />
                          }
                          label="Public Bot"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Public bots can be accessed by users outside your organization
                        </Typography>
                      </Paper>

                      {botData.is_public && (
                        <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <Language sx={{ mr: 1, fontSize: 20 }} />
                            Domain Restrictions
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Restrict access to specific domains. Leave empty to allow all domains.
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              label="Add Domain"
                              value={domainInput}
                              onChange={(e) => setDomainInput(e.target.value)}
                              placeholder="example.com"
                              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                              fullWidth
                            />
                            <Button 
                              variant="outlined" 
                              onClick={addDomain}
                              startIcon={<Add />}
                              disabled={!domainInput.trim()}
                            >
                              Add
                            </Button>
                          </Box>
                          
                          {botData.allowed_domains && botData.allowed_domains.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {botData.allowed_domains.map((domain) => (
                                <Chip
                                  key={domain}
                                  label={domain}
                                  deleteIcon={<Remove />}
                                  onDelete={() => removeDomain(domain)}
                                  icon={<Language />}
                                />
                              ))}
                            </Box>
                          )}
                        </Paper>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Step 4: Review & Save */}
                {activeStep === 4 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Save sx={{ mr: 1 }} />
                      Review & Save Changes
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Basic Information</Typography>
                          <Typography><strong>Name:</strong> {botData.name}</Typography>
                          <Typography><strong>Description:</strong> {botData.description || 'None'}</Typography>
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>AI Configuration</Typography>
                          <Typography><strong>Provider:</strong> {aiProviders.find(p => p.id === botData.tenant_ai_provider_id)?.provider_name}</Typography>
                          <Typography><strong>Model:</strong> {botData.model}</Typography>
                          <Typography><strong>Temperature:</strong> {botData.temperature}</Typography>
                          <Typography><strong>Max Tokens:</strong> {botData.max_tokens}</Typography>
                          {botData.system_prompt && (
                            <Box sx={{ mt: 1 }}>
                              <Typography><strong>System Prompt:</strong></Typography>
                              <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                                <Typography variant="body2">{botData.system_prompt}</Typography>
                              </Paper>
                            </Box>
                          )}
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Knowledge & Access</Typography>
                          <Typography><strong>Datasets:</strong> {botData.dataset_ids?.length || 0} selected</Typography>
                          <Typography><strong>Scopes:</strong> {botData.scope_ids?.length || 0} selected</Typography>
                          {botData.scope_ids && botData.scope_ids.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">Selected scopes:</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {botData.scope_ids.map(scopeId => {
                                  const allScopes = [...availableScopes, ...customScopes];
                                  const scope = allScopes.find(s => s.id === scopeId);
                                  return scope ? (
                                    <Chip 
                                      key={scopeId}
                                      label={scope.name} 
                                      size="small" 
                                      color={scope.custom ? "secondary" : "primary"}
                                      variant="outlined"
                                    />
                                  ) : null;
                                })}
                              </Box>
                            </Box>
                          )}
                          <Typography><strong>Visibility:</strong> {botData.is_public ? 'Public' : 'Private'}</Typography>
                          {botData.allowed_domains && botData.allowed_domains.length > 0 && (
                            <Typography><strong>Allowed Domains:</strong> {botData.allowed_domains.join(', ')}</Typography>
                          )}
                        </CardContent>
                      </Card>

                      {hasChanges() && (
                        <Alert severity="info">
                          You have unsaved changes. Click "Save Changes" to apply them.
                        </Alert>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleUpdateBot}
                        disabled={saving || !isStepComplete(activeStep) || !hasChanges()}
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!isStepComplete(activeStep)}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Success/Error Snackbars */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </TenantLayout>
    </ProtectedRoute>
  );
}