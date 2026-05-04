module.exports = async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('SLACK_WEBHOOK_URL env var is missing');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Forward the request body to Slack
        const slackResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        if (!slackResponse.ok) {
            throw new Error(`Slack webhook returned ${slackResponse.status}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending Slack notification:', error);
        res.status(500).json({ error: error.message });
    }
};
