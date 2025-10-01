/**
 * Guardrails Configuration Card for Bot Edit page
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
import { Security, FilterList } from '@mui/icons-material';
import GuardrailConfiguration from '../GuardrailConfiguration';
import DatasetFilterConfiguration from '../DatasetFilterConfiguration';

interface GuardrailsEditCardProps {
  botData: any;
  availableDatasets: any[];
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
      id={`edit-guardrails-tabpanel-${index}`}
      aria-labelledby={`edit-guardrails-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const GuardrailsEditCard: React.FC<GuardrailsEditCardProps> = ({
  botData,
  availableDatasets,
  onFieldChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleGuardrailsChange = (guardrails: any) => {
    onFieldChange('guardrails', guardrails);
  };

  const handleDatasetFiltersChange = (dataset_filters: any) => {
    onFieldChange('dataset_filters', dataset_filters);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 1 }} />
          Guardrails & Content Filters
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Configure response guardrails and content filters to control bot behavior and data access.
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
          <GuardrailConfiguration
            guardrails={botData.guardrails || {}}
            onChange={handleGuardrailsChange}
            readOnly={false}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DatasetFilterConfiguration
            datasetFilters={botData.dataset_filters || {}}
            onChange={handleDatasetFiltersChange}
            availableDatasets={availableDatasets}
            readOnly={false}
          />
        </TabPanel>
      </CardContent>
    </Card>
  );
};