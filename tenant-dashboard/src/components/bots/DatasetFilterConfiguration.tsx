'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Storage as StorageIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Dataset } from '@/services/dataset';
import { DatasetFilters } from '@/types';

interface DatasetFilterConfigurationProps {
  datasetFilters: DatasetFilters;
  onChange: (filters: DatasetFilters) => void;
  availableDatasets?: Dataset[];
  readOnly?: boolean;
}

const DatasetFilterConfiguration: React.FC<DatasetFilterConfigurationProps> = ({
  datasetFilters,
  onChange,
  availableDatasets = [],
  readOnly = false,
}) => {
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newIncludePattern, setNewIncludePattern] = useState('');
  const [newExcludePattern, setNewExcludePattern] = useState('');
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

  const handleFilterChange = (field: keyof DatasetFilters, value: unknown) => {
    onChange({
      ...datasetFilters,
      [field]: value,
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...(datasetFilters.tags || []), newTag.trim()];
      handleFilterChange('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const updatedTags = datasetFilters.tags?.filter((_: string, i: number) => i !== index) || [];
    handleFilterChange('tags', updatedTags);
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...(datasetFilters.categories || []), newCategory.trim()];
      handleFilterChange('categories', updatedCategories);
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    const updatedCategories = datasetFilters.categories?.filter((_: string, i: number) => i !== index) || [];
    handleFilterChange('categories', updatedCategories);
  };

  const addIncludePattern = () => {
    if (newIncludePattern.trim()) {
      const updatedPatterns = [...(datasetFilters.include_patterns || []), newIncludePattern.trim()];
      handleFilterChange('include_patterns', updatedPatterns);
      setNewIncludePattern('');
    }
  };

  const removeIncludePattern = (index: number) => {
    const updatedPatterns = datasetFilters.include_patterns?.filter((_: string, i: number) => i !== index) || [];
    handleFilterChange('include_patterns', updatedPatterns);
  };

  const addExcludePattern = () => {
    if (newExcludePattern.trim()) {
      const updatedPatterns = [...(datasetFilters.exclude_patterns || []), newExcludePattern.trim()];
      handleFilterChange('exclude_patterns', updatedPatterns);
      setNewExcludePattern('');
    }
  };

  const removeExcludePattern = (index: number) => {
    const updatedPatterns = datasetFilters.exclude_patterns?.filter((_: string, i: number) => i !== index) || [];
    handleFilterChange('exclude_patterns', updatedPatterns);
  };

  const addMetadataFilter = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      const updatedFilters = {
        ...datasetFilters.metadata_filters,
        [newMetadataKey.trim()]: newMetadataValue.trim(),
      };
      handleFilterChange('metadata_filters', updatedFilters);
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const removeMetadataFilter = (key: string) => {
    const updatedFilters = { ...datasetFilters.metadata_filters };
    delete updatedFilters[key];
    handleFilterChange('metadata_filters', updatedFilters);
  };

  // Extract available tags and categories from datasets
  const availableTags = Array.from(new Set(
    availableDatasets.flatMap(dataset => dataset.tags || [])
  ));

  const availableCategories = Array.from(new Set(
    availableDatasets.map(dataset => dataset.metadata?.category).filter(Boolean)
  ));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FilterIcon sx={{ mr: 1 }} />
        Dataset Filter Configuration
      </Typography>

      {/* Tag Filters */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TagIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Tag Filters</Typography>
            <Tooltip title="Filter datasets by tags to control which content the bot can access">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Tag</InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const updatedTags = [...(datasetFilters.tags || []), e.target.value];
                      handleFilterChange('tags', updatedTags);
                    }
                  }}
                  disabled={readOnly}
                >
                  {availableTags.filter(tag => !datasetFilters.tags?.includes(tag)).map((tag) => (
                    <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Or enter custom tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                disabled={readOnly}
              />
              <IconButton 
                onClick={addTag} 
                color="primary"
                disabled={readOnly || !newTag.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {datasetFilters.tags?.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  color="primary"
                  variant="outlined"
                  onDelete={readOnly ? undefined : () => removeTag(index)}
                  deleteIcon={<RemoveIcon />}
                />
              ))}
            </Box>
            {(!datasetFilters.tags || datasetFilters.tags.length === 0) && (
              <Alert severity="info">
                No tag filters configured. Bot will have access to all datasets regardless of tags.
              </Alert>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Category Filters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Category Filters</Typography>
            <Tooltip title="Filter datasets by categories for more organized content access">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const updatedCategories = [...(datasetFilters.categories || []), e.target.value];
                      handleFilterChange('categories', updatedCategories);
                    }
                  }}
                  disabled={readOnly}
                >
                  {availableCategories.filter(cat => !datasetFilters.categories?.includes(cat)).map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Or enter custom category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                disabled={readOnly}
              />
              <IconButton 
                onClick={addCategory} 
                color="primary"
                disabled={readOnly || !newCategory.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {datasetFilters.categories?.map((category: string, index: number) => (
                <Chip
                  key={index}
                  label={category}
                  color="secondary"
                  variant="outlined"
                  onDelete={readOnly ? undefined : () => removeCategory(index)}
                  deleteIcon={<RemoveIcon />}
                />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Content Patterns */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StorageIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Content Patterns</Typography>
            <Tooltip title="Include or exclude content based on filename or content patterns">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Include Patterns */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main' }}>
                Include Patterns
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g., *.pdf, *manual*, documentation/*"
                  value={newIncludePattern}
                  onChange={(e) => setNewIncludePattern(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIncludePattern()}
                  fullWidth
                  disabled={readOnly}
                />
                <IconButton 
                  onClick={addIncludePattern} 
                  color="primary"
                  disabled={readOnly || !newIncludePattern.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {datasetFilters.include_patterns?.map((pattern: string, index: number) => (
                  <Chip
                    key={index}
                    label={pattern}
                    color="success"
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => removeIncludePattern(index)}
                    deleteIcon={<RemoveIcon />}
                  />
                ))}
              </Box>
            </Box>

            {/* Exclude Patterns */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                Exclude Patterns
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g., *confidential*, *.temp, drafts/*"
                  value={newExcludePattern}
                  onChange={(e) => setNewExcludePattern(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExcludePattern()}
                  fullWidth
                  disabled={readOnly}
                />
                <IconButton 
                  onClick={addExcludePattern} 
                  color="error"
                  disabled={readOnly || !newExcludePattern.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {datasetFilters.exclude_patterns?.map((pattern: string, index: number) => (
                  <Chip
                    key={index}
                    label={pattern}
                    color="error"
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => removeExcludePattern(index)}
                    deleteIcon={<RemoveIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Metadata Filters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Metadata Filters</Typography>
            <Tooltip title="Filter content based on custom metadata properties">
              <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Metadata key (e.g., department, priority)"
                value={newMetadataKey}
                onChange={(e) => setNewMetadataKey(e.target.value)}
                disabled={readOnly}
              />
              <TextField
                size="small"
                placeholder="Metadata value"
                value={newMetadataValue}
                onChange={(e) => setNewMetadataValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMetadataFilter()}
                disabled={readOnly}
              />
              <Button
                onClick={addMetadataFilter}
                disabled={readOnly || !newMetadataKey.trim() || !newMetadataValue.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(datasetFilters.metadata_filters || {}).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  color="info"
                  variant="outlined"
                  onDelete={readOnly ? undefined : () => removeMetadataFilter(key)}
                  deleteIcon={<RemoveIcon />}
                />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Configuration Summary */}
      {(datasetFilters.tags?.length || datasetFilters.categories?.length || 
        datasetFilters.include_patterns?.length || datasetFilters.exclude_patterns?.length ||
        Object.keys(datasetFilters.metadata_filters || {}).length > 0) && (
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
            Filter Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {datasetFilters.tags?.length && (
              <Typography variant="body2">
                📌 {datasetFilters.tags.length} tag filter(s) configured
              </Typography>
            )}
            {datasetFilters.categories?.length && (
              <Typography variant="body2">
                📁 {datasetFilters.categories.length} category filter(s) configured
              </Typography>
            )}
            {datasetFilters.include_patterns?.length && (
              <Typography variant="body2">
                ✅ {datasetFilters.include_patterns.length} include pattern(s) configured
              </Typography>
            )}
            {datasetFilters.exclude_patterns?.length && (
              <Typography variant="body2">
                ❌ {datasetFilters.exclude_patterns.length} exclude pattern(s) configured
              </Typography>
            )}
            {Object.keys(datasetFilters.metadata_filters || {}).length > 0 && (
              <Typography variant="body2">
                🏷️ {Object.keys(datasetFilters.metadata_filters || {}).length} metadata filter(s) configured
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DatasetFilterConfiguration;