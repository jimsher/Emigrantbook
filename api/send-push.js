export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ONE_SIGNAL_APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const APP_API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vy2fxnb5wspu2k4hf74jhsxjcrat6gi5kd5v62e3nvkl4nksxpkzzhj53cjpl4xzx7f2p3h45agofui";

  try {
    let bodyData = {};
    if (typeof req.body === 'string') {
      try { bodyData = JSON.parse(req.body); } catch (e) { bodyData = {}; }
    } else if (req.body) {
      bodyData = req.body;
    }

    // მიმღების ID-ის ამოღება
    let recipientId = bodyData.recipient_id;
    if (!recipientId && bodyData.include_aliases && bodyData.include_aliases.external_id) {
      recipientId = bodyData.include_aliases.external_id[0];
    }
    if (!recipientId && Array.isArray(bodyData.include_external_user_ids)) {
      recipientId = bodyData.include_external_user_ids[0];
    }

    // OneSignal V2-ის სტანდარტის სუფთა Payload
    const pushPayload = {
      app_id: ONE_SIGNAL_APP_ID,
      headings: bodyData.headings || { en: "ახალი შეტყობინება", ka: "ახალი შეტყობინება" },
      contents: bodyData.contents || { en: "გაქვთ ახალი შეტყობინება", ka: "გაქვთ ახალი შეტყობინება" },
      url: bodyData.url || "https://emigrantbook.com"
    };

    if (recipientId) {
      pushPayload.include_aliases = { external_id: [String(recipientId)] };
      pushPayload.target_channel = "push";
    } else {
      pushPayload.included_segments = ["Total Subscriptions"];
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "accept": "application/json",
        "Authorization": `Key ${APP_API_KEY.trim()}`
      },
      body: JSON.stringify(pushPayload)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
