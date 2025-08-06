# Complete MUI Project Files

## 📁 **All Required Files for JPM Graph Platform**

### **1. src/types/graph.ts**

```typescript
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  labels: string[];
  region?: string;
  sales_region?: string[];
  channel?: string | string[];
  privacy?: string;
  pca?: string;
  aca?: string;
  level_of_influence?: string;
  asset_class?: string;
  mandate_status?: string;
  product_id?: string;
  consultant?: string;
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  mandate_status?: string;
  consultant?: string;
  rating_change?: string;
  rankgroup?: string;
  rankvalue?: string;
  rankorder?: number;
  level_of_influence?: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  total_nodes: number;
  total_edges: number;
  node_type_counts: Record<string, number>;
  edge_type_counts: Record<string, number>;
  mandate_status_counts?: Record<string, number>;
  applied_filters: any;
  query_params: {
    limit: number;
    offset?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

### **2. src/types/filters.ts**

```typescript
export interface GraphFilters {
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
  rating_range?: {
    min: number;
    max: number;
  };
  rank_order_range?: {
    min: number;
    max: number;
  };
}

export interface FilterOptions {
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
  consultants: EntityOption[];
  companies: EntityOption[];
  products: EntityOption[];
  field_consultants: EntityOption[];
}

export interface EntityOption {
  id: string;
  name: string;
}

export interface FilterState {
  [key: string]: string[] | number[] | { min: number; max: number } | undefined;
}
```

### **3. src/services/api.ts**

```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_V1_STR = process.env.REACT_APP_API_V1_STR || '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}${API_V1_STR}`;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('API request failed:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; database: string }> {
    return this.get<{ status: string; database: string }>('/health');
  }
}

export const apiService = new ApiService();
```

### **4. src/services/graphService.ts**

```typescript
import { apiService, ApiError } from './api';
import { GraphData, GraphFilters, FilterOptions, ApiResponse } from '../types';

export class GraphService {
  /**
   * Fetch graph data with applied filters
   */
  async getGraphData(filters: GraphFilters, limit: number = 100): Promise<GraphData> {
    try {
      const response = await apiService.post<ApiResponse<GraphData>>('/graph/data', {
        filters,
        limit
      });
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch graph data');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching graph data:', error);
      throw error;
    }
  }

  /**
   * Fetch all available filter options for UI population
   */
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await apiService.get<FilterOptions>('/filters/options');
      return response;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific node
   */
  async getNodeDetails(nodeId: string): Promise<any> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/graph/node/${nodeId}`);
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch node details');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching node details:', error);
      throw error;
    }
  }

  /**
   * Get consultants with optional filters
   */
  async getConsultants(params?: {
    regions?: string[];
    sales_regions?: string[];
    channels?: string[];
    level_of_influence?: string[];
    privacy?: string;
    pca?: string[];
    aca?: string[];
  }): Promise<GraphData> {
    try {
      const response = await apiService.get<ApiResponse<GraphData>>('/graph/consultants', params);
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch consultants');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }
  }

  /**
   * Get companies with optional filters
   */
  async getCompanies(params?: {
    regions?: string[];
    sales_regions?: string[];
    channels?: string[];
    privacy?: string;
    pca?: string[];
    aca?: string[];
  }): Promise<GraphData> {
    try {
      const response = await apiService.get<ApiResponse<GraphData>>('/graph/companies', params);
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch companies');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Get products with optional filters
   */
  async getProducts(params?: {
    asset_class?: string[];
    mandate_status?: string[];
    product_name?: string[];
  }): Promise<GraphData> {
    try {
      const response = await apiService.get<ApiResponse<GraphData>>('/graph/products', params);
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch products');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get graph summary statistics
   */
  async getGraphSummary(): Promise<any> {
    try {
      const response = await apiService.get<ApiResponse<any>>('/graph/summary');
      
      if (!response.success) {
        throw new ApiError(response.error || 'Failed to fetch graph summary');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching graph summary:', error);
      throw error;
    }
  }
}

export const graphService = new GraphService();
```

### **5. src/hooks/useGraphData.ts**

```typescript
import { useState, useCallback } from 'react';
import { graphService } from '../services/graphService';
import { GraphData, GraphFilters } from '../types';

export interface UseGraphDataReturn {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
  fetchData: (filters: GraphFilters, limit?: number) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useGraphData = (): UseGraphDataReturn => {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<GraphFilters>({});
  const [lastLimit, setLastLimit] = useState<number>(100);

  const fetchData = useCallback(async (filters: GraphFilters, limit: number = 100) => {
    setLoading(true);
    setError(null);
    setLastFilters(filters);
    setLastLimit(limit);
    
    try {
      const result = await graphService.getGraphData(filters, limit);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching graph data';
      setError(errorMessage);
      console.error('Error fetching graph data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (Object.keys(lastFilters).length > 0 || lastLimit !== 100) {
      await fetchData(lastFilters, lastLimit);
    }
  }, [fetchData, lastFilters, lastLimit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    fetchData, 
    refetch, 
    clearError 
  };
};
```

### **6. src/hooks/useFilters.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { graphService } from '../services/graphService';
import { FilterOptions, GraphFilters } from '../types';

export interface UseFiltersReturn {
  filterOptions: FilterOptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useFilters = (): UseFiltersReturn => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilterOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = await graphService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load filter options';
      setError(errorMessage);
      console.error('Error fetching filter options:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return { 
    filterOptions, 
    loading, 
    error, 
    refetch: fetchFilterOptions, 
    clearError 
  };
};

export const useFilterState = (initialFilters: GraphFilters = {}) => {
  const [filters, setFilters] = useState<GraphFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof GraphFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((key: keyof GraphFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    removeFilter,
    getActiveFiltersCount
  };
};
```

### **7. src/components/Common/Loading.tsx**

```typescript
import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Paper 
} from '@mui/material';

interface LoadingProps {
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  overlay = false,
  size = 'medium' 
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };

  const content = (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      gap={2}
      p={3}
    >
      <CircularProgress size={sizeMap[size]} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  if (overlay) {
    return (
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
        <Paper elevation={3}>
          {content}
        </Paper>
      </Box>
    );
  }

  return content;
};

export default Loading;
```

### **8. src/components/Common/ErrorBoundary.tsx**

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          p={3}
        >
          <Paper sx={{ p: 4, maxWidth: 500 }}>
            <Alert severity="error">
              <AlertTitle>Something went wrong</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                size="small"
              >
                Try Again
              </Button>
            </Alert>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### **9. src/components/Layout/Header.tsx**

```typescript
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Assessment as ProductIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { GraphMetadata } from '../../types';

interface HeaderProps {
  metadata?: GraphMetadata | null;
}

const Header: React.FC<HeaderProps> = ({ metadata }) => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          JPM Business Network Graph
        </Typography>
        
        {metadata && (
          <Box display="flex" gap={2} alignItems="center">
            <Chip 
              icon={<PersonIcon />}
              label={`Consultants: ${metadata.node_type_counts?.CONSULTANT || 0}`}
              color="primary"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Chip 
              icon={<BusinessIcon />}
              label={`Companies: ${metadata.node_type_counts?.COMPANY || 0}`}
              color="primary"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Chip 
              icon={<ProductIcon />}
              label={`Products: ${metadata.node_type_counts?.PRODUCT || 0}`}
              color="primary"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Chip 
              icon={<GroupIcon />}
              label={`Field Consultants: ${metadata.node_type_counts?.FIELD_CONSULTANT || 0}`}
              color="primary"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white', mx: 1 }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              Total Nodes: {metadata.total_nodes} | Edges: {metadata.total_edges}
            </Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
```

### **10. src/components/Layout/AppLayout.tsx**

```typescript
import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { jpmTheme } from '../../theme/theme';
import ErrorBoundary from '../Common/ErrorBoundary';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  headerProps?: any;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, headerProps }) => {
  return (
    <ThemeProvider theme={jpmTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
          <Header {...headerProps} />
          <Box sx={{ height: 'calc(100vh - 64px)' }}>
            {children}
          </Box>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default AppLayout;
```

### **11. src/theme/theme.ts**

```typescript
import { createTheme } from '@mui/material/styles';

export const jpmTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // JPM Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // JPM Red
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&:before': {
            display: 'none',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});
```

### **12. src/App.tsx (Updated)**

```typescript
import React from 'react';
import AppLayout from './components/Layout/AppLayout';
import JPMGraphVisualization from './components/Graph/JPMGraphVisualization';

function App() {
  return (
    <AppLayout>
      <JPMGraphVisualization />
    </AppLayout>
  );
}

export default App;
```

### **13. src/index.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### **14. src/index.css**

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* React Flow specific styles */
.react-flow__node {
  cursor: pointer;
}

.react-flow__edge {
  cursor: pointer;
}

/* Custom scrollbar for filter panel */
.filter-panel-scroll::-webkit-scrollbar {
  width: 6px;
}

.filter-panel-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.filter-panel-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.filter-panel-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
```

## 🚀 **Setup Instructions**

```bash
# 1. Create all directories
mkdir -p src/{components/{Graph,Layout,Common},hooks,services,types,theme}

# 2. Copy all the files above into their respective locations

# 3. Install dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/lab reactflow

# 4. Start development
npm start
```

Now you have **all the files** needed for a complete, professional MUI-based JPM Graph Platform! 🎉