export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const APP_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vy2fxnb5wspu2k4hf74jhsxjcrat6gi5kd5v62e3nvkl4nksxpkzzhj53cjpl4xzx7f2p3h45agofui";
  const ORG_KEY = "os_v2_org_ohkifot4rjcovl4ogegabgduycyjl5cl4fiuzlnrzjqn2aw6kg63gxikmsdnsengoqamgua7kka6gy2svbs2wz4n32g4pfwvcwiqlci";

  try {
    let bodyData = {};
    if (typeof req.body === 'string') {
      try { bodyData = JSON.parse(req.body); } catch (e) { bodyData = {}; }
    } else if (req.body) {
      bodyData = req.body;
    }

    // შეტყობინების სრული და დაცული მონაცემები
    const recipient = bodyData.recipient_id || (bodyData.include_aliases && bodyData.include_aliases.external_id ? bodyData.include_aliases.external_id[0] : null);
    
    const pushPayload = {
      app_id: APP_ID,
      headings: bodyData.headings || { en: "ახალი შეტყობინება" },
      contents: bodyData.contents || { en: "გაქვთ ახალი შეტყობინება" },
      url: bodyData.url || "https://emigrantbook.com",
      ...(recipient ? {
        include_aliases: { external_id: [recipient] },
        include_external_user_ids: [recipient],
        target_channel: "push"
      } : {
        included_segments: ["Total Subscriptions"]
      })
    };

    // ყველა შესაძლო კომბინაცია (App Key და Org Key ყველა ფორმატით)
    const attempts = [
      { url: "https://api.onesignal.com/notifications", auth: `Key ${APP_KEY.trim()}` },
      { url: "https://api.onesignal.com/notifications", auth: `Bearer ${APP_KEY.trim()}` },
      { url: "https://api.onesignal.com/notifications", auth: `Key ${ORG_KEY.trim()}` },
      { url: "https://api.onesignal.com/notifications", auth: `Bearer ${ORG_KEY.trim()}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Basic ${APP_KEY.trim()}` },
      { url: "https://onesignal.com/api/v1/notifications", auth: `Key ${APP_KEY.trim()}` }
    ];

    let lastData = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "accept": "application/json",
            "Authorization": attempt.auth
          },
          body: JSON.stringify(pushPayload)
        });

        const data = await response.json();
        lastData = data;

        // თუ წარმატებით გაიგზავნა ან ID დაბრუნდა
        if (data.id || (data.errors === undefined && response.status === 200)) {
          return res.status(200).json({ success: true, result: data });
        }
      } catch (e) {
        // გადადის შემდეგ ვარიანტზე
      }
    }

    return res.status(200).json({ success: false, last_response: lastData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
