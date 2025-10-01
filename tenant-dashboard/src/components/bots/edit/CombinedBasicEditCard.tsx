/**
 * Combined Basic Configuration Card with Tabs for Bot Edit page
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
import { Info, Settings, SmartToy } from '@mui/icons-material';
import { BasicInfoEditCard } from './BasicInfoEditCard';
import { AIConfigEditCard } from './AIConfigEditCard';
import { SettingsEditCard } from './SettingsEditCard';

interface CombinedBasicEditCardProps {
  botData: any;
  aiProviders: any[];
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
      id={`basic-edit-tabpanel-${index}`}
      aria-labelledby={`basic-edit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const CombinedBasicEditCard: React.FC<CombinedBasicEditCardProps> = ({
  botData,
  aiProviders,
  onFieldChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <SmartToy sx={{ mr: 1 }} />
          Bot Configuration
        </Typography>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
          <Tab 
            label="Basic Info" 
            icon={<Info />}
            iconPosition="start"
          />
          <Tab 
            label="AI Settings" 
            icon={<SmartToy />}
            iconPosition="start"
          />
          <Tab 
            label="General Settings" 
            icon={<Settings />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ '& .MuiCard-root': { boxShadow: 'none', border: 'none' } }}>
            <BasicInfoEditCard
              botData={botData}
              aiProviders={aiProviders}
              onFieldChange={onFieldChange}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ '& .MuiCard-root': { boxShadow: 'none', border: 'none' } }}>
            <AIConfigEditCard
              botData={botData}
              onFieldChange={onFieldChange}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ '& .MuiCard-root': { boxShadow: 'none', border: 'none' } }}>
            <SettingsEditCard
              botData={botData}
              onFieldChange={onFieldChange}
            />
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
};