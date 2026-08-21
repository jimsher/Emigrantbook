export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const RAW_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vy2fxnb5wspu2k4hf74jhsxjcrat6gi5kd5v62e3nvkl4nksxpkzzhj53cjpl4xzx7f2p3h45agofui";
  const API_KEY = RAW_KEY.trim();

  try {
    let bodyData = {};
    if (typeof req.body === 'string') {
      try { bodyData = JSON.parse(req.body); } catch (e) { bodyData = {}; }
    } else if (req.body) {
      bodyData = req.body;
    }

    // app_id ფიქსირდება ბოლოში, რომ ფრონტიდან არ გადაეწეროს
    const pushPayload = {
      ...bodyData,
      app_id: APP_ID
    };

    const attempts = [
      { url: "https://api.onesignal.com/notifications", auth: `Key ${API_KEY}` },
      { url: "https://api.onesignal.com/notifications", auth: `Bearer ${API_KEY}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Key ${API_KEY}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Basic ${Buffer.from(API_KEY + ":").toString('base64')}` }
    ];

    let finalResponse = null;

    for (const attempt of attempts) {
      const resp = await fetch(attempt.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "accept": "application/json",
          "Authorization": attempt.auth
        },
        body: JSON.stringify(pushPayload)
      });

      const json = await resp.json();
      finalResponse = json;

      if (json.id || json.recipients !== undefined || !JSON.stringify(json).includes("Access denied")) {
        return res.status(200).json(json);
      }
    }

    return res.status(200).json(finalResponse);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
