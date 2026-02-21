// --- TIKTOK STYLE LIVE LOGIC ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }
async function startLive() {
 const appId = "7290502fac7f4feb82b021ccde79988a"; 
 const token = "007eJxTYJCJDClhfz5XMXb3vpfqFU8l31bKlrHO3sDbt+LzEhlT81oFBnMjSwNTA6O0xGTzNJO01CQLoyQDI8Pk5JRUc0tLC4vEKrO+zIZARgbe89EsjAwQCOJzM+RklqXGF5cUpSbmMjAAAMI9INc=";
 currentLiveChannel = "live_" + auth.currentUser.uid; 
 document.getElementById('liveUI').style.display = 'flex';
 document.getElementById('liveHostName').innerText = myName;
 document.getElementById('liveHostAva').src = myPhoto;
 try {
 await liveClient.setClientRole("host");
 await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);
 liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
 liveTracks.video = await AgoraRTC.createCameraVideoTrack();
 liveTracks.video.play("remote-live-video");
 await liveClient.publish([liveTracks.audio, liveTracks.video]);
 db.ref(`lives/${auth.currentUser.uid}`).set({ hostId: auth.currentUser.uid, hostName: myName, hostPhoto: myPhoto, channel: currentLiveChannel, status: 'active', ts: Date.now() });
 listenToLiveChat(currentLiveChannel);
 } catch (e) { endLive(); }
}
function listenToLiveChat(channel) {
 const chatBox = document.getElementById('liveChatBox');
 chatBox.innerHTML = "";
 db.ref(`live_chats/${channel}`).on('child_added', snap => {
 const msg = snap.val();
 const div = document.createElement('div');
 if(msg.name === "SYSTEM") {
 div.style = "background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:10px; margin-bottom:5px; border:1px solid var(--gold); text-align:center;";
 div.innerHTML = `<span style="color:var(--gold); font-size:13px; font-weight:bold;">${msg.text}</span>`;
 } else {
 div.style = "background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:15px; margin-bottom:5px; width:fit-content; border-left:3px solid var(--gold);";
 div.innerHTML = `<b style="color:var(--gold); font-size:11px;">${msg.name}:</b> <span style="color:white; font-size:13px;">${msg.text}</span>`;
 }
 chatBox.appendChild(div);
 chatBox.scrollTop = chatBox.scrollHeight;
 });
}
function sendLiveComment() {
 const inp = document.getElementById('liveMsgInp');
 if(!inp.value.trim() || !currentLiveChannel) return;
 db.ref(`live_chats/${currentLiveChannel}`).push({ name: myName, text: inp.value, ts: Date.now() });
 inp.value = "";
}
async function endLive() {
 if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); }
 if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); }
 await liveClient.leave();
 document.getElementById('liveUI').style.display = 'none';
 if (currentLiveChannel && currentLiveChannel.includes(auth.currentUser.uid)) {
 db.ref(`lives/${auth.currentUser.uid}`).remove();
 db.ref(`live_chats/${currentLiveChannel}`).remove();
 }
}

async function joinLive(hostUid, channelName) {
 const appId = "7290502fac7f4feb82b021ccde79988a"; 
 const token = "007eJxTYJCJDClhfz5XMXb3vpfqFU8l31bKlrHO3sDbt+LzEhlT81oFBnMjSwNTA6O0xGTzNJO01CQLoyQDI8Pk5JRUc0tLC4vEKrO+zIZARgbe89EsjAwQCOJzM+RklqXGF5cUpSbmMjAAAMI9INc=";
 currentLiveChannel = channelName;
 document.getElementById('liveUI').style.display = 'flex';
 document.getElementById('activeLivesModal').style.display = 'none';
 db.ref(`users/${hostUid}`).once('value', snap => {
 const host = snap.val();
 if(host) {
 document.getElementById('liveHostName').innerText = host.name;
 document.getElementById('liveHostAva').src = host.photo || "https://ui-avatars.com/api/?name=" + host.name;
 }
 });
 try {
 await liveClient.leave(); // აზღვევს დუბლირებას
 await liveClient.setClientRole("audience");
 await liveClient.join(appId, channelName, token, auth.currentUser.uid);
 liveClient.on("user-published", async (user, mediaType) => {
 await liveClient.subscribe(user, mediaType);
 if (mediaType === "video") user.videoTrack.play("remote-live-video");
 if (mediaType === "audio") user.audioTrack.play();
 });
 listenToLiveChat(channelName);
 db.ref(`live_chats/${channelName}`).push({ name: "SYSTEM", text: `👋 ${myName} შემოვიდა`, ts: Date.now() });
 } catch (e) { console.log(e); }
}

function sendLiveHeart() {
 const container = document.getElementById('live-video-container');
 const heart = document.createElement('i');
 heart.className = "fas fa-heart"; heart.style = `position:absolute; right:20px; bottom:150px; color:hsl(${Math.random()*360},100%,50%); font-size:24px; transition:all 1s ease-out; z-index:100;`;
 container.appendChild(heart);
 setTimeout(() => { heart.style.bottom = "400px"; heart.style.right = (Math.random()*100)+"px"; heart.style.opacity = "0"; }, 50);
 setTimeout(() => heart.remove(), 1000);
}
function toggleGiftPanel() { const p = document.getElementById('giftPanel'); p.style.display = p.style.display === 'none' ? 'block' : 'none'; }
function sendGift(emoji, price, giftName) {
 if (myAkho < price) { alert("ბალანსი!"); openWalletUI(); return; }
 const hostUid = currentLiveChannel.replace("live_", "");
 spendAkho(price, `Gift: ${giftName}`); earnAkho(hostUid, price, `Gift: ${giftName}`);
 db.ref(`live_chats/${currentLiveChannel}`).push({ name: "SYSTEM", text: `🎁 ${myName}-მა გაჩუქა ${giftName}`, ts: Date.now() });
 showGiftAnimation(emoji); toggleGiftPanel();
}
function showGiftAnimation(emoji) {
 const container = document.getElementById('live-video-container');
 const giftEl = document.createElement('div');
 giftEl.style = "position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:100px; z-index:100001; animation:gift-pop-up 2s ease-out forwards;";
 giftEl.innerText = emoji; container.appendChild(giftEl);
 setTimeout(() => giftEl.remove(), 2000);
}
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes gift-pop-up { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; } 100% { transform: translate(-50%, -200%) scale(1); opacity: 0; } }";
document.head.appendChild(styleSheet);

function listenToActiveLives() {
 const floatBtn = document.getElementById('liveFloatingBtn');
 const lastAva = document.getElementById('lastLiveAva');
 const modalList = document.getElementById('modalLivesList');
 db.ref('lives').on('value', snap => {
 const lives = snap.val(); modalList.innerHTML = "";
 if (!lives || Object.keys(lives).length === 0) { floatBtn.style.display = 'none'; return; }
 floatBtn.style.display = 'block';
 const liveEntries = Object.entries(lives);
 const lastLive = liveEntries[liveEntries.length - 1][1];
 lastAva.src = lastLive.hostPhoto || 'https://ui-avatars.com/api/?name=' + lastLive.hostName;
 liveEntries.forEach(([uid, data]) => {
 const item = document.createElement('div');
 item.style = "display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:15px; margin-bottom:10px;";
 item.innerHTML = `<div style="display:flex; align-items:center; gap:12px;"><img src="${data.hostPhoto}" style="width:45px; height:45px; border-radius:50%; border:1px solid var(--gold);"><b style="color:white;">${data.hostName}</b></div><button onclick="joinLive('${uid}', '${data.channel}'); closeActiveLivesModal();" style="background:var(--gold); border:none; padding:7px 15px; border-radius:10px; font-weight:900;">WATCH</button>`;
 modalList.appendChild(item);
 });
 });
}
function openActiveLivesModal() { document.getElementById('activeLivesModal').style.display = 'flex'; }
function closeActiveLivesModal() { document.getElementById('activeLivesModal').style.display = 'none'; }
listenToActiveLives();
 
const feed = document.getElementById('main-feed');
let isScrolling = false;

feed.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isScrolling) return;

    isScrolling = true;
    const direction = e.deltaY > 0 ? 1 : -1;
    const scrollAmount = window.innerHeight * direction;

    feed.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
    });

    setTimeout(() => { isScrolling = false; }, 500); // 0.5 წამიანი პაუზა სქროლებს შორის
}, { passive: false });
