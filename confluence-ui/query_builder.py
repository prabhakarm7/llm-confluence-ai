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
                where_conditions.append("""
                    (n.region IN $regions OR 
                     any(region IN n.region WHERE region IN $regions))
                """)
                parameters['regions'] = query.filters.regions
            
            # Sales region filter (market segments - this is the sales_region property)
            if query.filters.sales_regions:
                where_conditions.append("""
                    (n.sales_region IN $sales_regions OR
                     any(sales_region IN n.sales_region WHERE sales_region IN $sales_regions))
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
                where_conditions.append("""
                    (n.asset_class IN $asset_classes OR
                     any(asset IN n.asset_class WHERE asset IN $asset_classes))
                """)
                parameters['asset_classes'] = query.filters.asset_classes
            
            # Mandate status filter - CHECK BOTH NODES AND RELATIONSHIPS
            if query.filters.mandate_status:
                where_conditions.append("""
                    (n.mandate_status IN $mandate_status OR
                     any(status IN n.mandate_status WHERE status IN $mandate_status) OR
                     any(rel in relationships WHERE rel.mandate_status IN $mandate_status))
                """)
                parameters['mandate_status'] = query.filters.mandate_status
            
            # Privacy level filter
            if query.filters.privacy_levels:
                where_conditions.append("""
                    (n.privacy IN $privacy_levels OR
                     any(privacy IN n.privacy WHERE privacy IN $privacy_levels))
                """)
                parameters['privacy_levels'] = query.filters.privacy_levels
            
            # Level of influence filter - TRY MULTIPLE PROPERTY NAMES
            if query.filters.level_of_influence:
                where_conditions.append("""
                    (n.level_of_influence IN $level_of_influence OR
                     n.influence_level IN $level_of_influence OR
                     n.levelOfInfluence IN $level_of_influence OR
                     n.influence IN $level_of_influence OR
                     any(influence IN n.level_of_influence WHERE influence IN $level_of_influence))
                """)
                parameters['level_of_influence'] = query.filters.level_of_influence
            
            # PCA (Primary Consultant Advisor) filter
            if query.filters.pca:
                where_conditions.append("""
                    (n.pca IN $pca OR
                     any(pca IN n.pca WHERE pca IN $pca))
                """)
                parameters['pca'] = query.filters.pca
            
            # ACA (Alternate Client Advisor) filter
            if query.filters.aca:
                where_conditions.append("""
                    (n.aca IN $aca OR
                     any(aca IN n.aca WHERE aca IN $aca))
                """)
                parameters['aca'] = query.filters.aca
            
            # Specific entity name/ID filters
            if query.filters.field_consultant:
                where_conditions.append("""
                    ((n:FIELD_CONSULTANT) AND 
                     (n.name IN $field_consultant OR toString(id(n)) IN $field_consultant))
                """)
                parameters['field_consultant'] = query.filters.field_consultant
            
            if query.filters.product:
                where_conditions.append("""
                    ((n:PRODUCT) AND 
                     (n.name IN $product OR toString(id(n)) IN $product))
                """)
                parameters['product'] = query.filters.product
            
            if query.filters.company:
                where_conditions.append("""
                    ((n:COMPANY) AND 
                     (n.name IN $company OR toString(id(n)) IN $company))
                """)
                parameters['company'] = query.filters.company
            
            if query.filters.consultant:
                where_conditions.append("""
                    ((n:CONSULTANT) AND 
                     (n.name IN $consultant OR toString(id(n)) IN $consultant))
                """)
                parameters['consultant'] = query.filters.consultant
        
        # Add relationship-based filters (requires different query pattern)
        relationship_filters = []
        
        # Rating range filter (from RATES relationship)
        if query.filters and query.filters.rating_range:
            rating_range = query.filters.rating_range
            if 'min' in rating_range:
                relationship_filters.append("toFloat(r.rankvalue) >= $rating_min")
                parameters['rating_min'] = rating_range['min']
            if 'max' in rating_range:
                relationship_filters.append("toFloat(r.rankvalue) <= $rating_max")
                parameters['rating_max'] = rating_range['max']
        
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
            if 'min' in rank_range:
                relationship_filters.append("r.rankorder >= $rank_order_min")
                parameters['rank_order_min'] = rank_range['min']
            if 'max' in rank_range:
                relationship_filters.append("r.rankorder <= $rank_order_max")
                parameters['rank_order_max'] = rank_range['max']
        
        # Modify query pattern if relationship filters exist
        if relationship_filters:
            # Need to ensure we're matching relationships when filtering by them
            base_query = """
            MATCH (n)-[r]-(m)
            """
            where_conditions.extend(relationship_filters)
        
        # Add WHERE clause if conditions exist
        if where_conditions:
            base_query += f" WHERE {' AND '.join(where_conditions)}"
        
        # Return statement with pagination
        if query.offset and query.offset > 0:
            base_query += """
            RETURN n, 
                   collect(DISTINCT r) as relationships, 
                   collect(DISTINCT m) as connected_nodes
            SKIP $offset
            LIMIT $limit
            """
            parameters['offset'] = query.offset
        else:
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