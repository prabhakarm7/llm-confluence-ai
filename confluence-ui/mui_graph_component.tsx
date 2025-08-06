import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Assessment as ProductIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

// JPM Theme
const jpmTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // JPM Blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e', // JPM Red
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Types
interface GraphFilters {
  regions?: string[];
  sales_regions?: string[];
  channels?: string[];
  node_types?: string[];
  asset_classes?: string[];
  mandate_status?: string[];
  privacy_levels?: string[];
  level_of_influence?: string[];
  pca?: string[];
  aca?: string[];
  rating_change?: string[];
  rank_group?: string[];
}

interface FilterOptions {
  regions: string[];
  sales_regions: string[];
  channels: string[];
  asset_classes: string[];
  mandate_status: string[];
  privacy_levels: string[];
  level_of_influence: string[];
  pca_options: string[];
  aca_options: string[];
  rating_changes: string[];
  rank_groups: string[];
  consultants: Array<{id: string; name: string}>;
  companies: Array<{id: string; name: string}>;
  products: Array<{id: string; name: string}>;
  field_consultants: Array<{id: string; name: string}>;
}

// Custom Node Components with MUI
const ConsultantNode = ({ data }: { data: any }) => (
  <Card sx={{ 
    minWidth: 200, 
    bgcolor: 'primary.main', 
    color: 'white',
    border: '2px solid',
    borderColor: 'primary.dark'
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" mb={1}>
        <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </Typography>
      </Box>
      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        📍 {data.region} | {data.sales_region?.join(', ')}
      </Typography>
      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        💼 {data.channel}
      </Typography>
      {data.level_of_influence && (
        <Chip 
          label={`⭐ ${data.level_of_influence}`}
          size="small" 
          sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.7rem' }}
        />
      )}
      <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
        PCA: {data.pca}
      </Typography>
    </CardContent>
  </Card>
);

const CompanyNode = ({ data }: { data: any }) => (
  <Card sx={{ 
    minWidth: 200, 
    bgcolor: 'warning.main', 
    color: 'white',
    border: '2px solid',
    borderColor: 'warning.dark'
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" mb={1}>
        <BusinessIcon sx={{ mr: 1, fontSize: 16 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </Typography>
      </Box>
      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        📍 {data.region}
      </Typography>
      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        🏢 {Array.isArray(data.channel) ? data.channel.join(', ') : data.channel}
      </Typography>
      <Chip 
        label={data.privacy}
        size="small" 
        sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.7rem' }}
      />
      <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
        PCA: {data.pca}
      </Typography>
    </CardContent>
  </Card>
);

const ProductNode = ({ data }: { data: any }) => (
  <Card sx={{ 
    minWidth: 200, 
    bgcolor: 'secondary.main', 
    color: 'white',
    border: '2px solid',
    borderColor: 'secondary.dark'
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" mb={1}>
        <ProductIcon sx={{ mr: 1, fontSize: 16 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </Typography>
      </Box>
      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        📊 {data.asset_class}
      </Typography>
      {data.mandate_status && (
        <Chip 
          label={data.mandate_status}
          size="small" 
          sx={{ 
            mt: 0.5, 
            bgcolor: data.mandate_status === 'Active' ? 'success.main' :
                   data.mandate_status === 'At Risk' ? 'error.main' : 'warning.main',
            color: 'white',
            fontSize: '0.7rem'
          }}
        />
      )}
    </CardContent>
  </Card>
);

const FieldConsultantNode = ({ data }: { data: any }) => (
  <Card sx={{ 
    minWidth: 180, 
    bgcolor: 'success.main', 
    color: 'white',
    border: '2px solid',
    borderColor: 'success.dark'
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" mb={1}>
        <GroupIcon sx={{ mr: 1, fontSize: 16 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {data.name}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        Field Consultant
      </Typography>
    </CardContent>
  </Card>
);

const nodeTypes = {
  consultant: ConsultantNode,
  company: CompanyNode,
  product: ProductNode,
  fieldConsultant: FieldConsultantNode,
};

// Graph Statistics Component
const GraphStats = ({ metadata }: { metadata: any }) => {
  if (!metadata) return null;

  return (
    <Box display="flex" gap={2} alignItems="center">
      <Chip 
        icon={<PersonIcon />}
        label={`Consultants: ${metadata.node_type_counts?.CONSULTANT || 0}`}
        color="primary"
        variant="outlined"
      />
      <Chip 
        icon={<BusinessIcon />}
        label={`Companies: ${metadata.node_type_counts?.COMPANY || 0}`}
        color="warning"
        variant="outlined"
      />
      <Chip 
        icon={<ProductIcon />}
        label={`Products: ${metadata.node_type_counts?.PRODUCT || 0}`}
        color="secondary"
        variant="outlined"
      />
      <Chip 
        icon={<GroupIcon />}
        label={`Field Consultants: ${metadata.node_type_counts?.FIELD_CONSULTANT || 0}`}
        color="success"
        variant="outlined"
      />
      <Divider orientation="vertical" flexItem />
      <Typography variant="body2" color="text.secondary">
        Total Nodes: {metadata.total_nodes} | Edges: {metadata.total_edges}
      </Typography>
    </Box>
  );
};

// Filter Panel Component
const FilterPanel = ({ 
  filters, 
  setFilters, 
  filterOptions, 
  onApplyFilters,
  loading 
}: {
  filters: GraphFilters;
  setFilters: (filters: GraphFilters) => void;
  filterOptions: FilterOptions | null;
  onApplyFilters: () => void;
  loading: boolean;
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
      <Paper sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
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

      {/* Ratings */}
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
            <Typography variant="subtitle2">Rank Group</Typography>
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
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// Main Component
const JPMGraphVisualization = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [filters, setFilters] = useState<GraphFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Mock API calls - replace with real API
  const fetchFilterOptions = async () => {
    try {
      // Replace with: const response = await fetch('/api/v1/filters/options');
      // Mock data for demo
      const mockFilterOptions: FilterOptions = {
        regions: ['NAI', 'EMEA', 'APAC'],
        sales_regions: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
        channels: ['Institutional', 'Retail', 'Private Banking'],
        asset_classes: ['Equities', 'Fixed Income', 'Alternatives', 'Multi-Asset'],
        mandate_status: ['Active', 'At Risk', 'Conversion in progress'],
        privacy_levels: ['public', 'private', 'restricted'],
        level_of_influence: ['High', 'Medium', 'Low', 'UNK'],
        pca_options: ['James Matt', 'Richard Forrest', 'Sarah Johnson'],
        aca_options: ['Mike Davis', 'Lisa Rodriguez', 'John Smith'],
        rating_changes: ['Upgrade', 'Downgrade'],
        rank_groups: ['Positive', 'Negative'],
        consultants: [
          {id: '1', name: 'John Smith'},
          {id: '2', name: 'Sarah Johnson'},
        ],
        companies: [
          {id: '1', name: 'ABC Corp'},
          {id: '2', name: 'XYZ Holdings'},
        ],
        products: [
          {id: '1', name: 'Equity Growth Fund'},
          {id: '2', name: 'Bond Income Fund'},
        ],
        field_consultants: [
          {id: '1', name: 'Mike Davis'},
        ]
      };
      setFilterOptions(mockFilterOptions);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setError('Failed to load filter options');
    }
  };

  // Transform API data to React Flow format
  const transformGraphData = useCallback((apiData: any) => {
    const { nodes: apiNodes, edges: apiEdges } = apiData;

    // Transform nodes
    const flowNodes: Node[] = apiNodes.map((node: any, index: number) => {
      // Calculate position (circular layout)
      const angle = (index / apiNodes.length) * 2 * Math.PI;
      const radius = Math.min(300, apiNodes.length * 30);
      
      return {
        id: node.id,
        type: getNodeType(node.type),
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        },
        data: node
      };
    });

    // Transform edges
    const flowEdges: Edge[] = apiEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: getEdgeLabel(edge),
      style: getEdgeStyle(edge),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: edge
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, []);

  const getNodeType = (apiNodeType: string) => {
    switch (apiNodeType) {
      case 'CONSULTANT': return 'consultant';
      case 'COMPANY': return 'company';
      case 'PRODUCT': return 'product';
      case 'FIELD_CONSULTANT': return 'fieldConsultant';
      default: return 'default';
    }
  };

  const getEdgeLabel = (edge: any) => {
    switch (edge.type) {
      case 'OWNS':
        return `OWNS (${edge.mandate_status})`;
      case 'RATES':
        return `RATES (${edge.rankgroup || 'N/A'})`;
      case 'COVERS':
        return `COVERS`;
      case 'EMPLOYS':
        return `EMPLOYS`;
      default:
        return edge.type;
    }
  };

  const getEdgeStyle = (edge: any) => {
    switch (edge.type) {
      case 'OWNS':
        return {
          stroke: edge.mandate_status === 'Active' ? '#4caf50' : 
                 edge.mandate_status === 'At Risk' ? '#f44336' : '#ff9800',
          strokeWidth: 3
        };
      case 'RATES':
        return {
          stroke: edge.rankgroup === 'Positive' ? '#2196f3' : '#ff5722',
          strokeWidth: 2,
          strokeDasharray: edge.rating_change === 'Upgrade' ? 'none' : '5,5'
        };
      case 'COVERS':
        return { stroke: '#607d8b', strokeWidth: 2 };
      case 'EMPLOYS':
        return { stroke: '#9c27b0', strokeWidth: 2 };
      default:
        return { stroke: '#666', strokeWidth: 1 };
    }
  };

  // Fetch graph data
  const fetchGraphData = useCallback(async (appliedFilters: GraphFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      // Replace with real API call:
      // const response = await fetch('/api/v1/graph/data', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ filters: appliedFilters, limit: 100 })
      // });
      // const result = await response.json();

      // Mock data for demo
      const mockGraphData = {
        nodes: [
          {
            id: '1',
            type: 'CONSULTANT',
            name: 'John Smith',
            region: 'NAI',
            sales_region: ['North America'],
            channel: 'Institutional',
            privacy: 'public',
            pca: 'James Matt',
            aca: 'Richard Forrest',
            level_of_influence: 'High'
          },
          {
            id: '2',
            type: 'COMPANY',
            name: 'ABC Corporation',
            region: 'NAI',
            sales_region: ['North America'],
            channel: ['Institutional', 'Retail'],
            privacy: 'public',
            pca: 'James Matt',
            aca: 'Sarah Johnson'
          },
          {
            id: '3',
            type: 'PRODUCT',
            name: 'US Equity Growth Fund',
            asset_class: 'Equities',
            mandate_status: 'Active'
          },
          {
            id: '4',
            type: 'FIELD_CONSULTANT',
            name: 'Mike Davis',
            consultant: '1'
          }
        ],
        edges: [
          {
            id: 'e1',
            source: '1',
            target: '4',
            type: 'EMPLOYS'
          },
          {
            id: 'e2',
            source: '4',
            target: '2',
            type: 'COVERS',
            level_of_influence: 'High'
          },
          {
            id: 'e3',
            source: '2',
            target: '3',
            type: 'OWNS',
            mandate_status: 'Active',
            consultant: 'John Smith'
          },
          {
            id: 'e4',
            source: '1',
            target: '3',
            type: 'RATES',
            rating_change: 'Upgrade',
            rankgroup: 'Positive',
            rankvalue: 'Client-directed Approval',
            rankorder: 1
          }
        ],
        metadata: {
          total_nodes: 4,
          total_edges: 4,
          node_type_counts: {
            CONSULTANT: 1,
            COMPANY: 1,
            PRODUCT: 1,
            FIELD_CONSULTANT: 1
          },
          edge_type_counts: {
            EMPLOYS: 1,
            COVERS: 1,
            OWNS: 1,
            RATES: 1
          },
          applied_filters: appliedFilters
        }
      };

      const { nodes: flowNodes, edges: flowEdges } = transformGraphData(mockGraphData);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setMetadata(mockGraphData.metadata);

    } catch (error) {
      console.error('Error fetching graph data:', error);
      setError('Failed to load graph data');
    } finally {
      setLoading(false);
    }
  }, [transformGraphData]);

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
    fetchGraphData({});
  }, [fetchGraphData]);

  const handleApplyFilters = () => {
    fetchGraphData(filters);
  };

  return (
    <ThemeProvider theme={jpmTheme}>
      <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              JPM Business Network Graph
            </Typography>
            <GraphStats metadata={metadata} />
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Grid container sx={{ height: 'calc(100vh - 64px)' }}>
          {/* Graph Visualization - 60% width */}
          <Grid item xs={7.2}>
            <Paper sx={{ height: '100%', m: 1, position: 'relative' }}>
              {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ height: '100%' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Controls />
                  <Background />
                </ReactFlow>
              </Box>

              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}
                >
                  <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography>Loading graph data...</Typography>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Filter Panel - 40% width */}
          <Grid item xs={4.8}>
            <Paper sx={{ height: '100%', m: 1, ml: 0 }}>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                onApplyFilters={handleApplyFilters}
                loading={loading}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default JPMGraphVisualization; 