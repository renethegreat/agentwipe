// Trigger Node: Ingestion Endpoint
// Secure webhook ingestion daemon replacing fragile shell cron polling.
const express = require('express');
const router = express.Router();

function createTriggerRouter(pipelineCallback) {
    // Secure webhook ingestion endpoint
    router.post('/', (req, res) => {
        const { event, source, description, severity } = req.body;
        
        console.log(`\n[TRIGGER EVENT INGESTED]`);
        console.log(`- Source: ${source || 'Render API'}`);
        console.log(`- Event: ${event || 'Memory Warning'}`);
        console.log(`- Severity: ${severity || 'HIGH'}`);
        console.log(`- Description: ${description || 'Disk consumption exceeded threshold (91%)'}`);

        // Launch pipeline callback asynchronously
        pipelineCallback({
            eventId: `evt_${Date.now()}`,
            event,
            source,
            severity,
            description,
            timestamp: new Date().toISOString()
        });

        res.status(202).json({
            status: "success",
            message: "Trigger registered inside SuperPlane Service Harness. Processing sandboxed workflow..."
        });
    });

    return router;
}

module.exports = { createTriggerRouter };
