/**
 * Access & Security step for Create Bot form
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Security, ExpandMore, Add, Remove, Language } from '@mui/icons-material';
import type { AccessSecurityStepProps } from './types';

export const AccessSecurityStep: React.FC<AccessSecurityStepProps> = ({
  botData,
  onChange,
}) => {
  const [domainInput, setDomainInput] = useState('');

  const addDomain = () => {
    if (domainInput.trim() && !botData.allowed_domains?.includes(domainInput.trim())) {
      onChange({
        allowed_domains: [...(botData.allowed_domains || []), domainInput.trim()]
      });
      setDomainInput('');
    }
  };

  const removeDomain = (domain: string) => {
    onChange({
      allowed_domains: botData.allowed_domains?.filter(d => d !== domain) || []
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addDomain();
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Security sx={{ mr: 1 }} />
        Access & Security
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Visibility Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={botData.is_public || false}
                  onChange={(e) => onChange({ is_public: e.target.checked })}
                />
              }
              label="Public Bot"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Public bots can be accessed by users outside your organization
            </Typography>
          </AccordionDetails>
        </Accordion>

        {botData.is_public && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Domain Restrictions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Restrict access to specific domains. Leave empty to allow all domains.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Add Domain"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com"
                  onKeyPress={handleKeyPress}
                  fullWidth
                />
                <Button 
                  variant="outlined" 
                  onClick={addDomain}
                  startIcon={<Add />}
                  disabled={!domainInput.trim()}
                >
                  Add
                </Button>
              </Box>
              
              {botData.allowed_domains && botData.allowed_domains.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {botData.allowed_domains.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      deleteIcon={<Remove />}
                      onDelete={() => removeDomain(domain)}
                      icon={<Language />}
                    />
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  );
};