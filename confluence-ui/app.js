import React, { useState, useEffect } from 'react';

// Simple Chat Interface
const AgentQChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      type: 'agent',
      content: "🕴️ Agent Q here. I'm your technical intelligence officer for SPARK007. Ask me about anti-patterns, performance analysis, or cost optimization!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simple response logic
    setTimeout(() => {
      let response = "I can help you with SPARK007 intelligence. Try asking about anti-patterns, agents, or performance optimization.";
      
      if (inputValue.toLowerCase().includes('anti-pattern')) {
        response = "🔥 Golden Eye detects critical anti-patterns like:\n\n• Cartesian Products (99% performance gain when fixed)\n• Unnecessary Shuffles (45% improvement)\n• Small Files Problem (30% I/O improvement)\n• Memory Leaks from uncached DataFrames\n• Late Filter Applications";
      } else if (inputValue.toLowerCase().includes('agent')) {
        response = "🕴️ SPARK007 deploys 4 specialized agents:\n\n👁️ Golden Eye - AST Scanner for code analysis\n⚡ Skyfall - Performance profiler\n🔒 Quantum - Rules engine for compliance\n☁️ Agent 007 - Cluster configuration optimizer";
      } else if (inputValue.toLowerCase().includes('cost')) {
        response = "💰 Current demo shows:\n\n• Current costs: $47.82/hour, $1,147.68/day\n• Optimized costs: $16.73/hour, $401.52/day\n• Monthly savings: $22,397.76\n• ROI timeframe: 2.3 months";
      }

      const agentMessage = {
        type: 'agent',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);

    setInputValue('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">🕴️</div>
          <div>
            <h3 className="font-bold text-white">Agent Q</h3>
            <p className="text-xs text-cyan-200">Technical Intelligence Officer</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-96">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-gray-800 text-gray-100 border border-gray-700'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2 mb-2">
          {['Anti-patterns', 'Agents', 'Costs'].map((tag) => (
            <button
              key={tag}
              onClick={() => setInputValue(`Tell me about ${tag.toLowerCase()}`)}
              className="px-2 py-1 bg-gray-700 text-xs text-cyan-400 rounded hover:bg-gray-600"
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about SPARK007..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Intelligence Report Component
const IntelligenceReportViewer = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">📊 EXECUTIVE SUMMARY</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">HIGH</div>
            <div className="text-sm text-gray-400">Threat Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">42%</div>
            <div className="text-sm text-gray-400">Compliance Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">8</div>
            <div className="text-sm text-gray-400">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">65%</div>
            <div className="text-sm text-gray-400">Optimization Potential</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-400 mb-4">💰 COST ANALYSIS</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Current Daily Cost</span>
              <span className="text-white font-bold">$1,147.68</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Optimized Daily Cost</span>
              <span className="text-green-400 font-bold">$401.52</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-3">
              <span className="text-gray-300">Monthly Savings</span>
              <span className="text-green-400 font-bold">$22,397.76</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-orange-400 mb-4">⚡ PERFORMANCE METRICS</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Anti-patterns Found</span>
              <span className="text-red-400 font-bold">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">CPU Utilization</span>
              <span className="text-yellow-400 font-bold">87%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Memory Usage</span>
              <span className="text-cyan-400 font-bold">1247MB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-400 mb-4">🔥 CRITICAL ANTI-PATTERNS</h3>
        <div className="space-y-4">
          <div className="border border-red-400 bg-red-900/20 rounded p-4">
            <h4 className="font-bold text-white mb-2">Accidental Cartesian Product</h4>
            <p className="text-sm text-gray-300 mb-2">Join without proper keys causing explosive data growth</p>
            <div className="text-xs text-gray-400">📍 ReportGenerator.scala:134</div>
            <div className="text-green-400 text-sm mt-2">✨ Fix Impact: 99% performance improvement</div>
          </div>
          
          <div className="border border-orange-400 bg-orange-900/20 rounded p-4">
            <h4 className="font-bold text-white mb-2">Unnecessary Data Shuffling</h4>
            <p className="text-sm text-gray-300 mb-2">Multiple shuffle operations in transformation chain</p>
            <div className="text-xs text-gray-400">📍 DataProcessor.scala:67</div>
            <div className="text-green-400 text-sm mt-2">✨ Fix Impact: 45% performance improvement</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mission Launcher Component
const MissionLauncher = ({ onMissionLaunched }) => {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    setTimeout(() => {
      onMissionLaunched({
        mission_id: `MISSION_${Date.now()}`,
        status: 'AGENTS_DEPLOYED'
      });
      setLaunching(false);
    }, 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-cyan-400 mb-6">🎯 MISSION DEPLOYMENT</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Repository URL</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            defaultValue="https://github.com/acme-corp/spark-etl-pipeline"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Classification</label>
            <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white">
              <option>CONFIDENTIAL</option>
              <option>SECRET</option>
              <option>TOP SECRET</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
            <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white">
              <option>HIGH</option>
              <option>CRITICAL</option>
              <option>MEDIUM</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-6 rounded hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
        >
          {launching ? 'DEPLOYING AGENTS...' : 'DEPLOY AGENTS'}
        </button>
      </div>
    </div>
  );
};

// Agent Status Dashboard
const AgentStatusDashboard = () => {
  const agents = [
    { name: 'Golden Eye', codename: 'AST Scanner', icon: '👁️', status: 'MISSION_COMPLETE' },
    { name: 'Skyfall', codename: 'Profiler', icon: '⚡', status: 'MISSION_COMPLETE' },
    { name: 'Quantum', codename: 'Rules Engine', icon: '🔒', status: 'MISSION_COMPLETE' },
    { name: 'Agent 007', codename: 'Cluster Config', icon: '☁️', status: 'MISSION_COMPLETE' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">🕴️ AGENT STATUS NETWORK</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, index) => (
          <div key={index} className="bg-gray-900 border border-green-400 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">{agent.icon}</div>
            <h3 className="font-bold text-white mb-1">{agent.name}</h3>
            <p className="text-sm text-gray-400 mb-2">{agent.codename}</p>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
              {agent.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tab Navigation
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'mission', label: '🎯 MISSION CONTROL' },
    { id: 'intelligence', label: '📊 INTELLIGENCE' },
    { id: 'agents', label: '🤖 AGENTS' },
    { id: 'config', label: '⚙️ CONFIGURATION' }
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const SPARK007Dashboard = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState('mission-control');
  const [activeTab, setActiveTab] = useState('intelligence');
  const [missions, setMissions] = useState([]);

  const handleMissionLaunched = (result) => {
    setMissions(prev => [...prev, {
      ...result,
      start_time: new Date().toISOString()
    }]);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xl mb-4">
          🕴️
        </div>
        
        {/* Mission Control Button */}
        <button
          onClick={() => setActiveSidebarItem('mission-control')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            activeSidebarItem === 'mission-control'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Mission Control"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        
        {/* Talk to Agent Button */}
        <button
          onClick={() => setActiveSidebarItem('agent-chat')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            activeSidebarItem === 'agent-chat'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Talk to Agent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-cyan-500">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-wider">SPARK007</h1>
                <p className="text-sm text-cyan-400">MI6 INTELLIGENCE</p>
              </div>
              <div className="hidden md:block">
                <p className="text-sm italic text-gray-400">"Licensed to Optimize"</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-6 py-6">
          {activeSidebarItem === 'mission-control' && (
            <>
              <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

              {activeTab === 'mission' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <MissionLauncher onMissionLaunched={handleMissionLaunched} />
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-cyan-400 mb-4">📋 MISSION HISTORY</h2>
                    {missions.length > 0 ? (
                      <div className="space-y-3">
                        {missions.map((mission, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-4">
                            <h4 className="font-bold text-white">{mission.mission_id}</h4>
                            <p className="text-sm text-gray-400">Status: {mission.status}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No missions deployed yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'intelligence' && <IntelligenceReportViewer />}
              {activeTab === 'agents' && <AgentStatusDashboard />}
              
              {activeTab === 'config' && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-cyan-400 mb-4">⚙️ SYSTEM CONFIGURATION</h2>
                  <p className="text-gray-400">Q Branch access required for system configuration.</p>
                </div>
              )}
            </>
          )}

          {activeSidebarItem === 'agent-chat' && (
            <div className="h-full">
              <AgentQChatInterface />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-black px-6 py-4">
          <p className="text-center text-gray-400 text-sm">
            🕴️ SPARK007 MI6 Intelligence System - Version 1.0.0 - Licensed to Optimize
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SPARK007Dashboard;


    // Enhanced response logic for codebase queries
    setTimeout(() => {
        let response = "I can help you with SPARK007 intelligence. Try asking about functions, architecture, data lineage, anti-patterns, or performance optimization.";
        
        const query = inputValue.toLowerCase();
        
        if (query.includes('function') || query.includes('explain the logic')) {
          response = "🔍 **Code Analysis Results:**\n\n**Key Functions Detected:**\n• `processUserData()` - Main ETL pipeline entry point\n• `validateSchema()` - Data quality checks with 99.7% accuracy\n• `transformCustomerRecords()` - Business logic transformation\n• `aggregateMetrics()` - Performance aggregation layer\n• `writeToDataLake()` - Output persistence handler\n\n**Logic Flow:**\n1. Data ingestion from multiple sources\n2. Schema validation & cleansing\n3. Business rule application\n4. Aggregation & enrichment\n5. Quality checks & output\n\n💡 **Golden Eye Analysis:** 23 functions scanned, 8 optimization opportunities identified";
        } else if (query.includes('architecture') || query.includes('diagram')) {
          response = "🏗️ **System Architecture Overview:**\n\n```\n┌─────────────────┐    ┌──────────────────┐\n│   Data Sources  │───▶│   Ingestion Hub  │\n│ • Kafka Streams │    │ • Spark Streaming│\n│ • HDFS Files    │    │ • Schema Registry│\n└─────────────────┘    └──────────────────┘\n                                │\n                                ▼\n┌─────────────────┐    ┌──────────────────┐\n│ Transformation  │◀───│   Processing     │\n│ • Business Logic│    │   Engine         │\n│ • Data Quality  │    │ • Spark SQL      │\n└─────────────────┘    └──────────────────┘\n                                │\n                                ▼\n┌─────────────────┐    ┌──────────────────┐\n│   Data Lake     │◀───│   Output Layer   │\n│ • Parquet Files │    │ • Delta Tables   │\n│ • Partitioned   │    │ • ACID Support   │\n└─────────────────┘    └──────────────────┘\n```\n\n🎯 **Critical Path:** Kafka → Spark → Delta → Analytics\n⚡ **Bottleneck Detected:** Shuffle operations in transformation layer";
        } else if (query.includes('data lineage') || query.includes('column')) {
          response = "📊 **Data Lineage Analysis:**\n\n**Column: `customer_revenue`**\n```\nSource: customer_transactions.amount\n  │\n  ├─ Filter: WHERE status = 'COMPLETED'\n  │\n  ├─ Transform: SUM(amount) GROUP BY customer_id\n  │\n  ├─ Enrich: JOIN customer_profiles.tier_multiplier\n  │\n  └─ Output: analytics.customer_metrics.revenue\n```\n\n**Dependencies:**\n• Raw Table: `transactions.raw_events` (Kafka)\n• Reference: `dim_customers.profiles`\n• Lookup: `config.business_rules`\n\n**Impact Analysis:**\n• Downstream Tables: 12 affected\n• Reports: Executive Dashboard, Sales Analytics\n• SLA: 99.5% data freshness guarantee\n\n🔒 **Quantum Security:** PII masking applied, GDPR compliant";
        } else if (query.includes('anti-pattern')) {
          response = "🔥 **Golden Eye Anti-Pattern Detection:**\n\n**Critical Issues Found:**\n• Cartesian Products (99% performance gain when fixed)\n• Unnecessary Shuffles (45% improvement)\n• Small Files Problem (30% I/O improvement)\n• Memory Leaks from uncached DataFrames\n• Late Filter Applications\n\n**Code Locations:**\n• `ReportGenerator.scala:134` - Join without keys\n• `DataProcessor.scala:67` - Multiple shuffles\n• `ETLPipeline.scala:89` - Missing cache() calls\n\n💡 **Agent Q Recommendation:** Fix cartesian product first for maximum impact";
        } else if (query.includes('agent')) {
          response = "🕴️ **SPARK007 Agent Network:**\n\n👁️ **Golden Eye** - AST Scanner\n• Scans 50,000+ lines of Scala/Python code\n• Pattern recognition with 94% accuracy\n• Real-time code analysis\n\n⚡ **Skyfall** - Performance Profiler\n• JVM heap analysis & GC optimization\n• Spark UI metrics correlation\n• 24/7 cluster monitoring\n\n🔒 **Quantum** - Rules Engine\n• 847 compliance rules active\n• Data governance enforcement\n• Automated policy validation\n\n☁️ **Agent 007** - Cluster Optimizer\n• Auto-scaling recommendations\n• Cost optimization algorithms\n• Resource allocation intelligence";
        } else if (query.includes('cost')) {
          response = "💰 **Cost Intelligence Report:**\n\n**Current Spending:**\n• Hourly: $47.82\n• Daily: $1,147.68\n• Monthly: $34,730.40\n\n**Optimized Projection:**\n• Hourly: $16.73 (-65%)\n• Daily: $401.52 (-65%)\n• Monthly: $12,045.60 (-65%)\n\n**Savings Breakdown:**\n• Compute Optimization: $8,234/month\n• Storage Efficiency: $6,891/month\n• Network Reduction: $7,272/month\n\n🎯 **ROI Timeline:** 2.3 months payback period\n💡 **Top Recommendation:** Implement auto-scaling policies";
        } else if (query.includes('performance') || query.includes('optimization')) {
          response = "⚡ **Performance Analysis Dashboard:**\n\n**Current Metrics:**\n• Job Duration: 47 minutes (baseline)\n• CPU Utilization: 87% (high)\n• Memory Usage: 1.2GB peak\n• Network I/O: 2.3GB shuffled\n\n**Optimization Opportunities:**\n• Reduce Shuffle: 45% speed improvement\n• Optimize Joins: 32% faster execution\n• Cache Strategy: 28% memory efficiency\n• Partition Tuning: 23% I/O reduction\n\n**Skyfall Recommendations:**\n1. Implement broadcast joins for dim tables\n2. Increase parallelism from 200 to 400\n3. Enable adaptive query execution\n4. Optimize file sizes to 128MB blocks";
        } else if (query.includes('error') || query.includes('debug')) {
          response = "🐛 **Error Analysis & Debugging:**\n\n**Recent Issues Detected:**\n• OutOfMemoryError in driver (3 occurrences)\n• Serialization exceptions in UDFs\n• Timeout errors in external API calls\n• Schema evolution conflicts\n\n**Root Cause Analysis:**\n• Driver memory: Increase from 2GB to 8GB\n• Broadcast threshold: Reduce from 100MB to 50MB\n• API timeouts: Implement retry logic\n• Schema: Add backward compatibility layer\n\n**Golden Eye Insights:**\n• 89% of errors preventable with proper configuration\n• Common pattern: Memory issues during peak hours\n• Recommendation: Implement circuit breaker pattern";
        }