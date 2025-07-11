import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Filter, 
  Settings, 
  HelpCircle, 
  Bell, 
  User, 
  BarChart3, 
  Network, 
  Home, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Send, 
  X, 
  Bot, 
  Code, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Building,
  Users,
  Briefcase,
  MessageCircle,
  Sliders
} from 'lucide-react';

// Mock data
const mockGraphData = {
  nodes: [
    { id: 'person1', label: 'Alice Johnson', type: 'Person', properties: { age: 32, city: 'New York', department: 'Engineering' } },
    { id: 'person2', label: 'Bob Smith', type: 'Person', properties: { age: 28, city: 'Boston', department: 'Marketing' } },
    { id: 'person3', label: 'Carol Davis', type: 'Person', properties: { age: 35, city: 'Chicago', department: 'Engineering' } },
    { id: 'company1', label: 'TechCorp', type: 'Company', properties: { industry: 'Technology', employees: 500, founded: 2010 } },
    { id: 'project1', label: 'AI Platform', type: 'Project', properties: { status: 'Active', budget: 1000000, priority: 'High' } },
    { id: 'project2', label: 'Data Pipeline', type: 'Project', properties: { status: 'Completed', budget: 500000, priority: 'Medium' } }
  ],
  edges: [
    { id: 'e1', source: 'person1', target: 'company1', type: 'WORKS_FOR', properties: { since: '2020', role: 'Senior Engineer' } },
    { id: 'e2', source: 'person2', target: 'company1', type: 'WORKS_FOR', properties: { since: '2021', role: 'Marketing Manager' } },
    { id: 'e3', source: 'person1', target: 'project1', type: 'MANAGES', properties: { responsibility: 'Technical Lead' } },
    { id: 'e4', source: 'person3', target: 'project2', type: 'COMPLETED', properties: { role: 'Architect' } }
  ]
};

const sampleQueries = [
  { text: "Find all engineers at TechCorp", category: "People" },
  { text: "Show active projects and their managers", category: "Projects" },
  { text: "List companies in technology industry", category: "Companies" },
  { text: "Find people who joined after 2020", category: "People" },
  { text: "Show project dependencies and timelines", category: "Projects" }
];

const graphLayouts = [
  { value: 'cose', label: 'Force-directed' },
  { value: 'hierarchical', label: 'Hierarchical' },
  { value: 'circular', label: 'Circular' },
  { value: 'grid', label: 'Grid' },
  { value: 'concentric', label: 'Concentric' }
];

const TextToCypherDashboard = () => {
  const cyRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [selectedNavItem, setSelectedNavItem] = useState('graph');
  const [query, setQuery] = useState('');
  const [cypherQuery, setCypherQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! I can help you explore your graph data. What would you like to find?', timestamp: new Date() }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedLayout, setSelectedLayout] = useState('cose');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [showProperties, setShowProperties] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [nodeSize, setNodeSize] = useState(50);
  const [edgeThickness, setEdgeThickness] = useState(30);
  const [graphMetrics] = useState({
    nodes: mockGraphData.nodes.length,
    edges: mockGraphData.edges.length,
    density: 0.4
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'graph', icon: Network, label: 'Graph Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'help', icon: HelpCircle, label: 'Help' }
  ];

  useEffect(() => {
    loadMockGraphData();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMockGraphData = () => {
    console.log('Loading graph data:', mockGraphData);
  };

  const handleQuerySubmit = async () => {
    // This function is now integrated into handleSendMessage
    // but we keep it for backward compatibility with any direct calls
    if (!query.trim()) return;
    setCurrentMessage(query);
    setQuery('');
    handleSendMessage();
  };

  const generateMockCypher = (naturalQuery) => {
    const lower = naturalQuery.toLowerCase();
    if (lower.includes('engineer')) {
      return "MATCH (p:Person)-[:WORKS_FOR]->(c:Company) WHERE p.department = 'Engineering' RETURN p, c";
    } else if (lower.includes('project') && lower.includes('active')) {
      return "MATCH (p:Project)-[r:MANAGES]-(person:Person) WHERE p.status = 'Active' RETURN p, r, person";
    } else if (lower.includes('technology')) {
      return "MATCH (c:Company) WHERE c.industry = 'Technology' RETURN c";
    } else {
      return "MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 25";
    }
  };

  const handleSampleQuery = (sampleQuery) => {
    setQuery(sampleQuery.text);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      text: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        type: 'bot',
        text: `I understand you're asking about: "${currentMessage}". Let me help you explore this in the graph.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
    
    setCurrentMessage('');
  };

  const clearMessages = () => {
    setChatMessages([
      { id: 1, type: 'bot', text: 'Chat cleared. How can I help you explore your graph data?', timestamp: new Date() }
    ]);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Left Navigation Sidebar */}
      <div className="w-18 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4">
        {/* Logo */}
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
          <Network className="w-5 h-5 text-white" />
        </div>
        
        {/* Navigation Items */}
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedNavItem(item.id)}
                className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  selectedNavItem === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Graph Explorer</h1>
            <p className="text-sm text-slate-400">Explore and analyze your graph data</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </header>

        {/* Graph Controls */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <select 
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {graphLayouts.map((layout) => (
                <option key={layout.value} value={layout.value}>
                  {layout.label}
                </option>
              ))}
            </select>

            <select 
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Nodes</option>
              <option value="Person">People</option>
              <option value="Company">Companies</option>
              <option value="Project">Projects</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Fit to Screen">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Export">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Graph Visualization Area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900/20">
          {/* Loading Bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 animate-pulse z-10"></div>
          )}

          {/* Graph Metrics Card */}
          <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Graph Metrics</h3>
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{graphMetrics.nodes}</div>
                <div className="text-xs text-slate-400">Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{graphMetrics.edges}</div>
                <div className="text-xs text-slate-400">Edges</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{graphMetrics.density}</div>
                <div className="text-xs text-slate-400">Density</div>
              </div>
            </div>
          </div>

          {/* Mock Graph Visualization */}
          <div className="flex items-center justify-center h-full">
            <div className="grid grid-cols-3 gap-16 items-center">
              {/* Mock Nodes */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-slate-300">Alice</span>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-slate-300">TechCorp</span>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-slate-300">AI Platform</span>
              </div>
            </div>
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              <line x1="30%" y1="50%" x2="50%" y2="50%" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="50%" y1="50%" x2="70%" y2="50%" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>
          </div>

          {/* Graph Status */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-slate-400 text-sm">Interactive graph visualization</p>
            <p className="text-slate-500 text-xs">Enter a query to see dynamic results</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Agent & Filters */}
      <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
        {/* AI Agent Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Bot className="w-6 h-6 text-indigo-400" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Graph AI Agent</h2>
                <p className="text-xs text-slate-400">Query • Analyze • Explore</p>
              </div>
            </div>
            <button
              onClick={clearMessages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-700">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentMessage("Generate a query to find all people in engineering")}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors group"
            >
              <Code className="w-4 h-4 text-indigo-400 mb-1" />
              <div className="text-xs font-medium text-white">Generate Query</div>
              <div className="text-xs text-slate-400">Create Cypher</div>
            </button>
            
            <button
              onClick={() => setCurrentMessage("Explain the relationships in this graph")}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors group"
            >
              <Network className="w-4 h-4 text-emerald-400 mb-1" />
              <div className="text-xs font-medium text-white">Analyze Graph</div>
              <div className="text-xs text-slate-400">Get insights</div>
            </button>
            
            <button
              onClick={() => setCurrentMessage("Show me sample queries for exploring this data")}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors group"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 mb-1" />
              <div className="text-xs font-medium text-white">Get Help</div>
              <div className="text-xs text-slate-400">Learn queries</div>
            </button>
            
            <button
              onClick={() => setCurrentMessage("What are the key metrics and patterns in this graph?")}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors group"
            >
              <BarChart3 className="w-4 h-4 text-purple-400 mb-1" />
              <div className="text-xs font-medium text-white">Insights</div>
              <div className="text-xs text-slate-400">Find patterns</div>
            </button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Try asking:</h3>
          <div className="space-y-2">
            {[
              "Find all engineers at TechCorp",
              "Show me project dependencies",
              "Which people joined after 2020?",
              "Explain this graph structure"
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => setCurrentMessage(prompt)}
                className="w-full text-left p-2 text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="border-b border-slate-700">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full p-4 flex items-center justify-between text-white hover:text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span className="font-medium text-sm">Display Settings</span>
            </div>
            {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {filtersExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Show Properties</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProperties}
                    onChange={(e) => setShowProperties(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2">Node Size: {nodeSize}</label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={nodeSize}
                  onChange={(e) => setNodeSize(e.target.value)}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-2">Edge Thickness: {edgeThickness}</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={edgeThickness}
                  onChange={(e) => setEdgeThickness(e.target.value)}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Conversation */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.type === 'bot' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-slate-400">AI Agent</span>
                      </div>
                    )}
                    
                    <div
                      className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      
                      {message.cypher && (
                        <div className="mt-3 bg-slate-900 border border-slate-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <Code className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs text-slate-400">Generated Cypher Query</span>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(message.cypher);
                                showNotification('Query copied to clipboard!', 'success');
                              }}
                              className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <code className="text-sm text-emerald-400 font-mono block leading-relaxed whitespace-pre-wrap">
                            {message.cypher}
                          </code>
                          <button className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors">
                            Execute Query
                          </button>
                        </div>
                      )}
                      
                      {message.actions && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentMessage(action.prompt)}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs text-white rounded transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.type === 'bot' && (
                          <div className="flex space-x-1">
                            <button className="p-1 text-xs text-slate-400 hover:text-white transition-colors" title="Good response">
                              👍
                            </button>
                            <button className="p-1 text-xs text-slate-400 hover:text-white transition-colors" title="Poor response">
                              👎
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded-lg rounded-bl-sm">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-slate-400">Thinking...</span>
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Enhanced Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-slate-700">
            <div className="relative">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me to generate queries, analyze data, or explain the graph..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
                rows="3"
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">
                Press Enter to send • Shift+Enter for new line
              </p>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>AI Online</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            <span className="text-white text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
              className="text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToCypherDashboard;