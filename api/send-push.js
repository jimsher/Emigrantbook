export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const REST_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vy2fxnb5wspu2k4hf74jhsxjcrat6gi5kd5v62e3nvkl4nksxpkzzhj53cjpl4xzx7f2p3h45agofui";

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const payload = {
      app_id: APP_ID,
      target_channel: "push",
      include_aliases: body.include_aliases,
      include_external_user_ids: body.include_external_user_ids,
      headings: body.headings,
      contents: body.contents,
      url: body.url
    };

    // 1. ცდა Basic პრეფიქსით v1 სერვერზე
    let response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${REST_KEY.trim()}`
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json();

    // 2. თუ v1-მა დაიწუნა, ცდა Key პრეფიქსით ახალ api.onesignal.com-ზე
    if (data.errors && JSON.stringify(data.errors).includes("Access denied")) {
      response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Key ${REST_KEY.trim()}`
        },
        body: JSON.stringify(payload)
      });
      data = await response.json();
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
