'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,

  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  FormHelperText,
  Divider,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Security,
  ExpandMore,
  Save,
  Cancel,
  ContentCopy,
  Visibility,
  VisibilityOff,
  Help,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { Scope, GuardrailConfig, CreateScopeRequest, UpdateScopeRequest } from '@/types';
import { ScopeService } from '@/services/scope';

interface ScopeManagerProps {
  botId: string;
  scopes: Scope[];
  onScopesChange: (scopes: Scope[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scope-tabpanel-${index}`}
      aria-labelledby={`scope-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ScopeManager({ botId, scopes, onScopesChange }: ScopeManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scopeToDelete, setScopeToDelete] = useState<Scope | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState<CreateScopeRequest>({
    name: '',
    description: '',
    guardrails: {
      allowed_topics: [],
      forbidden_topics: [],
      knowledge_boundaries: {
        strict_mode: false,
        context_preference: 'supplement',
        allowed_sources: []
      },
      response_guidelines: {
        max_response_length: 500,
        require_citations: false,
        step_by_step: false,
        mathematical_notation: false
      },
      refusal_message: ''
    },
    is_active: true
  });

  // Topic input states
  const [allowedTopicInput, setAllowedTopicInput] = useState('');
  const [forbiddenTopicInput, setForbiddenTopicInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      guardrails: {
        allowed_topics: [],
        forbidden_topics: [],
        knowledge_boundaries: {
          strict_mode: false,
          context_preference: 'supplement',
          allowed_sources: []
        },
        response_guidelines: {
          max_response_length: 500,
          require_citations: false,
          step_by_step: false,
          mathematical_notation: false
        },
        refusal_message: ''
      },
      is_active: true
    });
    setAllowedTopicInput('');
    setForbiddenTopicInput('');
    setSourceInput('');
    setActiveTab(0);
  };

  const handleCreateScope = () => {
    resetForm();
    setEditingScope(null);
    setDialogOpen(true);
  };

  const handleEditScope = (scope: Scope) => {
    setFormData({
      name: scope.name,
      description: scope.description || '',
      guardrails: scope.guardrails || {},
      is_active: scope.is_active
    });
    setEditingScope(scope);
    setDialogOpen(true);
  };

  const handleDeleteScope = (scope: Scope) => {
    setScopeToDelete(scope);
    setDeleteDialogOpen(true);
  };

  const handleSaveScope = async () => {
    try {
      setSaving(true);
      
      if (!formData.name.trim()) {
        setError('Scope name is required');
        return;
      }

      let savedScope: Scope;
      if (editingScope) {
        savedScope = await ScopeService.updateBotScope(botId, editingScope.id, formData);
        setSuccess('Scope updated successfully');
      } else {
        savedScope = await ScopeService.createBotScope(botId, formData);
        setSuccess('Scope created successfully');
      }

      // Update scopes list
      const updatedScopes = editingScope
        ? scopes.map(s => s.id === editingScope.id ? savedScope : s)
        : [...scopes, savedScope];
      
      onScopesChange(updatedScopes);
      setDialogOpen(false);
      resetForm();
      setEditingScope(null);
    } catch (error) {
      console.error('Failed to save scope:', error);
      setError('Failed to save scope');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!scopeToDelete) return;

    try {
      setLoading(true);
      await ScopeService.deleteBotScope(botId, scopeToDelete.id);
      
      const updatedScopes = scopes.filter(s => s.id !== scopeToDelete.id);
      onScopesChange(updatedScopes);
      
      setSuccess('Scope deleted successfully');
      setDeleteDialogOpen(false);
      setScopeToDelete(null);
    } catch (error) {
      console.error('Failed to delete scope:', error);
      setError('Failed to delete scope');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (template: any) => {
    setFormData(template.config);
    setTemplateDialogOpen(false);
    setEditingScope(null);
    setDialogOpen(true);
  };

  const addTopic = (type: 'allowed' | 'forbidden') => {
    const input = type === 'allowed' ? allowedTopicInput : forbiddenTopicInput;
    if (!input.trim()) return;

    const currentTopics = formData.guardrails?.[`${type}_topics`] || [];
    if (currentTopics.includes(input.trim())) return;

    setFormData({
      ...formData,
      guardrails: {
        ...formData.guardrails,
        [`${type}_topics`]: [...currentTopics, input.trim()]
      }
    });

    if (type === 'allowed') {
      setAllowedTopicInput('');
    } else {
      setForbiddenTopicInput('');
    }
  };

  const removeTopic = (type: 'allowed' | 'forbidden', topic: string) => {
    const currentTopics = formData.guardrails?.[`${type}_topics`] || [];
    setFormData({
      ...formData,
      guardrails: {
        ...formData.guardrails,
        [`${type}_topics`]: currentTopics.filter(t => t !== topic)
      }
    });
  };

  const addSource = () => {
    if (!sourceInput.trim()) return;

    const currentSources = formData.guardrails?.knowledge_boundaries?.allowed_sources || [];
    if (currentSources.includes(sourceInput.trim())) return;

    setFormData({
      ...formData,
      guardrails: {
        ...formData.guardrails,
        knowledge_boundaries: {
          ...formData.guardrails?.knowledge_boundaries,
          allowed_sources: [...currentSources, sourceInput.trim()]
        }
      }
    });
    setSourceInput('');
  };

  const removeSource = (source: string) => {
    const currentSources = formData.guardrails?.knowledge_boundaries?.allowed_sources || [];
    setFormData({
      ...formData,
      guardrails: {
        ...formData.guardrails,
        knowledge_boundaries: {
          ...formData.guardrails?.knowledge_boundaries,
          allowed_sources: currentSources.filter(s => s !== source)
        }
      }
    });
  };

  const getScopeStatusIcon = (scope: Scope) => {
    if (!scope.is_active) return <VisibilityOff color="disabled" />;
    
    const hasRestrictions = 
      (scope.guardrails?.allowed_topics && scope.guardrails.allowed_topics.length > 0) ||
      (scope.guardrails?.forbidden_topics && scope.guardrails.forbidden_topics.length > 0) ||
      scope.guardrails?.knowledge_boundaries?.strict_mode;
    
    if (hasRestrictions) return <Security color="success" />;
    return <Info color="info" />;
  };

  const getScopeStatusText = (scope: Scope) => {
    if (!scope.is_active) return 'Inactive';
    
    const hasRestrictions = 
      (scope.guardrails?.allowed_topics && scope.guardrails.allowed_topics.length > 0) ||
      (scope.guardrails?.forbidden_topics && scope.guardrails.forbidden_topics.length > 0) ||
      scope.guardrails?.knowledge_boundaries?.strict_mode;
    
    if (hasRestrictions) return 'Protected';
    return 'Open';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          Bot Scopes & Restrictions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={() => setTemplateDialogOpen(true)}
          >
            Use Template
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateScope}
          >
            Add Scope
          </Button>
        </Box>
      </Box>

      {scopes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Security sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Scopes Configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scopes help control what topics your bot can discuss and how it uses knowledge sources.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateScope}>
            Create First Scope
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {scopes.map((scope) => (
            <Box key={scope.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getScopeStatusIcon(scope)}
                      {scope.name}
                    </Typography>
                    <Chip 
                      label={getScopeStatusText(scope)} 
                      size="small" 
                      color={scope.is_active ? 'success' : 'default'}
                    />
                  </Box>
                  
                  {scope.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scope.description}
                    </Typography>
                  )}

                  <Stack spacing={1}>
                    {scope.guardrails?.allowed_topics && scope.guardrails.allowed_topics.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                          Allowed Topics ({scope.guardrails.allowed_topics.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {scope.guardrails.allowed_topics.slice(0, 3).map((topic) => (
                            <Chip key={topic} label={topic} size="small" color="success" variant="outlined" />
                          ))}
                          {scope.guardrails.allowed_topics.length > 3 && (
                            <Chip 
                              label={`+${scope.guardrails.allowed_topics.length - 3} more`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {scope.guardrails?.forbidden_topics && scope.guardrails.forbidden_topics.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold' }}>
                          Forbidden Topics ({scope.guardrails.forbidden_topics.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {scope.guardrails.forbidden_topics.slice(0, 3).map((topic) => (
                            <Chip key={topic} label={topic} size="small" color="error" variant="outlined" />
                          ))}
                          {scope.guardrails.forbidden_topics.length > 3 && (
                            <Chip 
                              label={`+${scope.guardrails.forbidden_topics.length - 3} more`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {scope.guardrails?.knowledge_boundaries?.strict_mode && (
                      <Alert severity="info" sx={{ py: 0 }}>
                        <Typography variant="caption">
                          Strict Mode: Bot will only use provided knowledge base
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditScope(scope)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteScope(scope)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Create/Edit Scope Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingScope ? 'Edit Scope' : 'Create New Scope'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="Topic Restrictions" />
              <Tab label="Knowledge Boundaries" />
              <Tab label="Response Guidelines" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Stack spacing={3}>
                <TextField
                  label="Scope Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  helperText="A unique name for this scope"
                />
                
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Describe what this scope controls"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3}>
                {/* Allowed Topics */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    Allowed Topics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Topics the bot is allowed to discuss. Leave empty to allow all topics.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add allowed topic"
                      value={allowedTopicInput}
                      onChange={(e) => setAllowedTopicInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTopic('allowed')}
                      size="small"
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      onClick={() => addTopic('allowed')}
                      disabled={!allowedTopicInput.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.guardrails?.allowed_topics?.map((topic) => (
                      <Chip
                        key={topic}
                        label={topic}
                        onDelete={() => removeTopic('allowed', topic)}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Forbidden Topics */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Forbidden Topics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Topics the bot should refuse to discuss.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add forbidden topic"
                      value={forbiddenTopicInput}
                      onChange={(e) => setForbiddenTopicInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTopic('forbidden')}
                      size="small"
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      onClick={() => addTopic('forbidden')}
                      disabled={!forbiddenTopicInput.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.guardrails?.forbidden_topics?.map((topic) => (
                      <Chip
                        key={topic}
                        label={topic}
                        onDelete={() => removeTopic('forbidden', topic)}
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Refusal Message */}
                <TextField
                  label="Refusal Message"
                  value={formData.guardrails?.refusal_message || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    guardrails: {
                      ...formData.guardrails,
                      refusal_message: e.target.value
                    }
                  })}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Message shown when refusing forbidden topics"
                  placeholder="I can only help with topics related to..."
                />
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.guardrails?.knowledge_boundaries?.strict_mode || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardrails: {
                          ...formData.guardrails,
                          knowledge_boundaries: {
                            ...formData.guardrails?.knowledge_boundaries,
                            strict_mode: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="Strict Mode"
                />
                <Typography variant="body2" color="text.secondary">
                  When enabled, the bot will only use provided knowledge base content and not its general training knowledge.
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>Context Preference</InputLabel>
                  <Select
                    value={formData.guardrails?.knowledge_boundaries?.context_preference || 'supplement'}
                    label="Context Preference"
                    onChange={(e) => setFormData({
                      ...formData,
                      guardrails: {
                        ...formData.guardrails,
                        knowledge_boundaries: {
                          ...formData.guardrails?.knowledge_boundaries,
                          context_preference: e.target.value as 'exclusive' | 'supplement' | 'prefer'
                        }
                      }
                    })}
                  >
                    <MenuItem value="exclusive">Exclusive - Only use provided context</MenuItem>
                    <MenuItem value="supplement">Supplement - Use context to supplement general knowledge</MenuItem>
                    <MenuItem value="prefer">Prefer - Prefer context but fall back to general knowledge</MenuItem>
                  </Select>
                  <FormHelperText>How the bot should use provided knowledge vs general knowledge</FormHelperText>
                </FormControl>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Allowed Sources
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Specify preferred information sources (optional).
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add source"
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSource()}
                      size="small"
                      fullWidth
                      placeholder="e.g., textbooks, official_documentation"
                    />
                    <Button
                      variant="outlined"
                      onClick={addSource}
                      disabled={!sourceInput.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.guardrails?.knowledge_boundaries?.allowed_sources?.map((source) => (
                      <Chip
                        key={source}
                        label={source}
                        onDelete={() => removeSource(source)}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Stack>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Stack spacing={3}>
                <TextField
                  label="Max Response Length (words)"
                  type="number"
                  value={formData.guardrails?.response_guidelines?.max_response_length || 500}
                  onChange={(e) => setFormData({
                    ...formData,
                    guardrails: {
                      ...formData.guardrails,
                      response_guidelines: {
                        ...formData.guardrails?.response_guidelines,
                        max_response_length: parseInt(e.target.value) || 500
                      }
                    }
                  })}
                  inputProps={{ min: 50, max: 2000 }}
                  helperText="Maximum number of words in bot responses"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.guardrails?.response_guidelines?.require_citations || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardrails: {
                          ...formData.guardrails,
                          response_guidelines: {
                            ...formData.guardrails?.response_guidelines,
                            require_citations: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="Require Citations"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.guardrails?.response_guidelines?.step_by_step || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardrails: {
                          ...formData.guardrails,
                          response_guidelines: {
                            ...formData.guardrails?.response_guidelines,
                            step_by_step: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="Step-by-Step Explanations"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.guardrails?.response_guidelines?.mathematical_notation || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardrails: {
                          ...formData.guardrails,
                          response_guidelines: {
                            ...formData.guardrails?.response_guidelines,
                            mathematical_notation: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="Use Mathematical Notation"
                />
              </Stack>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveScope}
            disabled={saving || !formData.name.trim()}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Scope'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Choose Scope Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            {ScopeService.getScopeTemplates().map((template) => (
              <Box key={template.name}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => handleApplyTemplate(template)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Scope</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the scope "{scopeToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={handleConfirmDelete}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}