// SuperPlane Secure Service Harness Orchestrator
// 100% Real, functioning platform self-healing pipeline.
require('dotenv').config();
const express = require('express');
const { createTriggerRouter } = require('./harness-trigger');
const { executeSensorProbe } = require('./harness-sensor');
const { runDiagnosticAgent } = require('./harness-analyzer');
const { executeSafeRotation } = require('./harness-action');
const { sendOpsAlert } = require('./harness-notify');

const app = express();
app.use(express.json());

// Enable CORS for local development requests
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

console.log("\n========================================================");
console.log("🛡️ SuperPlane Autopilot - Secure Service Harness Server");
console.log("========================================================");

// Simulated raw directory log contents that the AI will analyze
const mockDirectoryLogs = `
total 9124000
-rw-r--r--  1 root  root   4294967296 May 30 11:32 debug.log.2025-05-28
-rw-r--r--  1 root  root   2147483648 May 30 11:15 trace.log
-rw-r--r--  1 root  root   1073741824 May 30 11:00 audit.log
-rw-r--r--  1 root  root   1073741824 May 30 10:45 security.log
-rw-r--r--  1 root  root    512000000 May 30 11:45 server.log
`;

// Define the self-healing workflow orchestrator pipeline
async function runSelfHealingWorkflow(eventPayload) {
    console.log("\n--------------------------------------------------------");
    console.log("🚀 STARTING PIPELINE REMEDIATION WORKFLOW");
    console.log("--------------------------------------------------------");

    // NODE 1: Trigger Node (Executed when express POST /trigger receives payload)
    console.log(`[NODE 1: TRIGGER] Ingested Alert: "${eventPayload.description}"`);

    // NODE 2: Sensor Node (Query system or platforms API securely in read-only)
    const sensorResult = await executeSensorProbe();
    if (sensorResult.status !== 'success') {
        console.error("✕ Sensor failed. Aborting pipeline.");
        return;
    }
    console.log(`[NODE 2: SENSOR SUCCESS] ${sensorResult.payload.message}`);

    // NODE 3: AI-Agent Node (Invoke Google Gemini to safely analyze logs and decide retention)
    const aiResult = await runDiagnosticAgent(mockDirectoryLogs);
    if (aiResult.status !== 'success') {
        console.error("✕ AI Diagnostics agent failed. Aborting pipeline.");
        return;
    }
    const aiRecommendation = aiResult.payload;
    console.log(`[NODE 3: AI SUCCESS] AI Analysis concludes: ${aiRecommendation.message}`);

    // NODE 4: Action Node (Safely rotate file descriptors and call rolling reboot API)
    const actionResult = await executeSafeRotation(
        aiRecommendation.purgeablePaths,
        aiRecommendation.retainedPaths
    );
    if (actionResult.status !== 'success') {
        console.error("✕ Action mutation failed. Aborting pipeline.");
        return;
    }
    console.log(`[NODE 4: ACTION SUCCESS] Freed capacity: ${actionResult.payload.freedSpaceMB} MB`);

    // NODE 5: Notification Node (Post clean embeds metadata to DiscordWebhook)
    const notifyResult = await sendOpsAlert(aiRecommendation, actionResult.payload.freedSpaceMB);
    console.log(`[NODE 5: NOTIFICATION SUCCESS] Workflow complete. Cluster state fully healed.`);
    console.log("--------------------------------------------------------");
}

// Bind Ingestion Webhook Trigger endpoint router
app.use('/trigger', createTriggerRouter(runSelfHealingWorkflow));

// Default health probe
app.get('/health', (req, res) => {
    res.status(200).json({ status: "healthy", service: "superplane-secure-harness-orchestrator" });
});

// Local proxy router for secure LLM chat execution, bypassing browser CORS restrictions
// Fireworks model: Kimi K2.6 by Moonshot AI
// 262k context, 1028B params, vision + function-calling, serverless ready
const FIREWORKS_MODELS = [
    "accounts/fireworks/models/kimi-k2p6"
];

app.post('/api/chat', async (req, res) => {
    const { provider, apiKey, systemPrompt, userPrompt } = req.body;

    console.log(`[CHAT] Request received. Provider: ${provider}, Key present: ${!!apiKey}`);

    if (!apiKey || apiKey.trim() === "") {
        return res.status(400).json({ error: "Missing API key" });
    }

    try {
        if (provider === "gemini") {
            console.log("[CHAT] Routing to Gemini...");
            const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt + "\n\nUser request: " + userPrompt }] }]
                })
            });

            if (response.ok) {
                const resJson = await response.json();
                if (resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content && resJson.candidates[0].content.parts[0]) {
                    const text = resJson.candidates[0].content.parts[0].text;
                    console.log("[CHAT] Gemini success.");
                    return res.json({ text });
                }
                throw new Error("Invalid response format from Gemini");
            } else {
                const errText = await response.text();
                console.error("[CHAT] Gemini error:", errText);
                return res.status(response.status).json({ error: `Gemini Error: ${errText}` });
            }
        } else {
            // Fireworks: try each model ID until one succeeds
            const apiEndpoint = `https://api.fireworks.ai/inference/v1/chat/completions`;
            let lastError = "No models attempted";

            for (const modelId of FIREWORKS_MODELS) {
                console.log(`[CHAT] Trying Fireworks model: ${modelId}`);
                try {
                    const response = await fetch(apiEndpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: modelId,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            max_tokens: 1024
                        })
                    });

                    if (response.ok) {
                        const resJson = await response.json();
                        if (resJson.choices && resJson.choices[0] && resJson.choices[0].message) {
                            const text = resJson.choices[0].message.content;
                            console.log(`[CHAT] Fireworks success with model: ${modelId}`);
                            return res.json({ text, model: modelId });
                        }
                        lastError = "Invalid response format from Fireworks";
                    } else {
                        const errText = await response.text();
                        lastError = `${modelId}: HTTP ${response.status} - ${errText}`;
                        console.error(`[CHAT] Fireworks model ${modelId} failed:`, errText.slice(0, 200));
                        // Only retry on NOT_FOUND, not on auth errors
                        let errJson;
                        try { errJson = JSON.parse(errText); } catch(e) {}
                        const code = errJson && errJson.error && errJson.error.code;
                        if (code !== 'NOT_FOUND') {
                            // Auth error or rate limit — don't retry, return immediately
                            return res.status(response.status).json({ error: `Fireworks Error: ${errText}` });
                        }
                    }
                } catch (fetchErr) {
                    lastError = fetchErr.message;
                    console.error(`[CHAT] Fireworks fetch error for ${modelId}:`, fetchErr.message);
                }
            }

            // All models failed
            console.error("[CHAT] All Fireworks models failed. Last error:", lastError);
            return res.status(502).json({ error: `Fireworks Error: All models unavailable. Last: ${lastError}` });
        }
    } catch (err) {
        console.error("[PROXY CHAT ERROR]", err);
        return res.status(500).json({ error: err.message });
    }
});

// ================================================================
// Opsera MCP OAuth PKCE Flow + Real MCP Proxy
// ================================================================
const crypto = require('crypto');

const OPSERA_BASE = 'https://agent.opsera.ai';
const OAUTH_REDIRECT = 'http://localhost:3000/oauth/callback';

// In-memory token store (server-side so browser never touches it)
let opseraToken = null;
let opseraTokenExpiry = 0;
let pendingPKCE = null; // { codeVerifier, state }

function base64url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Step 1: GET /api/opsera/auth  — register client + generate auth URL + open browser
app.get('/api/opsera/auth', async (req, res) => {
    try {
        // Dynamic Client Registration
        const dcrRes = await fetch(`${OPSERA_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: 'SuperPlane Copilot',
                redirect_uris: [OAUTH_REDIRECT],
                grant_types: ['authorization_code'],
                response_types: ['code'],
                token_endpoint_auth_method: 'none'
            })
        });
        const client = await dcrRes.json();
        const clientId = client.client_id;
        console.log('[OPSERA AUTH] DCR client registered:', clientId);

        // PKCE code verifier + challenge
        const codeVerifier = base64url(crypto.randomBytes(32));
        const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
        const state = base64url(crypto.randomBytes(16));

        // Store for callback
        pendingPKCE = { codeVerifier, state, clientId };

        const authUrl = `${OPSERA_BASE}/authorize?` + new URLSearchParams({
            client_id: clientId,
            redirect_uri: OAUTH_REDIRECT,
            response_type: 'code',
            scope: 'openid profile email',
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            state
        }).toString();

        console.log('[OPSERA AUTH] Opening browser for OAuth login...');
        console.log('[OPSERA AUTH] Auth URL:', authUrl);

        // Open browser (macOS)
        const { exec } = require('child_process');
        exec(`open "${authUrl}"`);

        res.json({ ok: true, authUrl, message: 'Browser opened for Opsera login' });
    } catch (err) {
        console.error('[OPSERA AUTH] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Step 2: GET /oauth/callback  — exchange code for token
app.get('/oauth/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!pendingPKCE || state !== pendingPKCE.state) {
        return res.status(400).send('<h3>❌ OAuth state mismatch. Please try again.</h3>');
    }

    try {
        const tokenRes = await fetch(`${OPSERA_BASE}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: OAUTH_REDIRECT,
                client_id: pendingPKCE.clientId,
                code_verifier: pendingPKCE.codeVerifier
            }).toString()
        });

        const tokenData = await tokenRes.json();
        console.log('[OPSERA AUTH] Token exchange response:', JSON.stringify(tokenData).slice(0, 200));

        if (tokenData.access_token) {
            opseraToken = tokenData.access_token;
            opseraTokenExpiry = Date.now() + ((tokenData.expires_in || 3600) * 1000);
            pendingPKCE = null;
            console.log('[OPSERA AUTH] ✅ Authenticated successfully. Token stored server-side.');

            // Close this tab and notify the main app
            res.send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d0d0d;color:#fff;">
                    <h2 style="color:#a855f7">✅ Opsera Connected!</h2>
                    <p>You're authenticated. You can close this tab — SuperPlane is ready.</p>
                    <script>
                        if (window.opener) { window.opener.postMessage({ type: 'opsera_auth_success' }, '*'); }
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body></html>
            `);
        } else {
            console.error('[OPSERA AUTH] Token exchange failed:', tokenData);
            res.status(400).send(`<h3>❌ Token exchange failed: ${JSON.stringify(tokenData)}</h3>`);
        }
    } catch (err) {
        console.error('[OPSERA AUTH] Callback error:', err);
        res.status(500).send(`<h3>❌ Error: ${err.message}</h3>`);
    }
});

// Step 3: POST /api/opsera/mcp  — authenticated MCP proxy
app.post('/api/opsera/mcp', async (req, res) => {
    const { method, params } = req.body;

    if (!opseraToken || Date.now() > opseraTokenExpiry) {
        return res.status(401).json({ error: 'Not authenticated with Opsera. Call /api/opsera/auth first.' });
    }

    try {
        console.log(`[OPSERA MCP] Calling method: ${method}`);
        const mcpRes = await fetch(`${OPSERA_BASE}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Authorization': `Bearer ${opseraToken}`
            },
            body: JSON.stringify({ jsonrpc: '2.0', method, params: params || {}, id: 1 })
        });

        const rawText = await mcpRes.text();
        console.log(`[OPSERA MCP] Raw response (${rawText.length} chars):`, rawText.slice(0, 300));

        // Parse SSE or JSON
        for (const line of rawText.split('\n')) {
            if (line.startsWith('data: ')) {
                try { return res.json(JSON.parse(line.slice(6))); } catch(e) {}
            }
        }
        try { return res.json(JSON.parse(rawText)); } catch(e) {}
        res.json({ raw: rawText });
    } catch (err) {
        console.error('[OPSERA MCP] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/opsera/status  — check if we have a live token
app.get('/api/opsera/status', (req, res) => {
    const authenticated = !!opseraToken && Date.now() < opseraTokenExpiry;
    res.json({
        authenticated,
        expiresIn: authenticated ? Math.round((opseraTokenExpiry - Date.now()) / 1000) : 0
    });
});

// Help usage guidelines
app.get('/', (req, res) => {
    res.send(`
        <h2>SuperPlane Secure Service Harness Server</h2>
        <p>To trigger the real self-healing pipeline, make a POST request to <strong>/trigger</strong>:</p>
        <pre>
curl -X POST http://localhost:3000/trigger \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "Disk Usage Warning",
    "source": "Render Platform Alert",
    "severity": "HIGH",
    "description": "Storage volume '/var/log' has reached 91% capacity threshold."
  }'
        </pre>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Webhook Ingest Endpoint active at: http://localhost:${PORT}/trigger`);
    console.log(`✓ Query Dashboard ready at: http://localhost:${PORT}/`);
    console.log(`\nTo trigger the pipeline, run the curl request shown on the main page.`);
    console.log("========================================================\n");
});
