/**
 * Combined Advanced Configuration Card with Tabs for Bot Edit page
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
} from '@mui/material';
import { Settings, Security, FilterList } from '@mui/icons-material';
import GuardrailConfiguration from '../GuardrailConfiguration';
import DatasetFilterConfiguration from '../DatasetFilterConfiguration';
import ScopeConfiguration from '../ScopeConfiguration';

interface CombinedAdvancedEditCardProps {
  botData: any;
  availableDatasets: any[];
  availableScopes?: any[];
  onFieldChange: (field: string, value: any) => void;
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
      id={`advanced-edit-tabpanel-${index}`}
      aria-labelledby={`advanced-edit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const CombinedAdvancedEditCard: React.FC<CombinedAdvancedEditCardProps> = ({
  botData,
  availableDatasets,
  availableScopes = [],
  onFieldChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleGuardrailsChange = (guardrails: any) => {
    onFieldChange('guardrails', guardrails);
  };

  const handleDatasetFiltersChange = (dataset_filters: any) => {
    onFieldChange('dataset_filters', dataset_filters);
  };

  const handleScopeSelection = (scopeIds: string[]) => {
    onFieldChange('scope_ids', scopeIds);
  };

  const handleCreateScope = (scope: any) => {
    // This would typically call an API to create the scope
    console.log('Create scope:', scope);
  };

  const handleUpdateScope = (scopeId: string, updates: any) => {
    // This would typically call an API to update the scope
    console.log('Update scope:', scopeId, updates);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          Advanced Configuration
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Configure advanced bot behavior, content filtering, and response guidelines.
        </Alert>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
          <Tab 
            label="Response Guardrails" 
            icon={<Security />}
            iconPosition="start"
          />
          <Tab 
            label="Content Filters" 
            icon={<FilterList />}
            iconPosition="start"
          />
          <Tab 
            label="Scope Templates" 
            icon={<Settings />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure response guidelines, topic restrictions, and knowledge boundaries
          </Typography>
          <GuardrailConfiguration
            guardrails={botData.guardrails || {}}
            onChange={handleGuardrailsChange}
            readOnly={false}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set up filters to control which dataset content the bot can access
          </Typography>
          <DatasetFilterConfiguration
            datasetFilters={botData.dataset_filters || {}}
            onChange={handleDatasetFiltersChange}
            availableDatasets={availableDatasets}
            readOnly={false}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage scope templates that combine guardrails and filters into reusable configurations
          </Typography>
          <ScopeConfiguration
            selectedScopeIds={botData.scope_ids || []}
            availableScopes={availableScopes}
            availableDatasets={availableDatasets}
            onScopeSelection={handleScopeSelection}
            onCreateScope={handleCreateScope}
            onUpdateScope={handleUpdateScope}
            readOnly={false}
          />
        </TabPanel>
      </CardContent>
    </Card>
  );
};