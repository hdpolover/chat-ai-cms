'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  OutlinedInput,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  Paper,
  Tabs,
  Tab,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  SmartToy,
  Settings,
  Storage,
  Security,
  Language,
  ExpandMore,
  Add,
  Remove,
  Info,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { BotService } from '@/services/bot';
import { DatasetService, Dataset } from '@/services/dataset';
import { CreateBotRequest, TenantAIProvider } from '@/types';

const steps = [
  'Basic Information',
  'AI Configuration',
  'Knowledge & Datasets',
  'Access & Security',
  'Review & Create'
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

export default function CreateBotPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [availableScopes, setAvailableScopes] = useState<any[]>([]);
  
  // Form data
  const [botData, setBotData] = useState<CreateBotRequest & { 
    dataset_ids?: string[];
    scope_ids?: string[];
  }>({
    name: '',
    description: '',
    tenant_ai_provider_id: '',
    model: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    settings: {},
    is_public: false,
    allowed_domains: [],
    dataset_ids: [],
    scope_ids: [],
  });

  const [domainInput, setDomainInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersData, datasetsData] = await Promise.all([
        BotService.getTenantAIProviders(),
        DatasetService.getAvailableDatasets()
      ]);
      
      setAiProviders(providersData);
      setAvailableDatasets(datasetsData);
      
      // Load scopes if available
      try {
        // Note: Scopes API endpoint may need to be implemented
        setAvailableScopes([]);
      } catch (error) {
        console.error('Failed to load scopes:', error);
        setAvailableScopes([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!botData.name || !botData.tenant_ai_provider_id || !botData.model) {
        setError('Please fill in all required fields');
        return;
      }

      await BotService.createBot(botData);
      setSuccess('Bot created successfully');
      
      // Navigate back to bots list after a short delay
      setTimeout(() => {
        router.push('/bots');
      }, 1500);
    } catch (error) {
      console.error('Failed to create bot:', error);
      setError('Failed to create bot');
    } finally {
      setSaving(false);
    }
  };

  const getAvailableModels = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider?.custom_settings?.supported_models) return [];
    return provider.custom_settings.supported_models;
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
    const currentScopes = botData.scope_ids || [];
    const newScopes = currentScopes.includes(scopeId)
      ? currentScopes.filter(id => id !== scopeId)
      : [...currentScopes, scopeId];
    
    setBotData({ ...botData, scope_ids: newScopes });
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return botData.name.trim() !== '';
      case 1:
        return botData.tenant_ai_provider_id !== '' && botData.model !== '';
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return Boolean(botData.name && botData.tenant_ai_provider_id && botData.model);
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading configuration..." />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => router.push('/bots')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <SmartToy sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Create New Bot
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure your chatbot with AI providers, knowledge datasets, and access controls
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Stepper Sidebar */}
          <Box sx={{ width: { lg: 300 }, flexShrink: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Setup Progress
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label} completed={index < activeStep || isStepComplete(index)}>
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
                        value={botData.name}
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
                          value={botData.tenant_ai_provider_id}
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
                          {aiProviders.map((provider) => (
                            <MenuItem key={provider.id} value={provider.id}>
                              <Box>
                                <Typography variant="body1">{provider.provider_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {provider.custom_settings?.supported_models?.length || 0} models available
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Select the AI provider to power this bot</FormHelperText>
                      </FormControl>
                      
                      <FormControl fullWidth required disabled={!botData.tenant_ai_provider_id}>
                        <InputLabel>Model</InputLabel>
                        <Select
                          value={botData.model}
                          label="Model"
                          onChange={(e) => setBotData({ ...botData, model: e.target.value })}
                        >
                          {getAvailableModels(botData.tenant_ai_provider_id).map((model: string) => (
                            <MenuItem key={model} value={model}>
                              {model}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Choose the specific AI model for this bot</FormHelperText>
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
                          Temperature: {botData.temperature}
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
                            No scopes configured. Scopes help control bot permissions and access.
                          </Typography>
                          <Button variant="outlined" sx={{ mt: 2 }}>
                            Configure Scopes
                          </Button>
                        </Paper>
                      ) : (
                        <List>
                          {availableScopes.map((scope) => (
                            <ListItem key={scope.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                              <ListItemIcon>
                                <Checkbox
                                  checked={botData.scope_ids?.includes(scope.id) || false}
                                  onChange={() => handleScopeToggle(scope.id)}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={scope.name}
                                secondary={scope.description || 'No description'}
                              />
                            </ListItem>
                          ))}
                        </List>
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
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="h6">Visibility Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
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
                        </AccordionDetails>
                      </Accordion>

                      {botData.is_public && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">Domain Restrictions</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
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
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Step 4: Review & Create */}
                {activeStep === 4 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Save sx={{ mr: 1 }} />
                      Review & Create
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
                          <Typography><strong>Visibility:</strong> {botData.is_public ? 'Public' : 'Private'}</Typography>
                          {botData.allowed_domains && botData.allowed_domains.length > 0 && (
                            <Typography><strong>Allowed Domains:</strong> {botData.allowed_domains.join(', ')}</Typography>
                          )}
                        </CardContent>
                      </Card>
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
                        onClick={handleCreateBot}
                        disabled={saving || !isStepComplete(activeStep)}
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      >
                        {saving ? 'Creating...' : 'Create Bot'}
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