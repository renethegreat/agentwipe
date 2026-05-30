const mcpUrl = 'https://docs.agents.opsera.ai/~gitbook/mcp';

async function fetchMcpTools() {
    const body = { jsonrpc: '2.0', method: 'tools/list', params: {}, id: 1 };
    const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
        body: JSON.stringify(body)
    });
    const text = await response.text();
    for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
            try {
                const data = JSON.parse(line.slice(6));
                if (data.result && data.result.tools) return data.result.tools;
            } catch (e) {}
        }
    }
    return [];
}

async function callMcpTool(name, args) {
    const body = { jsonrpc: '2.0', method: 'tools/call', params: { name, arguments: args }, id: 2 };
    const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
        body: JSON.stringify(body)
    });
    const text = await response.text();
    for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
            try {
                const data = JSON.parse(line.slice(6));
                if (data.result && data.result.content) {
                    return data.result.content.map(c => c.text).join('\n');
                }
            } catch (e) {}
        }
    }
    return "Error: Tool execution failed.";
}

module.exports = { fetchMcpTools, callMcpTool };
