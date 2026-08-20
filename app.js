// app.js
async function sendPushNotification(title, message) {
  const ONE_SIGNAL_APP_ID = "5b8f7b19-f368-418a-b87b-f7582d331fae";
  const REST_API_KEY = "os_v2_app_lohxwgptnbayvod365mc2my7vzv4mz2abm4enhmpskzsyeqtwbx3a4n33clccezkigbl4hbkcsymizeka3o3lnnmbtwxqe4o3huynzy";

  const payload = {
    app_id: ONE_SIGNAL_APP_ID,
    included_segments: ["Subscribed Users"],
    headings: { ka: title, en: title },
    contents: { ka: message, en: message },
    url: "https://emigrantbook.com",
    chrome_web_badge: "https://emigrantbook.com/icon-192.png",
    ios_badgeType: "Increase",
    ios_badgeCount: 1
  };

  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("გაგზავნის შეცდომა:", error);
  }
}
