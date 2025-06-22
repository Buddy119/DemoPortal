try:
    from mcp.client.fastmcp import FastMCPClient
except ModuleNotFoundError:  # older SDK fallback for tests
    class FastMCPClient:
        def __init__(self, *args, **kwargs):
            pass

        async def complete(self, *args, **kwargs):
            raise NotImplementedError("FastMCPClient not available")

# Initializes MCP client with a unique name
mcp_client = FastMCPClient(name="DevPortalClient")
