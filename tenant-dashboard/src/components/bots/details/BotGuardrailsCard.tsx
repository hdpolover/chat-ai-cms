import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Stack,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Policy as PolicyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface BotGuardrailsCardProps {
  bot: any;
}

export const BotGuardrailsCard: React.FC<BotGuardrailsCardProps> = ({ bot }) => {
  const guardrails = bot.guardrails || {};
  const hasGuardrails = Object.keys(guardrails).length > 0;

  if (!hasGuardrails) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SecurityIcon color="primary" />
            Guardrails Configuration
          </Typography>
          <Alert severity="info">
            No guardrails configured. Bot operates with default behavior guidelines.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SecurityIcon color="primary" />
          Guardrails Configuration
        </Typography>
        
        <Stack spacing={2}>
          {/* Topic Management */}
          {(guardrails.allowed_topics?.length > 0 || guardrails.forbidden_topics?.length > 0) && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PolicyIcon fontSize="small" />
                  <Typography variant="subtitle1">Topic Management</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {guardrails.allowed_topics?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon fontSize="small" />
                        Allowed Topics ({guardrails.allowed_topics.length})
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {guardrails.allowed_topics.map((topic: string, index: number) => (
                          <Chip
                            key={index}
                            label={topic}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  {guardrails.forbidden_topics?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelIcon fontSize="small" />
                        Forbidden Topics ({guardrails.forbidden_topics.length})
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {guardrails.forbidden_topics.map((topic: string, index: number) => (
                          <Chip
                            key={index}
                            label={topic}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Knowledge Boundaries */}
          {guardrails.knowledge_boundaries && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  <Typography variant="subtitle1">Knowledge Boundaries</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Chip
                      label={guardrails.knowledge_boundaries.strict_mode ? "Strict Mode: ON" : "Strict Mode: OFF"}
                      color={guardrails.knowledge_boundaries.strict_mode ? "warning" : "default"}
                      variant="outlined"
                    />
                    {guardrails.knowledge_boundaries.context_preference && (
                      <Chip
                        label={`Context: ${guardrails.knowledge_boundaries.context_preference}`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {guardrails.knowledge_boundaries.allowed_sources?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Allowed Knowledge Sources
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {guardrails.knowledge_boundaries.allowed_sources.map((source: string, index: number) => (
                          <Chip
                            key={index}
                            label={source}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Response Guidelines */}
          {guardrails.response_guidelines && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  <Typography variant="subtitle1">Response Guidelines</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {guardrails.response_guidelines.max_response_length && (
                      <Chip
                        label={`Max Length: ${guardrails.response_guidelines.max_response_length} chars`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {guardrails.response_guidelines.require_citations && (
                      <Chip
                        label="Citations Required"
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {guardrails.response_guidelines.step_by_step && (
                      <Chip
                        label="Step-by-step Format"
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {guardrails.response_guidelines.mathematical_notation && (
                      <Chip
                        label="Math Notation Enabled"
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Custom Refusal Message */}
          {guardrails.refusal_message && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Custom Refusal Message
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'grey.50', 
                  p: 2, 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="body2">
                    {guardrails.refusal_message}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};