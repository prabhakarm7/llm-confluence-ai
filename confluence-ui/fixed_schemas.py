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

# Filter Options Response Model for UI - FIXED with proper defaults
class FilterOptions(BaseModel):
    regions: List[str] = Field(default_factory=lambda: ["NAI", "EMEA", "APAC"], description="Static regions")
    sales_regions: List[str] = Field(default_factory=list, description="Available sales regions from data")
    channels: List[str] = Field(default_factory=list, description="Available channels from data")
    asset_classes: List[str] = Field(default_factory=list, description="Available asset classes from data")
    mandate_status: List[str] = Field(default_factory=list, description="Available mandate statuses from data")
    privacy_levels: List[str] = Field(default_factory=list, description="Available privacy levels from data")
    level_of_influence: List[str] = Field(default_factory=list, description="Available influence levels from data")
    pca_options: List[str] = Field(default_factory=list, description="Available PCAs from data")
    aca_options: List[str] = Field(default_factory=list, description="Available ACAs from data")
    rating_changes: List[str] = Field(default_factory=list, description="Available rating changes from data")
    rank_groups: List[str] = Field(default_factory=list, description="Available rank groups from data")
    consultants: List[Dict[str, str]] = Field(default_factory=list, description="Available consultants (id, name)")
    companies: List[Dict[str, str]] = Field(default_factory=list, description="Available companies (id, name)")
    products: List[Dict[str, str]] = Field(default_factory=list, description="Available products (id, name)")
    field_consultants: List[Dict[str, str]] = Field(default_factory=list, description="Available field consultants (id, name)")

class GraphQuery(BaseModel):
    filters: Optional[GraphFilters] = None
    limit: Optional[int] = Field(1000, ge=1, le=10000, description="Maximum nodes to return")
    offset: Optional[int] = Field(0, ge=0, description="Number of nodes to skip")

class GraphResponse(BaseModel):
    nodes: List[Union[Company, Consultant, FieldConsultant, Product]]
    edges: List[Union[OwnsRelationship, RatesRelationship, EmploysRelationship, CoversRelationship]]
    metadata: Dict[str, Any]