/**
 * Knowledge & Datasets step for Create Bot form
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  Paper,
  Button,
} from '@mui/material';
import { Storage } from '@mui/icons-material';
import type { KnowledgeStepProps } from './types';

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
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const KnowledgeStep: React.FC<KnowledgeStepProps> = ({
  botData,
  availableDatasets,
  availableScopes,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleDatasetToggle = (datasetId: string) => {
    const currentDatasets = botData.dataset_ids || [];
    const newDatasets = currentDatasets.includes(datasetId)
      ? currentDatasets.filter(id => id !== datasetId)
      : [...currentDatasets, datasetId];
    
    onChange({ dataset_ids: newDatasets });
  };

  const handleScopeToggle = (scopeId: string) => {
    const currentScopes = botData.scope_ids || [];
    const newScopes = currentScopes.includes(scopeId)
      ? currentScopes.filter(id => id !== scopeId)
      : [...currentScopes, scopeId];
    
    onChange({ scope_ids: newScopes });
  };

  return (
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
  );
};