/**
 * Advanced Configuration step for Create Bot form
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Settings, Security } from '@mui/icons-material';
import ScopeConfiguration from '../ScopeConfiguration';
import type { AdvancedConfigStepProps } from './types';

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
      id={`advanced-tabpanel-${index}`}
      aria-labelledby={`advanced-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdvancedConfigStep: React.FC<AdvancedConfigStepProps> = ({
  botData,
  availableDatasets,
  availableScopes,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleScopeSelection = (scopeIds: string[]) => {
    onChange({ scope_ids: scopeIds });
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
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Settings sx={{ mr: 1 }} />
        Advanced Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure advanced bot behavior using scope templates. Scopes combine guardrails and dataset filters 
        into reusable configurations that can be applied across multiple bots.
      </Alert>
      
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        <Tab 
          label="Scope Configuration" 
          icon={<Security />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Select and configure scope templates that define your bot's behavior patterns, 
          access controls, and response guidelines
        </Typography>
        
        <ScopeConfiguration
          selectedScopeIds={botData.scope_ids || []}
          availableScopes={availableScopes || []}
          availableDatasets={availableDatasets}
          onScopeSelection={handleScopeSelection}
          onCreateScope={handleCreateScope}
          onUpdateScope={handleUpdateScope}
          readOnly={false}
        />
      </TabPanel>
    </Box>
  );
};