export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ONE_SIGNAL_APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const APP_API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vy2fxnb5wspu2k4hf74jhsxjcrat6gi5kd5v62e3nvkl4nksxpkzzhj53cjpl4xzx7f2p3h45agofui";

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const recipientId = bodyData.recipient_id;
    const senderName = bodyData.sender_name || "EmigrantBook";
    const messageText = bodyData.message_text || "ახალი შეტყობინება";
    const senderUid = bodyData.sender_uid || "";

    const pushPayload = {
      app_id: ONE_SIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [String(recipientId)]
      },
      headings: { ka: senderName, en: senderName, it: senderName, ru: senderName },
      contents: { ka: messageText, en: messageText, it: messageText, ru: messageText },
      url: `https://emigrantbook.com/messenger.html?uid=${senderUid}`
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
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
