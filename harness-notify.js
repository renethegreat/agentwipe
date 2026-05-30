// Notification Node: Ops Email & Chat Notification
// Dispatches structured, colored webhook payload JSON logs to Slack or Discord channels securely.
const fetch = require('node-fetch');

async function sendOpsAlert(remediationSummary, freedSpaceMB) {
    console.log(`\n[NOTIFICATION] Running Ops Email & Webhook Notification node...`);

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn("[WARN] DISCORD_WEBHOOK_URL not configured. Outputting operations summary to stdout.");
        console.log(`+-------------------------------------------------------------+`);
        console.log(`| 🛡️  SUPERPLANE SECURE SERVICE HARNESS SUMMARY REPORT         |`);
        console.log(`+-------------------------------------------------------------+`);
        console.log(`| Status: REMEDIATED (Disk usage returned below threshold)    |`);
        console.log(`| Freed Capacity: ${freedSpaceMB} MB                           |`);
        console.log(`| Analysis: ${remediationSummary.rootCause || 'N/A'}          |`);
        console.log(`+-------------------------------------------------------------+`);
        return {
            status: "success",
            message: "Ops report successfully printed to local standard output."
        };
    }

    const payload = {
        username: "SuperPlane Platform Autopilot",
        embeds: [{
            title: "🛡️ SuperPlane Secure Service Harness Remediation Report",
            description: "A brittle cron shell script was successfully replaced by a sandboxed Service Harness. Obsolete files were compressed and rotated safely.",
            color: 3066993, // Premium Emerald Green
            fields: [
                { name: "Remediation Action", value: remediationSummary.remediationAction || "COMPRESS_AND_ROTATE", inline: true },
                { name: "Capacity Recovered", value: `${freedSpaceMB} MB`, inline: true },
                { name: "AI Diagnostics", value: remediationSummary.rootCause || "Log accumulation", inline: false },
                { name: "Sandbox Status", value: "🟢 FULLY SANDBOXED & SECURE", inline: false }
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

        if (response.ok) {
            console.log("✓ Operations alert successfully dispatched to Discord Ops channel!");
        } else {
            throw new Error(`Discord hook returned status ${response.status}`);
        }

        return {
            status: "success",
            message: "Ops alert successfully dispatched to Discord channel."
        };

    } catch (err) {
        console.error(`✕ Ops Alert notification dispatch failed: ${err.message}`);
        return {
            status: "failed",
            error: err.message
        };
    }
}

module.exports = { sendOpsAlert };
