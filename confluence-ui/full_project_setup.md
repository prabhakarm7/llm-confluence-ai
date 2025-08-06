# JPM Graph Platform - Complete Project Setup

## 📁 **Project Structure**

```
jpm-graph-platform/
├── backend/                          # FastAPI Backend
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── graph_service.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── query_builder.py
│   ├── tests/
│   ├── scripts/
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/                         # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Graph/
│   │   │   │   ├── JPMGraphVisualization.tsx
│   │   │   │   ├── CustomNodes.tsx
│   │   │   │   └── FilterPanel.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── Common/
│   │   │       ├── Loading.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useGraphData.ts
│   │   │   └── useFilters.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── graphService.ts
│   │   ├── types/
│   │   │   ├── graph.ts
│   │   │   └── filters.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env
├── docker-compose.yml               # Full stack development
├── docker-compose.prod.yml          # Production deployment
├── .gitignore
├── README.md
└── Makefile                         # Development commands
```

## 🚀 **Step-by-Step Setup (Hosted Databases)**

### **Step 1: Create Project Root**

```bash
# Create main project directory
mkdir jpm-graph-platform
cd jpm-graph-platform

# Initialize git repository
git init
```

### **Step 2: Backend Setup**

```bash
# Create backend structure
mkdir -p backend/{src/{core,models,services,api,utils},tests,scripts}
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Create requirements.txt (Neo4j only for now)
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
neo4j==5.8.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
python-dotenv==1.0.0
pandas==2.1.4
networkx==3.2.1

# Optional for later:
# redis==5.0.1
# psycopg2-binary==2.9.9
# python-jose[cryptography]==3.3.0
# passlib[bcrypt]==1.7.4
EOF

# Install dependencies
pip install -r requirements.txt

# Create .env file for hosted Neo4j only
cat > .env << EOF
# Hosted Neo4j Configuration (Update with your hosted details)
NEO4J_URI=bolt://your-hosted-neo4j-url:7687
NEO4J_USERNAME=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j

# API Configuration
API_V1_STR=/api/v1
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","https://your-frontend-domain.com"]

# Environment
ENVIRONMENT=development
EOF

# Create Dockerfile for backend (production deployment)
cat > Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

cd ..
```

### **Step 3: Frontend Setup**

```bash
# Create React app with TypeScript
npx create-react-app frontend --template typescript
cd frontend

# Install additional dependencies
npm install reactflow @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer @types/node

# Initialize Tailwind CSS
npx tailwindcss init -p

# Configure Tailwind
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Update src/index.css
cat > src/index.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

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
EOF

# Create .env for frontend
cat > .env << EOF
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_V1_STR=/api/v1
EOF

# Create TypeScript types
mkdir -p src/types
cat > src/types/graph.ts << EOF
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  labels: string[];
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    node_type_counts: Record<string, number>;
    edge_type_counts: Record<string, number>;
    applied_filters: any;
  };
}
EOF

cat > src/types/filters.ts << EOF
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
  consultants: Array<{id: string; name: string}>;
  companies: Array<{id: string; name: string}>;
  products: Array<{id: string; name: string}>;
  field_consultants: Array<{id: string; name: string}>;
}
EOF

# Create API service
mkdir -p src/services
cat > src/services/api.ts << EOF
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_V1_STR = process.env.REACT_APP_API_V1_STR || '/api/v1';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = \`\${API_BASE_URL}\${API_V1_STR}\`;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = \`\${this.baseURL}\${endpoint}\`;
    
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
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
EOF

cat > src/services/graphService.ts << EOF
import { apiService } from './api';
import { GraphData, GraphFilters, FilterOptions } from '../types';

export class GraphService {
  async getGraphData(filters: GraphFilters, limit: number = 100): Promise<GraphData> {
    const response = await apiService.post<{success: boolean; data: GraphData}>('/graph/data', {
      filters,
      limit
    });
    return response.data;
  }

  async getFilterOptions(): Promise<FilterOptions> {
    return apiService.get<FilterOptions>('/filters/options');
  }

  async getNodeDetails(nodeId: string): Promise<any> {
    const response = await apiService.get<{success: boolean; data: any}>(\`/graph/node/\${nodeId}\`);
    return response.data;
  }

  async getConsultants(filters?: Partial<GraphFilters>): Promise<GraphData> {
    const queryParams = new URLSearchParams();
    if (filters?.regions) queryParams.append('regions', filters.regions.join(','));
    if (filters?.channels) queryParams.append('channels', filters.channels.join(','));
    
    const response = await apiService.get<{success: boolean; data: GraphData}>(\`/graph/consultants?\${queryParams}\`);
    return response.data;
  }
}

export const graphService = new GraphService();
EOF

# Create component directories
mkdir -p src/components/{Graph,Layout,Common}

cd ..
```

### **Step 4: Simplified Docker Compose (No Databases)**

```bash
# Create docker-compose.yml for development (no databases)
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Backend API (connects to your hosted databases)
  backend:
    build: ./backend
    container_name: jpm-backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    networks:
      - jpm-network

  # Frontend React App
  frontend:
    build: ./frontend
    container_name: jpm-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - jpm-network

networks:
  jpm-network:
    driver: bridge
EOF

# Create production docker-compose for deployment
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: jpm-backend-prod
    ports:
      - "8000:8000"
    environment:
      # Use environment variables for production
      - NEO4J_URI=\${NEO4J_URI}
      - NEO4J_USERNAME=\${NEO4J_USERNAME}
      - NEO4J_PASSWORD=\${NEO4J_PASSWORD}
      - POSTGRES_SERVER=\${POSTGRES_SERVER}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - REDIS_URL=\${REDIS_URL}
      - SECRET_KEY=\${SECRET_KEY}
      - ENVIRONMENT=production
    restart: unless-stopped
    networks:
      - jpm-network

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: jpm-frontend-prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - jpm-network

networks:
  jpm-network:
    driver: bridge
EOF

# Create production frontend Dockerfile
cat > frontend/Dockerfile.prod << EOF
# Multi-stage build for production
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx configuration
cat > frontend/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle React Router
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # API proxy (optional - if you want to serve API through same domain)
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
    }
}
EOF
```

### **Step 5: Development Scripts (Updated for Hosted DBs)**

```bash
cat > Makefile << EOF
.PHONY: help install dev build clean test

help:
	@echo "JPM Graph Platform - Development Commands (Hosted Databases)"
	@echo ""
	@echo "Available commands:"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development environment"
	@echo "  dev-local   - Start development locally (no Docker)"
	@echo "  build       - Build all containers"
	@echo "  clean       - Clean up containers"
	@echo "  test        - Run tests"
	@echo "  backend     - Start only backend"
	@echo "  frontend    - Start only frontend"
	@echo "  check-db    - Test database connections"

install:
	@echo "Installing backend dependencies..."
	cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed!"

dev:
	@echo "Starting development environment with hosted databases..."
	docker-compose up --build

dev-local:
	@echo "Starting local development (no Docker)..."
	@echo "Make sure to update .env with your hosted database credentials!"
	@echo "Starting backend in background..."
	cd backend && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting frontend..."
	cd frontend && npm start

build:
	@echo "Building all containers..."
	docker-compose build

clean:
	@echo "Cleaning up containers..."
	docker-compose down
	docker system prune -f

test:
	@echo "Running backend tests..."
	cd backend && python -m pytest
	@echo "Running frontend tests..."
	cd frontend && npm test

backend:
	@echo "Starting backend only..."
	cd backend && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	@echo "Starting frontend only (requires backend to be running)..."
	cd frontend && npm start

check-db:
	@echo "Testing database connections..."
	cd backend && source venv/bin/activate && python -c "from src.core.database import neo4j_conn; print('Testing Neo4j...'); session = neo4j_conn.get_session(); result = session.run('RETURN 1'); print('✅ Neo4j connected successfully')"

# Production deployment
deploy-prod:
	@echo "Building and starting production environment..."
	docker-compose -f docker-compose.prod.yml up --build -d

stop-prod:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.prod.yml down

# Development helpers
backend-shell:
	docker exec -it jpm-backend bash

frontend-shell:
	docker exec -it jpm-frontend sh

logs:
	docker-compose logs -f

stop:
	docker-compose stop

restart:
	docker-compose restart

# Database management (for hosted databases)
backup-neo4j:
	@echo "Instructions for backing up your hosted Neo4j database:"
	@echo "1. Go to your Neo4j hosting provider dashboard"
	@echo "2. Use their backup/export functionality"
	@echo "3. Or use cypher-shell to export data"

seed-data:
	@echo "Seeding data to hosted database..."
	cd backend && source venv/bin/activate && python scripts/seed_sample_data.py
EOF
```

### **Step 6: Git Configuration**

```bash
cat > .gitignore << EOF
# Dependencies
node_modules/
*/node_modules/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Build outputs
build/
dist/
*/build/
*/dist/

# Database
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db

# Docker
.dockerignore
EOF
```

## 🚀 **Getting Started Commands (Hosted Databases)**

### **Option 1: Local Development (Recommended)**

```bash
# Clone/create your project
mkdir jpm-graph-platform
cd jpm-graph-platform

# Set up the project structure (follow steps above)

# Update backend/.env with your hosted database credentials
# NEO4J_URI=bolt://your-hosted-neo4j.com:7687
# NEO4J_USERNAME=your_username
# NEO4J_PASSWORD=your_password

# Install dependencies
make install

# Test database connection
make check-db

# Start development locally
make dev-local

# Or start individual services:
# Terminal 1 - Backend
make backend

# Terminal 2 - Frontend  
make frontend

# Access the applications:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### **Option 2: Docker Development (Simplified)**

```bash
# Start frontend and backend with Docker (connects to your hosted DBs)
make dev

# View logs
make logs

# Stop services
make stop
```

### **Option 3: Production Deployment**

```bash
# Set environment variables for production
export NEO4J_URI="bolt://your-hosted-neo4j.com:7687"
export NEO4J_USERNAME="your_username"
export NEO4J_PASSWORD="your_password"
# ... other env vars

# Deploy to production
make deploy-prod

# Check status
docker-compose -f docker-compose.prod.yml ps

# Stop production
make stop-prod
```

## 📋 **Development Workflow (Hosted Databases)**

### **Daily Development:**

```bash
# Quick start for development
make dev-local

# Or with Docker
make dev

# View logs (if using Docker)
make logs

# Stop services
make stop
```

### **Environment Configuration:**

1. **Backend `.env` setup:**
   ```bash
   # Update backend/.env with your hosted database credentials
   NEO4J_URI=bolt://your-hosted-neo4j.com:7687
   NEO4J_USERNAME=your_neo4j_user
   NEO4J_PASSWORD=your_neo4j_password
   NEO4J_DATABASE=neo4j
   
   # Optional: If using hosted PostgreSQL
   POSTGRES_SERVER=your-postgres-host.com
   POSTGRES_USER=your_pg_user
   POSTGRES_PASSWORD=your_pg_password
   POSTGRES_DB=your_database
   POSTGRES_PORT=5432
   
   # Optional: If using hosted Redis
   REDIS_URL=redis://your-redis-host.com:6379/0
   ```

2. **Frontend `.env` setup:**
   ```bash
   # Update frontend/.env
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_API_V1_STR=/api/v1
   ```

### **Testing Database Connection:**

```bash
# Test your hosted database connection
make check-db

# Or manually test Neo4j connection
cd backend
source venv/bin/activate
python -c "
from src.core.database import neo4j_conn
print('Testing Neo4j connection...')
session = neo4j_conn.get_session()
result = session.run('RETURN 1 as test')
print('✅ Neo4j connected:', result.single()['test'])
"
```

### **Adding New Features:**

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - API auto-reloads with uvicorn `--reload`
   - Test at http://localhost:8000/docs

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - React auto-reloads with Create React App
   - View at http://localhost:3000

3. **Database Changes:**
   - Connect directly to your hosted Neo4j instance
   - Use Neo4j Browser or cypher-shell
   - No local database management needed!

## 🛠️ **Helpful Commands (Hosted Setup)**

```bash
# View running containers (if using Docker)
docker-compose ps

# Check backend logs
docker-compose logs backend
# Or for local development
tail -f backend/logs/app.log

# Check frontend logs
docker-compose logs frontend

# Access backend shell (Docker)
make backend-shell

# Restart just the backend
docker-compose restart backend
# Or for local development
cd backend && uvicorn src.main:app --reload

# Rebuild specific service
docker-compose up --build backend

# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/filters/options

# Check database connectivity
make check-db
```

## 🔒 **Security Considerations (Hosted Databases)**

### **Environment Variables:**
```bash
# Never commit these to git!
# Use environment variables for production:

# For development (.env file)
NEO4J_URI=bolt://your-host.com:7687
NEO4J_USERNAME=your_user
NEO4J_PASSWORD=your_password

# For production (environment variables)
export NEO4J_URI="bolt://prod-host.com:7687"
export NEO4J_USERNAME="prod_user"  
export NEO4J_PASSWORD="strong_password"

# Use different credentials for dev/staging/prod
```

### **Network Security:**
```bash
# Ensure your hosted databases allow connections from:
# - Your development IP
# - Your production server IPs
# - Configure firewall rules appropriately

# For cloud providers:
# - AWS: Security groups
# - GCP: Firewall rules  
# - Azure: Network security groups
```

## 🚀 **Deployment Options**

### **Option 1: Traditional VPS/Server**
```bash
# On your server
git clone <your-repo>
cd jpm-graph-platform

# Set production environment variables
export NEO4J_URI="bolt://your-prod-neo4j.com:7687"
export NEO4J_USERNAME="prod_user"
export NEO4J_PASSWORD="prod_password"

# Deploy
make deploy-prod
```

### **Option 2: Cloud Platforms**
```bash
# Heroku
heroku create jpm-graph-backend
heroku create jpm-graph-frontend
git push heroku main

# AWS ECS/Fargate
# Use docker-compose.prod.yml with ECS

# Google Cloud Run  
gcloud run deploy --source .

# Vercel (Frontend) + Railway/Render (Backend)
# Deploy frontend to Vercel
# Deploy backend to Railway/Render
```

## 🎯 **Next Steps**

1. **Update database credentials** in `backend/.env`
2. **Test connection** with `make check-db`
3. **Copy your FastAPI implementation** into `backend/src/`
4. **Copy the React component** into `frontend/src/components/Graph/`
5. **Start development**: `make dev-local`
6. **Test the integration**: Visit http://localhost:3000

You now have a **complete full-stack development environment** that connects to your hosted databases! 🚀

### **Advantages of This Setup:**
✅ **No local database management** - use your existing hosted infrastructure
✅ **Faster startup** - no database containers to start
✅ **Production-like environment** - same databases in dev and prod
✅ **Simplified deployment** - just frontend and backend services
✅ **Cost effective** - no duplicate database resources
