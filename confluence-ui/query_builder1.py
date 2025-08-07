# src/utils/query_builder.py
from typing import Dict, List, Tuple, Any
from ..models.schemas import GraphQuery, NodeType

class CypherQueryBuilder:
    
    def build_graph_query(self, query: GraphQuery) -> Tuple[str, Dict[str, Any]]:
        """Build comprehensive Cypher query that gets filtered nodes AND their complete network"""
        
        where_conditions = []
        parameters = {}
        
        # Build the main filter conditions for the starting nodes
        node_filters = self._build_node_filters(query.filters, parameters)
        
        # Create the comprehensive query that gets:
        # 1. Filtered nodes as starting points
        # 2. All their relationships (outgoing and incoming)  
        # 3. All connected nodes through those relationships
        # 4. Union everything and remove duplicates
        
        base_query = f"""
        // Step 1: Get filtered starting nodes
        MATCH (start_node)
        {f"WHERE {' AND '.join(node_filters)}" if node_filters else ""}
        
        // Step 2: Get complete network around filtered nodes
        CALL {{
            WITH start_node
            
            // Get all outgoing relationships and their targets
            OPTIONAL MATCH (start_node)-[r1]->(target1)
            
            // Get all incoming relationships and their sources  
            OPTIONAL MATCH (source1)-[r2]->(start_node)
            
            // Get 2nd degree connections (relationships of connected nodes)
            OPTIONAL MATCH (target1)-[r3]-(target2)
            OPTIONAL MATCH (source1)-[r4]-(source2)
            
            // Collect all nodes and relationships
            WITH start_node,
                 collect(DISTINCT target1) + collect(DISTINCT source1) + 
                 collect(DISTINCT target2) + collect(DISTINCT source2) as all_connected_nodes,
                 collect(DISTINCT r1) + collect(DISTINCT r2) + 
                 collect(DISTINCT r3) + collect(DISTINCT r4) as all_relationships
            
            // Return the starting node plus all connected nodes and relationships
            UNWIND [start_node] + all_connected_nodes as node
            UNWIND all_relationships as rel
            
            RETURN DISTINCT node, rel
        }}
        
        // Step 3: Union and deduplicate everything
        WITH collect(DISTINCT node) as all_nodes, 
             collect(DISTINCT rel) as all_relationships
        
        // Apply relationship filters if specified
        {self._build_relationship_filters(query.filters, parameters)}
        
        // Return final results with pagination
        UNWIND all_nodes as n
        UNWIND all_relationships as r
        
        WITH DISTINCT n, collect(DISTINCT r) as relationships
        
        RETURN n,
               relationships,
               [] as connected_nodes
        ORDER BY id(n)
        SKIP $offset
        LIMIT $limit
        """
        
        # Set pagination parameters
        parameters['offset'] = query.offset or 0
        parameters['limit'] = query.limit or 1000
        
        return base_query, parameters
    
    def _build_node_filters(self, filters, parameters: Dict[str, Any]) -> List[str]:
        """Build node-level filter conditions"""
        conditions = []
        
        if not filters:
            return conditions
        
        # Node type filter
        if filters.node_types:
            node_labels = [nt.value for nt in filters.node_types]
            label_conditions = " OR ".join([f"start_node:{label}" for label in node_labels])
            conditions.append(f"({label_conditions})")
        
        # Region filter (handles both string and array)
        if filters.regions:
            conditions.append("""
                (start_node.region IN $regions OR 
                 any(region IN start_node.region WHERE region IN $regions))
            """)
            parameters['regions'] = filters.regions
        
        # Sales region filter
        if filters.sales_regions:
            conditions.append("""
                (start_node.sales_region IN $sales_regions OR
                 any(sales_region IN start_node.sales_region WHERE sales_region IN $sales_regions))
            """)
            parameters['sales_regions'] = filters.sales_regions
        
        # Channel filter
        if filters.channels:
            conditions.append("""
                (start_node.channel IN $channels OR 
                 any(channel IN start_node.channel WHERE channel IN $channels))
            """)
            parameters['channels'] = filters.channels
        
        # Asset class filter
        if filters.asset_classes:
            conditions.append("""
                (start_node.asset_class IN $asset_classes OR
                 any(asset IN start_node.asset_class WHERE asset IN $asset_classes))
            """)
            parameters['asset_classes'] = filters.asset_classes
        
        # Mandate status filter (check both nodes and relationships)
        if filters.mandate_status:
            conditions.append("start_node.mandate_status IN $mandate_status")
            parameters['mandate_status'] = filters.mandate_status
        
        # Privacy level filter
        if filters.privacy_levels:
            conditions.append("""
                (start_node.privacy IN $privacy_levels OR
                 any(privacy IN start_node.privacy WHERE privacy IN $privacy_levels))
            """)
            parameters['privacy_levels'] = filters.privacy_levels
        
        # Level of influence filter (try multiple property names)
        if filters.level_of_influence:
            conditions.append("""
                (start_node.level_of_influence IN $level_of_influence OR
                 start_node.influence_level IN $level_of_influence OR
                 start_node.levelOfInfluence IN $level_of_influence OR
                 start_node.influence IN $level_of_influence)
            """)
            parameters['level_of_influence'] = filters.level_of_influence
        
        # PCA filter
        if filters.pca:
            conditions.append("""
                (start_node.pca IN $pca OR
                 any(pca IN start_node.pca WHERE pca IN $pca))
            """)
            parameters['pca'] = filters.pca
        
        # ACA filter
        if filters.aca:
            conditions.append("""
                (start_node.aca IN $aca OR
                 any(aca IN start_node.aca WHERE aca IN $aca))
            """)
            parameters['aca'] = filters.aca
        
        # Specific entity filters
        if filters.field_consultant:
            conditions.append("""
                ((start_node:FIELD_CONSULTANT) AND 
                 (start_node.name IN $field_consultant OR toString(id(start_node)) IN $field_consultant))
            """)
            parameters['field_consultant'] = filters.field_consultant
        
        if filters.product:
            conditions.append("""
                ((start_node:PRODUCT) AND 
                 (start_node.name IN $product OR toString(id(start_node)) IN $product))
            """)
            parameters['product'] = filters.product
        
        if filters.company:
            conditions.append("""
                ((start_node:COMPANY) AND 
                 (start_node.name IN $company OR toString(id(start_node)) IN $company))
            """)
            parameters['company'] = filters.company
        
        if filters.consultant:
            conditions.append("""
                ((start_node:CONSULTANT) AND 
                 (start_node.name IN $consultant OR toString(id(start_node)) IN $consultant))
            """)
            parameters['consultant'] = filters.consultant
        
        return conditions
    
    def _build_relationship_filters(self, filters, parameters: Dict[str, Any]) -> str:
        """Build relationship-level filter conditions"""
        if not filters:
            return ""
        
        rel_conditions = []
        
        # Rating range filter
        if filters.rating_range:
            if 'min' in filters.rating_range:
                rel_conditions.append("toFloat(r.rankvalue) >= $rating_min")
                parameters['rating_min'] = filters.rating_range['min']
            if 'max' in filters.rating_range:
                rel_conditions.append("toFloat(r.rankvalue) <= $rating_max")
                parameters['rating_max'] = filters.rating_range['max']
        
        # Rating change filter
        if filters.rating_change:
            rel_conditions.append("r.rating_change IN $rating_change")
            parameters['rating_change'] = filters.rating_change
        
        # Rank group filter
        if filters.rank_group:
            rel_conditions.append("r.rankgroup IN $rank_group")
            parameters['rank_group'] = filters.rank_group
        
        # Rank value filter
        if filters.rank_value:
            rel_conditions.append("r.rankvalue IN $rank_value")
            parameters['rank_value'] = filters.rank_value
        
        # Rank order range filter
        if filters.rank_order_range:
            if 'min' in filters.rank_order_range:
                rel_conditions.append("r.rankorder >= $rank_order_min")
                parameters['rank_order_min'] = filters.rank_order_range['min']
            if 'max' in filters.rank_order_range:
                rel_conditions.append("r.rankorder <= $rank_order_max")
                parameters['rank_order_max'] = filters.rank_order_range['max']
        
        if rel_conditions:
            return f"""
            WITH all_nodes, 
                 [rel in all_relationships WHERE {' AND '.join(rel_conditions)}] as filtered_relationships
            """
        
        return "WITH all_nodes, all_relationships as filtered_relationships"
    
    def build_network_expansion_query(self, node_ids: List[str], depth: int = 2) -> Tuple[str, Dict[str, Any]]:
        """Build query to get network around specific nodes with configurable depth"""
        
        query = f"""
        // Start with specified nodes
        MATCH (start_node)
        WHERE id(start_node) IN $node_ids
        
        // Expand network to specified depth
        CALL apoc.path.expandConfig(start_node, {{
            relationshipFilter: "EMPLOYS|COVERS|OWNS|RATES",
            minLevel: 0,
            maxLevel: $depth,
            bfs: true,
            uniqueness: "NODE_GLOBAL"
        }}) YIELD path
        
        // Extract nodes and relationships from paths
        WITH collect(DISTINCT path) as all_paths
        UNWIND all_paths as path
        UNWIND nodes(path) as node
        UNWIND relationships(path) as rel
        
        RETURN DISTINCT node as n, 
               collect(DISTINCT rel) as relationships,
               [] as connected_nodes
        ORDER BY id(node)
        LIMIT $limit
        """
        
        parameters = {
            'node_ids': [int(node_id) for node_id in node_ids],
            'depth': depth,
            'limit': 1000
        }
        
        return query, parameters
    
    def build_path_query(self, source_ids: List[str], target_ids: List[str], max_depth: int = 4) -> Tuple[str, Dict[str, Any]]:
        """Build query to find paths between source and target nodes"""
        
        query = f"""
        // Find paths between source and target nodes
        MATCH (source), (target)
        WHERE id(source) IN $source_ids 
          AND id(target) IN $target_ids
          AND id(source) <> id(target)
        
        // Find shortest paths up to max depth
        CALL apoc.algo.dijkstra(source, target, 
            "EMPLOYS|COVERS|OWNS|RATES", "weight", $max_depth) 
        YIELD path, weight
        
        // Extract all nodes and relationships from paths
        WITH collect(DISTINCT path) as all_paths
        UNWIND all_paths as path
        UNWIND nodes(path) as node
        UNWIND relationships(path) as rel
        
        RETURN DISTINCT node as n,
               collect(DISTINCT rel) as relationships,
               [] as connected_nodes
        ORDER BY id(node)
        LIMIT $limit
        """
        
        parameters = {
            'source_ids': [int(node_id) for node_id in source_ids],
            'target_ids': [int(node_id) for node_id in target_ids], 
            'max_depth': max_depth,
            'limit': 1000
        }
        
        return query, parameters
    
    def build_influence_network_query(self, consultant_ids: List[str]) -> Tuple[str, Dict[str, Any]]:
        """Build query to get complete influence network of consultants"""
        
        query = f"""
        // Start with specified consultants
        MATCH (consultant:CONSULTANT)
        WHERE id(consultant) IN $consultant_ids
        
        // Get their complete influence network
        OPTIONAL MATCH (consultant)-[:EMPLOYS]->(fc:FIELD_CONSULTANT)
        OPTIONAL MATCH (fc)-[:COVERS]->(company:COMPANY)
        OPTIONAL MATCH (fc)-[:COVERS]->(product:PRODUCT)
        OPTIONAL MATCH (company)-[:OWNS]->(owned_product:PRODUCT)
        OPTIONAL MATCH (consultant)-[:RATES]->(rated_product:PRODUCT)
        
        // Collect all nodes and relationships
        WITH consultant,
             collect(DISTINCT fc) + collect(DISTINCT company) + 
             collect(DISTINCT product) + collect(DISTINCT owned_product) + 
             collect(DISTINCT rated_product) as connected_nodes
        
        // Get all relationships in the network
        OPTIONAL MATCH (consultant)-[r1:EMPLOYS]->()
        OPTIONAL MATCH ()-[r2:COVERS]->() 
        OPTIONAL MATCH ()-[r3:OWNS]->()
        OPTIONAL MATCH (consultant)-[r4:RATES]->()
        
        WITH [consultant] + connected_nodes as all_nodes,
             collect(DISTINCT r1) + collect(DISTINCT r2) + 
             collect(DISTINCT r3) + collect(DISTINCT r4) as all_relationships
        
        UNWIND all_nodes as n
        RETURN DISTINCT n,
               all_relationships as relationships,
               [] as connected_nodes
        ORDER BY id(n)
        LIMIT $limit
        """
        
        parameters = {
            'consultant_ids': [int(consultant_id) for consultant_id in consultant_ids],
            'limit': 1000
        }
        
        return query, parameters
    
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