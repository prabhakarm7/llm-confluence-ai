# src/services/graph_service.py
from typing import Dict, List, Any, Tuple
from ..core.database import neo4j_conn
from ..core.config import settings
from ..models.schemas import GraphQuery, FilterOptions
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
        
        with neo4j_conn.get_session() as session:
    async def get_filter_options(self) -> FilterOptions:
        """Get all available filter options for UI population"""
        
        with neo4j_conn.get_session() as session:
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
            
            try:
                # Get distinct sales regions from all nodes
                result = session.run("""
                    MATCH (n) 
                    WHERE n.sales_region IS NOT NULL
                    UNWIND n.sales_region as sales_region
                    RETURN DISTINCT sales_region
                    ORDER BY sales_region
                """)
                filter_options["sales_regions"] = [record["sales_region"] for record in result]
                print(f"Found {len(filter_options['sales_regions'])} sales regions")
                
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
                print(f"Found {len(filter_options['channels'])} channels")
                
                # Get distinct asset classes from products
                result = session.run("""
                    MATCH (p:PRODUCT) 
                    WHERE p.asset_class IS NOT NULL
                    RETURN DISTINCT p.asset_class as asset_class
                    ORDER BY asset_class
                """)
                filter_options["asset_classes"] = [record["asset_class"] for record in result]
                print(f"Found {len(filter_options['asset_classes'])} asset classes")
                
                # Get distinct mandate statuses
                result = session.run("""
                    MATCH (n) 
                    WHERE n.mandate_status IS NOT NULL
                    RETURN DISTINCT n.mandate_status as mandate_status
                    ORDER BY mandate_status
                """)
                filter_options["mandate_status"] = [record["mandate_status"] for record in result]
                print(f"Found {len(filter_options['mandate_status'])} mandate statuses")
                
                # Get distinct privacy levels
                result = session.run("""
                    MATCH (n) 
                    WHERE n.privacy IS NOT NULL
                    RETURN DISTINCT n.privacy as privacy
                    ORDER BY privacy
                """)
                filter_options["privacy_levels"] = [record["privacy"] for record in result]
                print(f"Found {len(filter_options['privacy_levels'])} privacy levels")
                
                # Get distinct level of influence
                result = session.run("""
                    MATCH (c:CONSULTANT) 
                    WHERE c.level_of_influence IS NOT NULL
                    RETURN DISTINCT c.level_of_influence as level_of_influence
                    ORDER BY level_of_influence
                """)
                filter_options["level_of_influence"] = [record["level_of_influence"] for record in result]
                print(f"Found {len(filter_options['level_of_influence'])} influence levels")
                
                # Get distinct PCAs (filter out None values)
                result = session.run("""
                    MATCH (n) 
                    WHERE n.pca IS NOT NULL AND n.pca <> ""
                    RETURN DISTINCT n.pca as pca
                    ORDER BY pca
                """)
                filter_options["pca_options"] = [record["pca"] for record in result if record["pca"]]
                print(f"Found {len(filter_options['pca_options'])} PCAs")
                
                # Get distinct ACAs (filter out None values)
                result = session.run("""
                    MATCH (n) 
                    WHERE n.aca IS NOT NULL AND n.aca <> ""
                    RETURN DISTINCT n.aca as aca
                    ORDER BY aca
                """)
                filter_options["aca_options"] = [record["aca"] for record in result if record["aca"]]
                print(f"Found {len(filter_options['aca_options'])} ACAs")
                
                # Get distinct rating changes from RATES relationships
                result = session.run("""
                    MATCH ()-[r:RATES]-() 
                    WHERE r.rating_change IS NOT NULL
                    RETURN DISTINCT r.rating_change as rating_change
                    ORDER BY rating_change
                """)
                filter_options["rating_changes"] = [record["rating_change"] for record in result]
                print(f"Found {len(filter_options['rating_changes'])} rating changes")
                
                # Get distinct rank groups from RATES relationships
                result = session.run("""
                    MATCH ()-[r:RATES]-() 
                    WHERE r.rankgroup IS NOT NULL
                    RETURN DISTINCT r.rankgroup as rank_group
                    ORDER BY rank_group
                """)
                filter_options["rank_groups"] = [record["rank_group"] for record in result]
                print(f"Found {len(filter_options['rank_groups'])} rank groups")
                
                # Get all consultants with id and name (filter out None names)
                result = session.run("""
                    MATCH (c:CONSULTANT)
                    WHERE c.name IS NOT NULL
                    RETURN id(c) as id, c.name as name
                    ORDER BY c.name
                """)
                filter_options["consultants"] = [
                    {"id": str(record["id"]), "name": record["name"]} 
                    for record in result 
                    if record["name"] is not None
                ]
                print(f"Found {len(filter_options['consultants'])} consultants")
                
                # Get all companies with id and name (filter out None names)
                result = session.run("""
                    MATCH (co:COMPANY)
                    WHERE co.name IS NOT NULL
                    RETURN id(co) as id, co.name as name
                    ORDER BY co.name
                """)
                filter_options["companies"] = [
                    {"id": str(record["id"]), "name": record["name"]} 
                    for record in result 
                    if record["name"] is not None
                ]
                print(f"Found {len(filter_options['companies'])} companies")
                
                # Get all products with id and name (filter out None names)
                result = session.run("""
                    MATCH (p:PRODUCT)
                    WHERE p.name IS NOT NULL
                    RETURN id(p) as id, p.name as name
                    ORDER BY p.name
                """)
                filter_options["products"] = [
                    {"id": str(record["id"]), "name": record["name"]} 
                    for record in result 
                    if record["name"] is not None
                ]
                print(f"Found {len(filter_options['products'])} products")
                
                # Get all field consultants with id and name (filter out None names)
                result = session.run("""
                    MATCH (fc:FIELD_CONSULTANT)
                    WHERE fc.name IS NOT NULL
                    RETURN id(fc) as id, fc.name as name
                    ORDER BY fc.name
                """)
                filter_options["field_consultants"] = [
                    {"id": str(record["id"]), "name": record["name"]} 
                    for record in result 
                    if record["name"] is not None
                ]
                print(f"Found {len(filter_options['field_consultants'])} field consultants")
                
                return FilterOptions(
                    regions=["NAI", "EMEA", "APAC"],  # Static regions
                    sales_regions=filter_options.get("sales_regions", []),
                    channels=filter_options.get("channels", []),
                    asset_classes=filter_options.get("asset_classes", []),
                    mandate_status=filter_options.get("mandate_status", []),
                    privacy_levels=filter_options.get("privacy_levels", []),
                    level_of_influence=filter_options.get("level_of_influence", []),
                    pca_options=filter_options.get("pca_options", []),
                    aca_options=filter_options.get("aca_options", []),
                    rating_changes=filter_options.get("rating_changes", []),
                    rank_groups=filter_options.get("rank_groups", []),
                    consultants=filter_options.get("consultants", []),
                    companies=filter_options.get("companies", []),
                    products=filter_options.get("products", []),
                    field_consultants=filter_options.get("field_consultants", [])
                )
                
            except Exception as e:
                print(f"Error getting filter options: {str(e)}")
                # Return basic options even if queries fail
                return FilterOptions(
                    regions=["NAI", "EMEA", "APAC"],
                    sales_regions=[],
                    channels=[],
                    asset_classes=[],
                    mandate_status=[],
                    privacy_levels=[],
                    level_of_influence=[],
                    pca_options=[],
                    aca_options=[],
                    rating_changes=[],
                    rank_groups=[],
                    consultants=[],
                    companies=[],
                    products=[],
                    field_consultants=[]
                )
    
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