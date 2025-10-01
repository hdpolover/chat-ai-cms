import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  FormControlLabel,
  Switch,
  TextField,
  Stack,
  Box,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import type { SettingsEditProps } from './types';

export const SettingsEditCard: React.FC<SettingsEditProps> = ({
  botData,
  onFieldChange
}) => {
  const handleAddDomain = () => {
    const domain = prompt('Enter domain (e.g., example.com):');
    if (domain && domain.trim()) {
      const currentDomains = botData.allowed_domains || [];
      if (!currentDomains.includes(domain.trim())) {
        onFieldChange('allowed_domains', [...currentDomains, domain.trim()]);
      }
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const currentDomains = botData.allowed_domains || [];
    onFieldChange('allowed_domains', currentDomains.filter(domain => domain !== domainToRemove));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SettingsIcon color="primary" />
          Bot Settings
        </Typography>
        
        <Stack spacing={3}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={botData.is_active ?? true}
                  onChange={(e) => onFieldChange('is_active', e.target.checked)}
                />
              }
              label="Active"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              When active, the bot can respond to chat requests
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={botData.is_public ?? false}
                  onChange={(e) => onFieldChange('is_public', e.target.checked)}
                />
              }
              label="Public Bot"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Public bots can be accessed by anyone with the link
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Allowed Domains</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddDomain}
                size="small"
                variant="outlined"
              >
                Add Domain
              </Button>
            </Box>
            
            {botData.allowed_domains && botData.allowed_domains.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {botData.allowed_domains.map((domain, index) => (
                  <Chip
                    key={index}
                    label={domain}
                    onDelete={() => handleRemoveDomain(domain)}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No domain restrictions - bot can be accessed from any domain
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Restrict bot access to specific domains for security
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};