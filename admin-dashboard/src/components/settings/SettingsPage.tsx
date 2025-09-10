'use client';
import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import SystemSettings from './SystemSettings';
import AIProviderSettings from './AIProviderSettings';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="System Settings" />
            <Tab label="AI Providers" />
            <Tab label="User Management" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <SystemSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AIProviderSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography>User Management - Coming Soon</Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}