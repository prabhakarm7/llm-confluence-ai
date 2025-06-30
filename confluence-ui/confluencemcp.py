#!/usr/bin/env python3
"""
Confluence MCP Server with OAuth 1.0a Authentication
"""

import asyncio
import os
import json
import hashlib
import hmac
import base64
import secrets
import time
import urllib.parse
from typing import Any, Dict, List, Optional, Sequence
from dataclasses import dataclass

import httpx
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
import mcp.types as types


@dataclass
class OAuth1Config:
    base_url: str
    consumer_key: str
    consumer_secret: str
    access_token: str
    access_token_secret: str


@dataclass
class ConfluencePage:
    id: str
    title: str
    type: str
    status: str
    space_key: str
    version: int
    content: Optional[str] = None


@dataclass
class ConfluenceSpace:
    key: str
    name: str
    type: str
    status: str


class OAuth1Helper:
    """OAuth 1.0a signature generator for Confluence API"""
    
    def __init__(self, config: OAuth1Config):
        self.consumer_key = config.consumer_key
        self.consumer_secret = config.consumer_secret
        self.access_token = config.access_token
        self.access_token_secret = config.access_token_secret
    
    def _generate_nonce(self) -> str:
        """Generate a random nonce"""
        return secrets.token_hex(16)
    
    def _generate_timestamp(self) -> str:
        """Generate current timestamp"""
        return str(int(time.time()))
    
    def _percent_encode(self, value: str) -> str:
        """Percent encode a string according to OAuth spec"""
        return urllib.parse.quote(str(value), safe='')
    
    def _generate_signature(self, method: str, url: str, parameters: Dict[str, str]) -> str:
        """Generate OAuth signature using HMAC-SHA1"""
        # Sort parameters
        sorted_params = sorted(parameters.items())
        param_string = '&'.join([f"{self._percent_encode(k)}={self._percent_encode(v)}" 
                                for k, v in sorted_params])
        
        # Create signature base string
        signature_base = '&'.join([
            method.upper(),
            self._percent_encode(url),
            self._percent_encode(param_string)
        ])
        
        # Create signing key
        signing_key = '&'.join([
            self._percent_encode(self.consumer_secret),
            self._percent_encode(self.access_token_secret)
        ])
        
        # Generate signature
        signature = hmac.new(
            signing_key.encode('utf-8'),
            signature_base.encode('utf-8'),
            hashlib.sha1
        ).digest()
        
        return base64.b64encode(signature).decode('utf-8')
    
    def generate_auth_header(self, method: str, url: str, additional_params: Dict[str, str] = None) -> str:
        """Generate OAuth authorization header"""
        if additional_params is None:
            additional_params = {}
            
        nonce = self._generate_nonce()
        timestamp = self._generate_timestamp()
        
        oauth_params = {
            'oauth_consumer_key': self.consumer_key,
            'oauth_nonce': nonce,
            'oauth_signature_method': 'HMAC-SHA1',
            'oauth_timestamp': timestamp,
            'oauth_token': self.access_token,
            'oauth_version': '1.0',
            **additional_params
        }
        
        signature = self._generate_signature(method, url, oauth_params)
        oauth_params['oauth_signature'] = signature
        
        # Build authorization header
        auth_params = []
        for key in sorted(oauth_params.keys()):
            auth_params.append(f'{self._percent_encode(key)}="{self._percent_encode(oauth_params[key])}"')
        
        return f"OAuth {', '.join(auth_params)}"


class ConfluenceMCPServer:
    """MCP Server for Confluence with OAuth 1.0a authentication"""
    
    def __init__(self, config: OAuth1Config):
        self.config = config
        self.oauth = OAuth1Helper(config)
        self.server = Server("confluence-oauth-mcp-server")
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # Register handlers
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Set up MCP request handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            """List available tools"""
            return [
                Tool(
                    name="get_spaces",
                    description="Get all Confluence spaces",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "limit": {
                                "type": "number",
                                "description": "Maximum number of spaces to return (default: 25)"
                            },
                            "type": {
                                "type": "string",
                                "description": "Filter by space type (global, personal)"
                            }
                        }
                    }
                ),
                Tool(
                    name="get_pages",
                    description="Get pages from a Confluence space",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "spaceKey": {
                                "type": "string",
                                "description": "The space key to get pages from"
                            },
                            "limit": {
                                "type": "number",
                                "description": "Maximum number of pages to return (default: 25)"
                            },
                            "title": {
                                "type": "string",
                                "description": "Filter pages by title (partial match)"
                            }
                        },
                        "required": ["spaceKey"]
                    }
                ),
                Tool(
                    name="get_page_content",
                    description="Get the content of a specific Confluence page",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "pageId": {
                                "type": "string",
                                "description": "The ID of the page to retrieve"
                            },
                            "expand": {
                                "type": "string",
                                "description": "Comma-separated list of properties to expand"
                            }
                        },
                        "required": ["pageId"]
                    }
                ),
                Tool(
                    name="create_page",
                    description="Create a new Confluence page",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "spaceKey": {
                                "type": "string",
                                "description": "The space key where the page will be created"
                            },
                            "title": {
                                "type": "string",
                                "description": "The title of the new page"
                            },
                            "content": {
                                "type": "string",
                                "description": "The content of the page in Confluence storage format"
                            },
                            "parentId": {
                                "type": "string",
                                "description": "Optional parent page ID"
                            }
                        },
                        "required": ["spaceKey", "title", "content"]
                    }
                ),
                Tool(
                    name="update_page",
                    description="Update an existing Confluence page",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "pageId": {
                                "type": "string",
                                "description": "The ID of the page to update"
                            },
                            "title": {
                                "type": "string",
                                "description": "The new title of the page"
                            },
                            "content": {
                                "type": "string",
                                "description": "The new content in Confluence storage format"
                            },
                            "version": {
                                "type": "number",
                                "description": "The current version number of the page"
                            }
                        },
                        "required": ["pageId", "title", "content", "version"]
                    }
                ),
                Tool(
                    name="search_content",
                    description="Search for content in Confluence",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (CQL - Confluence Query Language)"
                            },
                            "limit": {
                                "type": "number",
                                "description": "Maximum number of results to return (default: 25)"
                            },
                            "expand": {
                                "type": "string",
                                "description": "Comma-separated list of properties to expand"
                            }
                        },
                        "required": ["query"]
                    }
                ),
                Tool(
                    name="delete_page",
                    description="Delete a Confluence page",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "pageId": {
                                "type": "string",
                                "description": "The ID of the page to delete"
                            }
                        },
                        "required": ["pageId"]
                    }
                ),
                Tool(
                    name="get_user_info",
                    description="Get current user information",
                    inputSchema={
                        "type": "object",
                        "properties": {}
                    }
                ),
                Tool(
                    name="get_content_properties",
                    description="Get properties of a content item",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "contentId": {
                                "type": "string",
                                "description": "The ID of the content item"
                            }
                        },
                        "required": ["contentId"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> Sequence[types.TextContent | types.ImageContent | types.EmbeddedResource]:
            """Handle tool calls"""
            try:
                if name == "get_spaces":
                    return await self.get_spaces(
                        arguments.get("limit", 25),
                        arguments.get("type")
                    )
                elif name == "get_pages":
                    return await self.get_pages(
                        arguments["spaceKey"],
                        arguments.get("limit", 25),
                        arguments.get("title")
                    )
                elif name == "get_page_content":
                    return await self.get_page_content(
                        arguments["pageId"],
                        arguments.get("expand", "body.storage,version,space")
                    )
                elif name == "create_page":
                    return await self.create_page(
                        arguments["spaceKey"],
                        arguments["title"],
                        arguments["content"],
                        arguments.get("parentId")
                    )
                elif name == "update_page":
                    return await self.update_page(
                        arguments["pageId"],
                        arguments["title"],
                        arguments["content"],
                        arguments["version"]
                    )
                elif name == "search_content":
                    return await self.search_content(
                        arguments["query"],
                        arguments.get("limit", 25),
                        arguments.get("expand")
                    )
                elif name == "delete_page":
                    return await self.delete_page(arguments["pageId"])
                elif name == "get_user_info":
                    return await self.get_user_info()
                elif name == "get_content_properties":
                    return await self.get_content_properties(arguments["contentId"])
                else:
                    raise ValueError(f"Unknown tool: {name}")
            except Exception as e:
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.list_resources()
        async def handle_list_resources() -> List[Resource]:
            """List available resources"""
            try:
                spaces_result = await self.get_spaces(50)
                spaces_text = spaces_result[0].text
                
                resources = []
                for line in spaces_text.split('\n'):
                    if 'Key:' in line:
                        import re
                        match = re.search(r'Key: (\w+)', line)
                        if match:
                            space_key = match.group(1)
                            resources.append(Resource(
                                uri=f"confluence://space/{space_key}",
                                name=f"Confluence Space: {space_key}",
                                description=f"Pages and content from Confluence space {space_key}",
                                mimeType="text/plain"
                            ))
                
                return resources
            except Exception as e:
                return []
        
        @self.server.read_resource()
        async def handle_read_resource(uri: str) -> str:
            """Read resource content"""
            if not uri.startswith("confluence://"):
                raise ValueError("Only confluence:// URIs are supported")
            
            parts = uri.split('/')
            if len(parts) < 4:
                raise ValueError("Invalid confluence URI format")
            
            resource_type = parts[2]
            identifier = parts[3]
            
            if resource_type == 'space':
                pages_result = await self.get_pages(identifier, 50)
                return pages_result[0].text
            elif resource_type == 'page':
                page_content = await self.get_page_content(identifier, "body.storage,version,space")
                return page_content[0].text
            else:
                raise ValueError(f"Unsupported resource type: {resource_type}")
    
    async def _make_request(self, endpoint: str, method: str = "GET", data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make authenticated request to Confluence API"""
        url = f"{self.config.base_url}/rest/api{endpoint}"
        
        # Generate OAuth authorization header
        auth_header = self.oauth.generate_auth_header(method, url)
        
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Atlassian-Token': 'no-check'
        }
        
        try:
            if method == "GET":
                response = await self.http_client.get(url, headers=headers)
            elif method == "POST":
                response = await self.http_client.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = await self.http_client.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = await self.http_client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except httpx.HTTPStatusError as e:
            raise Exception(f"Confluence API error: {e.response.status_code} {e.response.text}")
        except Exception as e:
            raise Exception(f"Request failed: {str(e)}")
    
    async def get_spaces(self, limit: int = 25, space_type: Optional[str] = None) -> List[TextContent]:
        """Get all Confluence spaces"""
        endpoint = f"/space?limit={limit}&expand=permissions,icon,description"
        if space_type:
            endpoint += f"&type={space_type}"
        
        data = await self._make_request(endpoint)
        spaces = data.get('results', [])
        
        space_list = []
        for space in spaces:
            space_list.append(
                f"Name: {space.get('name', 'N/A')}\n"
                f"Key: {space.get('key', 'N/A')}\n"
                f"Type: {space.get('type', 'N/A')}\n"
                f"Status: {space.get('status', 'N/A')}\n"
            )
        
        result_text = f"Found {len(spaces)} spaces:\n\n" + "\n".join(space_list)
        return [TextContent(type="text", text=result_text)]
    
    async def get_pages(self, space_key: str, limit: int = 25, title_filter: Optional[str] = None) -> List[TextContent]:
        """Get pages from a Confluence space"""
        endpoint = f"/space/{space_key}/content/page?limit={limit}&expand=version,space,ancestors"
        if title_filter:
            endpoint += f"&title={urllib.parse.quote(title_filter)}"
        
        data = await self._make_request(endpoint)
        pages = data.get('results', [])
        
        page_list = []
        for page in pages:
            page_list.append(
                f"Title: {page.get('title', 'N/A')}\n"
                f"ID: {page.get('id', 'N/A')}\n"
                f"Type: {page.get('type', 'N/A')}\n"
                f"Status: {page.get('status', 'N/A')}\n"
                f"Version: {page.get('version', {}).get('number', 'N/A')}\n"
            )
        
        result_text = f"Found {len(pages)} pages in space {space_key}:\n\n" + "\n".join(page_list)
        return [TextContent(type="text", text=result_text)]
    
    async def get_page_content(self, page_id: str, expand: str = "body.storage,version,space") -> List[TextContent]:
        """Get the content of a specific Confluence page"""
        endpoint = f"/content/{page_id}?expand={expand}"
        page = await self._make_request(endpoint)
        
        content = page.get('body', {}).get('storage', {}).get('value', 'No content available')
        
        metadata = (
            f"Title: {page.get('title', 'N/A')}\n"
            f"ID: {page.get('id', 'N/A')}\n"
            f"Space: {page.get('space', {}).get('key', 'N/A')}\n"
            f"Version: {page.get('version', {}).get('number', 'N/A')}\n"
            f"Status: {page.get('status', 'N/A')}\n\n"
            f"Content:\n{content}"
        )
        
        return [TextContent(type="text", text=metadata)]
    
    async def create_page(self, space_key: str, title: str, content: str, parent_id: Optional[str] = None) -> List[TextContent]:
        """Create a new Confluence page"""
        page_data = {
            "type": "page",
            "title": title,
            "space": {"key": space_key},
            "body": {
                "storage": {
                    "value": content,
                    "representation": "storage"
                }
            }
        }
        
        if parent_id:
            page_data["ancestors"] = [{"id": parent_id}]
        
        new_page = await self._make_request('/content', method="POST", data=page_data)
        
        result_text = (
            f"Page created successfully!\n"
            f"Title: {new_page.get('title', 'N/A')}\n"
            f"ID: {new_page.get('id', 'N/A')}\n"
            f"Space: {new_page.get('space', {}).get('key', 'N/A')}"
        )
        
        return [TextContent(type="text", text=result_text)]
    
    async def update_page(self, page_id: str, title: str, content: str, version: int) -> List[TextContent]:
        """Update an existing Confluence page"""
        page_data = {
            "version": {"number": version + 1},
            "title": title,
            "type": "page",
            "body": {
                "storage": {
                    "value": content,
                    "representation": "storage"
                }
            }
        }
        
        updated_page = await self._make_request(f'/content/{page_id}', method="PUT", data=page_data)
        
        result_text = (
            f"Page updated successfully!\n"
            f"Title: {updated_page.get('title', 'N/A')}\n"
            f"ID: {updated_page.get('id', 'N/A')}\n"
            f"New Version: {updated_page.get('version', {}).get('number', 'N/A')}"
        )
        
        return [TextContent(type="text", text=result_text)]
    
    async def search_content(self, query: str, limit: int = 25, expand: Optional[str] = None) -> List[TextContent]:
        """Search for content in Confluence"""
        endpoint = f"/content/search?cql={urllib.parse.quote(query)}&limit={limit}"
        if expand:
            endpoint += f"&expand={expand}"
        
        data = await self._make_request(endpoint)
        results = data.get('results', [])
        
        result_list = []
        for result in results:
            result_list.append(
                f"Title: {result.get('title', 'N/A')}\n"
                f"ID: {result.get('id', 'N/A')}\n"
                f"Type: {result.get('type', 'N/A')}\n"
                f"Space: {result.get('space', {}).get('key', 'N/A')}\n"
            )
        
        result_text = f"Found {len(results)} results for query \"{query}\":\n\n" + "\n".join(result_list)
        return [TextContent(type="text", text=result_text)]
    
    async def delete_page(self, page_id: str) -> List[TextContent]:
        """Delete a Confluence page"""
        await self._make_request(f'/content/{page_id}', method="DELETE")
        return [TextContent(type="text", text=f"Page {page_id} deleted successfully.")]
    
    async def get_user_info(self) -> List[TextContent]:
        """Get current user information"""
        data = await self._make_request('/user/current')
        
        result_text = (
            f"Current User:\n"
            f"Username: {data.get('username', 'N/A')}\n"
            f"Display Name: {data.get('displayName', 'N/A')}\n"
            f"Email: {data.get('email', 'N/A')}\n"
            f"User Key: {data.get('userKey', 'N/A')}"
        )
        
        return [TextContent(type="text", text=result_text)]
    
    async def get_content_properties(self, content_id: str) -> List[TextContent]:
        """Get properties of a content item"""
        endpoint = f"/content/{content_id}/property"
        data = await self._make_request(endpoint)
        
        properties = data.get('results', [])
        property_list = []
        for prop in properties:
            property_list.append(
                f"Key: {prop.get('key', 'N/A')}\n"
                f"Version: {prop.get('version', {}).get('number', 'N/A')}\n"
            )
        
        result_text = f"Content Properties for {content_id}:\n\n" + "\n".join(property_list)
        return [TextContent(type="text", text=result_text)]
    
    async def run(self):
        """Run the MCP server"""
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="confluence-oauth-mcp-server",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )


async def main():
    """Main entry point"""
    # OAuth 1.0a Configuration from environment variables
    config = OAuth1Config(
        base_url=os.getenv("CONFLUENCE_BASE_URL", "https://your-domain.atlassian.net/wiki"),
        consumer_key=os.getenv("CONFLUENCE_CONSUMER_KEY", "your-consumer-key"),
        consumer_secret=os.getenv("CONFLUENCE_CONSUMER_SECRET", "your-consumer-secret"),
        access_token=os.getenv("CONFLUENCE_ACCESS_TOKEN", "your-access-token"),
        access_token_secret=os.getenv("CONFLUENCE_ACCESS_TOKEN_SECRET", "your-access-token-secret")
    )
    
    server = ConfluenceMCPServer(config)
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())