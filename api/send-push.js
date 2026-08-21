export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ONE_SIGNAL_APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const REST_API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7v2jxfbclw6suoivpksfc3dfejroalu2lsxuilihvkollgscmtcqf53lh6um2jjoqomnw4dxpvetiaki";

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const pushPayload = {
      app_id: ONE_SIGNAL_APP_ID,
      ...bodyData
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Key ${REST_API_KEY.trim()}`
      },
      body: JSON.stringify(pushPayload)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
