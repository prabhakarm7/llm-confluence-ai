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
    NEO4J_DATABASE: str = "neo4j"  # Default database name
    
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
    
    def get_session(self, database=None):
        """
        Get a Neo4j session
        
        Args:
            database (str, optional): Specific database name. 
                                    If None, uses default database.
                                    Common values: 'neo4j', 'system', or custom DB name
        """
        if database:
            return self._driver.session(database=database)
        else:
            # Uses default database (usually 'neo4j')
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
    # Geographic Filters (corrected based on your explanation)
    regions: Optional[List[str]] = Field(None, description="Filter by static regions: NAI, EMEA, APAC")
    sales_regions: Optional[List[str]] = Field(None, description="Filter by sales regions (market segments)")
    channels: Optional[List[str]] = Field(None, description="Filter by channels")
    
    # Node Type Filters
    node_types: Optional[List[NodeType]] = Field(None, description="Filter by node types")
    
    # Specific Entity Filters (by name/id)
    field_consultant: Optional[List[str]] = Field(None, description="Filter by specific field consultants")
    product: Optional[List[str]] = Field(None, description="Filter by specific products")
    company: Optional[List[str]] = Field(None, description="Filter by specific companies")
    consultant: Optional[List[str]] = Field(None, description="Filter by specific consultants")
    
    # Product & Asset Filters (actual properties)
    asset_classes: Optional[List[str]] = Field(None, description="Filter by asset classes")
    mandate_status: Optional[List[str]] = Field(None, description="Filter by mandate status")
    
    # Status & Privacy Filters (actual properties)
    privacy_levels: Optional[List[str]] = Field(None, description="Filter by privacy levels")
    level_of_influence: Optional[List[str]] = Field(None, description="Filter by influence level")
    
    # Advisor Filters (actual properties from your schema)
    pca: Optional[List[str]] = Field(None, description="Filter by Primary Consultant Advisor")
    aca: Optional[List[str]] = Field(None, description="Filter by Alternate Client Advisor")
    
    # Relationship-based Rating Filters (from RATES relationship)
    rating_range: Optional[Dict[str, float]] = Field(None, description="Filter by rating range (min/max)")
    rating_change: Optional[List[str]] = Field(None, description="Filter by rating change (Upgrade/Downgrade)")
    rank_group: Optional[List[str]] = Field(None, description="Filter by rank group (Positive/Negative)")
    rank_order_range: Optional[Dict[str, int]] = Field(None, description="Filter by rank order range (min/max)")
    rank_value: Optional[List[str]] = Field(None, description="Filter by rank value (e.g., 'Client-directed Approval')")

# Filter Options Response Model for UI
class FilterOptions(BaseModel):
    regions: List[str] = Field(default=["NAI", "EMEA", "APAC"], description="Static regions")
    sales_regions: List[str] = Field(description="Available sales regions from data")
    channels: List[str] = Field(description="Available channels from data")
    asset_classes: List[str] = Field(description="Available asset classes from data")
    mandate_status: List[str] = Field(description="Available mandate statuses from data")
    privacy_levels: List[str] = Field(description="Available privacy levels from data")
    level_of_influence: List[str] = Field(description="Available influence levels from data")
    pca_options: List[str] = Field(description="Available PCAs from data")
    aca_options: List[str] = Field(description="Available ACAs from data")
    rating_changes: List[str] = Field(description="Available rating changes from data")
    rank_groups: List[str] = Field(description="Available rank groups from data")
    consultants: List[Dict[str, str]] = Field(description="Available consultants (id, name)")
    companies: List[Dict[str, str]] = Field(description="Available companies (id, name)")
    products: List[Dict[str, str]] = Field(description="Available products (id, name)")
    field_consultants: List[Dict[str, str]] = Field(description="Available field consultants (id, name)")

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
            
            # Region filter (static regions: NAI, EMEA, APAC)
            if query.filters.regions:
                where_conditions.append("n.region IN $regions")
                parameters['regions'] = query.filters.regions
            
            # Sales region filter (market segments - this is the sales_region property)
            if query.filters.sales_regions:
                where_conditions.append("""
                    any(sales_region IN n.sales_region WHERE sales_region IN $sales_regions)
                """)
                parameters['sales_regions'] = query.filters.sales_regions
            
            # Channel filter (handles both single channel and array channels)
            if query.filters.channels:
                where_conditions.append("""
                    (n.channel IN $channels OR 
                     any(channel IN n.channel WHERE channel IN $channels))
                """)
                parameters['channels'] = query.filters.channels
            
            # Asset class filter (only for PRODUCT nodes)
            if query.filters.asset_classes:
                where_conditions.append("n.asset_class IN $asset_classes")
                parameters['asset_classes'] = query.filters.asset_classes
            
            # Mandate status filter (only for PRODUCT nodes)
            if query.filters.mandate_status:
                where_conditions.append("n.mandate_status IN $mandate_status")
                parameters['mandate_status'] = query.filters.mandate_status
            
            # Privacy level filter
            if query.filters.privacy_levels:
                where_conditions.append("n.privacy IN $privacy_levels")
                parameters['privacy_levels'] = query.filters.privacy_levels
            
            # Level of influence filter (only for CONSULTANT nodes)
            if query.filters.level_of_influence:
                where_conditions.append("n.level_of_influence IN $level_of_influence")
                parameters['level_of_influence'] = query.filters.level_of_influence
            
            # PCA (Primary Consultant Advisor) filter
            if query.filters.pca:
                where_conditions.append("n.pca IN $pca")
                parameters['pca'] = query.filters.pca
            
            # ACA (Alternate Client Advisor) filter
            if query.filters.aca:
                where_conditions.append("n.aca IN $aca")
                parameters['aca'] = query.filters.aca
            
            # Specific entity name/ID filters
            if query.filters.field_consultant:
                where_conditions.append("(n.name IN $field_consultant OR n.id IN $field_consultant)")
                parameters['field_consultant'] = query.filters.field_consultant
            
            if query.filters.product:
                where_conditions.append("(n.name IN $product OR n.id IN $product)")
                parameters['product'] = query.filters.product
            
            if query.filters.company:
                where_conditions.append("(n.name IN $company OR n.id IN $company)")
                parameters['company'] = query.filters.company
            
            if query.filters.consultant:
                where_conditions.append("(n.name IN $consultant OR n.id IN $consultant)")
                parameters['consultant'] = query.filters.consultant
        
        # Add relationship-based filters (requires different query pattern)
        relationship_filters = []
        
        # Rating range filter (from RATES relationship)
        if query.filters and query.filters.rating_range:
            rating_range = query.filters.rating_range
            relationship_filters.append("r.rankvalue >= $rating_min AND r.rankvalue <= $rating_max")
            parameters['rating_min'] = rating_range.get('min', 0)
            parameters['rating_max'] = rating_range.get('max', 10)
        
        # Rating change filter (from RATES relationship - Upgrade/Downgrade)
        if query.filters and query.filters.rating_change:
            relationship_filters.append("r.rating_change IN $rating_change")
            parameters['rating_change'] = query.filters.rating_change
        
        # Rank group filter (from RATES relationship - Positive/Negative)
        if query.filters and query.filters.rank_group:
            relationship_filters.append("r.rankgroup IN $rank_group")
            parameters['rank_group'] = query.filters.rank_group
        
        # Rank value filter (from RATES relationship - e.g., 'Client-directed Approval')
        if query.filters and query.filters.rank_value:
            relationship_filters.append("r.rankvalue IN $rank_value")
            parameters['rank_value'] = query.filters.rank_value
        
        # Rank order range filter (from RATES relationship)
        if query.filters and query.filters.rank_order_range:
            rank_range = query.filters.rank_order_range
            relationship_filters.append("r.rankorder >= $rank_min AND r.rankorder <= $rank_max")
            parameters['rank_min'] = rank_range.get('min', 1)
            parameters['rank_max'] = rank_range.get('max', 100)
        
        # Modify query pattern if relationship filters exist
        if relationship_filters:
            base_query = """
            MATCH (n)-[r]-(m)
            """
            where_conditions.extend(relationship_filters)
        
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
    
    async def get_filter_options(self) -> FilterOptions:
        """Get all available filter options for UI population"""
        
        with neo4j_conn.get_session(database=settings.NEO4J_DATABASE) as session:
            filter_options = {
                "regions": ["NAI", "EMEA", "APAC"],  # Static regions
                "sales_regions": [],
                "channels": [],
                "asset_classes": [],
                "mandate_status": [],
                "privacy_levels": [],
                "level_of_influence": [],
                "pca_options": [],
                "aca_options": [],
                "rating_changes": [],
                "rank_groups": [],
                "consultants": [],
                "companies": [],
                "products": [],
                "field_consultants": []
            }
            
            # Get distinct sales regions from all nodes
            result = session.run("""
                MATCH (n) 
                WHERE n.sales_region IS NOT NULL
                UNWIND n.sales_region as sales_region
                RETURN DISTINCT sales_region
                ORDER BY sales_region
            """)
            filter_options["sales_regions"] = [record["sales_region"] for record in result]
            
            # Get distinct channels
            result = session.run("""
                MATCH (n) 
                WHERE n.channel IS NOT NULL
                WITH n.channel as channel_data
                UNWIND (CASE WHEN channel_data IS NULL THEN [] 
                             WHEN size(channel_data) > 0 THEN channel_data 
                             ELSE [channel_data] END) as channel
                RETURN DISTINCT channel
                ORDER BY channel
            """)
            filter_options["channels"] = [record["channel"] for record in result]
            
            # Get distinct asset classes from products
            result = session.run("""
                MATCH (p:PRODUCT) 
                WHERE p.asset_class IS NOT NULL
                RETURN DISTINCT p.asset_class as asset_class
                ORDER BY asset_class
            """)
            filter_options["asset_classes"] = [record["asset_class"] for record in result]
            
            # Get distinct mandate statuses
            result = session.run("""
                MATCH (n) 
                WHERE n.mandate_status IS NOT NULL
                RETURN DISTINCT n.mandate_status as mandate_status
                ORDER BY mandate_status
            """)
            filter_options["mandate_status"] = [record["mandate_status"] for record in result]
            
            # Get distinct privacy levels
            result = session.run("""
                MATCH (n) 
                WHERE n.privacy IS NOT NULL
                RETURN DISTINCT n.privacy as privacy
                ORDER BY privacy
            """)
            filter_options["privacy_levels"] = [record["privacy"] for record in result]
            
            # Get distinct level of influence
            result = session.run("""
                MATCH (c:CONSULTANT) 
                WHERE c.level_of_influence IS NOT NULL
                RETURN DISTINCT c.level_of_influence as level_of_influence
                ORDER BY level_of_influence
            """)
            filter_options["level_of_influence"] = [record["level_of_influence"] for record in result]
            
            # Get distinct PCAs
            result = session.run("""
                MATCH (n) 
                WHERE n.pca IS NOT NULL
                RETURN DISTINCT n.pca as pca
                ORDER BY pca
            """)
            filter_options["pca_options"] = [record["pca"] for record in result]
            
            # Get distinct ACAs
            result = session.run("""
                MATCH (n) 
                WHERE n.aca IS NOT NULL
                RETURN DISTINCT n.aca as aca
                ORDER BY aca
            """)
            filter_options["aca_options"] = [record["aca"] for record in result]
            
            # Get distinct rating changes from RATES relationships
            result = session.run("""
                MATCH ()-[r:RATES]-() 
                WHERE r.rating_change IS NOT NULL
                RETURN DISTINCT r.rating_change as rating_change
                ORDER BY rating_change
            """)
            filter_options["rating_changes"] = [record["rating_change"] for record in result]
            
            # Get distinct rank groups from RATES relationships
            result = session.run("""
                MATCH ()-[r:RATES]-() 
                WHERE r.rankgroup IS NOT NULL
                RETURN DISTINCT r.rankgroup as rank_group
                ORDER BY rank_group
            """)
            filter_options["rank_groups"] = [record["rank_group"] for record in result]
            
            # Get all consultants with id and name
            result = session.run("""
                MATCH (c:CONSULTANT)
                RETURN id(c) as id, c.name as name
                ORDER BY c.name
            """)
            filter_options["consultants"] = [{"id": str(record["id"]), "name": record["name"]} for record in result]
            
            # Get all companies with id and name
            result = session.run("""
                MATCH (co:COMPANY)
                RETURN id(co) as id, co.name as name
                ORDER BY co.name
            """)
            filter_options["companies"] = [{"id": str(record["id"]), "name": record["name"]} for record in result]
            
            # Get all products with id and name
            result = session.run("""
                MATCH (p:PRODUCT)
                RETURN id(p) as id, p.name as name
                ORDER BY p.name
            """)
            filter_options["products"] = [{"id": str(record["id"]), "name": record["name"]} for record in result]
            
            # Get all field consultants with id and name
            result = session.run("""
                MATCH (fc:FIELD_CONSULTANT)
                RETURN id(fc) as id, fc.name as name
                ORDER BY fc.name
            """)
            filter_options["field_consultants"] = [{"id": str(record["id"]), "name": record["name"]} for record in result]
            
            return FilterOptions(**filter_options)
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
from ..models.schemas import GraphQuery, GraphFilters, NodeType, FilterOptions
from ..services.graph_service import graph_service

router = APIRouter()

@router.get("/filters/options", response_model=FilterOptions)
async def get_filter_options():
    """
    Get all available filter options for UI population
    
    Returns all unique values from the database that can be used
    to populate dropdowns and filter controls in the UI.
    """
    try:
        options = await graph_service.get_filter_options()
        return options
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving filter options: {str(e)}")

@router.get("/graph/data")
async def get_graph_data_get(
    regions: Optional[List[str]] = Query(None, description="Static regions: NAI, EMEA, APAC"),
    sales_regions: Optional[List[str]] = Query(None, description="Sales regions (market segments)"),
    channels: Optional[List[str]] = Query(None),
    node_types: Optional[List[str]] = Query(None),
    limit: Optional[int] = Query(1000, ge=1, le=10000)
):
    """GET endpoint for simple graph data retrieval"""
    # Convert string node_types to enum
    parsed_node_types = None
    if node_types:
        try:
            parsed_node_types = [NodeType(nt.upper()) for nt in node_types]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid node_type: {str(e)}")
    
    filters = GraphFilters(
        regions=regions,
        sales_regions=sales_regions,
        channels=channels,
        node_types=parsed_node_types
    )
    
    query = GraphQuery(filters=filters, limit=limit)
    return await get_graph_data(query)
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
    regions: Optional[List[str]] = Query(None, description="Static regions: NAI, EMEA, APAC"),
    sales_regions: Optional[List[str]] = Query(None, description="Sales regions (market segments)"),
    channel: Optional[str] = Query(None),
    level_of_influence: Optional[List[str]] = Query(None),
    privacy: Optional[str] = Query(None),
    pca: Optional[List[str]] = Query(None, description="Primary Consultant Advisor"),
    aca: Optional[List[str]] = Query(None, description="Alternate Client Advisor")
):
    """Get consultants with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.CONSULTANT],
        regions=regions,
        sales_regions=sales_regions,
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
    regions: Optional[List[str]] = Query(None, description="Static regions: NAI, EMEA, APAC"),
    sales_regions: Optional[List[str]] = Query(None, description="Sales regions (market segments)"),
    channel: Optional[List[str]] = Query(None),
    privacy: Optional[str] = Query(None),
    pca: Optional[List[str]] = Query(None, description="Primary Consultant Advisor"),
    aca: Optional[List[str]] = Query(None, description="Alternate Client Advisor")
):
    """Get companies with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.COMPANY],
        regions=regions,
        sales_regions=sales_regions,
        channels=channel,
        privacy_levels=[privacy] if privacy else None,
        pca=pca,
        aca=aca
    )
    
    query = GraphQuery(filters=filters)
    return await get_graph_data(query)

@router.get("/graph/products")
async def get_products(
    asset_class: Optional[List[str]] = Query(None),
    mandate_status: Optional[List[str]] = Query(None),
    product_name: Optional[List[str]] = Query(None)
):
    """Get products with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.PRODUCT],
        asset_classes=asset_class,
        mandate_status=mandate_status,
        product=product_name
    )
    
    query = GraphQuery(filters=filters)
    return await get_graph_data(query)

@router.get("/graph/field-consultants")
async def get_field_consultants(
    consultant_name: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None)
):
    """Get field consultants with optional filters"""
    filters = GraphFilters(
        node_types=[NodeType.FIELD_CONSULTANT],
        field_consultant=consultant_name,
        regions=region
    )
    
    query = GraphQuery(filters=filters)
    return await get_graph_data(query)

@router.post("/graph/ratings")
async def get_consultant_product_ratings(
    filters: Dict[str, Any]
):
    """Get consultant product ratings with relationship-based filters"""
    graph_filters = GraphFilters(
        rating_range=filters.get('rating_range'),
        rating_change=filters.get('rating_change'),
        rank_group=filters.get('rank_group'),
        rank_value=filters.get('rank_value'),
        rank_order_range=filters.get('rank_order_range')
    )
    
    query = GraphQuery(filters=graph_filters)
    return await get_graph_data(query)

@router.get("/graph/advisors")
async def get_advisors(
    advisor_type: str = Query(..., description="Type: 'pca' or 'aca'"),
    advisor_name: Optional[List[str]] = Query(None)
):
    """Get nodes by advisor type (PCA or ACA)"""
    if advisor_type == "pca":
        filters = GraphFilters(pca=advisor_name)
    elif advisor_type == "aca":
        filters = GraphFilters(aca=advisor_name)
    else:
        raise HTTPException(status_code=400, detail="advisor_type must be 'pca' or 'aca'")
    
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
neo4j==5.8.0
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
NEO4J_DATABASE=neo4j

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
