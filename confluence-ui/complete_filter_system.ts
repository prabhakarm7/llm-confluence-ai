import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import type { GraphFilters, FilterOptions } from '../types';

interface CompleteFilterPanelProps {
  filters: GraphFilters;
  setFilters: (filters: GraphFilters) => void;
  filterOptions: FilterOptions | null;
  onApplyFilters: () => void;
  loading: boolean;
}

const CompleteFilterPanel: React.FC<CompleteFilterPanelProps> = ({
  filters,
  setFilters,
  filterOptions,
  onApplyFilters,
  loading
}) => {
  const [expanded, setExpanded] = useState<string>('geographic');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  const handleFilterChange = (key: keyof GraphFilters, value: string[]) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      Array.isArray(value) ? value.length > 0 : value
    ).length;
  };

  if (!filterOptions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Filter Header */}
      <Paper sx={{ p: 2, mb: 1, bgcolor: 'background.default' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Graph Filters</Typography>
            <Badge badgeContent={getActiveFiltersCount()} color="primary" sx={{ ml: 1 }}>
              <Box />
            </Badge>
          </Box>
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            onClick={onApplyFilters}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            fullWidth
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </Button>
        </Box>
      </Paper>

      {/* Geographic Filters */}
      <Accordion expanded={expanded === 'geographic'} onChange={handleAccordionChange('geographic')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            📍 Geographic & Market
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Regions */}
            <FormControl fullWidth size="small">
              <InputLabel>Regions</InputLabel>
              <Select
                multiple
                value={filters.regions || []}
                onChange={(e) => handleFilterChange('regions', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.regions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sales Regions */}
            <FormControl fullWidth size="small">
              <InputLabel>Sales Regions</InputLabel>
              <Select
                multiple
                value={filters.sales_regions || []}
                onChange={(e) => handleFilterChange('sales_regions', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.sales_regions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Channels */}
            <FormControl fullWidth size="small">
              <InputLabel>Channels</InputLabel>
              <Select
                multiple
                value={filters.channels || []}
                onChange={(e) => handleFilterChange('channels', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.channels.map(channel => (
                  <MenuItem key={channel} value={channel}>{channel}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Node Types */}
      <Accordion expanded={expanded === 'nodes'} onChange={handleAccordionChange('nodes')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            🔹 Node Types
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {['CONSULTANT', 'COMPANY', 'PRODUCT', 'FIELD_CONSULTANT'].map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={filters.node_types?.includes(type) || false}
                    onChange={(e) => {
                      const current = filters.node_types || [];
                      const updated = e.target.checked 
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      handleFilterChange('node_types', updated);
                    }}
                  />
                }
                label={type.replace('_', ' ')}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Asset Classes */}
      <Accordion expanded={expanded === 'assets'} onChange={handleAccordionChange('assets')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            📊 Asset Classes & Products
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Asset Classes</InputLabel>
              <Select
                multiple
                value={filters.asset_classes || []}
                onChange={(e) => handleFilterChange('asset_classes', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.asset_classes.map(asset => (
                  <MenuItem key={asset} value={asset}>{asset}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mandate Status */}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Mandate Status</Typography>
            <FormGroup row>
              {filterOptions.mandate_status.map(status => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={filters.mandate_status?.includes(status) || false}
                      onChange={(e) => {
                        const current = filters.mandate_status || [];
                        const updated = e.target.checked 
                          ? [...current, status]
                          : current.filter(s => s !== status);
                        handleFilterChange('mandate_status', updated);
                      }}
                    />
                  }
                  label={
                    <Chip 
                      label={status}
                      size="small"
                      color={
                        status === 'Active' ? 'success' :
                        status === 'At Risk' ? 'error' : 'warning'
                      }
                      variant="outlined"
                    />
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Advisors */}
      <Accordion expanded={expanded === 'advisors'} onChange={handleAccordionChange('advisors')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            👤 Advisors & Privacy
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* PCA */}
            <FormControl fullWidth size="small">
              <InputLabel>Primary Consultant Advisor (PCA)</InputLabel>
              <Select
                multiple
                value={filters.pca || []}
                onChange={(e) => handleFilterChange('pca', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.pca_options.map(pca => (
                  <MenuItem key={pca} value={pca}>{pca}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ACA */}
            <FormControl fullWidth size="small">
              <InputLabel>Alternate Client Advisor (ACA)</InputLabel>
              <Select
                multiple
                value={filters.aca || []}
                onChange={(e) => handleFilterChange('aca', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.aca_options.map(aca => (
                  <MenuItem key={aca} value={aca}>{aca}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Privacy Levels */}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Privacy Levels</Typography>
            <FormGroup row>
              {filterOptions.privacy_levels.map(privacy => (
                <FormControlLabel
                  key={privacy}
                  control={
                    <Checkbox
                      checked={filters.privacy_levels?.includes(privacy) || false}
                      onChange={(e) => {
                        const current = filters.privacy_levels || [];
                        const updated = e.target.checked 
                          ? [...current, privacy]
                          : current.filter(p => p !== privacy);
                        handleFilterChange('privacy_levels', updated);
                      }}
                    />
                  }
                  label={privacy}
                />
              ))}
            </FormGroup>

            {/* Level of Influence */}
            <FormControl fullWidth size="small">
              <InputLabel>Level of Influence</InputLabel>
              <Select
                multiple
                value={filters.level_of_influence || []}
                onChange={(e) => handleFilterChange('level_of_influence', e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {filterOptions.level_of_influence.map(level => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>


          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Ratings & Rankings */}
      <Accordion expanded={expanded === 'ratings'} onChange={handleAccordionChange('ratings')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            ⭐ Ratings & Rankings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Rating Change */}
            <Typography variant="subtitle2">Rating Change</Typography>
            <FormGroup row>
              {filterOptions.rating_changes.map(change => (
                <FormControlLabel
                  key={change}
                  control={
                    <Checkbox
                      checked={filters.rating_change?.includes(change) || false}
                      onChange={(e) => {
                        const current = filters.rating_change || [];
                        const updated = e.target.checked 
                          ? [...current, change]
                          : current.filter(c => c !== change);
                        handleFilterChange('rating_change', updated);
                      }}
                    />
                  }
                  label={
                    <Chip 
                      label={change}
                      size="small"
                      color={change === 'Upgrade' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  }
                />
              ))}
            </FormGroup>

            {/* Rank Group */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Rank Group</Typography>
            <FormGroup row>
              {filterOptions.rank_groups.map(group => (
                <FormControlLabel
                  key={group}
                  control={
                    <Checkbox
                      checked={filters.rank_group?.includes(group) || false}
                      onChange={(e) => {
                        const current = filters.rank_group || [];
                        const updated = e.target.checked 
                          ? [...current, group]
                          : current.filter(g => g !== group);
                        handleFilterChange('rank_group', updated);
                      }}
                    />
                  }
                  label={
                    <Chip 
                      label={group}
                      size="small"
                      color={group === 'Positive' ? 'primary' : 'warning'}
                      variant="outlined"
                    />
                  }
                />
              ))}
            </FormGroup>

            {/* Rating Range Slider */}
            {filters.rating_range && (
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>
                  Rating Range: {filters.rating_range.min} - {filters.rating_range.max}
                </Typography>
                <Slider
                  value={[filters.rating_range.min, filters.rating_range.max]}
                  onChange={(e, newValue) => {
                    const [min, max] = newValue as number[];
                    handleFilterChange('rating_range', [{ min, max }] as any);
                  }}
                  valueLabelDisplay="auto"
                  min={1}
                  max={10}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' }
                  ]}
                />
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Display Options */}
      <Accordion expanded={expanded === 'display'} onChange={handleAccordionChange('display')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            🎨 Display Options
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              Product Rating Filters
            </Typography>
            <FormControlLabel 
              control={
                <Switch 
                  checked={showPositiveRatingsOnly} 
                  onChange={(e) => setShowPositiveRatingsOnly(e.target.checked)} 
                />
              } 
              label="Show Positive Ratings Only" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={showProductsWithIssues} 
                  onChange={(e) => setShowProductsWithIssues(e.target.checked)} 
                />
              } 
              label="Show Products with Issues" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={showImplementationProgress} 
                  onChange={(e) => setShowImplementationProgress(e.target.checked)} 
                />
              } 
              label="Show Implementation Progress" 
            />

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Visualization Options
            </Typography>
            <FormControlLabel 
              control={
                <Switch 
                  checked={showConsultantRatings} 
                  onChange={(e) => setShowConsultantRatings(e.target.checked)} 
                />
              } 
              label="Show Consultant Ratings" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={showEdgeLabels} 
                  onChange={(e) => setShowEdgeLabels(e.target.checked)} 
                />
              } 
              label="Show Edge Labels" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={highlightCriticalPaths} 
                  onChange={(e) => setHighlightCriticalPaths(e.target.checked)} 
                />
              } 
              label="Highlight Critical Paths" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={showBusinessLineColors} 
                  onChange={(e) => setShowBusinessLineColors(e.target.checked)} 
                />
              } 
              label="Show Business Line Colors" 