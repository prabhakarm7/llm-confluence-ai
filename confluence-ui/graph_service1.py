# ADD this method to your existing GraphService class in graph_service.py:

async def get_cascading_filter_options(self, current_filters: GraphFilters) -> FilterOptions:
    """Get filter options based on current selections for cascading filters"""
    
    with neo4j_conn.get_session() as session:
        # Build base query with current filters to get the filtered dataset
        base_conditions = []
        parameters = {}
        
        # Apply current filters to narrow down the dataset
        if current_filters.regions:
            base_conditions.append("(n.region IN $regions OR any(region IN n.region WHERE region IN $regions))")
            parameters['regions'] = current_filters.regions
        
        if current_filters.sales_regions:
            base_conditions.append("(n.sales_region IN $sales_regions OR any(sr IN n.sales_region WHERE sr IN $sales_regions))")
            parameters['sales_regions'] = current_filters.sales_regions
        
        if current_filters.channels:
            base_conditions.append("(n.channel IN $channels OR any(ch IN n.channel WHERE ch IN $channels))")
            parameters['channels'] = current_filters.channels
        
        if current_filters.node_types:
            node_labels = [nt.value for nt in current_filters.node_types]
            label_conditions = " OR ".join([f"n:{label}" for label in node_labels])
            base_conditions.append(f"({label_conditions})")
        
        # Add more current filter conditions as needed
        base_where = f"WHERE {' AND '.join(base_conditions)}" if base_conditions else ""
        
        # Now get available options from this filtered dataset
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
            # Get available sales regions from filtered nodes and their network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(connected)
                WITH collect(DISTINCT n) + collect(DISTINCT connected) as all_nodes
                UNWIND all_nodes as node
                WHERE node.sales_region IS NOT NULL
                WITH node.sales_region as sr_data
                UNWIND (CASE WHEN sr_data IS NULL THEN []
                             WHEN size(sr_data) > 0 THEN sr_data
                             ELSE [sr_data] END) as sales_region
                RETURN DISTINCT sales_region
                ORDER BY sales_region
            """, parameters)
            filter_options["sales_regions"] = [record["sales_region"] for record in result if record["sales_region"]]
            
            # Get available channels from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(connected)
                WITH collect(DISTINCT n) + collect(DISTINCT connected) as all_nodes
                UNWIND all_nodes as node
                WHERE node.channel IS NOT NULL
                WITH node.channel as ch_data
                UNWIND (CASE WHEN ch_data IS NULL THEN []
                             WHEN size(ch_data) > 0 THEN ch_data
                             ELSE [ch_data] END) as channel
                RETURN DISTINCT channel
                ORDER BY channel
            """, parameters)
            filter_options["channels"] = [record["channel"] for record in result if record["channel"]]
            
            # Get available consultants from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(c:CONSULTANT)
                WITH collect(DISTINCT c) as consultants
                UNWIND consultants as consultant
                WHERE consultant.name IS NOT NULL
                RETURN DISTINCT id(consultant) as id, consultant.name as name
                ORDER BY name
            """, parameters)
            filter_options["consultants"] = [
                {"id": str(record["id"]), "name": record["name"]} 
                for record in result if record["name"]
            ]
            
            # Get available companies from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(co:COMPANY)
                WITH collect(DISTINCT co) as companies
                UNWIND companies as company
                WHERE company.name IS NOT NULL
                RETURN DISTINCT id(company) as id, company.name as name
                ORDER BY name
            """, parameters)
            filter_options["companies"] = [
                {"id": str(record["id"]), "name": record["name"]} 
                for record in result if record["name"]
            ]
            
            # Get available products from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(p:PRODUCT)
                WITH collect(DISTINCT p) as products
                UNWIND products as product
                WHERE product.name IS NOT NULL
                RETURN DISTINCT id(product) as id, product.name as name
                ORDER BY name
            """, parameters)
            filter_options["products"] = [
                {"id": str(record["id"]), "name": record["name"]} 
                for record in result if record["name"]
            ]
            
            # Get available PCAs from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(connected)
                WITH collect(DISTINCT n) + collect(DISTINCT connected) as all_nodes
                UNWIND all_nodes as node
                WHERE node.pca IS NOT NULL
                WITH node.pca as pca_data
                UNWIND (CASE WHEN pca_data IS NULL THEN []
                             WHEN size(pca_data) > 0 THEN pca_data
                             ELSE [pca_data] END) as pca
                RETURN DISTINCT pca
                ORDER BY pca
            """, parameters)
            filter_options["pca_options"] = [str(record["pca"]) for record in result if record["pca"]]
            
            # Get available ACAs from filtered network
            result = session.run(f"""
                MATCH (n)
                {base_where}
                OPTIONAL MATCH (n)-[]-(connected)
                WITH collect(DISTINCT n) + collect(DISTINCT connected) as all_nodes
                UNWIND all_nodes as node
                WHERE node.aca IS NOT NULL
                WITH node.aca as aca_data
                UNWIND (CASE WHEN aca_data IS NULL THEN []
                             WHEN size(aca_data) > 0 THEN aca_data
                             ELSE [aca_data] END) as aca
                RETURN DISTINCT aca
                ORDER BY aca
            """, parameters)
            filter_options["aca_options"] = [str(record["aca"]) for record in result if record["aca"]]
            
            print(f"Cascading filters - Found {len(filter_options['consultants'])} consultants, {len(filter_options['companies'])} companies")
            
            return FilterOptions(
                regions=["NAI", "EMEA", "APAC"],
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
            print(f"Error in cascading filters: {str(e)}")
            return FilterOptions()