# JPM FastAPI Implementation - Based on Your Neo4j Schema

## 🔍 Analyzed Data Structure from Your Cypher Queries

From your image, I can see you have:

### **Nodes:**
1. **COMPANY** - with properties: name, region, sales_region, privacy, channel, pca
2. **CONSULTANT** - with properties: name, region, channel, pca, sales_region, level_of_influence
3. **FIELD_CONSULTANT** - linked to consultants
4. **PRODUCT** - with properties: name, asset_class, mandate_status

### **Relationships:**
1. **EMPLOYS** - Consultant to Field Consultant
2. **COVERS** - Field Consultant to Company/Product
3. **OWNS** - Company to Product (with mandate_status)
4. **RATES** - Consultant to Product (with rating_change, rankgroup, rankvalue, rankorder)

## 📁 FastAPI Project Structure

```
backend/
├── src/
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── graph_service.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   └── utils/
│       ├── __init__.py
│       └── query_builder.py
├── requirements.txt
└── .env
```

## 🛠️ Implementation Files

### 1. Core Configuration

```python
# src/core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "JPM Graph API"
    
    # Neo4j Settings - Use your existing setup
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "your_password"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2. Database Connection

```python
# src/core/database.py
from neo4j import GraphDatabase
from .config import settings

class Neo4jConnection:
    def __init__(self):
        self._driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
        )
    
    def close(self):
        if self._driver is not None:
            self._driver.close()
    
    def get_session(self):
        return self._driver.session()

# Global connection instance
neo4j_conn = Neo4jConnection()
```

### 3. Pydantic Models (Based on Your Schema)

```python
# src/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum

class NodeType(str, Enum):
    CONSULTANT = "CONSULTANT"
    FIELD_CONSULTANT = "FIELD_CONSULTANT"
    COMPANY = "COMPANY"
    PRODUCT = "PRODUCT"

class MandateStatus(str, Enum):
    ACTIVE = "Active"
    AT_RISK = "At Risk"
    CONVERSION = "Conversion"

class RatingChange(str, Enum):
    UPGRADE = "Upgrade"
    DOWNGRADE = "Downgrade"
    STABLE = "Stable"

# Node Models (Based on your existing data)
class Company(BaseModel):
    id: str
    name: str
    region: Optional[str] = None
    sales_region: Optional[List[str]] = None
    privacy: Optional[str] = Field(None, description="Privacy level of the company")
    channel: Optional[List[str]] = None
    pca: Optional[str] = Field(None, description="Primary Consultant Advisor")
    aca: Optional[str] = Field(None, description="Alternate Client Advisor")

class Consultant(BaseModel):
    id: str
    name: str
    region: Optional[List[str]] = None
    channel: Optional[str] = None
    privacy: Optional[str] = Field(None, description="Privacy level of the consultant")
    pca: Optional[str] = Field(None, description="Primary Consultant Advisor")
    aca: Optional[str] = Field(None, description="Alternate Client Advisor")
    sales_region: Optional[List[str]] = None
    level_of_influence: Optional[str] = None

class FieldConsultant(BaseModel):
    id: str
    name: str
    consultant_id: Optional[str] = None

class Product(BaseModel):
    id: str
    name: str
    asset_class: Optional[str] = None
    mandate_status: Optional[str] = None

# Relationship Models
class OwnsRelationship(BaseModel):
    source: str
    target: str
    type: str = "OWNS"
    mandate_status: Optional[str] = None

class RatesRelationship(BaseModel):
    source: str
    target: str
    type: str = "RATES"
    rating_change: Optional[str] = None
    rankgroup: Optional[str] = None
    rankvalue: Optional[str] = None
    rankorder: Optional[int] = None

class EmploysRelationship(BaseModel):
    source: str
    target: str
    type: str = "EMPLOYS"

class CoversRelationship(BaseModel):
    source: str
    target: str
    type: str = "COVERS"

# Request/Response Models
class GraphFilters(BaseModel):
    regions: Optional[List[str]] = Field(None, description="Filter by regions")
    channels: Optional[List[str]] = Field(None, description="Filter by channels")
    node_types: Optional[List[NodeType]] = Field(None, description="Filter by node types")
    asset_classes: Optional[List[str]] = Field(None, description="Filter by asset classes")
    mandate_status: Optional[List[str]] = Field(None, description="Filter by mandate status")
    privacy_levels: Optional[List[str]] = Field(None, description="Filter by privacy levels")
    level_of_influence: Optional[List[str]] = Field(None, description="Filter by influence level")
    pca: Optional[List[str]] = Field(None, description="Filter by Primary Consultant Advisor")
    aca: Optional[List[str]] = Field(None, description="Filter by Alternate Client Advisor")

class GraphQuery(BaseModel):
    filters: Optional[GraphFilters] = None
    limit: Optional[int] = Field(1000, ge=1, le=10000, description="Maximum nodes to return")
    offset: Optional[int] = Field(0, ge=0, description="Number of nodes to skip")

class GraphResponse(BaseModel):
    nodes: List[Union[Company, Consultant, FieldConsultant, Product]]
    edges: List[Union[OwnsRelationship, RatesRelationship, EmploysRelationship, CoversRelationship]]
    metadata: Dict[str, Any]
```

### 4. Query Builder (Matches Your Cypher Patterns)

```python
# src/utils/query_builder.py
from typing import Dict, List, Tuple, Any
from ..models.schemas import GraphQuery, NodeType

class CypherQueryBuilder:
    
    def build_graph_query(self, query: GraphQuery) -> Tuple[str, Dict[str, Any]]:
        """Build Cypher query based on your existing patterns"""
        
        where_conditions = []
        parameters = {}
        
        # Base query - get all nodes and their relationships
        base_query = """
        MATCH (n)
        OPTIONAL MATCH (n)-[r]-(m)
        """
        
        if query.filters:
            # Node type filter
            if query.filters.node_types:
                node_labels = [nt.value for nt in query.filters.node_types]
                where_conditions.append("any(label IN labels(n) WHERE label IN $node_types)")
                parameters['node_types'] = node_labels
            
            # Region filter (handles both single region and array regions)
            if query.filters.regions:
                where_conditions.append("""
                    (n.region IN $regions OR 
                     any(region IN n.sales_region WHERE region IN $regions) OR
                     any(region IN n.region WHERE region IN $regions))
                """)
                parameters['regions'] = query.filters.regions
            
            # Channel filter
            if query.filters.channels:
                where_conditions.append("""
                    (n.channel IN $channels OR 
                     any(channel IN n.channel WHERE channel IN $channels))
                """)
                parameters['channels'] = query.filters.channels
            
            # Asset class filter
            if query.filters.asset_classes:
                where_conditions.append("n.asset_class IN $asset_classes")
                parameters['asset_classes'] = query.filters.asset_classes
            
            # Mandate status filter
            if query.filters.mandate_status:
                where_conditions.append("n.mandate_status IN $mandate_status")
                parameters['mandate_status'] = query.filters.mandate_status
            
            # Privacy level filter
            if query.filters.privacy_levels:
                where_conditions.append("n.privacy IN $privacy_levels")
                parameters['privacy_levels'] = query.filters.privacy_levels
            
            # Level of influence filter
            if query.filters.level_of_influence:
                where_conditions.append("n.level_of_influence IN $level_of_influence")
                parameters['level_of_influence'] = query.filters.level_of_influence
            
            # PCA (Primary Consultant Advisor) filter - string field
            if query.filters.pca:
                where_conditions.append("n.pca IN $pca")
                parameters['pca'] = query.filters.pca
            
            # ACA (Alternate Client Advisor) filter - string field
            if query.filters.aca:
                where_conditions.append("n.aca IN $aca")
                parameters['aca'] = query.filters.aca
        
        # Add WHERE clause if conditions exist
        if where_conditions:
            base_query += f" WHERE {' AND '.join(where_conditions)}"
        
        # Return statement
        base_query += """
        RETURN n, 
               collect(DISTINCT r) as relationships, 
               collect(DISTINCT m) as connected_nodes
        LIMIT $limit
        """
        parameters['limit'] = query.limit or 1000
        
        return base_query, parameters
    
    def build_node_detail_query(self, node_id: str) -> Tuple[str, Dict[str, Any]]:
        """Get detailed information about a specific node"""
        query = """
        MATCH (n) WHERE id(n) = $node_id
        OPTIONAL MATCH (n)-[r]-(m)
        RETURN n, 
               collect(r) as relationships, 
               collect(m) as connected_nodes
        """
        return query, {"node_id": int(node_id)}
    
    def build_summary_query(self) -> str:
        """Get overall graph statistics"""
        return """
        MATCH (n)
        OPTIONAL MATCH ()-[r]-()
        RETURN 
            labels(n) as node_labels,
            count(DISTINCT n) as node_count,
            type(r) as relationship_type,
            count(DISTINCT r) as relationship_count
        """
```

### 5. Graph Service (Core Business Logic)

```python
# src/services/graph_service.py
from typing import Dict, List, Any, Tuple
from ..core.database import neo4j_conn
from ..models.schemas import GraphQuery
from ..utils.query_builder import CypherQueryBuilder

class GraphService:
    def __init__(self):
        self.query_builder = CypherQueryBuilder()
    
    async def get_graph_data(self, query: GraphQuery) -> Dict[str, Any]:
        """Get filtered graph data based on your existing Neo4j structure"""
        
        with neo4j_conn.get_session() as session:
            # Build query
            cypher_query, parameters = self.query_builder.build_graph_query(query)
            
            print(f"Executing query: {cypher_query}")
            print(f"Parameters: {parameters}")
            
            # Execute query
            result = session.run(cypher_query, parameters)
            
            # Process results
            nodes, edges = self._process_results(result)
            
            # Calculate metadata
            metadata = self._calculate_metadata(nodes, edges, query)
            
            return {
                "nodes": nodes,
                "edges": edges,
                "metadata": metadata
            }
    
    def _process_results(self, result) -> Tuple[List[Dict], List[Dict]]:
        """Process Neo4j results into nodes and edges"""
        nodes = []
        edges = []
        node_ids = set()
        edge_ids = set()
        
        for record in result:
            # Process main node
            main_node = record['n']
            if main_node and main_node.id not in node_ids:
                node_data = {
                    'id': str(main_node.id),
                    'labels': list(main_node.labels),
                    'type': list(main_node.labels)[0] if main_node.labels else 'Unknown',
                    **dict(main_node)
                }
                nodes.append(node_data)
                node_ids.add(main_node.id)
            
            # Process connected nodes
            connected_nodes = record.get('connected_nodes', [])
            for connected_node in connected_nodes:
                if connected_node and connected_node.id not in node_ids:
                    node_data = {
                        'id': str(connected_node.id),
                        'labels': list(connected_node.labels),
                        'type': list(connected_node.labels)[0] if connected_node.labels else 'Unknown',
                        **dict(connected_node)
                    }
                    nodes.append(node_data)
                    node_ids.add(connected_node.id)
            
            # Process relationships
            relationships = record.get('relationships', [])
            for rel in relationships:
                if rel and rel.id not in edge_ids:
                    edge_data = {
                        'id': str(rel.id),
                        'source': str(rel.start_node.id),
                        'target': str(rel.end_node.id),
                        'type': rel.type,
                        **dict(rel)
                    }
                    edges.append(edge_data)
                    edge_ids.add(rel.id)
        
        return nodes, edges
    
    def _calculate_metadata(self, nodes: List[Dict], edges: List[Dict], query: GraphQuery) -> Dict[str, Any]:
        """Calculate metadata and statistics"""
        
        # Node type counts
        node_type_counts = {}
        for node in nodes:
            node_type = node.get('type', 'Unknown')
            node_type_counts[node_type] = node_type_counts.get(node_type, 0) + 1
        
        # Edge type counts
        edge_type_counts = {}
        for edge in edges:
            edge_type = edge.get('type', 'Unknown')
            edge_type_counts[edge_type] = edge_type_counts.get(edge_type, 0) + 1
        
        # Mandate status distribution (if applicable)
        mandate_status_counts = {}
        for edge in edges:
            if edge.get('type') == 'OWNS' and 'mandate_status' in edge:
                status = edge['mandate_status']
                mandate_status_counts[status] = mandate_status_counts.get(status, 0) + 1
        
        return {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'node_type_counts': node_type_counts,
            'edge_type_counts': edge_type_counts,
            'mandate_status_counts': mandate_status_counts,
            'applied_filters': query.filters.dict() if query.filters else {},
            'query_params': {
                'limit': query.limit,
                'offset': query.offset
            }
        }
    
    async def get_node_details(self, node_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific node"""
        
        with neo4j_conn.get_session() as session:
            query, parameters = self.query_builder.build_node_detail_query(node_id)
            result = session.run(query, parameters)
            
            record = result.single()
            if not record:
                return None
            
            node = record['n']
            relationships = record.get('relationships', [])
            connected_nodes = record.get('connected_nodes', [])
            
            return {
                'node': {
                    'id': str(node.id),
                    'labels': list(node.labels),
                    'type': list(node.labels)[0] if node.labels else 'Unknown',
                    **dict(node)
                },
                'relationships': [
                    {
                        'id': str(rel.id),
                        'type': rel.type,
                        'target': str(rel.end_node.id),
                        **dict(rel)
                    } for rel in relationships
                ],
                'connected_nodes_count': len(connected_nodes)
            }

# Global service instance
graph_service = GraphService()
```

### 6. API Routes

```python
# src/api/routes.py
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from ..models.schemas import GraphQuery, GraphFilters, NodeType
from ..services.graph_service import graph_service

router = APIRouter()

@router.post("/graph/data")
async def get_graph_data(query: GraphQuery):
    """
    Get graph data with filters based on your existing Neo4j structure
    
    Supports filtering by:
    - Node types (CONSULTANT, COMPANY, PRODUCT, FIELD_CONSULTANT)
    - Regions (from region or sales_region properties)
    - Channels
    - Asset classes
    - Mandate status
    - Privacy levels
    - Level of influence
    """
    try:
        result = await graph_service.get_graph_data(query)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graph data: {str(e)}")

@router.get("/graph/node/{node_id}")
async def get_node_details(node_id: str):
    """Get detailed information about a specific node"""
    try:
        result = await graph_service.get_node_details(node_id)
        if not result:
            raise HTTPException(status_code=404, detail="Node not found")
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving node details: {str(e)}")

@router.get("/graph/summary")
async def get_graph_summary():
    """Get overall graph statistics"""
    try:
        with graph_service.neo4j_conn.get_session() as session:
            result = session.run(graph_service.query_builder.build_summary_query())
            
            summary = {
                "node_counts": {},
                "relationship_counts": {},
                "total_nodes": 0,
                "total_relationships": 0
            }
            
            for record in result:
                if record['node_labels']:
                    for label in record['node_labels']:
                        summary["node_counts"][label] = record['node_count']
                        summary["total_nodes"] += record['node_count']
                
                if record['relationship_type']:
                    summary["relationship_counts"][record['relationship_type']] = record['relationship_count']
                    summary["total_relationships"] += record['relationship_count']
            
            return {
                "success": True,
                "data": summary
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graph summary: {str(e)}")

# Convenience endpoint for common filters
@router.get("/graph/consultants")
async def get_consultants(
    region: Optional[List[str]] = Query(None),
    channel: Optional[str] = Query(None),
    level_of_influence: Optional[List[str]] = Query(None),
    privacy: Optional[str] = Query(None),
    pca: Optional[List[str]] = Query(None, description="Primary Consultant Advisor"),
    aca: Optional[List[str]] = Query(None, description="Alternate Client Advisor")
):
    """Get consultants with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.CONSULTANT],
        regions=region,
        channels=[channel] if channel else None,
        level_of_influence=level_of_influence,
        privacy_levels=[privacy] if privacy else None,
        pca=pca,
        aca=aca
    )
    
    query = GraphQuery(filters=filters)
    return await get_graph_data(query)

@router.get("/graph/companies")
async def get_companies(
    region: Optional[List[str]] = Query(None),
    channel: Optional[List[str]] = Query(None),
    privacy: Optional[str] = Query(None),
    pca: Optional[List[str]] = Query(None, description="Primary Consultant Advisor"),
    aca: Optional[List[str]] = Query(None, description="Alternate Client Advisor")
):
    """Get companies with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.COMPANY],
        regions=region,
        channels=channel,
        privacy_levels=[privacy] if privacy else None,
        pca=pca,
        aca=aca
    )
    
    query = GraphQuery(filters=filters)
    return await get_graph_data(query)
```

### 7. Main Application

```python
# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import router
from .core.database import neo4j_conn

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for JPM Business Network Graph - Based on existing Neo4j data",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "JPM Business Network Graph API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Neo4j connection
        with neo4j_conn.get_session() as session:
            session.run("RETURN 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "service": "JPM Graph API"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    neo4j_conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 8. Requirements File

```text
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
neo4j==5.13.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
```

### 9. Environment File

```env
# .env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_actual_password

API_V1_STR=/api/v1
PROJECT_NAME=JPM Graph API
```

## 🚀 Getting Started

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Update your Neo4j credentials in .env**

3. **Run the FastAPI server:**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Test the API:**
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- Get graph data: POST http://localhost:8000/api/v1/graph/data

## 🧪 Example API Calls

```bash
# Get all data
curl -X POST "http://localhost:8000/api/v1/graph/data" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'

# Filter by node type and region
curl -X POST "http://localhost:8000/api/v1/graph/data" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "node_types": ["CONSULTANT", "COMPANY"],
      "regions": ["Asia", "North America"]
    },
    "limit": 50
  }'

# Get consultants only
curl "http://localhost:8000/api/v1/graph/consultants?region=Asia&level_of_influence=UNK"
```

This implementation is specifically tailored to work with your existing Neo4j data structure!
