/**
 * Advanced Configuration Card for Bot Edit page
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import ScopeConfiguration from '../ScopeConfiguration';

interface AdvancedConfigEditCardProps {
  botData: any;
  availableDatasets: any[];
  availableScopes: any[];
  onFieldChange: (field: string, value: any) => void;
}

export const AdvancedConfigEditCard: React.FC<AdvancedConfigEditCardProps> = ({
  botData,
  availableDatasets,
  availableScopes,
  onFieldChange,
}) => {
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
          Configure advanced behavior using scope templates that combine guardrails and dataset filters.
        </Alert>

        <ScopeConfiguration
          selectedScopeIds={botData.scope_ids || []}
          availableScopes={availableScopes || []}
          availableDatasets={availableDatasets}
          onScopeSelection={handleScopeSelection}
          onCreateScope={handleCreateScope}
          onUpdateScope={handleUpdateScope}
          readOnly={false}
        />
      </CardContent>
    </Card>
  );
};