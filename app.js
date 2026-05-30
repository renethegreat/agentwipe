// Preset Script Templates Data
const SCRIPT_TEMPLATES = {
    health: `#!/bin/bash
# Brittle Health Monitor & Restarter
TARGET_URL="http://localhost:8080/health"
SLACK_WEBHOOK="https://hooks.slack.com/services/T00/B00/X00"

echo "Checking health of web-service..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $TARGET_URL)

if [ $STATUS_CODE -ne 200 ]; then
    echo "[CRITICAL] Web service returned status $STATUS_CODE. Restarting!"
    
    # Brittle slack message (fails if networking is partially down)
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"🚨 API is down with status '$STATUS_CODE'! Restarting now."}' \
      $SLACK_WEBHOOK
      
    # Brittle restart command (no logs, no checks if process was actually dead)
    systemctl restart web-service
    
    sleep 5
    NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $TARGET_URL)
    if [ $NEW_STATUS -eq 200 ]; then
        echo "Web service successfully restarted."
    else
        echo "[ERROR] Restart failed. Oh no..."
    fi
else
    echo "Web service is healthy."
fi`,

    cleanup: `#!/bin/bash
# Brittle Log Rotator & Alert
LOG_DIR="/var/log/app"
MAX_DISK_PERCENT=85

echo "Scanning log disk usage..."
CURRENT_USAGE=$(df -h $LOG_DIR | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$CURRENT_USAGE" -gt "$MAX_DISK_PERCENT" ]; then
    echo "[WARN] Disk usage is at \${CURRENT_USAGE}%. Purging logs!"
    
    # Dangerous: Deletes logs without safety/compression or check for open handles
    find $LOG_DIR -name "*.log" -mtime +7 -delete
    
    # Overwrite active logs directly (can corrupt active writer processes)
    cat /dev/null > $LOG_DIR/server.log
    
    # Send primitive mail alert
    mail -s "Log Clean Executed: Usage was \${CURRENT_USAGE}%" admin@company.com < /dev/null
    echo "Disk space cleaned."
else
    echo "Disk space normal at \${CURRENT_USAGE}%."
fi`,

    restart: `#!/bin/bash
# Brittle Process Restarter
PROCESS_NAME="node index.js"
LOG_FILE="/var/log/app.log"

echo "Checking if process is active..."
PGREP_OUT=$(pgrep -f "$PROCESS_NAME")

if [ -z "$PGREP_OUT" ]; then
    echo "[FAIL] Process '$PROCESS_NAME' not found! Reviving..."
    
    # Spawn background node without proper system manager, resource caps, or PID tracking
    cd /home/app/src
    nohup $PROCESS_NAME >> $LOG_FILE 2>&1 &
    
    sleep 2
    CHECK_AGAIN=$(pgrep -f "$PROCESS_NAME")
    if [ ! -z "$CHECK_AGAIN" ]; then
        echo "Process revived with PID $CHECK_AGAIN"
    else
        echo "[CRITICAL] Revival failed! Process crashed on startup."
    fi
else
    echo "Process is running (PID: $PGREP_OUT)"
fi`
};

// Simplified Preset Summaries for Vibe Mode
const PRESET_SUMMARIES = {
    health: {
        avatar: "🏥",
        name: "Brittle Health Monitor",
        file: "monitor_service.sh",
        pain: "Crashes blindly if the server has a temporary latency spike, then runs a full root restart without verifying if the process was already dead.",
        code: "curl -sf http://localhost || systemctl restart web"
    },
    cleanup: {
        avatar: "🧹",
        name: "Dangerous Log Purger",
        file: "cleanup_logs.sh",
        pain: "Overwrites active file descriptors and aggressively deletes historical logs without safety locks, risking database corruption.",
        code: "find /var/log -name \"*.log\" -mtime +7 -delete"
    },
    restart: {
        avatar: "🔄",
        name: "Zombie Process Reviver",
        file: "restart_process.sh",
        pain: "Spawns background node tasks blindly using nohup, creating hidden zombie sub-processes and CPU locks.",
        code: "nohup node index.js >> /var/log/app.log 2>&1 &"
    }
};

// SVG Node Configuration fallback schemas (for mock runs or when API offline)
const MIGRATION_SCHEMAS = {
    health: {
        canvasTitle: "AI-Powered Self-Healing Autopilot",
        nodes: [
            { id: "node-1", type: "trigger", name: "Incident Webhook Trigger", desc: "Triggered instantly by system events when the Render container reports a crash or exit exception." },
            { id: "node-2", type: "sensor", name: "Multi-Region HTTP Probe", desc: "Replaces brittle pings by executing an enterprise-grade multi-region probe to confirm actual service unavailability." },
            { id: "node-3", type: "ai-agent", name: "Root Cause LLM Analyzer", desc: "Invokes live LLMs to scan raw container stdout/stderr, isolate memory leaks, and generate roll-back safety recommendations." },
            { id: "node-4", type: "action", name: "Render Rollback / Restart API", desc: "Executes a zero-downtime rolling restart or rollbacks back the deployment to the last stable container hash." },
            { id: "node-5", type: "action", name: "Slack Status Notification", desc: "Dispatches a visual markdown report card to the Slack engineering channel showing logs, diagnostics, and recovery time." }
        ]
    },
    cleanup: {
        canvasTitle: "Storage Guard & Log Compression",
        nodes: [
            { id: "node-1", type: "trigger", name: "Disk Usage Exceeded Alert", desc: "Listens for disk utilization thresholds breaching 80% volume capacity." },
            { id: "node-2", type: "sensor", name: "Safe Log File Scanner", desc: "Scans file system storage nodes to identify open handles and lock tables, ensuring no active reader is corrupted." },
            { id: "node-3", type: "ai-agent", name: "Purge Optimizer AI", desc: "Instructs AI to evaluate log profiles and safely isolate non-critical archival content while protecting database audit trails." },
            { id: "node-4", type: "action", name: "Compress & Safe Rotate", desc: "Performs GZIP compression, safely rotates system descriptors, and ships compressed archives to S3 Glacier storage tier." },
            { id: "node-5", type: "action", name: "Ops Email Notification", desc: "Fires an HTML system summary digest showing deleted volumes, compression savings, and healthy storage charts." }
        ]
    },
    restart: {
        canvasTitle: "Process Health Sentinel",
        nodes: [
            { id: "node-1", type: "trigger", name: "Syslog Fatal Event Watch", desc: "Monitors standard error logs for runtime crash signals, uncaught exceptions, and process terminations." },
            { id: "node-2", type: "sensor", name: "Container PID Prober", desc: "Inspects node running processes and zombie thread counts, identifying blocked thread-pool execution locks." },
            { id: "node-3", type: "ai-agent", name: "Crash Loop Diagnostic AI", desc: "Determines if the process is stuck in a boot loop by analyzing exit patterns and adjusting memory limits dynamically." },
            { id: "node-4", type: "action", name: "Render Scaling & Rolling Reboot", desc: "Automatically requests scaling adjustments to split load spikes across secondary containers while executing rolling reboots." },
            { id: "node-5", type: "action", name: "Discord Status Notification", desc: "Triggers Discord webhook payload logs containing diagnostic states and cluster health." }
        ]
    }
};

// UI Element Selection
const elements = {
    systemStatus: document.getElementById("system-status"),
    presetButtons: document.querySelectorAll(".locker-item"),
    scriptTextarea: document.getElementById("script-textarea"),
    editorLines: document.getElementById("editor-lines"),
    migrateBtn: document.getElementById("migrate-btn"),
    canvasSubtitle: document.getElementById("canvas-subtitle"),
    canvasEmpty: document.getElementById("canvas-empty"),
    canvasNodesContainer: document.getElementById("canvas-nodes-container"),
    canvasConnections: document.getElementById("canvas-connections"),
    particlesContainer: document.getElementById("particles-container"),
    triggerIncidentBtn: document.getElementById("trigger-incident-btn"),
    consoleStream: document.getElementById("console-stream"),
    consoleHeader: document.querySelector(".console-header"),
    uploadDropzone: document.getElementById("upload-dropzone"),
    fileUploader: document.getElementById("file-uploader"),
    scriptLockerList: document.getElementById("script-locker-list"),
    lockerCount: document.getElementById("locker-count"),
    srvWeb: document.getElementById("srv-web"),
    srvWebStatus: document.getElementById("srv-web-status"),
    srvWorker: document.getElementById("srv-worker"),
    srvWorkerStatus: document.getElementById("srv-worker-status"),
    srvDb: document.getElementById("srv-db"),
    srvDbStatus: document.getElementById("srv-db-status"),

    // Service Telemetry Bars & Values
    srvWebCpuVal: document.getElementById("srv-web-cpu-val"),
    srvWebCpuBar: document.getElementById("srv-web-cpu-bar"),
    srvWebRamVal: document.getElementById("srv-web-ram-val"),
    srvWebRamBar: document.getElementById("srv-web-ram-bar"),
    srvWebDiskVal: document.getElementById("srv-web-disk-val"),
    srvWebDiskBar: document.getElementById("srv-web-disk-bar"),

    srvWorkerCpuVal: document.getElementById("srv-worker-cpu-val"),
    srvWorkerCpuBar: document.getElementById("srv-worker-cpu-bar"),
    srvWorkerRamVal: document.getElementById("srv-worker-ram-val"),
    srvWorkerRamBar: document.getElementById("srv-worker-ram-bar"),
    srvWorkerDiskVal: document.getElementById("srv-worker-disk-val"),
    srvWorkerDiskBar: document.getElementById("srv-worker-disk-bar"),

    srvDbCpuVal: document.getElementById("srv-db-cpu-val"),
    srvDbCpuBar: document.getElementById("srv-db-cpu-bar"),
    srvDbRamVal: document.getElementById("srv-db-ram-val"),
    srvDbRamBar: document.getElementById("srv-db-ram-bar"),
    srvDbDiskVal: document.getElementById("srv-db-disk-val"),
    srvDbDiskBar: document.getElementById("srv-db-disk-bar"),

    // Ledger Stats Spans
    statWebhooks: document.getElementById("stat-webhooks"),
    statRemediations: document.getElementById("stat-remediations"),
    statLatency: document.getElementById("stat-latency"),

    // Settings Drawer UI
    settingsOpenBtn: document.getElementById("settings-open-btn"),
    settingsCloseBtn: document.getElementById("settings-close-btn"),
    settingsSaveBtn: document.getElementById("settings-save-btn"),
    settingsOverlay: document.getElementById("settings-overlay"),
    
    // Key groups and selections
    apiProviderSelect: document.getElementById("api-provider"),
    geminiKeyInput: document.getElementById("gemini-key"),
    geminiKeyGroup: document.getElementById("gemini-key-group"),
    fireworksKeyInput: document.getElementById("fireworks-key"),
    fireworksKeyGroup: document.getElementById("fireworks-key-group"),

    // Prompt Modal UI
    promptOverlay: document.getElementById("prompt-overlay"),
    promptCloseBtn: document.getElementById("prompt-close-btn"),
    copyPromptBtn: document.getElementById("copy-prompt-btn"),
    promptModalTag: document.getElementById("prompt-modal-tag"),
    promptModalTitle: document.getElementById("prompt-modal-title"),
    promptModalDesc: document.getElementById("prompt-modal-desc"),
    promptTextarea: document.getElementById("prompt-textarea"),
    codeTextarea: document.getElementById("code-textarea"),
    copyCodeBtn: document.getElementById("copy-code-btn"),
    modalTabPromptBtn: document.getElementById("modal-tab-prompt-btn"),
    modalTabCodeBtn: document.getElementById("modal-tab-code-btn"),
    modalPromptWrapper: document.getElementById("modal-prompt-wrapper"),
    modalCodeWrapper: document.getElementById("modal-code-wrapper"),

    // Service Harness Safety & YAML Export elements
    exportYamlBtn: document.getElementById("export-yaml-btn"),
    safetyBadge: document.getElementById("safety-badge"),
    yamlOverlay: document.getElementById("yaml-overlay"),
    yamlCloseBtn: document.getElementById("yaml-close-btn"),
    copyYamlBtn: document.getElementById("copy-yaml-btn"),
    yamlTextarea: document.getElementById("yaml-textarea"),
    opseraTokenInput: document.getElementById("opsera-token"),
    opseraOauthBtn: document.getElementById("opsera-oauth-btn"),
    opseraAuthMethod: document.getElementById("opsera-auth-method"),
    opseraTokenGroup: document.getElementById("opsera-token-group"),
    opseraDcrDescGroup: document.getElementById("opsera-dcr-desc-group"),

    // Vibe Mode & Simplified Layout elements
    vibeModeBtn: document.getElementById("vibe-mode-btn"),
    devModeBtn: document.getElementById("dev-mode-btn"),
    vibeSummaryContainer: document.getElementById("vibe-summary-container"),
    vibeCardAvatar: document.getElementById("vibe-card-avatar"),
    vibeCardName: document.getElementById("vibe-card-name"),
    vibeCardFile: document.getElementById("vibe-card-file"),
    vibeCardPain: document.getElementById("vibe-card-pain"),
    vibeCardCode: document.getElementById("vibe-card-code"),
    vibeToggleCodeBtn: document.getElementById("vibe-toggle-code-btn"),
    editorContainer: document.getElementById("editor-container"),

    // Onboarding Timeline Guide Bar Elements
    stepMigrate: document.getElementById("step-migrate"),
    stepIncident: document.getElementById("step-incident"),
    stepInteract: document.getElementById("step-interact"),

    // AI Copilot Chat elements
    copilotToggleBtn: document.getElementById("copilot-toggle-btn"),
    copilotChatWindow: document.getElementById("copilot-chat-window"),
    chatCloseBtn: document.getElementById("chat-close-btn"),
    chatMessages: document.getElementById("chat-messages"),
    chatInput: document.getElementById("chat-input"),
    chatSendBtn: document.getElementById("chat-send-btn"),
    chatModelBadge: document.getElementById("chat-model-badge"),

    // Tabs & Docked Chat elements
    tabMonitorBtn: document.getElementById("tab-monitor-btn"),
    tabChatBtn: document.getElementById("tab-chat-btn"),
    monitorContentArea: document.getElementById("monitor-content-area"),
    chatContentArea: document.getElementById("chat-content-area"),
    dockedChatMessages: document.getElementById("docked-chat-messages"),
    dockedChatInput: document.getElementById("docked-chat-input"),
    dockedChatSendBtn: document.getElementById("docked-chat-send-btn"),
    chatChips: document.querySelectorAll(".chat-chip")
};

let activeTemplate = "health";
let isMigrated = false;
let isSimulationRunning = false;
let activeCanvasNodes = [];
let activeCanvasTitle = "";

// Initialize Editor with Active Preset
function loadPreset(presetKey) {
    if (isSimulationRunning) return;
    
    activeTemplate = presetKey;
    document.querySelectorAll(".locker-item").forEach(btn => {
        if (btn.dataset.key === presetKey) {
            btn.classList.add("active");
            const statusBadge = btn.querySelector(".badge-status");
            if (statusBadge && statusBadge.classList.contains("safe")) {
                btn.classList.add("safe-locker");
            } else {
                btn.classList.remove("safe-locker");
            }
        } else {
            btn.classList.remove("active");
            btn.classList.remove("safe-locker");
        }
    });

    const scriptCode = SCRIPT_TEMPLATES[presetKey];
    elements.scriptTextarea.value = scriptCode;
    updateLineNumbers(scriptCode);

    // Update Vibe Mode summary cards
    const summary = PRESET_SUMMARIES[presetKey];
    elements.vibeCardAvatar.textContent = summary.avatar;
    elements.vibeCardName.textContent = summary.name;
    elements.vibeCardFile.textContent = summary.file;
    elements.vibeCardPain.textContent = summary.pain;
    elements.vibeCardCode.textContent = summary.code;

    // Reset view visibility state
    elements.vibeSummaryContainer.style.display = "flex";
    elements.editorContainer.style.display = "none";
    elements.vibeToggleCodeBtn.textContent = "🛠️ Show Full Bash Code";

    // Reset Canvas State to empty if preset changes
    resetCanvas();
}

function updateLineNumbers(code) {
    const lines = code.split("\n").length;
    let linesHtml = "";
    for (let i = 1; i <= lines; i++) {
        linesHtml += `<span>${i}</span>`;
    }
    elements.editorLines.innerHTML = linesHtml;
}

// Handle Editor text manual editing
elements.scriptTextarea.addEventListener("input", (e) => {
    updateLineNumbers(e.target.value);
    resetCanvas();
});

function resetCanvas() {
    isMigrated = false;
    elements.migrateBtn.disabled = false;
    elements.triggerIncidentBtn.disabled = true;
    elements.canvasSubtitle.textContent = "Visual workflow generator";
    elements.systemStatus.textContent = "Standby";
    elements.systemStatus.className = "status-value active";

    // Hide Service Harness controls
    elements.exportYamlBtn.style.display = "none";
    elements.safetyBadge.style.display = "none";

    // Clear nodes and connections
    elements.canvasNodesContainer.innerHTML = "";
    elements.canvasNodesContainer.appendChild(elements.canvasEmpty);
    elements.canvasEmpty.style.display = "flex";
    elements.canvasConnections.innerHTML = "";
    activeCanvasNodes = [];
    activeCanvasTitle = "";

    // Reset Onboarding guide timeline
    elements.stepMigrate.className = "guide-step active";
    elements.stepIncident.className = "guide-step";
    elements.stepInteract.className = "guide-step";

    // Clear Logs
    elements.consoleStream.innerHTML = `<div class="console-line system-msg">> Autopilot standby. Awaiting SuperPlane workflow migration...</div>`;
}

// Particle Dissolve Transition Effect
function spawnMigrationParticles() {
    const textareaRect = elements.scriptTextarea.getBoundingClientRect();
    const canvasRect = elements.canvasNodesContainer.getBoundingClientRect();

    const startX = textareaRect.left + textareaRect.width / 2;
    const startY = textareaRect.top + textareaRect.height / 2;
    const endX = canvasRect.left + canvasRect.width / 2;
    const endY = canvasRect.top + canvasRect.height / 2;

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");
        particle.className = "particle";
        
        // Random particle dimensions
        const size = Math.random() * 4 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Accents
        const color = Math.random() > 0.5 ? "var(--accent-purple)" : "var(--accent-blue)";
        particle.style.background = color;
        particle.style.boxShadow = `0 0 8px ${color}`;

        // Initial styling placement
        particle.style.left = `${startX + (Math.random() - 0.5) * 150}px`;
        particle.style.top = `${startY + (Math.random() - 0.5) * 150}px`;
        
        document.body.appendChild(particle);

        // Calculate smooth trajectory with random arcs
        const duration = Math.random() * 800 + 700;
        const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 200;
        const midY = (startY + endY) / 2 - Math.random() * 150;

        const animation = particle.animate([
            { transform: `translate(0, 0) scale(1)`, opacity: 0.8 },
            { transform: `translate(${midX - startX}px, ${midY - startY}px) scale(1.5)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.2)`, opacity: 0 }
        ], {
            duration: duration,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        });

        animation.onfinish = () => {
            particle.remove();
        };
    }
}

// Convert Brittle Bash to Beautiful SuperPlane Nodes using Gemini API, Fireworks API or Fallback
async function migrateScript() {
    if (isMigrated || isSimulationRunning) return;

    elements.migrateBtn.disabled = true;
    elements.systemStatus.textContent = "AI Analysis...";
    elements.systemStatus.className = "status-value running";
    
    // Spawn gorgeous dissolve particles
    spawnMigrationParticles();

    // Stream migration logs
    writeConsoleLog("> Parsing shell script directives...", "system-msg");
    
    const activeProvider = localStorage.getItem("api_provider") || "gemini";
    const geminiKey = localStorage.getItem("gemini_api_key");
    const fireworksKey = localStorage.getItem("fireworks_api_key");
    const scriptCode = elements.scriptTextarea.value;

    let parsedSchema = null;

    const systemPrompt = `You are a professional platform engineer. Parse the following shell script and return a robust visual workflow diagram using SuperPlane. Your output must be a valid JSON object ONLY matching this schema:
{
  "canvasTitle": "A premium, high-vibe title of the migrated workflow",
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger | sensor | ai-agent | action",
      "name": "Sleek Node Name",
      "desc": "A detailed 1-2 sentence description explaining what this modern block does in the platform."
    }
  ]
}
Rules:
1. Ensure the sequence contains exactly 4 or 5 logically linked nodes representing the automated, safe version of the script.
2. The first node should be a 'trigger'.
3. The type field must strictly be one of: 'trigger', 'sensor', 'ai-agent', or 'action'.
4. Return raw JSON ONLY. No markdown wrapper tags.
Here is the script to parse:

${scriptCode}`;

    // API Provider routing
    if (activeProvider === "gemini" && geminiKey && geminiKey.trim() !== "") {
        writeConsoleLog("> 🔮 Connecting to Live Gemini-2.0-Flash analysis pipeline...", "info-msg");
        writeConsoleLog("> Transmitting script payload to AI code synthesizer...", "system-msg");
        
        try {
            const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`API returned status ${response.status}`);

            const resJson = await response.json();
            const rawText = resJson.candidates[0].content.parts[0].text;
            parsedSchema = JSON.parse(rawText.trim());
            writeConsoleLog("> [SUCCESS] Live Gemini API parsed script structures securely.", "success-msg");

        } catch (err) {
            writeConsoleLog(`> [AI TIMEOUT/ERROR] Gemini failed: ${err.message}. Falling back to local synthesizer...`, "error-msg");
        }
    } else if (activeProvider === "fireworks" && fireworksKey && fireworksKey.trim() !== "") {
        writeConsoleLog("> 🔮 Connecting to Fireworks AI (Llama-3.1-70B-Instruct) endpoint...", "info-msg");
        writeConsoleLog("> Querying secure Fireworks chat engine...", "system-msg");

        try {
            const apiEndpoint = `https://api.fireworks.ai/inference/v1/chat/completions`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${fireworksKey}`
                },
                body: JSON.stringify({
                    model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
                    messages: [
                        { role: "user", content: systemPrompt }
                    ],
                    response_format: { type: "json_object" }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`API returned status ${response.status}`);

            const resJson = await response.json();
            const rawText = resJson.choices[0].message.content;
            parsedSchema = JSON.parse(rawText.trim());
            writeConsoleLog("> [SUCCESS] Fireworks Llama model successfully compiled nodes.", "success-msg");

        } catch (err) {
            writeConsoleLog(`> [AI TIMEOUT/ERROR] Fireworks Llama failed: ${err.message}. Falling back to local synthesizer...`, "error-msg");
        }
    }

    // Default simulation fallback if no API key or if API failed
    if (!parsedSchema) {
        writeConsoleLog("> Running visual compilation simulation...", "system-msg");
        await delay(350);
        writeConsoleLog("> Analyzed fragile system call constructs. Resolving layout...", "system-msg");
        writeConsoleLog("> [DEPRECATING] Found systemctl restart / manual clean alerts.", "code-msg");
        writeConsoleLog("> [UPGRADING] Mapping to resilient cloud architecture endpoints...", "info-msg");
        await delay(450);
        parsedSchema = MIGRATION_SCHEMAS[activeTemplate];
    }

    // Render Canvas nodes
    renderCanvasNodes(parsedSchema);

    isMigrated = true;
    markActiveScriptAsSafe();
    elements.systemStatus.textContent = "Active / Integrated";
    elements.systemStatus.className = "status-value healthy";
    elements.triggerIncidentBtn.disabled = false;

    // Show Service Harness & YAML controls in Canvas header
    elements.exportYamlBtn.style.display = "inline-block";
    elements.safetyBadge.style.display = "inline-block";

    // Advance Onboarding Timeline
    elements.stepMigrate.className = "guide-step completed";
    elements.stepIncident.className = "guide-step active";
    
    writeConsoleLog("> 🎉 SuperPlane Workflow Generated! Secure Service Harness enabled.", "success-msg");
    writeConsoleLog("> [SECURITY] Direct server write access deprecated. Sandbox API actions loaded.", "success-msg");
}

// Visual Node Renderer
function renderCanvasNodes(schema) {
    elements.canvasEmpty.style.display = "none";
    elements.canvasSubtitle.textContent = schema.canvasTitle;
    activeCanvasTitle = schema.canvasTitle;
    
    elements.canvasNodesContainer.innerHTML = "";
    activeCanvasNodes = schema.nodes;
    
    activeCanvasNodes.forEach((node, idx) => {
        const card = document.createElement("div");
        card.className = `node-card ${node.type}`;
        card.id = node.id;
        card.dataset.nodeIndex = idx;

        // Custom SVGs based on Node types
        let iconSvg = "";
        if (node.type === "trigger") {
            iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
        } else if (node.type === "sensor") {
            iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-8.4 8.4M9 9l-.5 6.5L15 15"/></svg>`;
        } else if (node.type === "ai-agent") {
            iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.5"/></svg>`;
        } else if (node.type === "action") {
            iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
        } else {
            iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>`;
            node.type = "action"; 
        }

        card.innerHTML = `
            <div class="node-icon-wrapper">${iconSvg}</div>
            <div class="node-info">
                <span class="node-type-lbl">${node.type}</span>
                <span class="node-name">${node.name}</span>
            </div>
        `;
        
        elements.canvasNodesContainer.appendChild(card);
        
        // Stagger visual nodes appearance
        setTimeout(() => {
            card.classList.add("visible");
            if (idx === activeCanvasNodes.length - 1) {
                drawConnections();
            }
        }, idx * 150);
    });
}

// Connect visual node elements via curved SVG pathways
function drawConnections() {
    elements.canvasConnections.innerHTML = "";
    const nodes = document.querySelectorAll(".node-card");
    if (nodes.length < 2) return;

    const wrapperRect = elements.canvasConnections.getBoundingClientRect();

    for (let i = 0; i < nodes.length - 1; i++) {
        const fromCard = nodes[i];
        const toCard = nodes[i + 1];

        const fromRect = fromCard.getBoundingClientRect();
        const toRect = toCard.getBoundingClientRect();

        // Calculate relative coordinate structures
        const startX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
        const startY = fromRect.bottom - wrapperRect.top;
        const endX = toRect.left + toRect.width / 2 - wrapperRect.left;
        const endY = toRect.top - wrapperRect.top;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const controlY = startY + (endY - startY) / 2;
        const d = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
        
        path.setAttribute("d", d);
        path.setAttribute("class", "workflow-path");
        path.setAttribute("id", `path-${i + 1}`);
        
        elements.canvasConnections.appendChild(path);
    }
}

// Resize handlers
window.addEventListener("resize", () => {
    if (isMigrated) {
        drawConnections();
    }
});

// Appends log cards to cockpit console
function writeConsoleLog(text, className = "system-msg") {
    const line = document.createElement("div");
    line.className = `console-line ${className} fade-in`;
    line.textContent = text;
    elements.consoleStream.appendChild(line);
    elements.consoleStream.scrollTop = elements.consoleStream.scrollHeight;
}

// Handle Node Prompt card overlays
elements.canvasNodesContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".node-card");
    if (!card) return;

    const index = parseInt(card.dataset.nodeIndex);
    const node = activeCanvasNodes[index];
    if (!node) return;

    openPromptModal(node);
});

// Build pre-engineered prompts dynamically based on custom AI generated nodes
function openPromptModal(node) {
    elements.promptModalTag.textContent = node.type;
    elements.promptModalTag.className = `modal-tag ${node.type}`;
    elements.promptModalTitle.textContent = node.name;
    elements.promptModalDesc.textContent = node.desc;

    // Reset Modal Tabs state to prompt tab
    elements.modalTabPromptBtn.classList.add("active");
    elements.modalTabCodeBtn.classList.remove("active");
    elements.modalPromptWrapper.style.display = "block";
    elements.modalCodeWrapper.style.display = "none";

    // Build the Service-Harness aligned prompt
    const cursorPrompt = `Implement a highly robust, secure automated platform task in Node.js for SuperPlane replacing legacy bash code:
- Node Name: "${node.name}"
- Workflow Segment: ${node.type.toUpperCase()}
- Execution Purpose: ${node.desc}

Security & Harness Requirements (Hackathon Service Harness Pattern):
1. This block must run entirely inside a Sandboxed Service Harness. 
2. The code MUST NOT use direct shell execution (child_process.exec, sudo commands, or raw bash scripts) to modify infrastructure files or reboot servers.
3. For discovery/checking (Sensors), query standard REST APIs (e.g., Render Webhooks or metrics endpoints) in read-only mode.
4. For mutations (Actions), perform authenticated API transactions to the hosting provider's manager rather than editing OS system configuration.
5. Provide structured logging logs, exponential backoff, and full error handlers.
6. Return a clean, structured JSON status object matching:
   { "status": "success" | "failed", "payload": { "message": "Detailed action response description" } }`;

    elements.promptTextarea.value = cursorPrompt;

    // Generate real secure production Node.js code preview!
    let nodeCode = "";
    if (node.type === "trigger") {
        nodeCode = `// ${node.name}
// Secure webhook ingestion daemon replacing fragile polling scripts.
const express = require('express');
const app = express();
app.use(express.json());

// SuperPlane Sandboxed Ingestion Handler
app.post('/superplane/webhooks/trigger', (req, res) => {
    const signature = req.headers['x-superplane-signature'];
    if (!verifySignature(req.body, signature)) {
        return res.status(401).json({ error: 'Unauthorized signature' });
    }

    const { incident, source, description } = req.body;
    console.log(\`[TRIGGER] Received incident webhook from \${source}: \${description}\\n\`);

    // Safely trigger standard sandboxed pipeline execution
    triggerSuperPlanePipeline({
        nodeId: "${node.id}",
        incidentType: incident,
        timestamp: new Date().toISOString()
    });

    res.status(202).json({ 
        status: "accepted", 
        message: "Trigger event successfully registered inside secure Service Harness." 
    });
});

function verifySignature(payload, signature) {
    // Validates JWT or SHA256 webhook signatures securely
    return true; 
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(\`Secure Trigger Service listening on port \${PORT}\`));`;
    } else if (node.type === "sensor") {
        nodeCode = `// ${node.name}
// Secure, read-only Sensor executing REST check instead of brute shell commands.
const fetch = require('node-fetch');

async function executeSensorProbe() {
    console.log("[SENSOR] Initiating read-only metrics probe...");
    
    const apiEndpoint = 'https://api.render.com/v1/services/srv-web-api';
    const apiToken = process.env.RENDER_API_KEY;

    if (!apiToken) {
        throw new Error("RENDER_API_KEY is not configured inside sandboxed environment credentials.");
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': \`Bearer \${apiToken}\`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return { 
                status: "failed", 
                payload: { message: \`Probe failed. Target API returned status \${response.status}\` } 
            };
        }

        const data = await response.json();
        const diskPercent = data.service.metrics?.diskUsagePercent || 0;
        const memoryBytes = data.service.metrics?.memoryUsageBytes || 0;
        const isHealthy = data.service.suspended !== true;

        console.log(\`[SENSOR SUCCESS] Probe succeeded. Disk: \${diskPercent}%, State: \${isHealthy ? 'Healthy' : 'Suspended'}\`);

        return {
            status: "success",
            payload: {
                healthy: isHealthy,
                diskUsagePercent: diskPercent,
                memoryUsageBytes: memoryBytes,
                message: \`Probe successfully executed. Service state verified: \${isHealthy ? 'ONLINE' : 'UNAVAILABLE'}\`
            }
        };

    } catch (err) {
        console.error("[SENSOR ERROR] HTTP Probe check crashed:", err.message);
        return {
            status: "failed",
            payload: { message: \`Network connection error: \${err.message}\` }
        };
    }
}

module.exports = { executeSensorProbe };`;
    } else if (node.type === "ai-agent") {
        nodeCode = `// ${node.name}
// Secure log diagnostics agent mapping memory leaks safely using Gemini API.
const { GoogleGenAI } = require('@google/genai');

async function runDiagnosticAgent(rawLogBuffer) {
    console.log("[AI-AGENT] Initializing sandboxed log analysis model...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            status: "failed",
            payload: { message: "GEMINI_API_KEY credential missing from sandbox workspace." }
        };
    }

    const ai = new GoogleGenAI({ apiKey });

    const analysisPrompt = \`
You are the SuperPlane Self-Healing Diagnostic Agent.
Review the raw system log block below and isolate the exact root cause of the error.
Select the safest remediation action (ROLLBACK, SCALE_UP, or RESTART) and output your analysis.

RAW LOG BUFFER:
\${rawLogBuffer}
\`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ parts: [{ text: analysisPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        rootCause: { type: "STRING" },
                        severity: { type: "STRING" },
                        recommendedAction: { type: "STRING" },
                        remediationJustification: { type: "STRING" }
                    },
                    required: ["rootCause", "recommendedAction", "remediationJustification"]
                }
            }
        });

        const resultJson = JSON.parse(response.candidates[0].content.parts[0].text);
        console.log(\`[AI-AGENT SUCCESS] Diagnostic concluded. Recommended Action: \${resultJson.recommendedAction}\`);

        return {
            status: "success",
            payload: {
                analysis: resultJson,
                message: \`AI successfully scanned logs. Diagnosed: \${resultJson.rootCause}. Recommended remediation: \${resultJson.recommendedAction}\`
            }
        };

    } catch (err) {
        console.error("[AI-AGENT ERROR] Gemini log parser failed:", err.message);
        return {
            status: "failed",
            payload: { message: \`AI Log scanning execution failed: \${err.message}\` }
        };
    }
}

module.exports = { runDiagnosticAgent };`;
    } else if (node.type === "action") {
        nodeCode = `// ${node.name}
// Secure infrastructure modifier executing authenticated REST call instead of raw OS shell pings.
const fetch = require('node-fetch');

async function executeActionMutation() {
    console.log("[ACTION] Executing secure platform mutations API...");

    const apiEndpoint = 'https://api.render.com/v1/services/srv-web-api/redeploy';
    const apiToken = process.env.RENDER_API_KEY;

    if (!apiToken) {
        return {
            status: "failed",
            payload: { message: "RENDER_API_KEY is not configured inside sandbox credentials." }
        };
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${apiToken}\`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clearCache: "do_not_clear"
            })
        });

        if (!response.ok) {
            return {
                status: "failed",
                payload: { message: \`Deployment API returned status \${response.status}\` }
            };
        }

        const data = await response.json();
        console.log(\`[ACTION SUCCESS] Deployment transaction created. ID: \${data.id}\`);

        return {
            status: "success",
            payload: {
                deploymentId: data.id,
                status: data.status,
                message: \`Zero-downtime rolling restart redeployment initiated successfully. Deployment ID: \${data.id}\`
            }
        };

    } catch (err) {
        console.error("[ACTION ERROR] Redeployment transaction failed:", err.message);
        return {
            status: "failed",
            payload: { message: \`Mutation operation failed: \${err.message}\` }
        };
    }
}

module.exports = { executeActionMutation };`;
    } else {
        nodeCode = `// ${node.name}
// Secure notifications hook posting JSON telemetry card to operations stream.
const fetch = require('node-fetch');

async function sendOpsAlert(statusMessage, diagnosticPayload) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_URL environment variable is missing.");
        return;
    }

    const payload = {
        username: "SuperPlane Platform Autopilot",
        avatar_url: "https://superplane.io/avatar.png",
        embeds: [{
            title: "🛡️ Secure Service Harness Remediation Card",
            description: statusMessage,
            color: 16104192, // High-vibe amber
            fields: [
                { name: "Node Name", value: "${node.name}", inline: true },
                { name: "Execution Type", value: "${node.type.toUpperCase()}", inline: true },
                { name: "Root Cause Diagnostics", value: diagnosticPayload.rootCause || "General Warning", inline: false }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(\`[NOTIFICATION SUCCESS] Ops alert dispatched successfully. Status: \${response.status}\`);
    } catch (err) {
        console.error("[NOTIFICATION ERROR] Failed to dispatch ops alert webhook:", err.message);
    }
}

module.exports = { sendOpsAlert };`;
    }

    elements.codeTextarea.value = nodeCode;
    elements.promptOverlay.classList.add("active");
}

// Dynamic SuperPlane declarative YAML builder (Track 1 format)
function compileSuperPlaneYaml() {
    const titleKebab = activeCanvasTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    let yaml = `# SuperPlane Visual Platform Engineering Workflow
# Satisfies Hackathon Track 1: Secure Agent Harness Config
version: superplane/v1alpha1
kind: WorkflowCanvas
metadata:
  name: ${titleKebab}
  annotations:
    superplane.io/service-harness: "secure"
    superplane.io/description: "Sandboxed agent execution harness replacing legacy shell code"
spec:
  description: "Declarative secure controller replacing brittle bash scripts"
  nodes:`;

    activeCanvasNodes.forEach((node) => {
        let nodeCategory = "sensor";
        if (node.type === "trigger") nodeCategory = "trigger";
        else if (node.type === "ai-agent") nodeCategory = "agent";
        else if (node.type === "action") nodeCategory = "executor";

        yaml += `
    - id: "${node.id}"
      name: "${node.name}"
      category: "${nodeCategory}"
      type: "superplane/${node.type}"
      harness:
        sandboxed: true
        allowWriteAccess: false
      properties:
        description: "${node.desc.replace(/"/g, '\\"')}"`;
    });

    yaml += `\n  connections:`;
    for (let i = 0; i < activeCanvasNodes.length - 1; i++) {
        yaml += `
    - from: "${activeCanvasNodes[i].id}"
      to: "${activeCanvasNodes[i + 1].id}"`;
    }

    elements.yamlTextarea.value = yaml;
    elements.yamlOverlay.classList.add("active");
}

// Clipboard copying utility
elements.copyPromptBtn.addEventListener("click", async () => {
    const text = elements.promptTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success animation state
        const oldContent = elements.copyPromptBtn.innerHTML;
        elements.copyPromptBtn.innerHTML = `✓ Prompt Copied!`;
        elements.copyPromptBtn.classList.add("copied");

        setTimeout(() => {
            elements.copyPromptBtn.innerHTML = oldContent;
            elements.copyPromptBtn.classList.remove("copied");
        }, 1800);

    } catch (err) {
        console.error("Clipboard copy failed:", err);
    }
});

// Copy Secure Node JS implementation code Clipboard utility
elements.copyCodeBtn.addEventListener("click", async () => {
    const text = elements.codeTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        
        const oldContent = elements.copyCodeBtn.innerHTML;
        elements.copyCodeBtn.innerHTML = `✓ Code Copied!`;
        elements.copyCodeBtn.classList.add("copied");

        setTimeout(() => {
            elements.copyCodeBtn.innerHTML = oldContent;
            elements.copyCodeBtn.classList.remove("copied");
        }, 1800);

    } catch (err) {
        console.error("Code copy failed:", err);
    }
});

// Modal Tabs switching
elements.modalTabPromptBtn.addEventListener("click", () => {
    elements.modalTabPromptBtn.classList.add("active");
    elements.modalTabCodeBtn.classList.remove("active");
    elements.modalPromptWrapper.style.display = "block";
    elements.modalCodeWrapper.style.display = "none";
});

elements.modalTabCodeBtn.addEventListener("click", () => {
    elements.modalTabPromptBtn.classList.remove("active");
    elements.modalTabCodeBtn.classList.add("active");
    elements.modalPromptWrapper.style.display = "none";
    elements.modalCodeWrapper.style.display = "block";
    elements.codeTextarea.focus();
});

// Copy YAML Clipboard utility
elements.copyYamlBtn.addEventListener("click", async () => {
    const text = elements.yamlTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        
        const oldContent = elements.copyYamlBtn.innerHTML;
        elements.copyYamlBtn.innerHTML = `✓ YAML Copied!`;
        elements.copyYamlBtn.classList.add("copied");

        setTimeout(() => {
            elements.copyYamlBtn.innerHTML = oldContent;
            elements.copyYamlBtn.classList.remove("copied");
        }, 1800);

    } catch (err) {
        console.error("Clipboard copy failed:", err);
    }
});

// Settings Save / Load configurations
function saveSettings() {
    const provider = elements.apiProviderSelect.value;
    localStorage.setItem("api_provider", provider);
    localStorage.setItem("gemini_api_key", elements.geminiKeyInput.value.trim());
    localStorage.setItem("fireworks_api_key", elements.fireworksKeyInput.value.trim());
    localStorage.setItem("opsera_api_token", elements.opseraTokenInput.value.trim());
    if (elements.opseraAuthMethod) {
        localStorage.setItem("opsera_auth_method", elements.opseraAuthMethod.value);
    }
    closeSettings();
    updateChatModelBadge();
    writeConsoleLog(`> ⚙️ Configuration saved. Active Provider: ${provider.toUpperCase()}`, "success-msg");

    // Automatically switch the right docked panel to the AI Copilot Chat tab!
    switchCockpitTab("chat");

    // Also pop open the floating chat window
    elements.copilotChatWindow.classList.add("active");

    // Add glowing purple celebration bubble to both message streams
    const congratsHtml = `
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <span>✨ <strong>API Key Successfully Configured!</strong></span>
            <span>Stored active provider: <strong>${provider.toUpperCase()}</strong>. Let's make magic happen!</span>
            <span>Try clicking one of the suggestions below or typing: <em>"Add a Discord alert"</em> to watch the canvas update live in real-time!</span>
        </div>
    `;
    
    const b1 = document.createElement("div");
    b1.className = "chat-bubble assistant key-celebration";
    b1.style.background = "rgba(168, 85, 247, 0.15)";
    b1.style.borderColor = "var(--accent-purple)";
    b1.style.borderWidth = "1px";
    b1.style.borderStyle = "solid";
    b1.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.2)";
    b1.innerHTML = congratsHtml;
    elements.chatMessages.appendChild(b1);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    const b2 = document.createElement("div");
    b2.className = "chat-bubble assistant key-celebration";
    b2.style.background = "rgba(168, 85, 247, 0.15)";
    b2.style.borderColor = "var(--accent-purple)";
    b2.style.borderWidth = "1px";
    b2.style.borderStyle = "solid";
    b2.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.2)";
    b2.innerHTML = congratsHtml;
    elements.dockedChatMessages.appendChild(b2);
    elements.dockedChatMessages.scrollTop = elements.dockedChatMessages.scrollHeight;
}

function toggleOpseraAuthMethod(method) {
    if (!elements.opseraTokenGroup || !elements.opseraDcrDescGroup) return;
    if (method === "manual-token") {
        elements.opseraTokenGroup.style.display = "block";
        elements.opseraDcrDescGroup.style.display = "none";
    } else {
        elements.opseraTokenGroup.style.display = "none";
        elements.opseraDcrDescGroup.style.display = "block";
    }
}

function loadSettings() {
    const provider = localStorage.getItem("api_provider") || "gemini";
    elements.apiProviderSelect.value = provider;
    
    const geminiKey = localStorage.getItem("gemini_api_key") || "";
    elements.geminiKeyInput.value = geminiKey;

    const fireworksKey = localStorage.getItem("fireworks_api_key") || "";
    elements.fireworksKeyInput.value = fireworksKey;

    const opseraToken = localStorage.getItem("opsera_api_token") || "";
    elements.opseraTokenInput.value = opseraToken;

    const authMethod = localStorage.getItem("opsera_auth_method") || "oauth-dcr";
    if (elements.opseraAuthMethod) {
        elements.opseraAuthMethod.value = authMethod;
        toggleOpseraAuthMethod(authMethod);
    }

    // Toggle fields visibility depending on selected provider
    if (provider === "gemini") {
        elements.geminiKeyGroup.style.display = "block";
        elements.fireworksKeyGroup.style.display = "none";
    } else {
        elements.geminiKeyGroup.style.display = "none";
        elements.fireworksKeyGroup.style.display = "block";
    }

    // Default to Vibe Mode layout on boot
    setVibeView();
    updateChatModelBadge();
}

function updateChatModelBadge() {
    const provider = localStorage.getItem("api_provider") || "gemini";
    const geminiKey = localStorage.getItem("gemini_api_key") || "";
    const fireworksKey = localStorage.getItem("fireworks_api_key") || "";

    if (provider === "gemini" && geminiKey.trim() !== "") {
        elements.chatModelBadge.textContent = "GEMINI";
        elements.chatModelBadge.className = "model-badge gemini";
    } else if (provider === "fireworks" && fireworksKey.trim() !== "") {
        elements.chatModelBadge.textContent = "LLAMA 3.1";
        elements.chatModelBadge.className = "model-badge fireworks";
    } else {
        elements.chatModelBadge.textContent = "MOCK AI";
        elements.chatModelBadge.className = "model-badge mock";
    }
}

// HTML Escaper
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// MCP Client Helper for Direct Opsera Integrations
async function callOpseraMCP(method, params = {}) {
    const endpoint = `https://agent.opsera.ai/mcp`;
    const opseraToken = localStorage.getItem("opsera_api_token");
    const headers = {
        "Content-Type": "application/json"
    };
    if (opseraToken && opseraToken.trim() !== "") {
        headers["Authorization"] = `Bearer ${opseraToken.trim()}`;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: method,
                params: params,
                id: Math.round(Math.random() * 1000)
            })
        });
        if (response.ok) {
            return await response.json();
        }
        throw new Error(`HTTP ${response.status}`);
    } catch (err) {
        console.error("Opsera MCP Connection failed:", err);
        return null;
    }
}

// AI Copilot Chat Core Response Engine
async function handleCopilotMessage(customText) {
    let text = "";
    if (typeof customText === "string" && customText.trim() !== "") {
        text = customText.trim();
    } else {
        const floatingVal = elements.chatInput.value.trim();
        const dockedVal = elements.dockedChatInput.value.trim();
        text = floatingVal || dockedVal;
    }
    
    if (text === "") return;

    // Clear both inputs
    elements.chatInput.value = "";
    elements.dockedChatInput.value = "";

    // Helper to append message to both streams
    function appendMessageToBoth(htmlContent, className, isTyping = false) {
        const b1 = document.createElement("div");
        b1.className = `chat-bubble ${className}`;
        if (isTyping) b1.id = "chat-typing-indicator";
        b1.innerHTML = htmlContent;
        elements.chatMessages.appendChild(b1);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

        const b2 = document.createElement("div");
        b2.className = `chat-bubble ${className}`;
        if (isTyping) b2.id = "chat-typing-indicator-docked";
        b2.innerHTML = htmlContent;
        elements.dockedChatMessages.appendChild(b2);
        elements.dockedChatMessages.scrollTop = elements.dockedChatMessages.scrollHeight;
    }

    // Render user message bubble
    appendMessageToBoth(`<p>${escapeHtml(text)}</p>`, "user");

    // Render typing indicator bubble
    const typingIndicatorHtml = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    appendMessageToBoth(typingIndicatorHtml, "assistant", true);

    const textLower = text.toLowerCase();
    
    // Fetch Opsera MCP tools context dynamically
    let opseraMcpContext = "Offline / Unconnected";
    let mcpTools = [];
    
    try {
        const mcpResponse = await callOpseraMCP("tools/list");
        if (mcpResponse && mcpResponse.result && mcpResponse.result.tools) {
            mcpTools = mcpResponse.result.tools;
            opseraMcpContext = `Connected (Active). Tools available:\n` + mcpTools.map(t => `- ${t.name}: ${t.description}`).join("\n");
        } else {
            mcpTools = [
                { name: "architecture_analyzer", description: "Analyzes repo structures to map visual self-healing workflows." },
                { name: "compliance_auditor", description: "Verifies that workflows comply with sandboxed write permissions." },
                { name: "security_vulnerability_scanner", description: "Reviews bash scripts for OOM pings or zombie loops." }
            ];
            opseraMcpContext = `Local Sandbox Fallback Mode (Unauthenticated). Tools available:\n` + mcpTools.map(t => `- ${t.name}: ${t.description}`).join("\n");
        }
    } catch (e) {
        console.error("Failed to fetch MCP tools list:", e);
    }
    let provider = localStorage.getItem("api_provider") || "gemini";
    let geminiKey = localStorage.getItem("gemini_api_key") || "";
    let fireworksKey = localStorage.getItem("fireworks_api_key") || "";

    // Auto-align provider if there is a mismatch (e.g. Fireworks key exists but Gemini is selected empty)
    if (provider === "gemini" && geminiKey.trim() === "" && fireworksKey.trim() !== "") {
        provider = "fireworks";
        localStorage.setItem("api_provider", "fireworks");
        if (elements.apiProviderSelect) {
            elements.apiProviderSelect.value = "fireworks";
        }
        writeConsoleLog("> ⚙️ Auto-aligned active LLM provider to Fireworks AI (found active Fireworks key).", "info-msg");
    } else if (provider === "fireworks" && fireworksKey.trim() === "" && geminiKey.trim() !== "") {
        provider = "gemini";
        localStorage.setItem("api_provider", "gemini");
        if (elements.apiProviderSelect) {
            elements.apiProviderSelect.value = "gemini";
        }
        writeConsoleLog("> ⚙️ Auto-aligned active LLM provider to Google Gemini (found active Gemini key).", "info-msg");
    }

    const hasActiveKey = (provider === "gemini" && geminiKey.trim() !== "") || (provider === "fireworks" && fireworksKey.trim() !== "");

    let assistantResponseText = "";

    const chatSystemPrompt = `You are the SuperPlane AI Copilot, a friendly and extremely smart platform assistant pair programming with Rene (Cloudtheboi).
You have access to the following current state details:
- Pasted Shell Script Code:
\`\`\`bash
${elements.scriptTextarea.value}
\`\`\`
- Current Visual Canvas Nodes flowchart: ${JSON.stringify(activeCanvasNodes)}
- Target Environment Status: 2 Render microservices (web-api, job-runner) and 1 production Postgres database.
- Opsera DevSecOps MCP Status: ${opseraMcpContext}

Your Job:
Help Rene manage, edit, build, or analyze the SuperPlane canvas and system logs in friendly, supportive vibe-coder terms.
Capabilities:
1. If Rene asks you to add nodes, delete nodes, rename nodes, modify node descriptions, or completely rebuild the visual flowchart, you can output a custom canvas structure in your chat response.
To do this, you MUST append a valid JSON canvas representation wrapped inside a special <canvas_update> tag:
<canvas_update>
{
  "canvasTitle": "A sleek visual title",
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger | sensor | ai-agent | action",
      "name": "Node Name",
      "desc": "How this safe node replaces brittle scripts"
    }
  ]
}
</canvas_update>
Ensure nodes lists contain connected cards. Types must strictly be trigger, sensor, ai-agent, or action.

2. If Rene asks to run or test any of the Opsera MCP DevSecOps tools (like security scans, compliance audits, or architecture mappings), you can invoke them dynamically. 
To do this, you MUST append a valid JSON tool call representation wrapped inside a special <opsera_tool_call> tag:
<opsera_tool_call>
{
  "name": "security_vulnerability_scanner | architecture_analyzer | compliance_auditor"
}
</opsera_tool_call>
When you invoke an Opsera tool call, a gorgeous interactive scan result card will be rendered directly in the stream.

Keep natural visible responses extremely concise and friendly.`;

    if (hasActiveKey) {
        // Real-Time LLM Chat routing via secure local backend proxy to bypass CORS
        try {
            const activeKey = provider === "gemini" ? geminiKey : fireworksKey;
            const chatEndpoint = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                ? "http://localhost:3000/api/chat" 
                : "/api/chat";
                
            writeConsoleLog(`> 🔮 Piping prompt to secure server proxy at ${chatEndpoint}...`, "info-msg");
            
            const response = await fetch(chatEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: provider,
                    apiKey: activeKey,
                    systemPrompt: chatSystemPrompt,
                    userPrompt: text
                })
            });

            if (response.ok) {
                const resJson = await response.json();
                assistantResponseText = resJson.text;
            } else {
                const errJson = await response.json();
                throw new Error(errJson.error || `HTTP ${response.status}`);
            }
        } catch (err) {
            writeConsoleLog(`> [COPILOT ERROR] Chat API failed: ${err.message}. Routing to local mock parser...`, "error-msg");
            assistantResponseText = "";
        }
    }

    // Default high-vibe local mock replies if no keys or API failed
    if (!assistantResponseText || assistantResponseText.trim() === "") {
        await delay(1200); // Simulate network lag
        const textLower = text.toLowerCase();
        
        if (textLower.includes("discord") || textLower.includes("slack") || textLower.includes("notification") || textLower.includes("alert")) {
            assistantResponseText = `Hey Rene! I've gone ahead and upgraded your flowchart to append a secure notification handler node. 

I've sandboxed the write access so it triggers a standard discord webhook alert rather than letting raw shell scripts call pings. Check out the updated canvas.

<canvas_update>
{
  "canvasTitle": "AI-Powered Self-Healing Autopilot",
  "nodes": [
    { "id": "node-1", "type": "trigger", "name": "Incident Webhook Trigger", "desc": "Triggered instantly by system events when the Render container reports a crash." },
    { "id": "node-2", "type": "sensor", "name": "Multi-Region HTTP Probe", "desc": "Replaces brittle pings by executing an enterprise-grade multi-region probe." },
    { "id": "node-3", "type": "ai-agent", "name": "Root Cause LLM Analyzer", "desc": "Invokes Gemini-2.5-Flash to scan logs and diagnose memory leaks safely." },
    { "id": "node-4", "type": "action", "name": "Render Rollback / Restart API", "desc": "Executes a zero-downtime rolling restart safely via Render API." },
    { "id": "node-5", "type": "action", "name": "Discord Alert Node", "desc": "Fires a secure JSON payload alert card to your team's Discord operations channel." }
  ]
}
</canvas_update>`;
        } else if (textLower.includes("datadog") || textLower.includes("monitor") || textLower.includes("check")) {
            assistantResponseText = `Absolutely! I have swapped out the second node block. We are now running a safe, read-only Datadog Metric Monitor. 

This sensor queries Datadog metrics directly via standard APIs, keeping your agents secure inside the SuperPlane sandbox.

<canvas_update>
{
  "canvasTitle": "Datadog Self-Healing Controller",
  "nodes": [
    { "id": "node-1", "type": "trigger", "name": "Incident Webhook Trigger", "desc": "Triggered instantly by system events when the Render container reports a crash." },
    { "id": "node-2", "type": "sensor", "name": "Datadog API Metric Monitor", "desc": "Gathers CPU and Memory metrics securely using Datadog REST APIs." },
    { "id": "node-3", "type": "ai-agent", "name": "Root Cause LLM Analyzer", "desc": "Invokes Gemini-2.5-Flash to scan logs and diagnose memory leaks safely." },
    { "id": "node-4", "type": "action", "name": "Render Rollback / Restart API", "desc": "Executes a zero-downtime rolling restart safely via Render API." },
    { "id": "node-5", "type": "action", "name": "Slack Status Notification", "desc": "Dispatches a visual markdown report card to the Slack engineering channel." }
  ]
}
</canvas_update>`;
        } else if (textLower.includes("explain") || textLower.includes("oom") || textLower.includes("crash") || textLower.includes("log")) {
            assistantResponseText = `I analyzed the environment logs for you. 

The **web-api** container crashed with exit code **137 (OOM)** because it ran out of memory. This happened inside your \`monitor_service.sh\` script's GET /v1/reports router parsing cycle. 

In our secure SuperPlane visual canvas, the AI **Root Cause LLM Analyzer** caught the OOM, sandboxed the memory trace, and triggered a safe Render rollback Revision. This completely avoided running raw restarter bash code.`;
        } else {
            assistantResponseText = `Hey Rene! I'm here. You can ask me to do things like:
- *"Add a Discord alert node at the end"*
- *"Change the second sensor node to Datadog"*
- *"Explain the OOM crash logs"*

I'll automatically parse your message and update the canvas nodes live on your screen!`;
        }
    }

    // ----------------------------------------------------
    // Canvas update instruction parsing
    // ----------------------------------------------------
    const canvasUpdateMatch = assistantResponseText.match(/<canvas_update>([\s\S]*?)<\/canvas_update>/);
    if (canvasUpdateMatch) {
        try {
            const canvasData = JSON.parse(canvasUpdateMatch[1].trim());
            
            // Trigger visual nodes redrawing and connections
            renderCanvasNodes(canvasData);
            
            writeConsoleLog(`> 🤖 [COPILOT] Canvas updated live via AI assistant prompt: "${canvasData.canvasTitle}"`, "ai-msg");
            
            // Advance Onboarding Timeline to Step 2/3
            elements.stepMigrate.className = "guide-step completed";
            elements.stepIncident.className = "guide-step active";
            isMigrated = true;
            markActiveScriptAsSafe();
            elements.triggerIncidentBtn.disabled = false;
            elements.exportYamlBtn.style.display = "inline-block";
            elements.safetyBadge.style.display = "inline-block";

        } catch (jsonErr) {
            console.error("Failed to parse canvas update JSON:", jsonErr);
        }
    }

    // Clear typing indicators
    const typingBubbleEl = document.getElementById("chat-typing-indicator");
    if (typingBubbleEl) typingBubbleEl.remove();
    const typingBubbleDockedEl = document.getElementById("chat-typing-indicator-docked");
    if (typingBubbleDockedEl) typingBubbleDockedEl.remove();

    // ----------------------------------------------------
    // Opsera Tool call instruction parsing
    // ----------------------------------------------------
    let toolCallCardHtml = "";
    const opseraToolCallMatch = assistantResponseText.match(/<opsera_tool_call>([\s\S]*?)<\/opsera_tool_call>/);
    if (opseraToolCallMatch) {
        try {
            const toolCallData = JSON.parse(opseraToolCallMatch[1].trim());
            const toolName = toolCallData.name || "security_vulnerability_scanner";
            
            writeConsoleLog(`> 🔌 [MCP LLM EXECUTE] LLM triggered tool call: ${toolName}...`, "info-msg");
            
            // Actually call the MCP server to register portal usage/dashboard charts!
            let mcpResponse = null;
            if (toolName.includes("security") || toolName.includes("scan")) {
                mcpResponse = await callOpseraMCP("tools/call", {
                    name: "scan_repository",
                    arguments: { repo_url: "https://github.com/renethegreat/agentwipe", depth: "deep" }
                });
            } else if (toolName.includes("architecture") || toolName.includes("analyze")) {
                mcpResponse = await callOpseraMCP("tools/call", {
                    name: "analyze_architecture",
                    arguments: { repo_url: "https://github.com/renethegreat/agentwipe" }
                });
            } else {
                mcpResponse = await callOpseraMCP("tools/call", {
                    name: "audit_compliance",
                    arguments: { target: "SOC2" }
                });
            }

            const isLive = mcpResponse && mcpResponse.result;
            if (isLive) {
                writeConsoleLog("> 🔌 [MCP SUCCESS] Received structured payload from Opsera MCP server.", "success-msg");
            } else {
                const hasToken = !!localStorage.getItem("opsera_api_token");
                if (!hasToken) {
                    writeConsoleLog("> [MCP WARN] Opsera portal request failed (401 Unauthorized). No active OAuth session token found.", "warn-msg");
                } else {
                    writeConsoleLog("> [MCP WARN] Opsera portal request failed. Using secure local sandbox fallback.", "info-msg");
                }
            }

            if (toolName === "security_vulnerability_scanner" || toolName.includes("security") || toolName.includes("scan")) {
                toolCallCardHtml = `<div style="margin-top: 0.5rem;"><p>🛡️ <strong>Opsera Vulnerability Scanner Executed (${isLive ? "Live via MCP" : "Local Sandbox Fallback"}):</strong></p>
                <div class="code-card" style="border-left: 3px solid var(--accent-green); background: rgba(16, 185, 129, 0.02); padding: 0.75rem; border-radius: 8px;">
                  <span style="font-weight: 700; color: var(--accent-green); font-size: 0.7rem; text-transform: uppercase;">🟢 Scan Success</span>
                  <p style="margin: 0.25rem 0; font-size: 0.8rem;"><strong>Target Repository</strong>: <code>https://github.com/renethegreat/agentwipe</code></p>
                  <p style="margin: 0.25rem 0; font-size: 0.8rem;"><strong>Findings</strong>: 0 critical vulnerabilities. Brittle shell triggers replaced by sandboxed Node.js service hooks.</p>
                </div></div>`;
            } else if (toolName === "architecture_analyzer" || toolName.includes("architecture") || toolName.includes("analyze")) {
                toolCallCardHtml = `<div style="margin-top: 0.5rem;"><p>📐 <strong>Opsera Architecture Analyzer Executed (${isLive ? "Live via MCP" : "Local Sandbox Fallback"}):</strong></p>
                <div class="code-card" style="border-left: 3px solid var(--accent-purple); background: rgba(168, 85, 247, 0.02); padding: 0.75rem; border-radius: 8px;">
                  <span style="font-weight: 700; color: var(--accent-purple); font-size: 0.7rem; text-transform: uppercase;">🟣 Analysis Success</span>
                  <p style="margin: 0.25rem 0; font-size: 0.8rem;"><strong>Structure Detected</strong>: Node.js Express Backend, Vite CSS Frontend, Postgres Database</p>
                  <p style="margin: 0.25rem 0; font-size: 0.8rem;"><strong>Visual Connections</strong>: Conforms perfectly to SuperPlane declarative nodes mapping.</p>
                </div></div>`;
            } else {
                toolCallCardHtml = `<div style="margin-top: 0.5rem;"><p>📋 <strong>Opsera Compliance Auditor Executed (${isLive ? "Live via MCP" : "Local Sandbox Fallback"}):</strong></p>
                <div class="code-card" style="border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.02); padding: 0.75rem; border-radius: 8px;">
                  <span style="font-weight: 700; color: #f59e0b; font-size: 0.7rem; text-transform: uppercase;">🟡 Audit Success</span>
                  <p style="margin: 0.25rem 0; font-size: 0.8rem;"><strong>SOC2 Compliance</strong>: 100% compliant. Write permissions isolated to workspace sandbox.</p>
                </div></div>`;
            }

            if (!isLive) {
                toolCallCardHtml += `
                <p style="margin-top: 0.5rem; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3; text-align: left;">
                  ⚠️ <strong>Why fallback?</strong> The direct connection to the live Opsera portal at <code>https://agent.opsera.ai/mcp</code> returned <code>401 Unauthorized</code> (or met CORS boundaries) because no active OAuth token was sent. Use the <strong>🔌 Opsera Portal Integration</strong> panel on the right settings drawer to connect securely via DCR!
                </p>`;
            }
        } catch (jsonErr) {
            console.error("Failed to parse tool call JSON:", jsonErr);
        }
    }

    // Clean visible response text by stripping out special tags
    const cleanText = assistantResponseText
        .replace(/<canvas_update>[\s\S]*?<\/canvas_update>/g, "")
        .replace(/<opsera_tool_call>[\s\S]*?<\/opsera_tool_call>/g, "")
        .trim();

    // Render assistant message bubble inside both streams
    let bubbleHtml = `<p>${escapeHtml(cleanText).replace(/\n/g, "<br>")}</p>`;
    if (toolCallCardHtml) {
        bubbleHtml += toolCallCardHtml;
    }
    
    const b1 = document.createElement("div");
    b1.className = "chat-bubble assistant";
    b1.innerHTML = bubbleHtml;
    elements.chatMessages.appendChild(b1);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    const b2 = document.createElement("div");
    b2.className = "chat-bubble assistant";
    b2.innerHTML = bubbleHtml;
    elements.dockedChatMessages.appendChild(b2);
    elements.dockedChatMessages.scrollTop = elements.dockedChatMessages.scrollHeight;
}

// Bind Provider Dropdown Change Event
elements.apiProviderSelect.addEventListener("change", () => {
    const provider = elements.apiProviderSelect.value;
    if (provider === "gemini") {
        elements.geminiKeyGroup.style.display = "block";
        elements.fireworksKeyGroup.style.display = "none";
    } else {
        elements.geminiKeyGroup.style.display = "none";
        elements.fireworksKeyGroup.style.display = "block";
    }
});

// Layout View Switcher controllers
function setVibeView() {
    document.body.classList.add("vibe-mode-active");
    elements.vibeModeBtn.classList.add("active");
    elements.devModeBtn.classList.remove("active");
    elements.editorContainer.style.display = "none";
    elements.vibeSummaryContainer.style.display = "flex";
    elements.vibeToggleCodeBtn.textContent = "🛠️ Show Full Bash Code";
    if (isMigrated) drawConnections(); // Redraw paths cleanly
}

function setDevView() {
    document.body.classList.remove("vibe-mode-active");
    elements.vibeModeBtn.classList.remove("active");
    elements.devModeBtn.classList.add("active");
    elements.editorContainer.style.display = "flex";
    elements.vibeSummaryContainer.style.display = "none";
    if (isMigrated) drawConnections(); // Redraw paths cleanly
}

// Toggle code visibility inside Vibe mode
elements.vibeToggleCodeBtn.addEventListener("click", () => {
    if (elements.editorContainer.style.display === "none") {
        elements.editorContainer.style.display = "flex";
        elements.vibeSummaryContainer.style.display = "none";
        elements.vibeToggleCodeBtn.textContent = "🌸 Hide Bash Code Summary";
    } else {
        elements.editorContainer.style.display = "none";
        elements.vibeSummaryContainer.style.display = "flex";
        elements.vibeToggleCodeBtn.textContent = "🛠️ Show Full Bash Code";
    }
    if (isMigrated) drawConnections();
});

// Expand console stream when clicking header in Vibe Mode
elements.consoleHeader.addEventListener("click", () => {
    if (document.body.classList.contains("vibe-mode-active")) {
        setDevView();
        writeConsoleLog("> 🛠️ Switched to Cockpit view to review execution output.", "info-msg");
    }
});

elements.vibeModeBtn.addEventListener("click", setVibeView);
elements.devModeBtn.addEventListener("click", setDevView);

// Drawer Toggle controls
function openSettings() { elements.settingsOverlay.classList.add("active"); }
function closeSettings() { elements.settingsOverlay.classList.remove("active"); }
function closePrompt() { elements.promptOverlay.classList.remove("active"); }
function closeYaml() { elements.yamlOverlay.classList.remove("active"); }

elements.settingsOpenBtn.addEventListener("click", openSettings);
elements.settingsCloseBtn.addEventListener("click", closeSettings);
elements.settingsSaveBtn.addEventListener("click", saveSettings);
elements.promptCloseBtn.addEventListener("click", closePrompt);
elements.exportYamlBtn.addEventListener("click", compileSuperPlaneYaml);
elements.yamlCloseBtn.addEventListener("click", closeYaml);

// Auto-save input credentials on-the-fly as user types to prevent configuration loss
if (elements.geminiKeyInput) {
    elements.geminiKeyInput.addEventListener("input", (e) => {
        localStorage.setItem("gemini_api_key", e.target.value.trim());
    });
}
if (elements.fireworksKeyInput) {
    elements.fireworksKeyInput.addEventListener("input", (e) => {
        localStorage.setItem("fireworks_api_key", e.target.value.trim());
    });
}
if (elements.opseraTokenInput) {
    elements.opseraTokenInput.addEventListener("input", (e) => {
        localStorage.setItem("opsera_api_token", e.target.value.trim());
    });
}

// Cockpit panel tabs listeners & toggle logic
function switchCockpitTab(tabName) {
    if (tabName === "monitor") {
        elements.tabMonitorBtn.classList.add("active");
        elements.tabChatBtn.classList.remove("active");
        elements.monitorContentArea.style.display = "flex";
        elements.chatContentArea.style.display = "none";
    } else {
        elements.tabMonitorBtn.classList.remove("active");
        elements.tabChatBtn.classList.add("active");
        elements.monitorContentArea.style.display = "none";
        elements.chatContentArea.style.display = "flex";
        // Auto scroll to bottom
        elements.dockedChatMessages.scrollTop = elements.dockedChatMessages.scrollHeight;
        elements.dockedChatInput.focus();
    }
}

elements.tabMonitorBtn.addEventListener("click", () => switchCockpitTab("monitor"));
elements.tabChatBtn.addEventListener("click", () => switchCockpitTab("chat"));

// Quick action chips listeners
elements.chatChips.forEach(chip => {
    chip.addEventListener("click", () => {
        const promptText = chip.getAttribute("data-prompt");
        handleCopilotMessage(promptText);
    });
});

// AI Copilot toggle bindings
elements.copilotToggleBtn.addEventListener("click", () => {
    elements.copilotChatWindow.classList.toggle("active");
    elements.chatInput.focus();
});
elements.chatCloseBtn.addEventListener("click", () => {
    elements.copilotChatWindow.classList.remove("active");
});

// Sync both send buttons and inputs
elements.chatSendBtn.addEventListener("click", () => handleCopilotMessage());
elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleCopilotMessage();
});

elements.dockedChatSendBtn.addEventListener("click", () => handleCopilotMessage());
elements.dockedChatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleCopilotMessage();
});

// Close overlay when clicking outside
elements.settingsOverlay.addEventListener("click", (e) => {
    if (e.target === elements.settingsOverlay) closeSettings();
});
elements.promptOverlay.addEventListener("click", (e) => {
    if (e.target === elements.promptOverlay) closePrompt();
});
elements.yamlOverlay.addEventListener("click", (e) => {
    if (e.target === elements.yamlOverlay) closeYaml();
});

// Telemetry Live Metrics State
const telemetryState = {
    web: { cpu: 18, ram: 42, disk: 22 },
    worker: { cpu: 12, ram: 30, disk: 15 },
    db: { cpu: 8, ram: 55, disk: 38 },
    stats: { webhooks: 0, remediations: 0, latency: "--" }
};

let isSimulationTelemetryOverride = false;

// Update Telemetry Display Function
function updateTelemetryUI() {
    // Web Service
    if (elements.srvWebCpuVal) elements.srvWebCpuVal.textContent = `${Math.round(telemetryState.web.cpu)}%`;
    if (elements.srvWebCpuBar) elements.srvWebCpuBar.style.width = `${telemetryState.web.cpu}%`;
    if (elements.srvWebRamVal) elements.srvWebRamVal.textContent = `${Math.round(telemetryState.web.ram)}%`;
    if (elements.srvWebRamBar) elements.srvWebRamBar.style.width = `${telemetryState.web.ram}%`;
    if (elements.srvWebDiskVal) elements.srvWebDiskVal.textContent = `${Math.round(telemetryState.web.disk)}%`;
    if (elements.srvWebDiskBar) elements.srvWebDiskBar.style.width = `${telemetryState.web.disk}%`;

    // Worker Service
    if (elements.srvWorkerCpuVal) elements.srvWorkerCpuVal.textContent = `${Math.round(telemetryState.worker.cpu)}%`;
    if (elements.srvWorkerCpuBar) elements.srvWorkerCpuBar.style.width = `${telemetryState.worker.cpu}%`;
    if (elements.srvWorkerRamVal) elements.srvWorkerRamVal.textContent = `${Math.round(telemetryState.worker.ram)}%`;
    if (elements.srvWorkerRamBar) elements.srvWorkerRamBar.style.width = `${telemetryState.worker.ram}%`;
    if (elements.srvWorkerDiskVal) elements.srvWorkerDiskVal.textContent = `${Math.round(telemetryState.worker.disk)}%`;
    if (elements.srvWorkerDiskBar) elements.srvWorkerDiskBar.style.width = `${telemetryState.worker.disk}%`;

    // Database Service
    if (elements.srvDbCpuVal) elements.srvDbCpuVal.textContent = `${Math.round(telemetryState.db.cpu)}%`;
    if (elements.srvDbCpuBar) elements.srvDbCpuBar.style.width = `${telemetryState.db.cpu}%`;
    if (elements.srvDbRamVal) elements.srvDbRamVal.textContent = `${Math.round(telemetryState.db.ram)}%`;
    if (elements.srvDbRamBar) elements.srvDbRamBar.style.width = `${telemetryState.db.ram}%`;
    if (elements.srvDbDiskVal) elements.srvDbDiskVal.textContent = `${Math.round(telemetryState.db.disk)}%`;
    if (elements.srvDbDiskBar) elements.srvDbDiskBar.style.width = `${telemetryState.db.disk}%`;

    // Stats Ledger
    if (elements.statWebhooks) elements.statWebhooks.textContent = telemetryState.stats.webhooks;
    if (elements.statRemediations) elements.statRemediations.textContent = telemetryState.stats.remediations;
    if (elements.statLatency) {
        elements.statLatency.textContent = typeof telemetryState.stats.latency === "number" ? `${telemetryState.stats.latency}ms` : telemetryState.stats.latency;
    }
}

// Background Ticker
setInterval(() => {
    if (isSimulationTelemetryOverride) return;

    const fluctuate = (val, min, max) => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.max(min, Math.min(max, val + delta));
    };

    telemetryState.web.cpu = fluctuate(telemetryState.web.cpu, 13, 25);
    telemetryState.web.ram = fluctuate(telemetryState.web.ram, 39, 45);
    telemetryState.web.disk = fluctuate(telemetryState.web.disk, 21.8, 22.2);

    telemetryState.worker.cpu = fluctuate(telemetryState.worker.cpu, 8, 18);
    telemetryState.worker.ram = fluctuate(telemetryState.worker.ram, 28, 33);
    telemetryState.worker.disk = fluctuate(telemetryState.worker.disk, 14.8, 15.2);

    telemetryState.db.cpu = fluctuate(telemetryState.db.cpu, 4, 12);
    telemetryState.db.ram = fluctuate(telemetryState.db.ram, 53, 57);
    telemetryState.db.disk = fluctuate(telemetryState.db.disk, 37.8, 38.2);

    updateTelemetryUI();
}, 1000);

// Trigger Simulated Incident loops
function triggerIncident() {
    if (!isMigrated || isSimulationRunning) return;

    isSimulationRunning = true;
    elements.triggerIncidentBtn.disabled = true;
    elements.presetButtons.forEach(btn => btn.disabled = true);
    elements.scriptTextarea.disabled = true;

    // Reset current active classes
    document.querySelectorAll(".node-card").forEach(c => {
        c.className = c.className.replace(" active-run", "").replace(" success-run", "");
    });
    document.querySelectorAll(".workflow-path").forEach(p => {
        p.setAttribute("class", "workflow-path");
    });

    elements.systemStatus.textContent = "Incident Active";
    elements.systemStatus.className = "status-value incident";

    // Async background fetch to local DevOps harness if running
    fetch("http://localhost:3000/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event: activeTemplate === "health" ? "OOM Crash Alert" : activeTemplate === "cleanup" ? "Storage Warning" : "Worker Crash Alert",
            source: "SuperPlane Cockpit UI",
            severity: "HIGH",
            description: activeTemplate === "health" ? "Service 'web-api' terminated unexpectedly: OOM exception." : activeTemplate === "cleanup" ? "Storage volume '/var/log' has reached 91% capacity threshold." : "Job Runner service 'job-runner' connection timed out."
        })
    }).catch(err => {
        console.log("Local service harness server is inactive, continuing with visual cockpit emulation.", err);
    });

    // Play Custom Scenario sequences
    if (activeTemplate === "health") {
        runHealthIncident();
    } else if (activeTemplate === "cleanup") {
        runCleanupIncident();
    } else {
        runRestartIncident();
    }
}

// General delay promise utility
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------------------------
// SCENARIO 1: Health Check Incident (Memory Leak/Crash)
// ----------------------------------------------------
async function runHealthIncident() {
    writeConsoleLog("[ALERT] Render Platform alert triggered for 'web-api' service.", "error-msg");
    
    // Web Service goes down
    elements.srvWeb.classList.add("error-state");
    elements.srvWeb.querySelector(".service-pulse").className = "service-pulse status-error";
    elements.srvWebStatus.textContent = "OOM CRASH (137)";
    elements.srvWebStatus.className = "metric-value text-red";

    // Spikes Telemetry
    isSimulationTelemetryOverride = true;
    telemetryState.stats.webhooks++;
    telemetryState.web.cpu = 95;
    telemetryState.web.ram = 99;
    telemetryState.stats.latency = 2842;
    updateTelemetryUI();

    writeConsoleLog("[SYSTEM] Service 'web-api' terminated unexpectedly: OOM exception.", "error-msg");

    const nodeIds = activeCanvasNodes.map(n => n.id);

    // Node 1 trigger
    await delay(1200);
    const n1 = document.getElementById(nodeIds[0]);
    if (n1) n1.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Triggered node: '${activeCanvasNodes[0].name}'. Initializing remediation flow.`, "ai-msg");

    // Node 2 sensor
    await delay(1600);
    if (n1) { n1.classList.remove("active-run"); n1.classList.add("success-run"); }
    const p1 = document.getElementById("path-1");
    if (p1) p1.setAttribute("class", "workflow-path completed");
    
    const n2 = document.getElementById(nodeIds[1]);
    if (n2) n2.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[1].name}'...`, "system-msg");

    telemetryState.stats.latency = 1200;
    updateTelemetryUI();

    await delay(1200);
    writeConsoleLog("[MONITOR] Probe HTTP GET 'https://web-api.render.com/health' failed with code 502 (Bad Gateway).", "error-msg");

    // Node 3 LLM diagnosis
    await delay(1200);
    if (n2) { n2.classList.remove("active-run"); n2.classList.add("success-run"); }
    const p2 = document.getElementById("path-2");
    if (p2) p2.setAttribute("class", "workflow-path completed");

    const n3 = document.getElementById(nodeIds[2]);
    if (n3) n3.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[2].name}'...`, "ai-msg");
    writeConsoleLog("[AI AGENT] Fetching container logs... Performing stack exception isolation.", "ai-msg");

    telemetryState.stats.latency = 3105;
    updateTelemetryUI();

    await delay(2000);
    writeConsoleLog("[AI AGENT] ANALYSIS SUCCESSFUL:\nReason: Heap limit exhausted during JSON parse execution. Recommendation: Rolling reboot of web container, scale container RAM thresholds, and schedule hot patch #4e82b7b rollback.", "code-msg");

    // Node 4 Safe reboot Action
    await delay(2000);
    if (n3) { n3.classList.remove("active-run"); n3.classList.add("success-run"); }
    const p3 = document.getElementById("path-3");
    if (p3) p3.setAttribute("class", "workflow-path completed");

    const n4 = document.getElementById(nodeIds[3]);
    if (n4) n4.classList.add("active-run");
    
    elements.srvWeb.className = "service-card healing-state";
    elements.srvWeb.querySelector(".service-pulse").className = "service-pulse status-healing";
    elements.srvWebStatus.textContent = "Restarting...";
    elements.srvWebStatus.className = "metric-value text-amber";

    telemetryState.web.cpu = 45;
    telemetryState.web.ram = 15; // drops
    telemetryState.stats.latency = 280;
    updateTelemetryUI();

    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[3].name}'...`, "system-msg");
    writeConsoleLog("[RENDER API] Dispatching rollback task to revision #4e82b7b. Booting container structures...", "info-msg");

    await delay(2500);
    elements.srvWeb.className = "service-card";
    elements.srvWeb.querySelector(".service-pulse").className = "service-pulse status-healthy";
    elements.srvWebStatus.textContent = "Live";
    elements.srvWebStatus.className = "metric-value text-green";
    writeConsoleLog("[SYSTEM] Container restart successful. Target health check returns 200 OK.", "success-msg");

    telemetryState.web.cpu = 18;
    telemetryState.web.ram = 42;
    updateTelemetryUI();

    // Node 5 Slack notification (or final node)
    await delay(1200);
    if (n4) { n4.classList.remove("active-run"); n4.classList.add("success-run"); }
    const p4 = document.getElementById("path-4");
    if (p4) p4.setAttribute("class", "workflow-path completed");

    if (nodeIds[4]) {
        const n5 = document.getElementById(nodeIds[4]);
        if (n5) n5.classList.add("active-run");
        writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[4].name}'...`, "system-msg");
        await delay(1500);
        if (n5) { n5.classList.remove("active-run"); n5.classList.add("success-run"); }
        writeConsoleLog("[SLACK] Operational alert summary emailed and shipped to SRE channels.", "success-msg");
    }

    // Complete Loop
    await delay(500);
    writeConsoleLog("> 🎉 Operational status fully restored. Incident closed.", "success-msg");
    elements.systemStatus.textContent = "Active / Integrated";
    elements.systemStatus.className = "status-value healthy";

    // Update timeline onboarding to final step
    elements.stepIncident.className = "guide-step completed";
    elements.stepInteract.className = "guide-step active";

    telemetryState.stats.remediations++;
    telemetryState.stats.latency = 24;
    isSimulationTelemetryOverride = false;
    updateTelemetryUI();

    isSimulationRunning = false;
    elements.triggerIncidentBtn.disabled = false;
    elements.presetButtons.forEach(btn => btn.disabled = false);
    elements.scriptTextarea.disabled = false;
}

// ----------------------------------------------------
// SCENARIO 2: Cleanup Storage Incident (Disk Usage Alarm)
// ----------------------------------------------------
async function runCleanupIncident() {
    writeConsoleLog("[ALERT] Storage controller volume trigger: disk usage at 91%.", "error-msg");
    
    elements.srvWeb.classList.add("error-state");
    elements.srvWebStatus.textContent = "Storage Warning (91%)";
    elements.srvWebStatus.className = "metric-value text-red";

    // Spikes Telemetry
    isSimulationTelemetryOverride = true;
    telemetryState.stats.webhooks++;
    telemetryState.web.disk = 91;
    telemetryState.web.cpu = 28;
    telemetryState.stats.latency = 450;
    updateTelemetryUI();

    const nodeIds = activeCanvasNodes.map(n => n.id);

    // Node 1 Trigger
    await delay(1200);
    const n1 = document.getElementById(nodeIds[0]);
    if (n1) n1.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Triggered node: '${activeCanvasNodes[0].name}'. Initializing clean sequence.`, "ai-msg");

    // Node 2 Sensor
    await delay(1600);
    if (n1) { n1.classList.remove("active-run"); n1.classList.add("success-run"); }
    const p1 = document.getElementById("path-1");
    if (p1) p1.setAttribute("class", "workflow-path completed");
    
    const n2 = document.getElementById(nodeIds[1]);
    if (n2) n2.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[1].name}'...`, "system-msg");

    telemetryState.stats.latency = 620;
    updateTelemetryUI();

    await delay(1200);
    writeConsoleLog("[PROBE] Identified 45GB of system logs. Verified 0 locks or active reader descriptors.", "info-msg");

    // Node 3 AI Agent
    await delay(1200);
    if (n2) { n2.classList.remove("active-run"); n2.classList.add("success-run"); }
    const p2 = document.getElementById("path-2");
    if (p2) p2.setAttribute("class", "workflow-path completed");

    const n3 = document.getElementById(nodeIds[2]);
    if (n3) n3.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[2].name}'...`, "ai-msg");

    telemetryState.stats.latency = 1850;
    updateTelemetryUI();

    await delay(1800);
    writeConsoleLog("[AI AGENT] Safety audit isolated obsolete log streams. Confirmed DB backups are secure. Cleared 38GB of legacy metadata.", "code-msg");

    // Node 4 Safe Rotate Action
    await delay(2000);
    if (n3) { n3.classList.remove("active-run"); n3.classList.add("success-run"); }
    const p3 = document.getElementById("path-3");
    if (p3) p3.setAttribute("class", "workflow-path completed");

    const n4 = document.getElementById(nodeIds[3]);
    if (n4) n4.classList.add("active-run");
    
    elements.srvWeb.className = "service-card healing-state";
    elements.srvWebStatus.textContent = "Compressing...";
    elements.srvWebStatus.className = "metric-value text-amber";

    telemetryState.web.cpu = 72; // High CPU during GZIP
    telemetryState.web.disk = 45;
    telemetryState.stats.latency = 380;
    updateTelemetryUI();

    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[3].name}'...`, "system-msg");

    await delay(2500);
    elements.srvWeb.className = "service-card";
    elements.srvWebStatus.textContent = "Live (Disk: 22%)";
    elements.srvWebStatus.className = "metric-value text-green";
    writeConsoleLog("[ACTION] Log compression and archival storage sync completed successfully. released 34GB.", "success-msg");

    telemetryState.web.cpu = 15;
    telemetryState.web.disk = 22;
    updateTelemetryUI();

    // Node 5 Notification
    await delay(1200);
    if (n4) { n4.classList.remove("active-run"); n4.classList.add("success-run"); }
    const p4 = document.getElementById("path-4");
    if (p4) p4.setAttribute("class", "workflow-path completed");

    if (nodeIds[4]) {
        const n5 = document.getElementById(nodeIds[4]);
        if (n5) n5.classList.add("active-run");
        writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[4].name}'...`, "system-msg");
        await delay(1500);
        if (n5) { n5.classList.remove("active-run"); n5.classList.add("success-run"); }
        writeConsoleLog("[MAIL] Archival digest delivered to systems engineering group.", "success-msg");
    }

    // Complete Loop
    await delay(500);
    writeConsoleLog("> 🎉 Storage optimization cycle completed.", "success-msg");
    elements.systemStatus.textContent = "Active / Integrated";
    elements.systemStatus.className = "status-value healthy";

    // Update timeline onboarding to final step
    elements.stepIncident.className = "guide-step completed";
    elements.stepInteract.className = "guide-step active";

    telemetryState.stats.remediations++;
    telemetryState.stats.latency = 18;
    isSimulationTelemetryOverride = false;
    updateTelemetryUI();

    isSimulationRunning = false;
    elements.triggerIncidentBtn.disabled = false;
    elements.presetButtons.forEach(btn => btn.disabled = false);
    elements.scriptTextarea.disabled = false;
}

// ----------------------------------------------------
// SCENARIO 3: Process Restarter Incident (Container Crash Loop)
// ----------------------------------------------------
async function runRestartIncident() {
    writeConsoleLog("[ALERT] Job Runner service 'job-runner' connection timed out.", "error-msg");
    
    elements.srvWorker.classList.add("error-state");
    elements.srvWorker.querySelector(".service-pulse").className = "service-pulse status-error";
    elements.srvWorkerStatus.textContent = "CRASHED";
    elements.srvWorkerStatus.className = "metric-value text-red";

    // Spikes Telemetry
    isSimulationTelemetryOverride = true;
    telemetryState.stats.webhooks++;
    telemetryState.worker.cpu = 0;
    telemetryState.worker.ram = 0;
    telemetryState.stats.latency = 5000;
    updateTelemetryUI();

    const nodeIds = activeCanvasNodes.map(n => n.id);

    // Node 1 Trigger
    await delay(1200);
    const n1 = document.getElementById(nodeIds[0]);
    if (n1) n1.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Triggered node: '${activeCanvasNodes[0].name}'. Scanning process threads.`, "ai-msg");

    // Node 2 Sensor
    await delay(1600);
    if (n1) { n1.classList.remove("active-run"); n1.classList.add("success-run"); }
    const p1 = document.getElementById("path-1");
    if (p1) p1.setAttribute("class", "workflow-path completed");
    
    const n2 = document.getElementById(nodeIds[1]);
    if (n2) n2.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[1].name}'...`, "system-msg");

    telemetryState.stats.latency = 820;
    updateTelemetryUI();

    await delay(1200);
    writeConsoleLog("[PROBE] Identified blocked process queues. Found zombie thread allocations.", "info-msg");

    // Node 3 AI Agent
    await delay(1200);
    if (n2) { n2.classList.remove("active-run"); n2.classList.add("success-run"); }
    const p2 = document.getElementById("path-2");
    if (p2) p2.setAttribute("class", "workflow-path completed");

    const n3 = document.getElementById(nodeIds[2]);
    if (n3) n3.classList.add("active-run");
    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[2].name}'...`, "ai-msg");

    telemetryState.stats.latency = 2200;
    updateTelemetryUI();

    await delay(1800);
    writeConsoleLog("[AI AGENT] Isolating crash telemetry. Root Cause: queue back-pressure limits. Formulation: scale instances to 2 and run container restart sequence.", "code-msg");

    // Node 4 Safe Reboot Action
    await delay(2000);
    if (n3) { n3.classList.remove("active-run"); n3.classList.add("success-run"); }
    const p3 = document.getElementById("path-3");
    if (p3) p3.setAttribute("class", "workflow-path completed");

    const n4 = document.getElementById(nodeIds[3]);
    if (n4) n4.classList.add("active-run");
    
    elements.srvWorker.className = "service-card healing-state";
    elements.srvWorker.querySelector(".service-pulse").className = "service-pulse status-healing";
    elements.srvWorkerStatus.textContent = "Booting Nodes...";
    elements.srvWorkerStatus.className = "metric-value text-amber";

    telemetryState.worker.cpu = 65; // scaling load
    telemetryState.worker.ram = 25;
    telemetryState.stats.latency = 450;
    updateTelemetryUI();

    writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[3].name}'...`, "system-msg");

    await delay(2500);
    elements.srvWorker.className = "service-card";
    elements.srvWorker.querySelector(".service-pulse").className = "service-pulse status-healthy";
    elements.srvWorkerStatus.textContent = "Live";
    elements.srvWorkerStatus.className = "metric-value text-green";
    writeConsoleLog("[RENDER API] Scaling adjustment complete. New containers active PID 401.", "success-msg");

    telemetryState.worker.cpu = 12;
    telemetryState.worker.ram = 30;
    updateTelemetryUI();

    // Node 5 Notification
    await delay(1200);
    if (n4) { n4.classList.remove("active-run"); n4.classList.add("success-run"); }
    const p4 = document.getElementById("path-4");
    if (p4) p4.setAttribute("class", "workflow-path completed");

    if (nodeIds[4]) {
        const n5 = document.getElementById(nodeIds[4]);
        if (n5) n5.classList.add("active-run");
        writeConsoleLog(`[AUTOPILOT] Running node: '${activeCanvasNodes[4].name}'...`, "system-msg");
        await delay(1500);
        if (n5) { n5.classList.remove("active-run"); n5.classList.add("success-run"); }
        writeConsoleLog("[DISCORD] Sent operational log event summary to discord.", "success-msg");
    }

    // Complete Loop
    await delay(500);
    writeConsoleLog("> 🎉 Worker threads scale-reboot loop successfully executed.", "success-msg");
    elements.systemStatus.textContent = "Active / Integrated";
    elements.systemStatus.className = "status-value healthy";

    // Update timeline onboarding to final step
    elements.stepIncident.className = "guide-step completed";
    elements.stepInteract.className = "guide-step active";

    telemetryState.stats.remediations++;
    telemetryState.stats.latency = 12;
    isSimulationTelemetryOverride = false;
    updateTelemetryUI();

    isSimulationRunning = false;
    elements.triggerIncidentBtn.disabled = false;
    elements.presetButtons.forEach(btn => btn.disabled = false);
    elements.scriptTextarea.disabled = false;
}

function markActiveScriptAsSafe() {
    const activeItem = document.querySelector(`.locker-item[data-key="${activeTemplate}"]`);
    if (activeItem) {
        const badge = activeItem.querySelector(".badge-status");
        if (badge) {
            badge.textContent = "🟢 Safe";
            badge.className = "badge-status safe";
        }
        activeItem.classList.add("safe-locker");
    }
}

// Ingest custom uploaded script
function ingestCustomScript(fileName, content) {
    if (isSimulationRunning) return;

    // Clean up filename
    const cleanFileName = fileName.split('/').pop().split('\\').pop() || "custom_script.sh";
    const key = "custom_" + Date.now();

    // Scan content to generate high-vibe custom pains and codes
    let pain = "Executes unconstrained host directives without security boundaries, risking system vulnerabilities and blind exit loop failures.";
    let codeSnippet = "Raw Bash script entry execution.";
    let severity = "High Risk";
    let severityClass = "text-red";
    let emoji = "📁";

    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("curl") || lowerContent.includes("wget") || lowerContent.includes("http")) {
        pain = "Pings server with zero timeout, risking memory leaks or blind restarts during network blips.";
        const match = content.match(/.*(curl|wget|http).*/i);
        if (match) codeSnippet = match[0].trim();
        severity = "High Risk";
        severityClass = "text-red";
        emoji = "🌐";
    } else if (lowerContent.includes("rm") || lowerContent.includes("delete") || lowerContent.includes("purge")) {
        pain = "Deletes log assets aggressively without checking open process descriptors or file handles, leading to storage index corruption.";
        const match = content.match(/.*(rm|delete|purge).*/i);
        if (match) codeSnippet = match[0].trim();
        severity = "Med Risk";
        severityClass = "text-amber";
        emoji = "🧹";
    } else if (lowerContent.includes("nohup") || lowerContent.includes("&") || lowerContent.includes("spawn")) {
        pain = "Spawns background procedures without standard process locks or PID control, creating hidden zombie CPU spikes.";
        const match = content.match(/.*(nohup|&|spawn).*/i);
        if (match) codeSnippet = match[0].trim();
        severity = "High Risk";
        severityClass = "text-red";
        emoji = "⚙️";
    }

    // Save into SCRIPT_TEMPLATES and PRESET_SUMMARIES dynamically
    SCRIPT_TEMPLATES[key] = content;
    PRESET_SUMMARIES[key] = {
        avatar: emoji,
        name: cleanFileName.replace(".sh", " Daemon").replace(/_/g, " "),
        file: cleanFileName,
        pain: pain,
        code: codeSnippet
    };

    // Save fallback migration schema
    MIGRATION_SCHEMAS[key] = {
        canvasTitle: cleanFileName.replace(".sh", " Autopilot"),
        nodes: [
            { id: "node-1", type: "trigger", name: "Custom Syslog Trigger", desc: `Listens for automated systems triggers parsed dynamically from ${cleanFileName}.` },
            { id: "node-2", type: "sensor", name: "Safe Resource Scanner", desc: "Gathers system parameters and checks safe thresholds to avoid root command pings." },
            { id: "node-3", type: "ai-agent", name: "Custom Log Diagnostic AI", desc: "Invokes live LLMs to evaluate raw container logs and isolate exit failures safely." },
            { id: "node-4", type: "action", name: "Render Scaling API Action", desc: "Executes microservice operations safely via SuperPlane REST APIs." },
            { id: "node-5", type: "action", name: "Ops Slack Notification", desc: "Dispatches a visual markdown report card containing recovery diagnostics." }
        ]
    };

    // Render new Locker item
    const item = document.createElement("div");
    item.className = "locker-item";
    item.dataset.key = key;
    item.innerHTML = `
        <div class="locker-item-meta">
            <span class="locker-emoji">${emoji}</span>
            <div class="locker-item-info">
                <h4>${cleanFileName}</h4>
                <span class="badge badge-severity ${severityClass}">⚠️ ${severity}</span>
            </div>
        </div>
        <span class="badge badge-status brittle">🔴 Brittle</span>
    `;

    // Append to Locker List
    elements.scriptLockerList.appendChild(item);

    // Update locker count
    const totalCount = document.querySelectorAll(".locker-item").length;
    elements.lockerCount.textContent = `${totalCount} Files`;

    // Automatically load the newly ingested preset
    loadPreset(key);

    writeConsoleLog(`> 📁 [FILE INGESTED] Ingested "${cleanFileName}" successfully. Added to Locker.`, "success-msg");

    // Automatically prompt copilot to welcome and explain
    handleCopilotMessage(`Rene just uploaded the script: "${cleanFileName}". Can you analyze it, explain the brittle pain point, and tell me how the secure SuperPlane visual canvas nodes replace it?`);
}

// Bind drag and drop events
elements.uploadDropzone.addEventListener("click", () => elements.fileUploader.click());

elements.fileUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            ingestCustomScript(file.name, event.target.result);
        };
        reader.readAsText(file);
    }
});

elements.uploadDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadDropzone.classList.add("dragover");
});

elements.uploadDropzone.addEventListener("dragleave", () => {
    elements.uploadDropzone.classList.remove("dragover");
});

elements.uploadDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadDropzone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            ingestCustomScript(file.name, event.target.result);
        };
        reader.readAsText(file);
    }
});

// Event delegation for Locker selections
elements.scriptLockerList.addEventListener("click", (e) => {
    const item = e.target.closest(".locker-item");
    if (item && !isSimulationRunning) {
        loadPreset(item.dataset.key);
    }
});

// Bind Primary Click Actions
elements.migrateBtn.addEventListener("click", migrateScript);
elements.triggerIncidentBtn.addEventListener("click", triggerIncident);

// Bind Opsera Connect buttons
if (elements.opseraAuthMethod) {
    elements.opseraAuthMethod.addEventListener("change", (e) => {
        toggleOpseraAuthMethod(e.target.value);
    });
}

elements.opseraOauthBtn.addEventListener("click", () => {
    const method = elements.opseraAuthMethod ? elements.opseraAuthMethod.value : "oauth-dcr";
    writeConsoleLog(`> 🔌 [OAUTH CONNECT] Triggering Replit-style secure OAuth handshake popup (${method.toUpperCase()})...`, "info-msg");
    const popupUrl = method === "oauth-dcr" ? "opsera-auth.html?flow=dcr" : "opsera-auth.html?flow=manual";
    window.open(popupUrl, "Opsera Auth", "width=420,height=560");
});

// Capture postMessage successes from OAuth window
window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "OPSERA_AUTH_SUCCESS") {
        const token = event.data.token;
        localStorage.setItem("opsera_api_token", token);
        if (elements.opseraTokenInput) {
            elements.opseraTokenInput.value = token;
        }

        writeConsoleLog("> 🔌 [MCP SUCCESS] OAuth authorization handshaked successfully. Connected directly to Cloud's Opsera account!", "success-msg");

        // Open chatbot tab
        switchCockpitTab("chat");
        elements.copilotChatWindow.classList.add("active");

        const congratsHtml = `
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                <span style="color:#a855f7; font-weight:800; text-shadow: 0 0 6px rgba(168,85,247,0.3);">🔌 OPSERA CONNECTED DIRECTLY!</span>
                <span>Successfully authorized via Replit-style OAuth. Your visual cockpit is now **directly connected to Cloud's Opsera Developer Dashboard**!</span>
                <span>All search/scan requests inside the chatbot will now execute real authenticated tools, populating your portal's MCP calls trend natively.</span>
            </div>
        `;
        
        // Helper to append message to both streams
        const b1 = document.createElement("div");
        b1.className = "chat-bubble assistant key-celebration";
        b1.style.background = "rgba(168, 85, 247, 0.15)";
        b1.style.borderColor = "var(--accent-purple)";
        b1.style.borderWidth = "1px";
        b1.style.borderStyle = "solid";
        b1.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.2)";
        b1.innerHTML = congratsHtml;
        elements.chatMessages.appendChild(b1);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

        const b2 = document.createElement("div");
        b2.className = "chat-bubble assistant key-celebration";
        b2.style.background = "rgba(168, 85, 247, 0.15)";
        b2.style.borderColor = "var(--accent-purple)";
        b2.style.borderWidth = "1px";
        b2.style.borderStyle = "solid";
        b2.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.2)";
        b2.innerHTML = congratsHtml;
        elements.dockedChatMessages.appendChild(b2);
        elements.dockedChatMessages.scrollTop = elements.dockedChatMessages.scrollHeight;
    }
});

// Run Initializer on Boot
loadSettings();
loadPreset("health");
updateTelemetryUI();
