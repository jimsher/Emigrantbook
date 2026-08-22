export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ONE_SIGNAL_APP_ID = "62724a32-cffe-4878-bc5f-32118f487f1d";
  const APP_API_KEY = "os_v2_org_d47bm2anxvaf3lzfgtqfp7qm22ilvb5ib6temwmva3z7wemahcacsj4eqakmsfb355gmdb46xkm5mavwhw2el7aiexumdhnhusadpzq";

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const recipientId = String(bodyData.recipient_id || "");
    const senderName = bodyData.sender_name || "EmigrantBook";
    const messageText = bodyData.message_text || "ახალი შეტყობინება";
    const senderUid = bodyData.sender_uid || "";

    if (!recipientId) {
      return res.status(400).json({ error: "recipient_id is required" });
    }

    const pushPayload = {
      app_id: ONE_SIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [recipientId]
      },
      headings: { ka: senderName, en: senderName, it: senderName, ru: senderName },
      contents: { ka: messageText, en: messageText, it: messageText, ru: messageText },
      url: `https://emigrantbook.com/messenger.html?uid=${senderUid}`,
      chrome_web_icon: "https://emigrantbook.com/icons/icon-192x192.png",
      chrome_web_badge: "https://emigrantbook.com/icons/icon-192x192.png",
      priority: 10
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
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
