'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Policy as PolicyIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { GuardrailConfig } from '@/types';

interface GuardrailConfigurationProps {
  guardrails: GuardrailConfig;
  onChange: (guardrails: GuardrailConfig) => void;
  readOnly?: boolean;
}

const GuardrailConfiguration: React.FC<GuardrailConfigurationProps> = ({
  guardrails,
  onChange,
  readOnly = false,
}) => {
  const [newAllowedTopic, setNewAllowedTopic] = useState('');
  const [newForbiddenTopic, setNewForbiddenTopic] = useState('');
  const [newAllowedSource, setNewAllowedSource] = useState('');

  const handleGuardrailChange = (field: keyof GuardrailConfig, value: unknown) => {
    onChange({
      ...guardrails,
      [field]: value,
    });
  };

  const handleKnowledgeBoundaryChange = (field: string, value: unknown) => {
    onChange({
      ...guardrails,
      knowledge_boundaries: {
        ...guardrails.knowledge_boundaries,
        [field]: value,
      },
    });
  };

  const handleResponseGuidelineChange = (field: string, value: unknown) => {
    onChange({
      ...guardrails,
      response_guidelines: {
        ...guardrails.response_guidelines,
        [field]: value,
      },
    });
  };

  const addAllowedTopic = () => {
    if (newAllowedTopic.trim()) {
      const updatedTopics = [...(guardrails.allowed_topics || []), newAllowedTopic.trim()];
      handleGuardrailChange('allowed_topics', updatedTopics);
      setNewAllowedTopic('');
    }
  };

  const removeAllowedTopic = (index: number) => {
    const updatedTopics = guardrails.allowed_topics?.filter((_, i) => i !== index) || [];
    handleGuardrailChange('allowed_topics', updatedTopics);
  };

  const addForbiddenTopic = () => {
    if (newForbiddenTopic.trim()) {
      const updatedTopics = [...(guardrails.forbidden_topics || []), newForbiddenTopic.trim()];
      handleGuardrailChange('forbidden_topics', updatedTopics);
      setNewForbiddenTopic('');
    }
  };

  const removeForbiddenTopic = (index: number) => {
    const updatedTopics = guardrails.forbidden_topics?.filter((_, i) => i !== index) || [];
    handleGuardrailChange('forbidden_topics', updatedTopics);
  };

  const addAllowedSource = () => {
    if (newAllowedSource.trim()) {
      const updatedSources = [...(guardrails.knowledge_boundaries?.allowed_sources || []), newAllowedSource.trim()];
      handleKnowledgeBoundaryChange('allowed_sources', updatedSources);
      setNewAllowedSource('');
    }
  };

  const removeAllowedSource = (index: number) => {
    const updatedSources = guardrails.knowledge_boundaries?.allowed_sources?.filter((_, i) => i !== index) || [];
    handleKnowledgeBoundaryChange('allowed_sources', updatedSources);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <SecurityIcon sx={{ mr: 1 }} />
        Guardrail Configuration
      </Typography>

      {/* Topic Management */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PolicyIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Topic Management</Typography>
            <Tooltip title="Configure what topics your bot can and cannot discuss">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Allowed Topics */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main' }}>
                Allowed Topics
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g., product information, support questions"
                  value={newAllowedTopic}
                  onChange={(e) => setNewAllowedTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllowedTopic()}
                  fullWidth
                  disabled={readOnly}
                />
                <IconButton 
                  onClick={addAllowedTopic} 
                  color="primary"
                  disabled={readOnly || !newAllowedTopic.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {guardrails.allowed_topics?.map((topic, index) => (
                  <Chip
                    key={index}
                    label={topic}
                    color="success"
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => removeAllowedTopic(index)}
                    deleteIcon={<RemoveIcon />}
                  />
                ))}
              </Box>
              {(!guardrails.allowed_topics || guardrails.allowed_topics.length === 0) && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No allowed topics configured. Bot can discuss any topic not forbidden.
                </Alert>
              )}
            </Box>

            {/* Forbidden Topics */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                Forbidden Topics
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g., personal information, competitor details"
                  value={newForbiddenTopic}
                  onChange={(e) => setNewForbiddenTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addForbiddenTopic()}
                  fullWidth
                  disabled={readOnly}
                />
                <IconButton 
                  onClick={addForbiddenTopic} 
                  color="error"
                  disabled={readOnly || !newForbiddenTopic.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {guardrails.forbidden_topics?.map((topic, index) => (
                  <Chip
                    key={index}
                    label={topic}
                    color="error"
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => removeForbiddenTopic(index)}
                    deleteIcon={<RemoveIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Knowledge Boundaries */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Knowledge Boundaries</Typography>
            <Tooltip title="Configure how strictly the bot should stick to its knowledge base">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Strict Mode & Context Preference */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={guardrails.knowledge_boundaries?.strict_mode || false}
                      onChange={(e) => handleKnowledgeBoundaryChange('strict_mode', e.target.checked)}
                      disabled={readOnly}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Strict Mode</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only answer questions using configured knowledge base
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Context Preference</InputLabel>
                  <Select
                    value={guardrails.knowledge_boundaries?.context_preference || 'supplement'}
                    onChange={(e) => handleKnowledgeBoundaryChange('context_preference', e.target.value)}
                    disabled={readOnly}
                  >
                    <MenuItem value="exclusive">Exclusive - Only use knowledge base</MenuItem>
                    <MenuItem value="prefer">Prefer - Prioritize knowledge base</MenuItem>
                    <MenuItem value="supplement">Supplement - Use both sources</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Allowed Sources */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Allowed Knowledge Sources
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g., product_docs, support_articles, faq"
                  value={newAllowedSource}
                  onChange={(e) => setNewAllowedSource(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllowedSource()}
                  fullWidth
                  disabled={readOnly}
                />
                <IconButton 
                  onClick={addAllowedSource} 
                  color="primary"
                  disabled={readOnly || !newAllowedSource.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {guardrails.knowledge_boundaries?.allowed_sources?.map((source, index) => (
                  <Chip
                    key={index}
                    label={source}
                    color="primary"
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => removeAllowedSource(index)}
                    deleteIcon={<RemoveIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Response Guidelines */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Response Guidelines</Typography>
            <Tooltip title="Configure how the bot should format and structure its responses">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Max Response Length & Response Options */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Maximum Response Length: {guardrails.response_guidelines?.max_response_length || 500} characters
                </Typography>
                <Slider
                  value={guardrails.response_guidelines?.max_response_length || 500}
                  onChange={(_, value) => handleResponseGuidelineChange('max_response_length', value)}
                  min={100}
                  max={2000}
                  step={50}
                  marks={[
                    { value: 100, label: '100' },
                    { value: 500, label: '500' },
                    { value: 1000, label: '1000' },
                    { value: 2000, label: '2000' },
                  ]}
                  disabled={readOnly}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={guardrails.response_guidelines?.require_citations || false}
                        onChange={(e) => handleResponseGuidelineChange('require_citations', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Require Citations"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={guardrails.response_guidelines?.step_by_step || false}
                        onChange={(e) => handleResponseGuidelineChange('step_by_step', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Step-by-step Instructions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={guardrails.response_guidelines?.mathematical_notation || false}
                        onChange={(e) => handleResponseGuidelineChange('mathematical_notation', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Mathematical Notation"
                  />
                </Box>
              </Box>
            </Box>

            {/* Custom Refusal Message */}
            <Box>
              <TextField
                fullWidth
                label="Custom Refusal Message"
                placeholder="Message to show when bot refuses to answer (optional)"
                value={guardrails.refusal_message || ''}
                onChange={(e) => handleGuardrailChange('refusal_message', e.target.value)}
                multiline
                rows={2}
                disabled={readOnly}
                helperText="This message will be shown when the bot cannot answer due to guardrail restrictions"
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Configuration Summary */}
      {(guardrails.allowed_topics?.length || guardrails.forbidden_topics?.length || 
        guardrails.knowledge_boundaries?.strict_mode || guardrails.refusal_message) && (
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
            Configuration Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {guardrails.allowed_topics?.length && (
              <Typography variant="body2">
                ✓ {guardrails.allowed_topics.length} allowed topic(s) configured
              </Typography>
            )}
            {guardrails.forbidden_topics?.length && (
              <Typography variant="body2">
                ✗ {guardrails.forbidden_topics.length} forbidden topic(s) configured
              </Typography>
            )}
            {guardrails.knowledge_boundaries?.strict_mode && (
              <Typography variant="body2">
                🔒 Strict mode enabled - knowledge base only
              </Typography>
            )}
            {guardrails.refusal_message && (
              <Typography variant="body2">
                💬 Custom refusal message configured
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default GuardrailConfiguration;