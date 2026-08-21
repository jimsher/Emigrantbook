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
  const API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7v2tssegoiobev7ea55o2ny4ed6235aeqqpnk7xfzkd4a7lcavv3dgsrgpjiaupczkm3llgp57d4esui";

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const payload = {
      app_id: APP_ID,
      ...body
    };

    // 1. ცდა ოფიციალურ v1 სერვერზე Key ავტორიზაციით
    let onesignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    let result = await onesignalRes.json();

    // 2. თუ v1-მა დაიწუნა, ცდა api.onesignal.com-ზე Bearer-ით
    if (result.errors && JSON.stringify(result.errors).includes("Access denied")) {
      onesignalRes = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      result = await onesignalRes.json();
    }

    return res.status(200).json({
      build: "v5_live",
      ...result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
