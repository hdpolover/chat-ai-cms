'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { GuardrailConfig, DatasetFilters } from '@/types';
import { Dataset } from '@/services/dataset';
import GuardrailConfiguration from './GuardrailConfiguration';
import DatasetFilterConfiguration from './DatasetFilterConfiguration';

interface ScopeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  guardrails?: GuardrailConfig;
  dataset_filters?: DatasetFilters;
  template?: boolean;
  existing?: boolean;
  custom?: boolean;
}

interface ScopeConfigurationProps {
  selectedScopeIds: string[];
  availableScopes: ScopeTemplate[];
  availableDatasets?: Dataset[];
  onScopeSelection: (scopeIds: string[]) => void;
  onCreateScope?: (scope: { 
    name: string; 
    description: string; 
    guardrails?: GuardrailConfig;
    dataset_filters?: DatasetFilters;
  }) => void;
  onUpdateScope?: (scopeId: string, updates: {
    guardrails?: GuardrailConfig;
    dataset_filters?: DatasetFilters;
  }) => void;
  readOnly?: boolean;
}

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
      id={`scope-tabpanel-${index}`}
      aria-labelledby={`scope-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ScopeConfiguration: React.FC<ScopeConfigurationProps> = ({
  selectedScopeIds,
  availableScopes,
  availableDatasets = [],
  onScopeSelection,
  onCreateScope,
  onUpdateScope,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  
  // Form state for scope creation/editing
  const [scopeName, setScopeName] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const [scopeGuardrails, setScopeGuardrails] = useState<GuardrailConfig>({});
  const [scopeDatasetFilters, setScopeDatasetFilters] = useState<DatasetFilters>({});

  const handleScopeToggle = (scopeId: string) => {
    const newSelection = selectedScopeIds.includes(scopeId)
      ? selectedScopeIds.filter(id => id !== scopeId)
      : [...selectedScopeIds, scopeId];
    onScopeSelection(newSelection);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setScopeName('');
    setScopeDescription('');
    setScopeGuardrails({});
    setScopeDatasetFilters({});
    setEditingScopeId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (scope: ScopeTemplate) => {
    setDialogMode('edit');
    setScopeName(scope.name);
    setScopeDescription(scope.description);
    setScopeGuardrails(scope.guardrails || {});
    setScopeDatasetFilters(scope.dataset_filters || {});
    setEditingScopeId(scope.id);
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    if (dialogMode === 'create' && onCreateScope) {
      onCreateScope({
        name: scopeName,
        description: scopeDescription,
        guardrails: scopeGuardrails,
        dataset_filters: scopeDatasetFilters,
      });
    } else if (dialogMode === 'edit' && onUpdateScope && editingScopeId) {
      onUpdateScope(editingScopeId, {
        guardrails: scopeGuardrails,
        dataset_filters: scopeDatasetFilters,
      });
    }
    
    setDialogOpen(false);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  const selectedScopes = availableScopes.filter(scope => selectedScopeIds.includes(scope.id));
  const unselectedScopes = availableScopes.filter(scope => !selectedScopeIds.includes(scope.id));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Scope Configuration
        </Typography>
        {!readOnly && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Create Custom Scope
          </Button>
        )}
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        <Tab label={`Available Scopes (${availableScopes.length})`} />
        <Tab label={`Selected Scopes (${selectedScopeIds.length})`} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select scope templates to control your bot's behavior and access patterns
        </Typography>
        
        {unselectedScopes.length === 0 ? (
          <Alert severity="info">
            All available scopes are selected. Create a custom scope or deselect existing ones to add more.
          </Alert>
        ) : (
          <List>
            {unselectedScopes.map((scope) => (
              <ListItem 
                key={scope.id} 
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  mb: 1, 
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={false}
                    onChange={() => handleScopeToggle(scope.id)}
                    disabled={readOnly}
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
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {scope.guardrails?.allowed_topics?.length && (
                          <Chip 
                            label={`${scope.guardrails.allowed_topics.length} allowed topics`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {scope.guardrails?.forbidden_topics?.length && (
                          <Chip 
                            label={`${scope.guardrails.forbidden_topics.length} forbidden topics`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                        {scope.dataset_filters && Object.keys(scope.dataset_filters).length > 0 && (
                          <Chip 
                            label="Dataset filters configured"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                {!readOnly && scope.custom && (
                  <IconButton 
                    onClick={() => openEditDialog(scope)}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage selected scopes and configure their detailed settings
        </Typography>
        
        {selectedScopeIds.length === 0 ? (
          <Alert severity="info">
                      Switch to the Available Scopes tab to select scope templates.
          </Alert>
        ) : (
          <List>
            {selectedScopes.map((scope) => (
              <ListItem 
                key={scope.id} 
                sx={{ 
                  border: 1, 
                  borderColor: 'success.main', 
                  mb: 1, 
                  borderRadius: 1,
                  bgcolor: 'success.50'
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={true}
                    onChange={() => handleScopeToggle(scope.id)}
                    disabled={readOnly}
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
                          ✓ Existing scope - already configured for this bot
                        </Typography>
                      )}
                      {scope.template && (
                        <Typography variant="caption" color="primary">
                          📋 Template - will be created when bot is saved
                        </Typography>
                      )}
                      {scope.custom && (
                        <Typography variant="caption" color="secondary">
                          🔧 Custom scope - fully configurable
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {!readOnly && (scope.custom || scope.template) && (
                  <IconButton 
                    onClick={() => openEditDialog(scope)}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <SettingsIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        )}

        {selectedScopeIds.length > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {selectedScopeIds.length} scope(s) configured. These will control bot behavior, knowledge access, and response guidelines.
            </Typography>
          </Alert>
        )}
      </TabPanel>

      {/* Scope Configuration Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Custom Scope' : `Edit Scope: ${scopeName}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Basic Information */}
            <Box>
              <TextField
                label="Scope Name"
                value={scopeName}
                onChange={(e) => setScopeName(e.target.value)}
                fullWidth
                required
                disabled={dialogMode === 'edit'}
                placeholder="e.g., Customer Support Agent, Technical Expert"
              />
              <TextField
                label="Description"
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                disabled={dialogMode === 'edit'}
                placeholder="Describe what this scope is designed to handle..."
                sx={{ mt: 2 }}
              />
            </Box>

            <Divider />

            {/* Guardrail Configuration */}
            <GuardrailConfiguration
              guardrails={scopeGuardrails}
              onChange={setScopeGuardrails}
              readOnly={false}
            />

            <Divider />

            {/* Dataset Filter Configuration */}
            <DatasetFilterConfiguration
              datasetFilters={scopeDatasetFilters}
              onChange={setScopeDatasetFilters}
              availableDatasets={availableDatasets}
              readOnly={false}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel}>Cancel</Button>
          <Button 
            onClick={handleDialogSave}
            variant="contained"
            disabled={!scopeName.trim()}
          >
            {dialogMode === 'create' ? 'Create Scope' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScopeConfiguration;