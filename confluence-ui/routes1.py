 ADD THESE IMPORTS to the top of your routes.py file:
from typing import Optional, List, Dict, Any

# ADD THESE NEW ROUTES to your existing routes.py file:

@router.post("/filters/cascading")
async def get_cascading_filter_options(current_filters: GraphFilters):
    """
    Get cascading filter options based on current selections
    
    When user selects certain filters (e.g., region), this endpoint returns
    the available options for other filters based on the current selection.
    This enables dynamic filtering where options change based on selections.
    """
    try:
        options = await graph_service.get_cascading_filter_options(current_filters)
        return {
            "success": True,
            "data": options
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cascading filter options: {str(e)}")

@router.post("/graph/network-expansion")
async def get_network_expansion(
    node_ids: List[str],
    depth: int = Query(2, ge=1, le=5, description="Network expansion depth (1-5)")
):
    """
    Expand network around specific nodes to a given depth
    
    This is perfect for exploring the complete network around selected nodes.
    Depth 1 = immediate connections, Depth 2 = connections of connections, etc.
    """
    try:
        with graph_service.neo4j_conn.get_session() as session:
            query, parameters = graph_service.query_builder.build_network_expansion_query(node_ids, depth)
            result = session.run(query, parameters)
            
            nodes, edges = graph_service._process_results(result)
            
            return {
                "success": True,
                "data": {
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": {
                        "total_nodes": len(nodes),
                        "total_edges": len(edges),
                        "expansion_depth": depth,
                        "source_nodes": node_ids
                    }
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error expanding network: {str(e)}")

@router.post("/graph/find-paths") 
async def find_paths_between_nodes(
    source_ids: List[str],
    target_ids: List[str], 
    max_depth: int = Query(4, ge=1, le=6, description="Maximum path depth to search")
):
    """
    Find paths between source and target nodes
    
    Useful for discovering how different entities are connected.
    For example: How is Consultant A connected to Product B?
    """
    try:
        with graph_service.neo4j_conn.get_session() as session:
            query, parameters = graph_service.query_builder.build_path_query(source_ids, target_ids, max_depth)
            result = session.run(query, parameters)
            
            nodes, edges = graph_service._process_results(result)
            
            return {
                "success": True, 
                "data": {
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": {
                        "total_nodes": len(nodes),
                        "total_edges": len(edges),
                        "source_nodes": source_ids,
                        "target_nodes": target_ids,
                        "max_depth": max_depth
                    }
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding paths: {str(e)}")

@router.post("/graph/influence-network")
async def get_consultant_influence_network(consultant_ids: List[str]):
    """
    Get complete influence network for consultants
    
    Returns the full hierarchy: Consultant -> Field Consultant -> Companies/Products
    Including all ratings, ownership relationships, etc.
    """
    try:
        with graph_service.neo4j_conn.get_session() as session:
            query, parameters = graph_service.query_builder.build_influence_network_query(consultant_ids)
            result = session.run(query, parameters)
            
            nodes, edges = graph_service._process_results(result)
            
            # Calculate influence metrics
            consultant_metrics = {}
            for node in nodes:
                if node.get('type') == 'CONSULTANT':
                    consultant_id = node['id']
                    connected_companies = sum(1 for n in nodes if n.get('type') == 'COMPANY')
                    connected_products = sum(1 for n in nodes if n.get('type') == 'PRODUCT')
                    field_consultants = sum(1 for n in nodes if n.get('type') == 'FIELD_CONSULTANT')
                    
                    consultant_metrics[consultant_id] = {
                        "companies_influenced": connected_companies,
                        "products_influenced": connected_products, 
                        "field_consultants_managed": field_consultants,
                        "total_relationships": len([e for e in edges if e['source'] == consultant_id or e['target'] == consultant_id])
                    }
            
            return {
                "success": True,
                "data": {
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": {
                        "total_nodes": len(nodes),
                        "total_edges": len(edges),
                        "consultant_metrics": consultant_metrics,
                        "source_consultants": consultant_ids
                    }
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting influence network: {str(e)}")

@router.get("/graph/recommendations")
async def get_recommendations(
    node_id: str,
    recommendation_type: str = Query(..., description="Type: 'similar_nodes', 'potential_connections', 'expansion_opportunities'"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get AI-powered recommendations based on graph analysis
    
    - similar_nodes: Find nodes with similar properties/connections
    - potential_connections: Suggest new relationships to create
    - expansion_opportunities: Identify growth opportunities
    """
    try:
        with graph_service.neo4j_conn.get_session() as session:
            if recommendation_type == "similar_nodes":
                query = f"""
                MATCH (target) WHERE id(target) = $node_id
                MATCH (similar) WHERE labels(similar) = labels(target) AND id(similar) <> $node_id
                
                // Calculate similarity based on shared properties
                WITH target, similar,
                     size([prop in keys(target) WHERE target[prop] = similar[prop]]) as shared_props,
                     size(keys(target)) as total_props
                WHERE shared_props > 0
                
                // Calculate similarity based on shared connections
                OPTIONAL MATCH (target)-[]-(shared_connection)-[]-(similar)
                WITH target, similar, shared_props, total_props, count(DISTINCT shared_connection) as shared_connections
                
                WITH similar, 
                     (toFloat(shared_props) / total_props) as property_similarity,
                     shared_connections,
                     (shared_props + shared_connections) as total_similarity
                ORDER BY total_similarity DESC
                LIMIT $limit
                
                RETURN similar as node, total_similarity as score
                """
                
            elif recommendation_type == "potential_connections":
                query = f"""
                MATCH (target) WHERE id(target) = $node_id
                MATCH (target)-[]-(intermediate)-[]-(potential) 
                WHERE id(potential) <> id(target)
                  AND NOT (target)-[]-(potential)
                
                WITH potential, count(DISTINCT intermediate) as connection_strength
                ORDER BY connection_strength DESC
                LIMIT $limit
                
                RETURN potential as node, connection_strength as score
                """
                
            elif recommendation_type == "expansion_opportunities":
                query = f"""
                MATCH (target) WHERE id(target) = $node_id
                
                // Find underrepresented areas in target's network
                OPTIONAL MATCH (target)-[]-(connected)
                WITH target, collect(DISTINCT labels(connected)[0]) as connected_types,
                     collect(DISTINCT connected.region) as connected_regions,
                     collect(DISTINCT connected.channel) as connected_channels
                
                // Find nodes in underrepresented areas
                MATCH (opportunity)
                WHERE NOT labels(opportunity)[0] IN connected_types
                   OR NOT opportunity.region IN connected_regions
                   OR NOT opportunity.channel IN connected_channels
                
                RETURN opportunity as node, 
                       CASE WHEN NOT labels(opportunity)[0] IN connected_types THEN 3
                            WHEN NOT opportunity.region IN connected_regions THEN 2  
                            ELSE 1 END as score
                ORDER BY score DESC
                LIMIT $limit
                """
            
            else:
                raise HTTPException(status_code=400, detail="Invalid recommendation_type")
            
            result = session.run(query, {"node_id": int(node_id), "limit": limit})
            
            recommendations = []
            for record in result:
                node_data = dict(record["node"])
                node_data.update({
                    'id': str(record["node"].id),
                    'labels': list(record["node"].labels),
                    'type': list(record["node"].labels)[0] if record["node"].labels else 'Unknown',
                    'recommendation_score': float(record["score"])
                })
                recommendations.append(node_data)
            
            return {
                "success": True,
                "data": {
                    "recommendations": recommendations,
                    "metadata": {
                        "total_recommendations": len(recommendations),
                        "recommendation_type": recommendation_type,
                        "source_node_id": node_id
                    }
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# ALSO UPDATE your existing GET /graph/data endpoint with ALL parameters:
@router.get("/graph/data")
async def get_graph_data_get(
    # Geographic Filters
    regions: Optional[List[str]] = Query(None, description="Static regions: NAI, EMEA, APAC"),
    sales_regions: Optional[List[str]] = Query(None, description="Sales regions (market segments)"),
    channels: Optional[List[str]] = Query(None, description="Filter by channels"),
    
    # Node Type Filters
    node_types: Optional[List[str]] = Query(None, description="Filter by node types: CONSULTANT, COMPANY, PRODUCT, FIELD_CONSULTANT"),
    
    # Specific Entity Filters (by name/id)
    field_consultant: Optional[List[str]] = Query(None, description="Filter by specific field consultants"),
    product: Optional[List[str]] = Query(None, description="Filter by specific products"),
    company: Optional[List[str]] = Query(None, description="Filter by specific companies"),
    consultant: Optional[List[str]] = Query(None, description="Filter by specific consultants"),
    
    # Product & Asset Filters
    asset_classes: Optional[List[str]] = Query(None, description="Filter by asset classes"),
    mandate_status: Optional[List[str]] = Query(None, description="Filter by mandate status"),
    
    # Status & Privacy Filters
    privacy_levels: Optional[List[str]] = Query(None, description="Filter by privacy levels"),
    level_of_influence: Optional[List[str]] = Query(None, description="Filter by influence level"),
    
    # Advisor Filters
    pca: Optional[List[str]] = Query(None, description="Filter by Primary Consultant Advisor"),
    aca: Optional[List[str]] = Query(None, description="Filter by Alternate Client Advisor"),
    
    # Relationship-based Rating Filters
    rating_min: Optional[float] = Query(None, description="Minimum rating value"),
    rating_max: Optional[float] = Query(None, description="Maximum rating value"), 
    rating_change: Optional[List[str]] = Query(None, description="Filter by rating change (Upgrade/Downgrade/Stable)"),
    rank_group: Optional[List[str]] = Query(None, description="Filter by rank group (Positive/Negative)"),
    rank_value: Optional[List[str]] = Query(None, description="Filter by rank value"),
    rank_order_min: Optional[int] = Query(None, description="Minimum rank order"),
    rank_order_max: Optional[int] = Query(None, description="Maximum rank order"),
    
    # Pagination
    limit: Optional[int] = Query(1000, ge=1, le=10000, description="Maximum nodes to return"),
    offset: Optional[int] = Query(0, ge=0, description="Number of nodes to skip")
):
    """GET endpoint for comprehensive graph data retrieval with all available filters"""
    
    # Convert string node_types to enum
    parsed_node_types = None
    if node_types:
        try:
            parsed_node_types = [NodeType(nt.upper()) for nt in node_types]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid node_type: {str(e)}")
    
    # Build rating range filter
    rating_range = None
    if rating_min is not None or rating_max is not None:
        rating_range = {}
        if rating_min is not None:
            rating_range['min'] = rating_min
        if rating_max is not None:
            rating_range['max'] = rating_max
    
    # Build rank order range filter  
    rank_order_range = None
    if rank_order_min is not None or rank_order_max is not None:
        rank_order_range = {}
        if rank_order_min is not None:
            rank_order_range['min'] = rank_order_min
        if rank_order_max is not None:
            rank_order_range['max'] = rank_order_max
    
    # Create comprehensive filters object
    filters = GraphFilters(
        # Geographic
        regions=regions,
        sales_regions=sales_regions,
        channels=channels,
        
        # Node types
        node_types=parsed_node_types,
        
        # Specific entities
        field_consultant=field_consultant,
        product=product,
        company=company,
        consultant=consultant,
        
        # Product & Asset
        asset_classes=asset_classes,
        mandate_status=mandate_status,
        
        # Status & Privacy
        privacy_levels=privacy_levels,
        level_of_influence=level_of_influence,
        
        # Advisors
        pca=pca,
        aca=aca,
        
        # Relationship-based ratings
        rating_range=rating_range,
        rating_change=rating_change,
        rank_group=rank_group,
        rank_value=rank_value,
        rank_order_range=rank_order_range
    )
    
    query = GraphQuery(filters=filters, limit=limit, offset=offset)
    return await get_graph_data(query)