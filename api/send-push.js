export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ONE_SIGNAL_APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const ORG_API_KEY = "os_v2_org_ohkifot4rjcovl4ogegabgduycyjl5cl4fiuzlnrzjqn2aw6kg63gxikmsdnsengoqamgua7kka6gy2svbs2wz4n32g4pfwvcwiqlci";

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const pushPayload = {
      ...bodyData,
      app_id: ONE_SIGNAL_APP_ID
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "accept": "application/json",
        "Authorization": `Key ${ORG_API_KEY.trim()}`
      },
      body: JSON.stringify(pushPayload)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
