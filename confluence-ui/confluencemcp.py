#!/usr/bin/env python3
"""
Confluence MCP Server with LLM-Powered Intelligent Search
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
import re
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
    cert_key: Optional[str] = None
    signature_method: str = "HMAC-SHA1"


@dataclass
class LLMConfig:
    """Configuration for LLM integration"""
    provider: str = "openai"  # openai, anthropic, ollama, etc.
    api_key: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    api_url: Optional[str] = None  # For custom endpoints like Ollama
    max_tokens: int = 1000
    temperature: float = 0.1


class LLMProcessor:
    """Handles LLM interactions for processing Confluence content"""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self.http_client = httpx.AsyncClient(timeout=60.0)
    
    async def analyze_content(self, question: str, confluence_content: str) -> str:
        """Use LLM to analyze Confluence content and answer questions"""
        
        prompt = f"""You are a helpful assistant that answers questions based on Confluence documentation content.

QUESTION: {question}

CONFLUENCE CONTENT:
{confluence_content}

Instructions:
1. Analyze the provided Confluence content carefully
2. Answer the question based ONLY on the information provided in the content
3. If the answer isn't in the content, say "The information needed to answer this question is not available in the provided content"
4. Provide specific references to relevant sections when possible
5. Be concise but thorough in your response

ANSWER:"""

        try:
            if self.config.provider == "openai":
                return await self._call_openai(prompt)
            elif self.config.provider == "anthropic":
                return await self._call_anthropic(prompt)
            elif self.config.provider == "ollama":
                return await self._call_ollama(prompt)
            else:
                return f"Unsupported LLM provider: {self.config.provider}"
        
        except Exception as e:
            return f"Error processing with LLM: {str(e)}"
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        if not self.config.api_key:
            raise Exception("OpenAI API key not provided")
        
        payload = {
            "model": self.config.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature
        }
        
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
        
        response = await self.http_client.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers
        )
        
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic Claude API"""
        if not self.config.api_key:
            raise Exception("Anthropic API key not provided")
        
        payload = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        headers = {
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        response = await self.http_client.post(
            "https://api.anthropic.com/v1/messages",
            json=payload,
            headers=headers
        )
        
        response.raise_for_status()
        result = response.json()
        return result["content"][0]["text"]
    
    async def _call_ollama(self, prompt: str) -> str:
        """Call Ollama local API"""
        api_url = self.config.api_url or "http://localhost:11434"
        
        payload = {
            "model": self.config.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens
            }
        }
        
        response = await self.http_client.post(
            f"{api_url}/api/generate",
            json=payload
        )
        
        response.raise_for_status()
        result = response.json()
        return result["response"]
    
    async def extract_key_info(self, content: str, topic: str) -> str:
        """Extract key information about a specific topic from content"""
        prompt = f"""Extract and summarize key information about "{topic}" from the following content:

CONTENT:
{content}

Please provide:
1. Main points about {topic}
2. Important details or specifications
3. Any relevant examples or instructions
4. Key warnings or limitations

If the topic is not mentioned in the content, respond with "No information about {topic} found in the provided content."

SUMMARY:"""

        return await self.analyze_content(topic, content)


class OAuth1Helper:
    """OAuth 1.0a signature generator for Confluence API"""
    
    def __init__(self, config: OAuth1Config):
        self.consumer_key = config.consumer_key
        self.consumer_secret = config.consumer_secret
        self.access_token = config.access_token
        self.access_token_secret = config.access_token_secret
        self.cert_key = config.cert_key
        self.signature_method = config.signature_method
    
    def _generate_nonce(self) -> str:
        return secrets.token_hex(16)
    
    def _generate_timestamp(self) -> str:
        return str(int(time.time()))
    
    def _percent_encode(self, value: str) -> str:
        return urllib.parse.quote(str(value), safe='')
    
    def _generate_signature(self, method: str, url: str, parameters: Dict[str, str]) -> str:
        sorted_params = sorted(parameters.items())
        param_string = '&'.join([f"{self._percent_encode(k)}={self._percent_encode(v)}" 
                                for k, v in sorted_params])
        
        signature_base = '&'.join([
            method.upper(),
            self._percent_encode(url),
            self._percent_encode(param_string)
        ])
        
        if self.signature_method == "RSA-SHA1" and self.cert_key:
            try:
                from cryptography.hazmat.primitives import hashes, serialization
                from cryptography.hazmat.primitives.asymmetric import padding
                
                if self.cert_key.startswith('-----BEGIN'):
                    private_key = serialization.load_pem_private_key(
                        self.cert_key.encode('utf-8'), password=None
                    )
                else:
                    with open(self.cert_key, 'rb') as key_file:
                        private_key = serialization.load_pem_private_key(
                            key_file.read(), password=None
                        )
                
                signature = private_key.sign(
                    signature_base.encode('utf-8'),
                    padding.PKCS1v15(),
                    hashes.SHA1()
                )
                
                return base64.b64encode(signature).decode('utf-8')
                
            except ImportError:
                raise Exception("cryptography library required for RSA-SHA1")
            except Exception as e:
                raise Exception(f"RSA signature generation failed: {e}")
        else:
            signing_key = '&'.join([
                self._percent_encode(self.consumer_secret),
                self._percent_encode(self.access_token_secret)
            ])
            
            signature = hmac.new(
                signing_key.encode('utf-8'),
                signature_base.encode('utf-8'),
                hashlib.sha1
            ).digest()
            
            return base64.b64encode(signature).decode('utf-8')
    
    def generate_auth_header(self, method: str, url: str, additional_params: Dict[str, str] = None) -> str:
        if additional_params is None:
            additional_params = {}
            
        nonce = self._generate_nonce()
        timestamp = self._generate_timestamp()
        
        oauth_params = {
            'oauth_consumer_key': self.consumer_key,
            'oauth_nonce': nonce,
            'oauth_signature_method': self.signature_method,
            'oauth_timestamp': timestamp,
            'oauth_token': self.access_token,
            'oauth_version': '1.0',
            **additional_params
        }
        
        signature = self._generate_signature(method, url, oauth_params)
        oauth_params['oauth_signature'] = signature
        
        auth_params = []
        for key in sorted(oauth_params.keys()):
            auth_params.append(f'{self._percent_encode(key)}="{self._percent_encode(oauth_params[key])}"')
        
        return f"OAuth {', '.join(auth_params)}"


class ConfluenceLLMServer:
    """Enhanced MCP Server with LLM-powered Confluence search"""
    
    def __init__(self, oauth_config: OAuth1Config, llm_config: LLMConfig):
        self.oauth_config = oauth_config
        self.llm_config = llm_config
        self.oauth = OAuth1Helper(oauth_config)
        self.llm = LLMProcessor(llm_config)
        self.server = Server("confluence-llm-mcp-server")
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        self._setup_handlers()
    
    def _setup_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            return [
                # Original Confluence tools
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
                    description="Search for content in Confluence (basic search)",
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
                ),
                # New LLM-powered tools
                Tool(
                    name="ask_confluence",
                    description="🧠 Ask a question and get an intelligent answer from Confluence content",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "question": {
                                "type": "string",
                                "description": "The question to ask about Confluence content"
                            },
                            "search_query": {
                                "type": "string",
                                "description": "Optional: Specific search query (if not provided, will be derived from question)"
                            },
                            "space_key": {
                                "type": "string",
                                "description": "Optional: Limit search to specific space"
                            },
                            "max_pages": {
                                "type": "number",
                                "description": "Maximum number of pages to analyze (default: 5)"
                            }
                        },
                        "required": ["question"]
                    }
                ),
                Tool(
                    name="find_information",
                    description="🔍 Find specific information about a topic from Confluence",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "topic": {
                                "type": "string",
                                "description": "The topic or subject to find information about"
                            },
                            "search_scope": {
                                "type": "string",
                                "description": "Search scope (e.g., 'space=DEV', 'type=page AND label=api')"
                            },
                            "max_pages": {
                                "type": "number",
                                "description": "Maximum number of pages to search (default: 3)"
                            }
                        },
                        "required": ["topic"]
                    }
                ),
                Tool(
                    name="compare_documents",
                    description="📊 Compare information across multiple Confluence pages",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "page_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of page IDs to compare"
                            },
                            "comparison_aspect": {
                                "type": "string",
                                "description": "What aspect to compare (e.g., 'features', 'requirements', 'procedures')"
                            }
                        },
                        "required": ["page_ids", "comparison_aspect"]
                    }
                ),
                Tool(
                    name="summarize_space",
                    description="📝 Get an LLM-generated summary of a Confluence space",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "space_key": {
                                "type": "string",
                                "description": "The space key to summarize"
                            },
                            "focus_area": {
                                "type": "string",
                                "description": "Optional: Specific area to focus on in the summary"
                            },
                            "max_pages": {
                                "type": "number",
                                "description": "Maximum number of pages to include (default: 10)"
                            }
                        },
                        "required": ["space_key"]
                    }
                ),
                Tool(
                    name="search_with_content",
                    description="🔍 Enhanced search that includes page content in results",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (CQL)"
                            },
                            "limit": {
                                "type": "number",
                                "description": "Maximum number of results (default: 5)"
                            },
                            "include_content": {
                                "type": "boolean",
                                "description": "Whether to include page content (default: true)"
                            }
                        },
                        "required": ["query"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> Sequence[types.TextContent]:
            try:
                # Original Confluence tools
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
                elif name == "search_with_content":
                    return await self.search_with_content(
                        arguments["query"],
                        arguments.get("limit", 5),
                        arguments.get("include_content", True)
                    )
                # New LLM-powered tools
                elif name == "ask_confluence":
                    return await self.ask_confluence(
                        arguments["question"],
                        arguments.get("search_query"),
                        arguments.get("space_key"),
                        arguments.get("max_pages", 5)
                    )
                elif name == "find_information":
                    return await self.find_information(
                        arguments["topic"],
                        arguments.get("search_scope"),
                        arguments.get("max_pages", 3)
                    )
                elif name == "compare_documents":
                    return await self.compare_documents(
                        arguments["page_ids"],
                        arguments["comparison_aspect"]
                    )
                elif name == "summarize_space":
                    return await self.summarize_space(
                        arguments["space_key"],
                        arguments.get("focus_area"),
                        arguments.get("max_pages", 10)
                    )
                else:
                    raise ValueError(f"Unknown tool: {name}")
            except Exception as e:
                return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _make_request(self, endpoint: str, method: str = "GET", data: Dict[str, Any] = None) -> Dict[str, Any]:
        url = f"{self.oauth_config.base_url}/rest/api{endpoint}"
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
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except httpx.HTTPStatusError as e:
            raise Exception(f"Confluence API error: {e.response.status_code} {e.response.text}")
    
    def _clean_content(self, html_content: str) -> str:
        """Clean Confluence HTML content for LLM processing"""
        if not html_content:
            return "No content available"
        
        # Remove Confluence macros
        content = re.sub(r'<ac:structured-macro[^>]*>.*?</ac:structured-macro>', '', html_content, flags=re.DOTALL)
        content = re.sub(r'<ac:parameter[^>]*>.*?</ac:parameter>', '', content, flags=re.DOTALL)
        
        # Convert HTML to readable text
        content = re.sub(r'<h([1-6])[^>]*>(.*?)</h\1>', r'\n## \2\n', content)
        content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', content)
        content = re.sub(r'<br\s*/?>', '\n', content)
        content = re.sub(r'<li[^>]*>(.*?)</li>', r'• \1\n', content)
        content = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', content)
        content = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', content)
        content = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', content)
        
        # Remove remaining HTML tags
        content = re.sub(r'<[^>]+>', '', content)
        
        # Clean up whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        content = content.strip()
        
        return content if content else "No readable content found"
    
    # ========== ORIGINAL CONFLUENCE METHODS ==========
    
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
        """Search for content in Confluence (basic search)"""
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
    
    async def search_with_content(self, query: str, limit: int = 5, include_content: bool = True) -> List[TextContent]:
        """Enhanced search that includes page content in results"""
        endpoint = f"/content/search?cql={urllib.parse.quote(query)}&limit={limit}&expand=body.storage,space,version"
        
        data = await self._make_request(endpoint)
        results = data.get('results', [])
        
        if not include_content:
            # Return just metadata (original behavior)
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
        
        # Include full content in results
        detailed_results = []
        for result in results:
            title = result.get('title', 'N/A')
            page_id = result.get('id', 'N/A')
            space_key = result.get('space', {}).get('key', 'N/A')
            content = result.get('body', {}).get('storage', {}).get('value', 'No content available')
            
            # Truncate content if too long (optional)
            if len(content) > 2000:
                content = content[:2000] + "... [truncated]"
            
            page_info = (
                f"=== {title} ===\n"
                f"ID: {page_id}\n"
                f"Space: {space_key}\n"
                f"Content:\n{content}\n\n"
            )
            detailed_results.append(page_info)
        
        result_text = f"Found {len(results)} results with content for query \"{query}\":\n\n" + "".join(detailed_results)
        return [TextContent(type="text", text=result_text)]
    
    # ========== LLM-POWERED METHODS ==========
    
    async def ask_confluence(self, question: str, search_query: Optional[str] = None, 
                           space_key: Optional[str] = None, max_pages: int = 5) -> List[TextContent]:
        """Ask a question and get an intelligent answer from Confluence content"""
        
        # Generate search query if not provided
        if not search_query:
            search_query = self._generate_search_query(question, space_key)
        
        # Search for relevant pages
        endpoint = f"/content/search?cql={urllib.parse.quote(search_query)}&limit={max_pages}&expand=body.storage,space,version"
        search_results = await self._make_request(endpoint)
        
        pages = search_results.get('results', [])
        if not pages:
            return [TextContent(type="text", text=f"No relevant pages found for your question: {question}")]
        
        # Collect content from all relevant pages
        all_content = []
        page_info = []
        
        for page in pages:
            title = page.get('title', 'Untitled')
            space = page.get('space', {}).get('key', 'Unknown')
            content = page.get('body', {}).get('storage', {}).get('value', '')
            
            clean_content = self._clean_content(content)
            if clean_content and clean_content != "No readable content found":
                all_content.append(f"=== {title} (Space: {space}) ===\n{clean_content}")
                page_info.append(f"• {title} (Space: {space})")
        
        if not all_content:
            return [TextContent(type="text", text="Found pages but no readable content was available.")]
        
        # Combine content for LLM analysis
        combined_content = "\n\n".join(all_content)
        
        # Use LLM to analyze and answer
        llm_response = await self.llm.analyze_content(question, combined_content)
        
        # Format final response
        response = f"""**Question:** {question}

**Answer based on Confluence content:**
{llm_response}

**Sources analyzed:**
{chr(10).join(page_info)}

---
*Answer generated from {len(pages)} Confluence page(s) using {self.llm_config.provider} {self.llm_config.model}*"""
        
        return [TextContent(type="text", text=response)]
    
    async def find_information(self, topic: str, search_scope: Optional[str] = None, 
                             max_pages: int = 3) -> List[TextContent]:
        """Find specific information about a topic"""
        
        search_query = f"text ~ \"{topic}\""
        if search_scope:
            search_query = f"{search_scope} AND {search_query}"
        
        endpoint = f"/content/search?cql={urllib.parse.quote(search_query)}&limit={max_pages}&expand=body.storage,space"
        results = await self._make_request(endpoint)
        
        pages = results.get('results', [])
        if not pages:
            return [TextContent(type="text", text=f"No information found about: {topic}")]
        
        all_content = []
        for page in pages:
            title = page.get('title', 'Untitled')
            content = page.get('body', {}).get('storage', {}).get('value', '')
            clean_content = self._clean_content(content)
            all_content.append(f"=== {title} ===\n{clean_content}")
        
        combined_content = "\n\n".join(all_content)
        
        # Use LLM to extract relevant information
        extracted_info = await self.llm.extract_key_info(combined_content, topic)
        
        response = f"""**Information about: {topic}**

{extracted_info}

**Sources:** {len(pages)} page(s) analyzed"""
        
        return [TextContent(type="text", text=response)]
    
    async def compare_documents(self, page_ids: List[str], comparison_aspect: str) -> List[TextContent]:
        """Compare information across multiple pages"""
        
        pages_content = []
        for page_id in page_ids:
            try:
                endpoint = f"/content/{page_id}?expand=body.storage,space"
                page_data = await self._make_request(endpoint)
                
                title = page_data.get('title', 'Untitled')
                content = page_data.get('body', {}).get('storage', {}).get('value', '')
                clean_content = self._clean_content(content)
                
                pages_content.append(f"=== {title} ===\n{clean_content}")
            except Exception as e:
                pages_content.append(f"=== Error loading page {page_id} ===\nError: {str(e)}")
        
        if not pages_content:
            return [TextContent(type="text", text="Could not load any pages for comparison.")]
        
        combined_content = "\n\n".join(pages_content)
        
        comparison_prompt = f"Compare the following documents focusing on {comparison_aspect}:\n\n{combined_content}"
        comparison_result = await self.llm.analyze_content(
            f"Compare these documents regarding {comparison_aspect}",
            combined_content
        )
        
        response = f"""**Document Comparison: {comparison_aspect}**

{comparison_result}

**Documents compared:** {len(page_ids)} page(s)"""
        
        return [TextContent(type="text", text=response)]
    
    async def summarize_space(self, space_key: str, focus_area: Optional[str] = None, 
                            max_pages: int = 10) -> List[TextContent]:
        """Generate LLM summary of a Confluence space"""
        
        search_query = f"space = {space_key} AND type = page"
        endpoint = f"/content/search?cql={urllib.parse.quote(search_query)}&limit={max_pages}&expand=body.storage"
        
        results = await self._make_request(endpoint)
        pages = results.get('results', [])
        
        if not pages:
            return [TextContent(type="text", text=f"No pages found in space: {space_key}")]
        
        # Collect content
        all_content = []
        for page in pages:
            title = page.get('title', 'Untitled')
            content = page.get('body', {}).get('storage', {}).get('value', '')
            clean_content = self._clean_content(content)
            all_content.append(f"=== {title} ===\n{clean_content}")
        
        combined_content = "\n\n".join(all_content)
        
        # Generate summary
        summary_question = f"Provide a comprehensive summary of this Confluence space"
        if focus_area:
            summary_question += f", focusing on {focus_area}"
        
        summary = await self.llm.analyze_content(summary_question, combined_content)
        
        response = f"""**Space Summary: {space_key}**
{f"**Focus: {focus_area}**" if focus_area else ""}

{summary}

**Based on {len(pages)} pages from the space**"""
        
        return [TextContent(type="text", text=response)]
    
    def _generate_search_query(self, question: str, space_key: Optional[str] = None) -> str:
        """Generate a Confluence search query from a natural language question"""
        
        # Extract key terms from question
        import re
        
        # Remove common question words
        question_clean = re.sub(r'\b(what|how|where|when|why|who|is|are|can|could|should|would|do|does|did)\b', '', question.lower())
        
        # Extract remaining meaningful words
        words = re.findall(r'\b\w{3,}\b', question_clean)
        
        if not words:
            search_query = "type = page"
        else:
            # Create text search for key terms
            search_terms = ' OR '.join([f'text ~ "{word}"' for word in words[:5]])  # Limit to 5 terms
            search_query = f"({search_terms}) AND type = page"
        
        if space_key:
            search_query = f"space = {space_key} AND {search_query}"
        
        return search_query
    
    async def run(self):
        """Run the MCP server"""
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="confluence-llm-mcp-server",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )


async def main():
    """Main entry point"""
    
    # OAuth Configuration
    oauth_config = OAuth1Config(
        base_url=os.getenv("CONFLUENCE_BASE_URL", "https://your-domain.atlassian.net/wiki"),
        consumer_key=os.getenv("CONFLUENCE_CONSUMER_KEY", "your-consumer-key"),
        consumer_secret=os.getenv("CONFLUENCE_CONSUMER_SECRET", "your-consumer-secret"),
        access_token=os.getenv("CONFLUENCE_ACCESS_TOKEN", "your-access-token"),
        access_token_secret=os.getenv("CONFLUENCE_ACCESS_TOKEN_SECRET", "your-access-token-secret"),
        cert_key=os.getenv("CONFLUENCE_CERT_KEY"),
        signature_method=os.getenv("CONFLUENCE_SIGNATURE_METHOD", "HMAC-SHA1")
    )
    
    # LLM Configuration
    llm_config = LLMConfig(
        provider=os.getenv("LLM_PROVIDER", "openai"),  # openai, anthropic, ollama
        api_key=os.getenv("LLM_API_KEY"),
        model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
        api_url=os.getenv("LLM_API_URL"),  # For Ollama: http://localhost:11434
        max_tokens=int(os.getenv("LLM_MAX_TOKENS", "1000")),
        temperature=float(os.getenv("LLM_TEMPERATURE", "0.1"))
    )
    
    server = ConfluenceLLMServer(oauth_config, llm_config)
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())