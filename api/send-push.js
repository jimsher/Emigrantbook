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

  const APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const RAW_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7v2tssegoiobev7ea55o2ny4ed6235aeqqpnk7xfzkd4a7lcavv3dgsrgpjiaupczkm3llgp57d4esui";
  const API_KEY = RAW_KEY.trim();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const payload = {
      app_id: APP_ID,
      ...body
    };

    const configs = [
      { url: "https://api.onesignal.com/notifications", auth: `Key ${API_KEY}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Basic ${API_KEY}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Key ${API_KEY}` },
      { url: "https://api.onesignal.com/notifications", auth: `Basic ${API_KEY}` }
    ];

    let lastResult = null;

    for (const cfg of configs) {
      const response = await fetch(cfg.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "accept": "application/json",
          "Authorization": cfg.auth
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      lastResult = result;

      // თუ შეტყობინება წარმატებით გაიგზავნა
      if (result.id || (result.errors && !JSON.stringify(result.errors).includes("Access denied"))) {
        return res.status(200).json(result);
      }
    }

    return res.status(200).json(lastResult);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
