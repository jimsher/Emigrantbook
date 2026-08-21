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
  const REST_API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vyfmsgkb22weezfzpaevpcc5tgdg57yiyorlzvmgvmmampwnh4vjkvcz2owkqkrf2qiqbjldwbmkr2i";

  try {
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const pushPayload = {
      app_id: ONE_SIGNAL_APP_ID,
      ...bodyData
    };

    // 1. ცდა Key პრეფიქსით
    let response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${REST_API_KEY}`
      },
      body: JSON.stringify(pushPayload)
    });

    let data = await response.json();

    // 2. თუ OneSignal-მა წვდომა უარყო, ავტომატური ცდა Basic პრეფიქსით
    if (data.errors && JSON.stringify(data.errors).includes("Access denied")) {
      response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${REST_API_KEY}`
        },
        body: JSON.stringify(pushPayload)
      });
      data = await response.json();
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
