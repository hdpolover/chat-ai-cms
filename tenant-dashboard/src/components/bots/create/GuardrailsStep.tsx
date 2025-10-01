/**
 * Guardrails & Filters step for Create Bot form
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Security, FilterList } from '@mui/icons-material';
import GuardrailConfiguration from '../GuardrailConfiguration';
import DatasetFilterConfiguration from '../DatasetFilterConfiguration';
import type { GuardrailsStepProps } from './types';

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
      id={`guardrails-tabpanel-${index}`}
      aria-labelledby={`guardrails-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const GuardrailsStep: React.FC<GuardrailsStepProps> = ({
  botData,
  availableDatasets,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleGuardrailsChange = (guardrails: any) => {
    onChange({ guardrails });
  };

  const handleDatasetFiltersChange = (dataset_filters: any) => {
    onChange({ dataset_filters });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Security sx={{ mr: 1 }} />
        Guardrails & Content Filters
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure how your bot should behave and what content it can access. 
        These settings help ensure your bot provides appropriate responses and stays within defined boundaries.
      </Alert>
      
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        <Tab 
          label="Response Guardrails" 
          icon={<Security />}
          iconPosition="start"
        />
        <Tab 
          label="Dataset Content Filters" 
          icon={<FilterList />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure response guidelines, topic restrictions, and knowledge boundaries to control how your bot behaves
        </Typography>
        
        <GuardrailConfiguration
          guardrails={botData.guardrails || {}}
          onChange={handleGuardrailsChange}
          readOnly={false}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Set up filters to control which content from your datasets the bot can access and use in responses
        </Typography>
        
        <DatasetFilterConfiguration
          datasetFilters={botData.dataset_filters || {}}
          onChange={handleDatasetFiltersChange}
          availableDatasets={availableDatasets}
          readOnly={false}
        />
      </TabPanel>
    </Box>
  );
};