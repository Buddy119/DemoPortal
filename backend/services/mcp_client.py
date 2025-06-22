try:
    from mcp.server.fastmcp import FastMCP
except ModuleNotFoundError:  # older SDK fallback for tests
    class FastMCP:
        def __init__(self, *args, **kwargs):
            pass

        async def complete(self, *args, **kwargs):
            raise NotImplementedError("FastMCPClient not available")

# Initializes MCP client with a unique name
mcp_client = FastMCP(name="DevPortalClient")
