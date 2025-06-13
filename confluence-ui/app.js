import React, { useState, useEffect, useRef } from 'react';

// Enhanced Mock Intelligence Data
const getMockIntelligenceReport = (missionId) => ({
  mission_id: missionId,
  analysis_timestamp: new Date().toISOString(),
  repository_url: "https://github.com/acme-corp/spark-etl-pipeline",
  total_files_analyzed: 47,
  lines_of_code: 12847,
  
  executive_summary: {
    threat_level: "HIGH",
    compliance_score: 42,
    critical_findings: 8,
    optimization_potential: "65%",
    estimated_cost_savings: 2847.50,
    performance_improvement_potential: "78%"
  },

  performance_metrics: {
    files_analyzed: 47,
    anti_patterns_found: 23,
    compliance_score: 42,
    execution_time_ms: 45230,
    memory_usage_mb: 1247,
    cpu_utilization: 87
  },

  cost_analysis: {
    current_hourly_cost: 47.82,
    current_daily_cost: 1147.68,
    optimized_hourly_cost: 16.73,
    optimized_daily_cost: 401.52,
    monthly_savings: 22397.76,
    roi_timeframe: "2.3 months"
  },

  // Enhanced anti-patterns with detailed information
  anti_patterns: [
    {
      id: "AP001",
      type: "CRITICAL_SHUFFLE",
      title: "Unnecessary Data Shuffling",
      description: "Multiple shuffle operations detected in transformation chain causing severe performance degradation",
      severity: "CRITICAL",
      file_path: "src/main/scala/etl/DataProcessor.scala",
      line_number: 67,
      code_snippet: "df.join(broadcast(smallDf), Seq(\"key\"), \"inner\").repartition(200)",
      issue: "Join operation followed by repartition causing double shuffle",
      recommendation: "Remove repartition after broadcast join or use coalesce instead",
      estimated_impact: "45% performance improvement",
      fix_effort: "LOW"
    },
    {
      id: "AP002", 
      type: "CARTESIAN_PRODUCT",
      title: "Accidental Cartesian Product",
      description: "Join without proper keys resulting in cartesian product explosion",
      severity: "CRITICAL",
      file_path: "src/main/scala/analytics/ReportGenerator.scala",
      line_number: 134,
      code_snippet: "leftDf.join(rightDf).where(col(\"timestamp\") > lit(\"2023-01-01\"))",
      issue: "Missing join condition causing cartesian product",
      recommendation: "Add explicit join keys: .join(rightDf, Seq(\"user_id\"), \"inner\")",
      estimated_impact: "99% performance improvement",
      fix_effort: "MEDIUM"
    },
    {
      id: "AP003",
      type: "SMALL_FILES",
      title: "Small Files Problem",
      description: "Writing thousands of small files instead of optimized partitions",
      severity: "HIGH",
      file_path: "src/main/scala/output/DataWriter.scala", 
      line_number: 89,
      code_snippet: "df.write.mode(\"overwrite\").partitionBy(\"date\", \"hour\", \"minute\").parquet(outputPath)",
      issue: "Over-partitioning creating 15,000+ small files",
      recommendation: "Reduce partitioning granularity or use coalesce before write",
      estimated_impact: "30% I/O performance improvement",
      fix_effort: "LOW"
    },
    {
      id: "AP004",
      type: "MEMORY_LEAK",
      title: "Uncached DataFrame Operations",
      description: "Expensive DataFrame computed multiple times without caching",
      severity: "HIGH",
      file_path: "src/main/scala/transform/FeatureEngine.scala",
      line_number: 45,
      code_snippet: "val expensiveDf = rawDf.filter(...).groupBy(...).agg(...)\nexpensiveDf.count()\nexpensiveDf.show()",
      issue: "Complex DataFrame recomputed for each action",
      recommendation: "Add .cache() after expensive transformations",
      estimated_impact: "60% execution time reduction",
      fix_effort: "LOW"
    },
    {
      id: "AP005",
      type: "SERIALIZATION",
      title: "Non-Serializable Object Reference",
      description: "References to non-serializable objects in closures",
      severity: "MEDIUM",
      file_path: "src/main/scala/udf/CustomFunctions.scala",
      line_number: 78,
      code_snippet: "val regex = new Regex(\"[0-9]+\")\ndf.map(row => regex.findFirstIn(row.getString(0)))",
      issue: "Regex object not serializable across cluster",
      recommendation: "Move object creation inside closure or use broadcast",
      estimated_impact: "Eliminates serialization errors",
      fix_effort: "MEDIUM"
    },
    {
      id: "AP006",
      type: "INEFFICIENT_FILTER",
      title: "Late Filter Application",
      description: "Filters applied after expensive operations instead of early",
      severity: "HIGH",
      file_path: "src/main/scala/pipeline/ETLPipeline.scala",
      line_number: 156,
      code_snippet: "df.join(largeDf).groupBy(\"category\").sum(\"amount\").filter(col(\"sum(amount)\") > 1000)",
      issue: "Filter applied after join and aggregation",
      recommendation: "Apply filters before join: df.filter(...).join(largeDf.filter(...))",
      estimated_impact: "40% data reduction before expensive ops",
      fix_effort: "MEDIUM"
    },
    {
      id: "AP007",
      type: "STAGE_SKEW",
      title: "Data Skew in Aggregation",
      description: "Highly skewed data causing stage performance issues",
      severity: "HIGH",
      file_path: "src/main/scala/analytics/MetricsCalculator.scala",
      line_number: 203,
      code_snippet: "df.groupBy(\"customer_id\").agg(sum(\"revenue\")).orderBy(desc(\"sum(revenue)\"))",
      issue: "80% of data concentrated in 5% of partitions",
      recommendation: "Use salting technique or custom partitioner",
      estimated_impact: "50% reduction in stage execution time",
      fix_effort: "HIGH"
    },
    {
      id: "AP008",
      type: "RESOURCE_WASTE",
      title: "Over-provisioned Cluster Resources",
      description: "Cluster configured with excessive resources for workload",
      severity: "MEDIUM",
      file_path: "config/spark-defaults.conf",
      line_number: 23,
      code_snippet: "spark.executor.cores=8\nspark.executor.memory=32g\nspark.executor.instances=50",
      issue: "Resources 3x larger than workload requirements",
      recommendation: "Reduce to 4 cores, 16GB memory, 20 instances",
      estimated_impact: "$1,200/day cost savings",
      fix_effort: "LOW"
    }
  ],

  performance_analysis: {
    job_execution_metrics: {
      total_jobs: 12,
      failed_jobs: 0,
      avg_job_duration: "8.7 minutes",
      longest_job_duration: "23.4 minutes",
      total_stages: 47,
      skipped_stages: 8,
      failed_stages: 0
    },
    stage_analysis: [
      {
        stage_id: 3,
        duration_seconds: 847,
        input_size_mb: 4582,
        shuffle_read_mb: 1247,
        shuffle_write_mb: 892,
        issues: ["High shuffle overhead", "Uneven partition sizes"],
        optimization: "Increase parallelism, use broadcast join"
      },
      {
        stage_id: 7,
        duration_seconds: 1203,
        input_size_mb: 8934,
        shuffle_read_mb: 0,
        shuffle_write_mb: 3456,
        issues: ["Large shuffle write", "Memory pressure"],
        optimization: "Increase executor memory, optimize partitioning"
      }
    ],
    bottlenecks: [
      {
        type: "CPU_BOUND",
        description: "Complex UDF operations consuming 60% of execution time",
        file_path: "src/main/scala/udf/TextProcessing.scala",
        line_number: 34,
        recommendation: "Vectorize UDF operations or use built-in functions"
      },
      {
        type: "I/O_BOUND", 
        description: "Small file reads causing 40% I/O overhead",
        file_path: "src/main/scala/input/DataLoader.scala",
        line_number: 67,
        recommendation: "Combine small files or use different file format"
      }
    ]
  },

  security_analysis: {
    classification_level: "CONFIDENTIAL",
    security_issues: [
      {
        type: "DATA_EXPOSURE",
        severity: "HIGH",
        description: "PII data logged in Spark UI",
        file_path: "src/main/scala/logging/AuditLogger.scala",
        line_number: 45,
        recommendation: "Mask sensitive data in logs"
      },
      {
        type: "ACCESS_CONTROL",
        severity: "MEDIUM", 
        description: "Broad S3 bucket permissions",
        file_path: "config/aws-config.json",
        line_number: 12,
        recommendation: "Implement least privilege access"
      }
    ]
  },

  compliance_analysis: {
    rules_evaluated: 78,
    rules_passed: 33,
    rules_failed: 45,
    compliance_categories: {
      "Performance Best Practices": { score: 35, max: 100 },
      "Resource Optimization": { score: 28, max: 100 },
      "Code Quality": { score: 67, max: 100 },
      "Security Standards": { score: 45, max: 100 },
      "Cost Efficiency": { score: 23, max: 100 }
    }
  },

  recommended_actions: [
    "🔥 CRITICAL: Fix cartesian product in ReportGenerator.scala line 134 (99% performance gain)",
    "⚡ HIGH: Add caching to expensive DataFrame operations in FeatureEngine.scala line 45",
    "🎯 HIGH: Apply filters before joins in ETLPipeline.scala line 156", 
    "💰 MEDIUM: Reduce cluster resources by 60% to save $1,200/day",
    "📊 MEDIUM: Implement data skew handling in MetricsCalculator.scala line 203",
    "🔒 HIGH: Mask PII data in application logs",
    "⚙️ LOW: Replace repartition with coalesce in DataProcessor.scala line 67",
    "📁 LOW: Optimize output partitioning to reduce small files"
  ],

  optimization_roadmap: {
    phase1: {
      title: "Critical Fixes (Week 1)",
      items: ["Fix cartesian product", "Add DataFrame caching", "Optimize cluster resources"],
      estimated_savings: "$1,847/day",
      effort: "8 developer hours"
    },
    phase2: {
      title: "Performance Tuning (Week 2-3)", 
      items: ["Implement data skew handling", "Optimize file I/O", "Improve partitioning strategy"],
      estimated_savings: "$724/day additional",
      effort: "24 developer hours"
    },
    phase3: {
      title: "Advanced Optimizations (Week 4-6)",
      items: ["Custom partitioners", "Advanced caching strategies", "Query optimization"],
      estimated_savings: "$432/day additional", 
      effort: "40 developer hours"
    }
  }
});

// AI Agent Knowledge Base
class AgentQ {
  constructor() {
    this.knowledgeBase = {
      "system_overview": {
        question: "What is SPARK007 and how does it work?",
        answer: "SPARK007 is an MI6-themed intelligent system for analyzing Apache Spark applications. It deploys four specialized agents: Golden Eye (AST Scanner) for code analysis, Skyfall (Profiler) for performance profiling, Quantum (Rules Engine) for compliance checking, and Agent 007 (Cluster Config) for cloud optimization. The system provides real-time monitoring, cost analysis, and actionable recommendations."
      },
      "agents_explained": {
        question: "Tell me about the four agents and their roles",
        answer: "🔍 **Golden Eye (AST Scanner)**: Analyzes code structure and identifies anti-patterns using Abstract Syntax Tree scanning.\n\n⚡ **Skyfall (Profiler)**: Monitors performance metrics, execution times, and resource utilization.\n\n🔒 **Quantum (Rules Engine)**: Enforces compliance rules and best practices for Spark applications.\n\n☁️ **Agent 007 (Cluster Config)**: Optimizes cluster configurations for different cloud platforms (AWS, Azure, GCP, Databricks)."
      },
      "anti_patterns": {
        question: "What anti-patterns can Golden Eye detect?",
        answer: "Golden Eye can detect 8+ critical anti-patterns:\n\n🔥 **Cartesian Products**: Accidental cross-joins causing explosive data growth\n⚡ **Unnecessary Shuffles**: Multiple shuffle operations in transformation chains\n📁 **Small Files**: Over-partitioning creating thousands of tiny files\n💾 **Memory Leaks**: Uncached DataFrames computed multiple times\n🔄 **Late Filters**: Filters applied after expensive operations\n📊 **Data Skew**: Uneven data distribution causing bottlenecks\n🔧 **Serialization Issues**: Non-serializable objects in closures\n💰 **Resource Waste**: Over-provisioned cluster configurations"
      },
      "performance_analysis": {
        question: "How does the performance analysis work?",
        answer: "The performance analysis engine evaluates:\n\n📊 **Job Metrics**: Execution times, stage analysis, failure rates\n🚧 **Bottlenecks**: CPU-bound vs I/O-bound identification\n⚡ **Stage Analysis**: Shuffle overhead, partition skew, memory pressure\n📈 **Optimization**: Specific recommendations with impact estimates\n\nEach issue includes file paths, line numbers, and actionable fixes with estimated performance improvements (up to 99% in some cases)."
      },
      "cost_optimization": {
        question: "How much can I save with SPARK007 optimizations?",
        answer: "Based on our analysis of the current demo:\n\n💰 **Current Costs**: $47.82/hour, $1,147.68/day\n✨ **Optimized Costs**: $16.73/hour, $401.52/day\n💵 **Monthly Savings**: $22,397.76\n⏱️ **ROI Timeframe**: 2.3 months\n\nKey savings come from:\n- Fixing cartesian products (99% performance gain)\n- Right-sizing cluster resources (60% cost reduction)\n- Eliminating unnecessary shuffles (45% improvement)\n- Optimizing file I/O operations (30% improvement)"
      },
      "code_issues": {
        question: "Show me specific code issues found",
        answer: "Here are the critical issues detected:\n\n🔥 **CRITICAL - Cartesian Product** (Line 134, ReportGenerator.scala):\n```scala\nleftDf.join(rightDf).where(col(\"timestamp\") > lit(\"2023-01-01\"))\n```\n❌ Missing join condition causing cartesian product\n✅ Fix: Add explicit join keys\n\n⚡ **HIGH - Uncached DataFrame** (Line 45, FeatureEngine.scala):\n```scala\nval expensiveDf = rawDf.filter(...).groupBy(...).agg(...)\nexpensiveDf.count()\nexpensiveDf.show()\n```\n❌ Complex DataFrame recomputed multiple times\n✅ Fix: Add .cache() after expensive transformations"
      }
    };

    this.quickResponses = [
      "Roger that, Agent. How can I assist with the mission?",
      "Intelligence received. Processing your query...",
      "Q Branch here. What intelligence do you require?",
      "Agent Q at your service. Mission parameters understood.",
      "Classified information accessed. Proceeding with briefing..."
    ];
  }

  processQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Find matching knowledge base entry
    for (const [key, data] of Object.entries(this.knowledgeBase)) {
      const keywords = key.split('_');
      if (keywords.some(keyword => lowerQuery.includes(keyword)) || 
          lowerQuery.includes(data.question.toLowerCase().split(' ').slice(0, 3).join(' '))) {
        return {
          type: 'knowledge',
          response: data.answer,
          confidence: 'HIGH'
        };
      }
    }

    if (lowerQuery.includes('help') || lowerQuery.includes('how') || lowerQuery.includes('what')) {
      return {
        type: 'general',
        response: "I'm Agent Q, your technical intelligence officer. I can explain how SPARK007 works, detail our agent capabilities, guide you through mission procedures, and answer questions about cost analysis, compliance scoring, and system architecture. What specific aspect would you like to explore?",
        confidence: 'MEDIUM'
      };
    }

    if (lowerQuery.includes('mission') || lowerQuery.includes('deploy')) {
      return {
        type: 'guidance',
        response: "To deploy a mission: 1) Enter your repository URL in the Mission Control tab, 2) Set classification level and priority, 3) Choose workload type and target platform, 4) Click 'DEPLOY AGENTS'. The system will analyze your code and provide detailed intelligence reports.",
        confidence: 'HIGH'
      };
    }

    // Default response
    return {
      type: 'default',
      response: "I'm afraid that's outside my current intelligence briefing. Try asking about system overview, agents, anti-patterns, performance analysis, or cost optimization. Use the suggested questions below for detailed explanations.",
      confidence: 'LOW'
    };
  }

  getSuggestedQuestions() {
    return Object.values(this.knowledgeBase).map(item => item.question);
  }

  getRandomGreeting() {
    return this.quickResponses[Math.floor(Math.random() * this.quickResponses.length)];
  }
}

// Chatbot Component
const AgentQChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const agentQ = new AgentQ();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting when chatbot opens
      setMessages([{
        type: 'agent',
        content: "🕴️ **Agent Q - Technical Intelligence**\n\nClassified briefing initiated. I'm your technical intelligence officer for SPARK007 operations. I can explain system architecture, agent capabilities, mission procedures, and operational protocols.\n\nHow may I assist with your mission today?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate processing delay
    setTimeout(() => {
      const response = agentQ.processQuery(inputValue);
      const agentMessage = {
        type: 'agent',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence
      };
      
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const suggestedQuestions = agentQ.getSuggestedQuestions().slice(0, 6);

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="text-2xl">🕴️</div>
        )}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[600px] h-[700px] bg-gray-900 border border-cyan-500 rounded-lg shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg">🕴️</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">Agent Q</h3>
                  <p className="text-xs text-cyan-200">Technical Intelligence Officer</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[500px]">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}>
                  <div className="text-sm whitespace-pre-wrap font-mono">{message.content}</div>
                  {message.confidence && (
                    <div className={`text-xs mt-2 flex items-center space-x-1 ${
                      message.confidence === 'HIGH' ? 'text-green-400' :
                      message.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      <span>🎯</span>
                      <span>Confidence: {message.confidence}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400">🧠</span>
                    <span className="text-gray-300 text-sm">Agent Q is analyzing...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-gray-700 max-h-40 overflow-y-auto">
              <div className="text-xs text-gray-400 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                <span>Popular Questions:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "What anti-patterns can Golden Eye detect?",
                  "How much can I save with SPARK007 optimizations?",
                  "Show me specific code issues found",
                  "How does the performance analysis work?",
                  "Tell me about the four agents and their roles",
                  "What is SPARK007 and how does it work?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left text-xs text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 p-2 rounded transition-colors truncate border border-gray-700"
                  >
                    • {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about anti-patterns, performance, costs, or agents..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-xs">Send</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["Anti-patterns", "Performance", "Costs", "Agents"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInputValue(`Tell me about ${tag.toLowerCase()}`)}
                  className="px-2 py-1 bg-gray-700 text-xs text-cyan-400 rounded hover:bg-gray-600 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// API Service
class MI6Intelligence {
  constructor() {
    this.baseURL = 'http://localhost:8000';
    this.token = 'demo-agent-token';
  }

  async launchMission(briefing) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      mission_id: `MISSION_${Date.now()}`,
      status: 'AGENTS_DEPLOYED',
      message: 'All agents successfully deployed'
    };
  }

  async getMissionStatus(missionId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      status: 'MISSION_COMPLETE',
      agent_status: {
        golden_eye: 'MISSION_COMPLETE',
        skyfall: 'MISSION_COMPLETE', 
        quantum: 'MISSION_COMPLETE',
        agent_007: 'MISSION_COMPLETE'
      }
    };
  }

  async getIntelligenceReport(missionId) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockIntelligenceReport(missionId);
  }
}

// Enhanced Intelligence Report Viewer
const IntelligenceReportViewer = ({ report }) => {
  const [activeDetailTab, setActiveDetailTab] = useState('anti-patterns');

  if (!report) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
        <div className="text-6xl text-gray-600 mb-4">📊</div>
        <h3 className="text-xl text-gray-400">No intelligence report available</h3>
        <p className="text-gray-500 mt-2">Complete a mission to view detailed analysis</p>
      </div>
    );
  }

  const getThreatColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/20 border-red-400';
      case 'HIGH': return 'text-orange-400 bg-orange-900/20 border-orange-400';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20 border-yellow-400';
      default: return 'text-green-400 bg-green-900/20 border-green-400';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🟡';
      default: return '✅';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-cyan-500 rounded-full p-2 mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-cyan-400">📊 EXECUTIVE SUMMARY</h2>
            <p className="text-sm text-gray-400">{report.total_files_analyzed} files • {report.lines_of_code.toLocaleString()} lines of code analyzed</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getThreatColor(report.executive_summary.threat_level).split(' ')[0]}`}>
              {report.executive_summary.threat_level}
            </div>
            <div className="text-sm text-gray-400">Threat Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {report.executive_summary.compliance_score}%
            </div>
            <div className="text-sm text-gray-400">Compliance Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {report.executive_summary.critical_findings}
            </div>
            <div className="text-sm text-gray-400">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {report.executive_summary.optimization_potential}
            </div>
            <div className="text-sm text-gray-400">Optimization Potential</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${report.executive_summary.estimated_cost_savings.toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Daily Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {report.executive_summary.performance_improvement_potential}
            </div>
            <div className="text-sm text-gray-400">Performance Gain</div>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg">
        <div className="border-b border-gray-700">
          <div className="flex flex-wrap">
            {[
              { id: 'anti-patterns', label: '🔍 Anti-Patterns', count: report.anti_patterns.length },
              { id: 'performance', label: '⚡ Performance', count: report.performance_analysis.bottlenecks.length },
              { id: 'security', label: '🔒 Security', count: report.security_analysis.security_issues.length },
              { id: 'compliance', label: '📋 Compliance', count: report.compliance_analysis.rules_failed }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeDetailTab === tab.id
                    ? 'bg-cyan-500 text-white border-b-2 border-cyan-300'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Anti-Patterns Tab */}
          {activeDetailTab === 'anti-patterns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-cyan-400">🔍 Code Anti-Patterns Detected</h3>
                <div className="text-sm text-gray-400">
                  {report.anti_patterns.length} issues found across {report.total_files_analyzed} files
                </div>
              </div>
              
              {report.anti_patterns.map((pattern, index) => (
                <div key={pattern.id} className={`border rounded-lg p-4 ${getThreatColor(pattern.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getSeverityIcon(pattern.severity)}</span>
                      <div>
                        <h4 className="font-bold text-white text-lg">{pattern.title}</h4>
                        <p className="text-sm opacity-90">{pattern.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getThreatColor(pattern.severity)}`}>
                        {pattern.severity}
                      </span>
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        {pattern.fix_effort} effort
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-300 mb-2">📍 Location</div>
                      <div className="bg-gray-800 p-3 rounded font-mono text-sm">
                        <div className="text-cyan-400">{pattern.file_path}</div>
                        <div className="text-gray-400">Line {pattern.line_number}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300 mb-2">💡 Impact & Fix</div>
                      <div className="space-y-1">
                        <div className="text-green-400 text-sm">✨ {pattern.estimated_impact}</div>
                        <div className="text-blue-400 text-sm">🔧 {pattern.fix_effort} effort to fix</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-300 mb-2">💻 Code Snippet</div>
                    <div className="bg-black p-3 rounded font-mono text-sm overflow-x-auto">
                      <pre className="text-red-400">{pattern.code_snippet}</pre>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-red-300 mb-2">❌ Issue</div>
                      <div className="text-sm text-gray-300">{pattern.issue}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-300 mb-2">✅ Recommendation</div>
                      <div className="text-sm text-gray-300">{pattern.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance Tab */}
          {activeDetailTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-orange-400">⚡ Performance Analysis</h3>
              </div>

              {/* Job Metrics */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h4 className="font-bold text-orange-400 mb-4">📊 Job Execution Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{report.performance_analysis.job_execution_metrics.total_jobs}</div>
                    <div className="text-sm text-gray-400">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{report.performance_analysis.job_execution_metrics.avg_job_duration}</div>
                    <div className="text-sm text-gray-400">Avg Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{report.performance_analysis.job_execution_metrics.total_stages}</div>
                    <div className="text-sm text-gray-400">Total Stages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{report.performance_analysis.job_execution_metrics.longest_job_duration}</div>
                    <div className="text-sm text-gray-400">Longest Job</div>
                  </div>
                </div>
              </div>

              {/* Bottlenecks */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h4 className="font-bold text-orange-400 mb-4">🚧 Performance Bottlenecks</h4>
                <div className="space-y-4">
                  {report.performance_analysis.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="border border-yellow-600 bg-yellow-900/10 rounded p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-bold text-yellow-400">{bottleneck.type.replace('_', ' ')}</h5>
                      </div>
                      <p className="text-gray-300 mb-3">{bottleneck.description}</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Location:</div>
                          <div className="font-mono text-sm bg-gray-900 p-2 rounded">
                            <div className="text-cyan-400">{bottleneck.file_path}</div>
                            <div className="text-gray-400">Line {bottleneck.line_number}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Recommendation:</div>
                          <div className="text-green-400 text-sm">{bottleneck.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeDetailTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-red-400">🔒 Security Analysis</h3>
                <div className="text-sm text-gray-400">
                  Classification: {report.security_analysis.classification_level}
                </div>
              </div>
              
              {report.security_analysis.security_issues.map((issue, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getThreatColor(issue.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <h4 className="font-bold text-white text-lg">{issue.type.replace('_', ' ')}</h4>
                        <p className="text-sm opacity-90">{issue.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getThreatColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-300 mb-2">📍 Location</div>
                      <div className="bg-gray-800 p-3 rounded font-mono text-sm">
                        <div className="text-cyan-400">{issue.file_path}</div>
                        <div className="text-gray-400">Line {issue.line_number}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-300 mb-2">✅ Recommendation</div>
                      <div className="text-sm text-gray-300">{issue.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compliance Tab */}
          {activeDetailTab === 'compliance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-purple-400">📋 Compliance Analysis</h3>
                <div className="text-sm text-gray-400">
                  {report.compliance_analysis.rules_passed}/{report.compliance_analysis.rules_evaluated} rules passed
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.compliance_analysis.compliance_categories).map(([category, data]) => (
                  <div key={category} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h4 className="font-bold text-white mb-2">{category}</h4>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Score</span>
                        <span className="text-white">{data.score}/{data.max}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(data.score / data.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round((data.score / data.max) * 100)}% compliant
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-400">💰 CURRENT COSTS</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Hourly Cost</span>
              <span className="text-white font-bold">${report.cost_analysis.current_hourly_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Daily Cost</span>
              <span className="text-white font-bold">${report.cost_analysis.current_daily_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Monthly Cost</span>
              <span className="text-white font-bold">${(report.cost_analysis.current_daily_cost * 30).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-cyan-500 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-cyan-400">📈 OPTIMIZED COSTS</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Optimized Hourly</span>
              <span className="text-green-400 font-bold">${report.cost_analysis.optimized_hourly_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Optimized Daily</span>
              <span className="text-green-400 font-bold">${report.cost_analysis.optimized_daily_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Monthly Savings</span>
              <span className="text-green-400 font-bold">${report.cost_analysis.monthly_savings}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-600 pt-3">
              <span className="text-gray-300">ROI Timeframe</span>
              <span className="text-purple-400 font-bold">{report.cost_analysis.roi_timeframe}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="bg-green-500 rounded-full p-2 mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-400">🎯 RECOMMENDED ACTIONS</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {report.recommended_actions.map((action, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
              <div className="text-green-400 mt-1 text-lg">✓</div>
              <span className="text-gray-300 text-sm">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-cyan-500 border-t-transparent ${sizeClasses[size]}`}></div>
  );
};

// Mission Status Badge
const StatusBadge = ({ status }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'MISSION_COMPLETE':
        return 'bg-green-500 text-white';
      case 'MISSION_FAILED':
        return 'bg-red-500 text-white';
      case 'AGENTS_DEPLOYED':
      case 'ACTIVE':
        return 'bg-yellow-500 text-black';
      case 'INFILTRATING':
      case 'ANALYZING':
      case 'INTERROGATING':
      case 'CONFIGURING':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(status)}`}>
      {status}
    </span>
  );
};

// Mission Launcher Component
const MissionLauncher = ({ onMissionLaunched }) => {
  const [briefing, setBriefing] = useState({
    repo_url: 'https://github.com/acme-corp/spark-etl-pipeline',
    classification_level: 'CONFIDENTIAL',
    optimization_priority: 'HIGH',
    workload_type: 'ETL_HEAVY',
    target_platform: 'AWS'
  });
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const intelligence = new MI6Intelligence();
      const result = await intelligence.launchMission(briefing);
      onMissionLaunched(result);
    } catch (error) {
      console.error('Mission launch failed:', error);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-xl">
      <div className="flex items-center mb-6">
        <div className="bg-cyan-500 rounded-full p-2 mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-cyan-400 tracking-wider">🎯 MISSION DEPLOYMENT</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Repository URL</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={briefing.repo_url}
            onChange={(e) => setBriefing({ ...briefing, repo_url: e.target.value })}
            placeholder="https://github.com/your-org/spark-project"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Classification Level</label>
            <select
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              value={briefing.classification_level}
              onChange={(e) => setBriefing({ ...briefing, classification_level: e.target.value })}
            >
              <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SECRET">SECRET</option>
              <option value="TOP_SECRET">TOP SECRET</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Priority Level</label>
            <select
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              value={briefing.optimization_priority}
              onChange={(e) => setBriefing({ ...briefing, optimization_priority: e.target.value })}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Workload Type</label>
            <select
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              value={briefing.workload_type}
              onChange={(e) => setBriefing({ ...briefing, workload_type: e.target.value })}
            >
              <option value="">Auto-Detect</option>
              <option value="ETL_HEAVY">ETL Heavy</option>
              <option value="ML_TRAINING">ML Training</option>
              <option value="STREAMING">Streaming</option>
              <option value="ANALYTICS">Analytics</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Platform</label>
            <select
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              value={briefing.target_platform}
              onChange={(e) => setBriefing({ ...briefing, target_platform: e.target.value })}
            >
              <option value="AWS">AWS</option>
              <option value="AZURE">Azure</option>
              <option value="GCP">Google Cloud</option>
              <option value="DATABRICKS">Databricks</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleLaunch}
          disabled={!briefing.repo_url || launching}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-6 rounded-md hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {launching ? (
            <>
              <LoadingSpinner size="sm" />
              <span>DEPLOYING AGENTS...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>DEPLOY AGENTS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Agent Status Card
const AgentCard = ({ agent, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'MISSION_COMPLETE': return 'text-green-400 border-green-400';
      case 'ACTIVE': return 'text-yellow-400 border-yellow-400';
      case 'INFILTRATING':
      case 'ANALYZING':
      case 'INTERROGATING':
      case 'CONFIGURING': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900 border rounded-lg p-4 text-center transition-all duration-300 hover:scale-105 ${getStatusColor(status)}`}>
      <div className="text-3xl mb-2">{agent.icon}</div>
      <h3 className="font-bold text-white mb-1">{agent.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{agent.codename}</p>
      <StatusBadge status={status} />
    </div>
  );
};

// Agent Status Dashboard
const AgentStatusDashboard = ({ missions }) => {
  const agents = [
    { id: 'golden_eye', name: 'Golden Eye', codename: 'AST Scanner', icon: '👁️' },
    { id: 'skyfall', name: 'Skyfall', codename: 'Profiler', icon: '⚡' },
    { id: 'quantum', name: 'Quantum', codename: 'Rules Engine', icon: '🔒' },
    { id: 'agent_007', name: 'Agent 007', codename: 'Cluster Config', icon: '☁️' }
  ];

  const getAgentStatus = (agentId) => {
    if (!missions.length) return 'STANDBY';
    const latestMission = missions[missions.length - 1];
    return latestMission.agent_status?.[agentId] || 'STANDBY';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          status={getAgentStatus(agent.id)}
        />
      ))}
    </div>
  );
};

// Mission History Component
const MissionHistory = ({ missions, onSelectMission }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="bg-cyan-500 rounded-full p-2 mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-cyan-400">📋 MISSION HISTORY</h2>
      </div>
      
      {missions.length > 0 ? (
        <div className="space-y-3">
          {missions.map((mission) => (
            <div
              key={mission.mission_id}
              onClick={() => onSelectMission(mission)}
              className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-cyan-500 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">{mission.mission_id}</h4>
                  <p className="text-sm text-gray-400">
                    Started: {new Date(mission.start_time).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={mission.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl text-gray-600 mb-2">📋</div>
          <p className="text-gray-400">No missions deployed yet. Launch your first analysis mission above.</p>
        </div>
      )}
    </div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'mission', label: '🎯 MISSION CONTROL', icon: '🎯' },
    { id: 'intelligence', label: '📊 INTELLIGENCE', icon: '📊' },
    { id: 'agents', label: '🤖 AGENTS', icon: '🤖' },
    { id: 'config', label: '⚙️ CONFIGURATION', icon: '⚙️' }
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white border-b-2 border-cyan-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="block truncate">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const SPARK007Dashboard = () => {
  const [activeTab, setActiveTab] = useState('intelligence'); // Start with intelligence tab
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [intelligenceReport, setIntelligenceReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const intelligence = new MI6Intelligence();

  // Auto-load demo data on component mount
  useEffect(() => {
    const loadDemoData = async () => {
      const demoMission = {
        mission_id: 'MISSION_DEMO_1734567890',
        status: 'MISSION_COMPLETE',
        start_time: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        agent_status: {
          golden_eye: 'MISSION_COMPLETE',
          skyfall: 'MISSION_COMPLETE',
          quantum: 'MISSION_COMPLETE',
          agent_007: 'MISSION_COMPLETE'
        }
      };
      
      setMissions([demoMission]);
      setSelectedMission(demoMission);
      
      // Load the intelligence report
      const report = getMockIntelligenceReport(demoMission.mission_id);
      setIntelligenceReport(report);
    };

    loadDemoData();
  }, []);

  // Handle mission launch
  const handleMissionLaunched = async (result) => {
    const newMission = {
      mission_id: result.mission_id,
      status: result.status,
      start_time: new Date().toISOString(),
      agent_status: {
        golden_eye: 'INFILTRATING',
        skyfall: 'ANALYZING',
        quantum: 'INTERROGATING',
        agent_007: 'CONFIGURING'
      }
    };
    
    setMissions(prev => [...prev, newMission]);
    setSelectedMission(newMission);
    
    // Simulate mission completion after 5 seconds
    setTimeout(async () => {
      const completedMission = {
        ...newMission,
        status: 'MISSION_COMPLETE',
        agent_status: {
          golden_eye: 'MISSION_COMPLETE',
          skyfall: 'MISSION_COMPLETE',
          quantum: 'MISSION_COMPLETE',
          agent_007: 'MISSION_COMPLETE'
        }
      };
      
      setMissions(prev => prev.map(m => 
        m.mission_id === result.mission_id ? completedMission : m
      ));
      setSelectedMission(completedMission);
      
      // Load intelligence report
      const report = getMockIntelligenceReport(result.mission_id);
      setIntelligenceReport(report);
    }, 5000);
  };

  // Handle mission selection
  const handleSelectMission = async (mission) => {
    setSelectedMission(mission);
    setLoading(true);
    
    try {
      if (mission.status === 'MISSION_COMPLETE') {
        const report = getMockIntelligenceReport(mission.mission_id);
        setIntelligenceReport(report);
      } else {
        setIntelligenceReport(null);
      }
    } catch (error) {
      console.error('Error fetching intelligence report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-cyan-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xl">
                🕴️
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider">SPARK007</h1>
                <p className="text-sm text-cyan-400">MI6 INTELLIGENCE</p>
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm italic text-gray-400">"Licensed to Optimize"</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Mission Control Tab */}
        {activeTab === 'mission' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MissionLauncher onMissionLaunched={handleMissionLaunched} />
            <MissionHistory missions={missions} onSelectMission={handleSelectMission} />
          </div>
        )}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <div>
            {loading ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-lg">Decrypting intelligence report...</p>
              </div>
            ) : (
              <IntelligenceReportViewer report={intelligenceReport} />
            )}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">🕴️ AGENT STATUS NETWORK</h2>
            <AgentStatusDashboard missions={missions} />
            
            {selectedMission && (
              <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Mission: {selectedMission.mission_id}</h3>
                <p className="text-gray-400 mb-4">Status: {selectedMission.status}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedMission.agent_status || {}).map(([agentId, status]) => (
                    <div key={agentId} className="text-center">
                      <div className="text-sm text-gray-300 mb-1">{agentId.replace('_', ' ').toUpperCase()}</div>
                      <StatusBadge status={status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-cyan-500 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-cyan-400">🔧 SYSTEM CONFIGURATION</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Advanced configuration options for MI6 Intelligence System.
                Access restricted to authorized personnel only.
              </p>
              <button className="bg-gray-700 text-gray-400 px-4 py-2 rounded cursor-not-allowed">
                Q Branch Access Required
              </button>
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-400">📡 SYSTEM STATUS</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">MI6 Backend</span>
                  <span className="text-green-400 font-bold">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Agent Network</span>
                  <span className="text-green-400 font-bold">All agents ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Intelligence Database</span>
                  <span className="text-green-400 font-bold">Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chatbot Component */}
      <AgentQChatbot />

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-gray-400 text-sm">
            🕴️ SPARK007 MI6 Intelligence System - Version 1.0.0 - Licensed to Optimize
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SPARK007Dashboard;
                