import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Alert, CircularProgress, Stack, Chip } from '@mui/material';
import { apiService } from '../services/api';
import { graphService } from '../services/graphService';

const BackendConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [testResults, setTestResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const runConnectionTests = async () => {
    setConnectionStatus('testing');
    setError(null);
    const results: any = {};

    try {
      // Test 1: Health Check
      console.log('🏥 Testing health endpoint...');
      const healthResponse = await apiService.healthCheck();
      results.health = { success: true, data: healthResponse };
      console.log('✅ Health check passed:', healthResponse);

      // Test 2: Filter Options
      console.log('🔧 Testing filter options...');
      const filtersResponse = await graphService.getFilterOptions();
      results.filters = { success: true, data: filtersResponse };
      console.log('✅ Filters loaded:', Object.keys(filtersResponse));

      // Test 3: Graph Data
      console.log('📊 Testing graph data...');
      const graphResponse = await graphService.getGraphData({}, 10);
      results.graph = { success: true, data: graphResponse };
      console.log('✅ Graph data loaded:', graphResponse.metadata);

      // Test 4: Graph Summary
      console.log('📈 Testing graph summary...');
      try {
        const summaryResponse = await graphService.getGraphSummary();
        results.summary = { success: true, data: summaryResponse };
        console.log('✅ Summary loaded');
      } catch (summaryError) {
        console.log('⚠️ Summary endpoint not available (optional)');
        results.summary = { success: false, error: 'Optional endpoint' };
      }

      setTestResults(results);
      setConnectionStatus('connected');
      
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setError(error.message || 'Connection failed');
      setConnectionStatus('error');
      setTestResults(results);
    }
  };

  useEffect(() => {
    // Auto-run test on mount
    runConnectionTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'error';
      case 'testing': return 'warning';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '✅ Backend Connected';
      case 'error': return '❌ Connection Failed';
      case 'testing': return '🔄 Testing Connection...';
      default: return '⏳ Ready to Test';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🔗 JPM Backend Connection Test
        </Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Alert severity={getStatusColor(connectionStatus) as any}>
            {getStatusText(connectionStatus)}
            {connectionStatus === 'testing' && <CircularProgress size={20} sx={{ ml: 2 }} />}
          </Alert>

          {error && (
            <Alert severity="error">
              <strong>Error Details:</strong> {error}
            </Alert>
          )}
        </Stack>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h6">Configuration Check:</Typography>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`API Base URL: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}
API Version: ${process.env.REACT_APP_API_V1_STR || '/api/v1'}
Full URL: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}${process.env.REACT_APP_API_V1_STR || '/api/v1'}`}
            </Typography>
          </Box>
        </Stack>

        {Object.keys(testResults).length > 0 && (
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Typography variant="h6">Test Results:</Typography>
            
            {/* Health Check */}
            {testResults.health && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip 
                    label="Health Check" 
                    color={testResults.health.success ? 'success' : 'error'}
                    size="small"
                  />
                  {testResults.health.success ? '✅' : '❌'}
                </Stack>
                {testResults.health.success && (
                  <Typography variant="body2" color="text.secondary">
                    Status: {testResults.health.data.status} | Database: {testResults.health.data.database}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Filter Options */}
            {testResults.filters && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip 
                    label="Filter Options" 
                    color={testResults.filters.success ? 'success' : 'error'}
                    size="small"
                  />
                  {testResults.filters.success ? '✅' : '❌'}
                </Stack>
                {testResults.filters.success && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available Filters:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {Object.keys(testResults.filters.data).map(key => (
                        <Chip key={key} label={key} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            {/* Graph Data */}
            {testResults.graph && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip 
                    label="Graph Data" 
                    color={testResults.graph.success ? 'success' : 'error'}
                    size="small"
                  />
                  {testResults.graph.success ? '✅' : '❌'}
                </Stack>
                {testResults.graph.success && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Nodes: {testResults.graph.data.metadata.total_nodes} | 
                      Edges: {testResults.graph.data.metadata.total_edges}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(testResults.graph.data.metadata.node_type_counts || {}).map(([type, count]) => (
                        <Chip key={type} label={`${type}: ${count}`} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            {/* Summary */}
            {testResults.summary && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip 
                    label="Graph Summary" 
                    color={testResults.summary.success ? 'success' : 'warning'}
                    size="small"
                  />
                  {testResults.summary.success ? '✅' : '⚠️'}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {testResults.summary.success ? 'Summary endpoint working' : 'Optional endpoint (not required)'}
                </Typography>
              </Paper>
            )}
          </Stack>
        )}

        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            onClick={runConnectionTests}
            disabled={connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {connectionStatus === 'connected' && (
            <Button variant="outlined" color="success">
              ✅ Ready to Use Dashboard
            </Button>
          )}
        </Stack>

        {connectionStatus === 'error' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Troubleshooting Tips:</strong>
            <ul>
              <li>Make sure your Node.js backend is running on the correct port</li>
              <li>Check CORS settings in your backend</li>
              <li>Verify the API endpoints are implemented</li>
              <li>Check browser network tab for specific error details</li>
            </ul>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default BackendConnectionTest;