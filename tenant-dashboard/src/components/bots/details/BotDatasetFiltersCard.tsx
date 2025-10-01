import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  FilterList as FilterIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface BotDatasetFiltersCardProps {
  bot: any;
}

export const BotDatasetFiltersCard: React.FC<BotDatasetFiltersCardProps> = ({ bot }) => {
  const datasetFilters = bot.dataset_filters || {};
  const hasFilters = Object.keys(datasetFilters).some(key => {
    const value = datasetFilters[key];
    return Array.isArray(value) ? value.length > 0 : Object.keys(value || {}).length > 0;
  });

  if (!hasFilters) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon color="primary" />
            Dataset Content Filters
          </Typography>
          <Alert severity="info">
            No content filters configured. Bot has access to all dataset content.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FilterIcon color="primary" />
          Dataset Content Filters
        </Typography>
        
        <Stack spacing={2}>
          {/* Tag Filters */}
          {datasetFilters.tags?.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TagIcon fontSize="small" />
                  <Typography variant="subtitle1">Tag Filters ({datasetFilters.tags.length})</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {datasetFilters.tags.map((tag: string, index: number) => (
                    <Chip
                      key={index}
                      label={tag}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Category Filters */}
          {datasetFilters.categories?.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon fontSize="small" />
                  <Typography variant="subtitle1">Category Filters ({datasetFilters.categories.length})</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {datasetFilters.categories.map((category: string, index: number) => (
                    <Chip
                      key={index}
                      label={category}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Content Patterns */}
          {(datasetFilters.include_patterns?.length > 0 || datasetFilters.exclude_patterns?.length > 0) && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon fontSize="small" />
                  <Typography variant="subtitle1">Content Patterns</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {datasetFilters.include_patterns?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                        Include Patterns ({datasetFilters.include_patterns.length})
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {datasetFilters.include_patterns.map((pattern: string, index: number) => (
                          <Chip
                            key={index}
                            label={pattern}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  {datasetFilters.exclude_patterns?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                        Exclude Patterns ({datasetFilters.exclude_patterns.length})
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {datasetFilters.exclude_patterns.map((pattern: string, index: number) => (
                          <Chip
                            key={index}
                            label={pattern}
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

          {/* Metadata Filters */}
          {datasetFilters.metadata_filters && Object.keys(datasetFilters.metadata_filters).length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  <Typography variant="subtitle1">
                    Metadata Filters ({Object.keys(datasetFilters.metadata_filters).length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(datasetFilters.metadata_filters).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Filter Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" />
              Filter Summary
            </Typography>
            <Stack spacing={0.5}>
              {datasetFilters.tags?.length > 0 && (
                <Typography variant="body2">
                  📌 {datasetFilters.tags.length} tag filter(s) configured
                </Typography>
              )}
              {datasetFilters.categories?.length > 0 && (
                <Typography variant="body2">
                  📁 {datasetFilters.categories.length} category filter(s) configured
                </Typography>
              )}
              {datasetFilters.include_patterns?.length > 0 && (
                <Typography variant="body2">
                  ✅ {datasetFilters.include_patterns.length} include pattern(s) configured
                </Typography>
              )}
              {datasetFilters.exclude_patterns?.length > 0 && (
                <Typography variant="body2">
                  ❌ {datasetFilters.exclude_patterns.length} exclude pattern(s) configured
                </Typography>
              )}
              {Object.keys(datasetFilters.metadata_filters || {}).length > 0 && (
                <Typography variant="body2">
                  🏷️ {Object.keys(datasetFilters.metadata_filters || {}).length} metadata filter(s) configured
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};