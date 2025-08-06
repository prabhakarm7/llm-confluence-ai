import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeProps,
  ReactFlowProvider,
  MarkerType,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
  Badge,
  Card,
  CardContent,
  Tab,
  Tabs,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Dashboard,
  AccountTree,
  Search,
  FilterList,
  Settings,
  Help,
  Notifications,
  Person,
  Business,
  Send,
  Clear,
  SmartToy,
  Code,
  MessageOutlined,
  ThumbUp,
  ThumbDown,
  ContentCopy,
  PlayArrow,
  SupportAgent,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  TrendingUp,
  AccountBalance,
  Security,
  CreditCard,
  Analytics,
  RemoveCircle,
  Inventory2,
  Assessment as ProductIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Import your existing services and types
import { useGraphData } from '../hooks/useGraphData';
import { useFilters, useFilterState } from '../hooks/useFilters';
import type { GraphNode, GraphEdge, GraphFilters, GraphMetadata, FilterOptions } from '../types';

// Enhanced Type definitions with JPM context
interface NodeData {
  label: string;
  type: 'consultant' | 'fieldconsultant' | 'client' | 'product';
  properties: {
    id?: string;
    status?: string;
    firm?: string;
    specialization?: string;
    experience?: number;
    region?: string;
    industry?: string;
    assetSize?: string;
    relationship?: string;
    category?: string;
    businessLine?: string;
    version?: string;
    mandate_status?: string;
    asset_class?: string;
    privacy?: string;
    level_of_influence?: string;
    pca?: string;
    aca?: string;
    channel?: string | string[];
    sales_region?: string[];
  };
}

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
  cypher?: string;
  actions?: Array<{
    label: string;
    prompt: string;
  }>;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f8fafc', secondary: '#cbd5e1' },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundColor: '#1e293b', backgroundImage: 'none' } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#1e293b', borderRight: '1px solid #334155' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#1e293b', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' } } },
  },
});

const StyledReactFlow = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  '& .react-flow__renderer': {
    zIndex: 1,
  },
  '& .react-flow__edge': {
    zIndex: 5,
  },
  '& .react-flow__node': { 
    fontSize: '12px',
    zIndex: 10,
  },
  '& .react-flow__controls': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    '& button': {
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      '&:hover': { backgroundColor: theme.palette.action.hover },
    },
  },
  '& .react-flow__minimap': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

// Custom Node Components matching your API data structure
const ConsultantNode: React.FC<NodeProps<NodeData>> = ({ data }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Avatar sx={{ 
      bgcolor: 'primary.main', 
      width: 60, 
      height: 60, 
      border: 3, 
      borderColor: 'primary.light', 
      mb: 1, 
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' 
    }}>
      <Person sx={{ fontSize: 28 }} />
    </Avatar>
    <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ maxWidth: 140 }}>
      {data.label}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {data.properties.region} • {data.properties.specialization || data.properties.channel}
    </Typography>
    {data.properties.level_of_influence && (
      <Chip 
        label={`⭐ ${data.properties.level_of_influence}`}
        size="small" 
        sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', color: 'primary.light', fontSize: '0.7rem' }}
      />
    )}
  </Box>
);

const FieldConsultantNode: React.FC<NodeProps<NodeData>> = ({ data }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Avatar sx={{ 
      bgcolor: 'secondary.main', 
      width: 60, 
      height: 60, 
      border: 3, 
      borderColor: 'secondary.light', 
      mb: 1, 
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' 
    }}>
      <SupportAgent sx={{ fontSize: 28 }} />
    </Avatar>
    <Typography variant="body2" fontWeight="bold" color="secondary.main" sx={{ maxWidth: 140 }}>
      {data.label}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {data.properties.region || 'Field Consultant'}
    </Typography>
  </Box>
);

const ClientNode: React.FC<NodeProps<NodeData>> = ({ data }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Avatar sx={{ 
      bgcolor: 'success.main', 
      width: 60, 
      height: 60, 
      border: 3, 
      borderColor: 'success.light', 
      mb: 1, 
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' 
    }}>
      <AccountBalance sx={{ fontSize: 28 }} />
    </Avatar>
    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ maxWidth: 140 }}>
      {data.label}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {data.properties.assetSize || data.properties.industry}
    </Typography>
  </Box>
);

const ProductNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const getProductIcon = (category: string) => {
    switch (category) {
      case 'Equities': return <TrendingUp sx={{ fontSize: 20, color: '#10b981' }} />;  
      case 'Fixed Income': return <Security sx={{ fontSize: 20, color: '#ef4444' }} />;
      case 'Alternatives': return <Analytics sx={{ fontSize: 20, color: '#8b5cf6' }} />;
      case 'Multi-Asset': return <CreditCard sx={{ fontSize: 20, color: '#3b82f6' }} />;
      default: return <Inventory2 sx={{ fontSize: 20, color: '#64748b' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'At Risk': return 'error';
      case 'Conversion in progress': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Paper elevation={4} sx={{ 
      p: 2, 
      minWidth: 220, 
      maxWidth: 280, 
      border: 2, 
      borderColor: 'info.main', 
      backgroundColor: 'background.paper', 
      borderRadius: 2, 
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)' 
    }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36 }}>
            {getProductIcon(data.properties.asset_class || data.properties.category || '')}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="info.main">
              {data.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.properties.asset_class} • {data.properties.version || 'v1.0'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="space-between">
          {data.properties.mandate_status && (
            <Chip 
              label={data.properties.mandate_status} 
              size="small" 
              color={getStatusColor(data.properties.mandate_status) as any}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {data.properties.asset_class}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

const nodeTypes = { 
  consultant: ConsultantNode, 
  fieldconsultant: FieldConsultantNode, 
  client: ClientNode, 
  product: ProductNode 
};

// Filter Panel Component
const FilterPanel: React.FC<{
  filters: GraphFilters;
  setFilters: (filters: GraphFilters) => void;
  filterOptions: FilterOptions | null;
  onApplyFilters: () => void;
  loading: boolean;
}> = ({ filters, setFilters, filterOptions, onApplyFilters, loading }) => {
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
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Graph Filters</Typography>
            <Badge badgeContent={getActiveFiltersCount()} color="primary" sx={{ ml: 1 }}>
              <Box />
            </Badge>
          </Box>
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} size="small">
              <Clear />
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
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const DRAWER_WIDTH = 72;
const RIGHT_DRAWER_WIDTH = 400;

const CompleteJPMDashboard: React.FC = () => {
  // Use your existing hooks
  const { data: graphData, loading: graphLoading, error: graphError, fetchData } = useGraphData();
  const { filterOptions, loading: filtersLoading } = useFilters();
  const { filters, updateFilter, clearFilters, getActiveFiltersCount } = useFilterState();
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // UI state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedNavItem, setSelectedNavItem] = useState<string>('graph');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, type: 'bot', text: 'Hello! I can help you analyze JPM\'s consultant network and product ratings across business lines. What would you like to explore?', timestamp: new Date() }
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const navItems = [
    { id: 'dashboard', icon: <Dashboard />, label: 'Dashboard' },
    { id: 'graph', icon: <AccountTree />, label: 'JPM Network' },
    { id: 'search', icon: <Search />, label: 'Search' },
    { id: 'analytics', icon: <TrendingUp />, label: 'Analytics' },
    { id: 'settings', icon: <Settings />, label: 'Settings' },
    { id: 'help', icon: <Help />, label: 'Help' }
  ];

  const suggestedQuestions = [
    "Show all consultants in North America",
    "Which products have Active mandate status?", 
    "Find consultants with High level of influence",
    "Show companies in the Institutional channel",
    "List all products in Equities asset class",
    "Which consultants work in EMEA region?",
    "Show products with At Risk status",
    "Find field consultants by region"
  ];

  // Transform your API data to React Flow format
  const transformGraphDataToFlow = useCallback((apiData: typeof graphData) => {
    if (!apiData) return;

    const flowNodes: Node<NodeData>[] = apiData.nodes.map((node: GraphNode, index: number) => {
      // Calculate position (circular layout)
      const angle = (index / apiData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(300, apiData.nodes.length * 30);
      
      const getNodeType = (labels: string[]) => {
        if (labels.includes('CONSULTANT')) return 'consultant';
        if (labels.includes('FIELD_CONSULTANT')) return 'fieldconsultant';
        if (labels.includes('COMPANY')) return 'client';
        if (labels.includes('PRODUCT')) return 'product';
        return 'consultant';
      };

      return {
        id: node.id,
        type: getNodeType(node.labels),
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        },
        data: {
          label: node.name,
          type: getNodeType(node.labels) as any,
          properties: {
            id: node.id,
            firm: node.name,
            region: node.region,
            specialization: node.asset_class || node.channel as string,
            privacy: node.privacy,
            level_of_influence: node.level_of_influence,
            pca: node.pca,
            aca: node.aca,
            channel: node.channel,
            sales_region: node.sales_region,
            version: '1.0',
            category: node.asset_class,
            businessLine: Array.isArray(node.channel) ? node.channel[0] : node.channel
          }
        }
      };
    });

    const flowEdges: Edge[] = apiData.edges.map((edge: GraphEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.type,
      style: getEdgeStyle(edge),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: edge
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  const getEdgeStyle = (edge: GraphEdge) => {
    switch (edge.type) {
      case 'OWNS':
        return {
          stroke: edge.mandate_status === 'Active' ? '#10b981' : 
                 edge.mandate_status === 'At Risk' ? '#ef4444' : '#f59e0b',
          strokeWidth: 3
        };
      case 'RATES':
        return {
          stroke: edge.rating_change === 'Upgrade' ? '#10b981' : '#ef4444',
          strokeWidth: 2,
          strokeDasharray: edge.rating_change === 'Upgrade' ? 'none' : '5,5'
        };
      case 'COVERS':
        return { stroke: '#64748b', strokeWidth: 2 };
      case 'EMPLOYS':
        return { stroke: '#8b5cf6', strokeWidth: 2 };
      default:
        return { stroke: '#6b7280', strokeWidth: 1 };
    }
  };

  // Effects
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (graphData) {
      transformGraphDataToFlow(graphData);
    }
  }, [graphData, transformGraphDataToFlow]);

  // Initialize with empty filters
  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleSendMessage = (): void => {
    if (!currentMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      text: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // Generate response based on current message
    setTimeout(() => {
      const response = generateIntelligentResponse(currentMessage);
      setChatMessages(prev => [...prev, response]);
    }, 1000);
    
    setCurrentMessage('');
  };

  const generateIntelligentResponse = (userMessage: string): ChatMessage => {
    const lower = userMessage.toLowerCase();
    const messageId = chatMessages.length + 2;
    
    // Basic response generation - you can enhance this with actual API calls
    return {
      id: messageId,
      type: 'bot',
      text: `I've analyzed your query about "${userMessage}". Based on the current JPM network data, I can help you explore the relationships between consultants, products, and business divisions.`,
      timestamp: new Date(),
      actions: [
        { label: "Apply filters", prompt: "Apply relevant network filters" },
        { label: "Show details", prompt: `Show detailed information about: ${userMessage}` }
      ]
    };
  };

  const handleApplyFilters = () => {
    fetchData(filters);
    showSnackbar('Filters applied to JPM network', 'success');
  };

  const handleClearFilters = () => {
    clearFilters();
    fetchData({});
    showSnackbar('All filters cleared', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success'): void => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ReactFlowProvider>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* Left Navigation */}
          <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
            <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <AccountBalance />
              </Avatar>
            </Toolbar>
            <Divider />
            <List sx={{ px: 1 }}>
              {navItems.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                  <Tooltip title={item.label} placement="right">
                    <ListItemButton
                      selected={selectedNavItem === item.id}
                      onClick={() => setSelectedNavItem(item.id)}
                      sx={{ 
                        minHeight: 48, 
                        justifyContent: 'center', 
                        borderRadius: 2, 
                        '&.Mui-selected': { 
                          bgcolor: 'primary.main', 
                          '&:hover': { bgcolor: 'primary.dark' } 
                        } 
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'inherit' }}>
                        {item.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Drawer>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <AppBar position="static" elevation={0}>
              <Toolbar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    JPM Business Network Explorer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {graphData && (
                      <>Total Nodes: {graphData.metadata.total_nodes} | Edges: {graphData.metadata.total_edges}</>
                    )}
                  </Typography>
                </Box>
                {graphData && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      icon={<Person />}
                      label={`Consultants: ${graphData.metadata.node_type_counts?.CONSULTANT || 0}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<Business />}
                      label={`Companies: ${graphData.metadata.node_type_counts?.COMPANY || 0}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<ProductIcon />}
                      label={`Products: ${graphData.metadata.node_type_counts?.PRODUCT || 0}`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<GroupIcon />}
                      label={`Field Consultants: ${graphData.metadata.node_type_counts?.FIELD_CONSULTANT || 0}`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  <Tooltip title="Notifications">
                    <IconButton color="inherit">
                      <Badge badgeContent={3} color="secondary">
                        <Notifications />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Profile">
                    <IconButton color="inherit">
                      <Avatar sx={{ width: 32, height: 32 }}>JPM</Avatar>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Toolbar>
            </AppBar>

            {/* Graph Visualization */}
            <Box sx={{ flexGrow: 1 }}>
              {graphError && (
                <Alert severity="error" sx={{ m: 2 }}>
                  {graphError}
                </Alert>
              )}
              
              <StyledReactFlow>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  fitViewOptions={{ padding: 0.1 }}
                >
                  <Controls />
                  <MiniMap 
                    nodeColor={(node) => {
                      switch (node.data?.type) {
                        case 'consultant': return '#6366f1';
                        case 'fieldconsultant': return '#f59e0b';  
                        case 'client': return '#10b981';
                        case 'product': return '#3b82f6';
                        default: return '#64748b';
                      }
                    }}
                    maskColor="rgba(0,0,0,0.8)"
                  />
                  <Background color="#334155" gap={20} />
                </ReactFlow>
              </StyledReactFlow>

              {graphLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}
                >
                  <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography>Loading JPM network data...</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Drawer */}
          <Drawer variant="permanent" anchor="right" sx={{ width: RIGHT_DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: RIGHT_DRAWER_WIDTH, boxSizing: 'border-box' } }}>
            <Toolbar />
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
                <Tab icon={<MessageOutlined />} label="AI Chat" iconPosition="start" />
                <Tab icon={<FilterList />} label="Filters" iconPosition="start" />
              </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeTab === 0 ? (
                /* Chat Panel */
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <SmartToy fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">JPM Network AI</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Consultant • Product • Rating Analysis
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Clear conversation">
                        <IconButton onClick={() => setChatMessages([{ id: 1, type: 'bot', text: 'Chat cleared. How can I help you analyze JPM\'s network?', timestamp: new Date() }])} size="small">
                          <Clear />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Insights:
                    </Typography>
                    <Stack spacing={1}>
                      {suggestedQuestions.slice(0, 4).map((question, index) => (
                        <Chip
                          key={index}
                          label={question}
                          size="small"
                          onClick={() => setCurrentMessage(question)}
                          sx={{ justifyContent: 'flex-start', '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' } }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
                    <Stack spacing={2}>
                      {chatMessages.map((message) => (
                        <Box key={message.id} sx={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
                          <Paper sx={{ p: 2, maxWidth: '85%', bgcolor: message.type === 'user' ? 'primary.main' : 'background.paper', color: message.type === 'user' ? 'primary.contrastText' : 'text.primary' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.text}
                            </Typography>
                            
                            {message.actions && (
                              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                                {message.actions.map((action, index) => (
                                  <Chip
                                    key={index}
                                    label={action.label}
                                    size="small"
                                    onClick={() => setCurrentMessage(action.prompt)}
                                    sx={{ mb: 1 }}
                                  />
                                ))}
                              </Stack>
                            )}
                            
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {message.timestamp.toLocaleTimeString()}
                              </Typography>
                              {message.type === 'bot' && (
                                <Stack direction="row">
                                  <IconButton size="small">
                                    <ThumbUp fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small">
                                    <ThumbDown fontSize="small" />
                                  </IconButton>
                                </Stack>
                              )}
                            </Stack>
                          </Paper>
                        </Box>
                      ))}
                      <div ref={messagesEndRef} />
                    </Stack>
                  </Box>
                  
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Stack spacing={1}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask about consultant networks, product ratings, or business line performance..."
                        variant="outlined"
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={handleSendMessage}
                              disabled={!currentMessage.trim()}
                              color="primary"
                            >
                              <Send />
                            </IconButton>
                          ),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Press Enter to send • Shift+Enter for new line
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                /* Filter Panel */
                <FilterPanel
                  filters={filters}
                  setFilters={(newFilters) => Object.keys(newFilters).forEach(key => updateFilter(key as keyof GraphFilters, (newFilters as any)[key]))}
                  filterOptions={filterOptions}
                  onApplyFilters={handleApplyFilters}
                  loading={graphLoading}
                />
              )}
            </Box>
          </Drawer>

          {/* Network Statistics Cards */}
          {graphData && activeTab === 1 && (
            <Box sx={{ position: 'absolute', bottom: 20, right: 420, zIndex: 1000 }}>
              <Stack spacing={2}>
                <Card sx={{ minWidth: 200 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Network Overview
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {graphData.metadata.total_nodes}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Nodes</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {graphData.metadata.total_edges}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Edges</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary.main">
                          {graphData.metadata.node_type_counts?.CONSULTANT || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Consultants</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {graphData.metadata.node_type_counts?.PRODUCT || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Products</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {graphData.metadata.mandate_status_counts && (
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mandate Status
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(graphData.metadata.mandate_status_counts).map(([status, count]) => (
                          <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={status} 
                              size="small" 
                              color={
                                status === 'Active' ? 'success' :
                                status === 'At Risk' ? 'error' : 'warning'
                              }
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {count}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>
          )}

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert 
              severity={snackbar.severity} 
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </ReactFlowProvider>
    </ThemeProvider>
  );
};

export default CompleteJPMDashboard;