const firebaseConfig = { 
 apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk", 
 authDomain: "emigrantbook.firebaseapp.com", 
 databaseURL: "https://emigrantbook-default-rtdb.europe-west1.firebasedatabase.app", 
 projectId: "emigrantbook", 
 appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f" 
 };
 firebase.initializeApp(firebaseConfig);
 const db = firebase.database(), auth = firebase.auth();

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
 // --- LANGUAGE LOGIC ---
 const translations = {
 ka: {
 welcome: "მოგესალმებით", ob_desc1: "შენ მოხვდი სივრცეში, სადაც ყოველი იდეა შედეგად გარდაიქმნება...", next: "შემდეგი",
 ob_desc2: "ეს არ არის უბრალოდ ციფრული აქტივი...", got_it: "გავიგე წესები", agreement: "📜 ჩვენი შეთანხმება",
 rule1: "იყავი გამჭვირვალე და რეალური", rule2: "პლატფორმაზე ქმედება ფასდება", rule3: "ყოველი IMPACT აისახება ბალანსზე",
 ready: "მზად ვარ შედეგისთვის!", login: "შესვლა", create_account: "ანგარიშის შექმნა", register: "რეგისტრაცია",
 have_account: "უკვე გაქვთ ანგარიში?", wallet_desc: "შეავსეთ ბალანსი Stripe გადახდით", how_it_works: "როგორ მუშაობს AKHO?",
 cash_out: "თანხის გატანა", min_withdraw: "მინიმალური გატანა: 50.00 € (500 AKHO)", withdraw_req: "გატანის მოთხოვნა",
 close: "დახურვა", thanks: "მადლობა!", payment_msg: "გადახდა მიღებულია. AKHO აისახება 5-10 წუთში", check_balance: "ბალანსის გადამოწმება",
 rules_title: "წესები და განმარტება", what_is_akho: "რა არის AKHO?", akho_desc: "AKHO არის პლატფორმის შიდა აქტივი...",
 make_money: "როგორ ვიშოვოთ ფული?", make_money_desc: "ატვირთეთ TOKEN (ვიდეო)...", top_up: "ბალანსის შევსება",
 fees: "ტარიფები და წესები", fees_list: "• ლაიქი: -0.1 AKHO...", comments: "კომენტარები", notifications: "შეტყობინებები",
 discover: "აღმოაჩინე", profile_views: "პროფილის ნახვები", edit: "რედაქტირება", full_name: "სრული სახელი",
 location: "საცხოვრებელი ადგილი", age: "ასაკი", relation: "ურთიერთობა", single: "დაუოჯახებელი", married: "დაოჯახებული",
 in_rel: "ურთიერთობაში", phone: "ტელეფონი", save: "შენახვა", info: "ინფორმაცია", profile_manage: "პროფილის მართვა",
 public: "საჯარო", friends: "მეგობრებისთვის", private: "პრივატული", finish: "დასრულება", videos: "ვიდეო",
 followers: "გამომწერი", following: "გამოწერა", photos: "ფოტოები", live: "ლაივი", real_balance: "რეალური ბალანსი",
 editor: "რედაქტორი", balance: "Wallet", logout: "გასვლა", chats: "ჩატები", upload_token: "ატვირთვა", upload: "ატვირთვა",
 cancel: "გაუქმება", home: "მთავარი", people: "ხალხი", chat: "ჩატი", profile: "პროფილი", search_p: "მოძებნე ემიგრანტი...",
 private_profile: "ეს პროფილი პრივატულია", follow: "გამოწერა", following_btn: "გამოწერილია", write: "მიწერა"
 },
 en: {
 welcome: "WELCOME", ob_desc1: "Welcome to a space where every idea turns into a result. Our platform is based on real Impact.", next: "Next",
 ob_desc2: "This is not just a digital asset. The token is a measure of your work and influence.", got_it: "I understand", agreement: "📜 Our Agreement",
 rule1: "Be transparent and real", rule2: "Every action is valued", rule3: "Every IMPACT is reflected on the balance",
 ready: "Ready for Impact!", login: "Login", create_account: "Create Account", register: "Register",
 have_account: "Already have an account?", wallet_desc: "Top up your balance with Stripe", how_it_works: "How AKHO works?",
 cash_out: "Cash Out", min_withdraw: "Minimum withdrawal: 50.00 € (500 AKHO)", withdraw_req: "Withdrawal Request",
 close: "Close", thanks: "Thank You!", payment_msg: "Payment received. AKHO will reflect in 5-10 mins.", check_balance: "Check Balance",
 rules_title: "Rules & Info", what_is_akho: "What is AKHO?", akho_desc: "AKHO is the platform's internal asset...",
 make_money: "How to earn money?", make_money_desc: "Upload TOKEN (video). When someone likes it, you get 2.00 AKHO.", top_up: "Top Up",
 fees: "Rates & Rules", fees_list: "• Like: -0.1 AKHO • Comment: -0.5 AKHO...", comments: "Comments", notifications: "Notifications",
 discover: "Discover", profile_views: "Profile Views", edit: "Edit Profile", full_name: "Full Name",
 location: "Location", age: "Age", relation: "Relationship", single: "Single", married: "Married",
 in_rel: "In Relationship", phone: "Phone", save: "Save Changes", info: "Information", profile_manage: "Manage Profile",
 public: "Public", friends: "For Friends", private: "Private", finish: "Finish", videos: "Videos",
 followers: "Followers", following: "Following", photos: "Photos", live: "Live", real_balance: "Real Balance",
 editor: "Editor", balance: "Wallet", logout: "Logout", chats: "Chats", upload_token: "Upload Token", upload: "Upload",
 cancel: "Cancel", home: "Home", people: "People", chat: "Chat", profile: "Profile", search_p: "Search emigrant...",
 private_profile: "This profile is private", follow: "Follow", following_btn: "Following", write: "Message"
 }
 };

 let currentLang = localStorage.getItem('appLang') || (navigator.language.startsWith('ka') ? 'ka' : 'en');

 function applyLanguage() {
 document.querySelectorAll('[data-key]').forEach(el => {
 const key = el.getAttribute('data-key');
 if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
 });
 
 // Specific Placeholders
 const searchInp = document.getElementById('searchPlaceholder');
 if(searchInp) searchInp.placeholder = translations[currentLang].search_p;
 
 const commInp = document.getElementById('commInp');
 if(commInp) commInp.placeholder = translations[currentLang].comments + "...";

 const msgInp = document.getElementById('messageInp');
 if(msgInp) msgInp.placeholder = translations[currentLang].chat + "...";
 }

 function toggleLanguage() {
 currentLang = currentLang === 'ka' ? 'en' : 'ka';
 localStorage.setItem('appLang', currentLang);
 applyLanguage();
 toggleSideMenu(false);
 }
 // --- END LANGUAGE LOGIC ---

 let myName = "User";
 let myPhoto = "";
 let myAkho = 0;
 let currentChatId = null;
 let activePostId = null;
 let activeReplyTo = null;
 let currentAdmTarget = null;
 let currentUserData = null;
 let typingTimeout = null;

 // ONLINE STATUS TRACKER
 function updatePresence() {
 const user = auth.currentUser;
 if (!user) return;
 const onlineRef = db.ref(`.info/connected`);
 const userPresenceRef = db.ref(`users/${user.uid}/presence`);
 
 onlineRef.on('value', snap => {
 if (snap.val() === false) return;
 userPresenceRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP).then(() => {
 userPresenceRef.set('online');
 });
 });
 }

 function formatTimeShort(timestamp) {
 if (!timestamp || timestamp === 'online') return 'online';
 const now = Date.now();
 const diff = Math.floor((now - timestamp) / 1000);
 if (diff < 60) return "1m";
 if (diff < 3600) return Math.floor(diff / 60) + "m";
 if (diff < 86400) return Math.floor(diff / 3600) + "h";
 return "";
 }

 function stopMainFeedVideos() {
 document.querySelectorAll('#main-feed video').forEach(v => v.pause());
 }

 function refreshHomeFeed() {
 stopMainFeedVideos();
 document.getElementById('discoveryUI').style.display = 'none';
 document.getElementById('profileUI').style.display = 'none';
 document.getElementById('messengerUI').style.display = 'none';
 document.getElementById('settingsUI').style.display = 'none';
 renderTokenFeed();
 }

 function toggleSideMenu(open) {
 const menu = document.getElementById('sideMenu');
 const overlay = document.getElementById('sideMenuOverlay');
 if (open) {
 menu.classList.add('active');
 overlay.style.display = 'block';
 } else {
 menu.classList.remove('active');
 overlay.style.display = 'none';
 }
 }

 

 function nextObSlide(n) {
 document.querySelectorAll('.ob-step').forEach(s => s.style.display = 'none');
 document.getElementById('obSlide' + n).style.display = 'block';
 }
 function runSuccessAndFinish() {
 document.getElementById('rulesList').style.display = 'none';
 document.getElementById('finishBtn').style.display = 'none';
 const animBox = document.getElementById('tokenSuccessAnim');
 animBox.style.display = 'block';
 animBox.classList.add('token-pop');
 setTimeout(() => finishOnboarding(), 1800);
 }
 function finishOnboarding() {
 const user = auth.currentUser;
 if (user) db.ref('users/' + user.uid).update({ hasSeenRules: true });
 document.getElementById('onboardingUI').style.display = 'none';
}

auth.onAuthStateChanged(user => {
 applyLanguage();
 if (user) {
 updatePresence();
 listenToGlobalMessages();
 
 db.ref(`video_calls/${user.uid}`).on('value', snap => {
 const call = snap.val();
 if (call && call.status === 'calling') {
 if (confirm(`${call.callerName} გირეკავთ ვიდეო ზარით. უპასუხებთ?`)) {
 currentChatId = call.callerUid; 
 startVideoCall(call.channel);
 db.ref(`video_calls/${user.uid}`).update({ status: 'accepted' });
 } else {
 db.ref(`video_calls/${user.uid}`).remove();
 }
 }
 });

 document.getElementById('authUI').style.display = 'none';
 db.ref('users/' + user.uid).on('value', snap => {
 const d = snap.val();
 if(d) {
 currentUserData = d;
 if(d.isBanned) {
 document.body.innerHTML = '<div style="background:#000; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif; text-align:center; padding:20px;"><i class="fas fa-gavel" style="font-size:80px; color:#ff4d4d; margin-bottom:20px;"></i><h1>Banned / დაბლოკილია</h1></div>';
 return;
 }
 myName = d.name || "User";
 myPhoto = d.photo || "https://ui-avatars.com/api/?name=" + myName;
 myAkho = d.akho || 0;
 document.getElementById('userAkho').innerText = myAkho.toFixed(2);
 document.getElementById('realCash').innerText = (myAkho / 10).toFixed(2);
 document.getElementById('bottomNavAva').src = myPhoto;
 if(!d.hasSeenRules) document.getElementById('onboardingUI').style.display = 'flex';
 if(d.role === 'admin') { document.getElementById('adminMenuBtn').style.display = 'flex'; }
 updateCashoutUI();
 loadActivityLog();
 }
 });
 renderTokenFeed();
 loadDiscoveryUsers();
 listenToRequests();
 } else {
 document.getElementById('authUI').style.display = 'flex';
 document.getElementById('main-feed').innerHTML = "";
 }
});

 function updateCashoutUI() {
 const status = document.getElementById('cashoutStatus');
 const form = document.getElementById('cashoutForm');
 if (myAkho >= 500) {
 status.innerText = currentLang === 'ka' ? "გატანა ხელმისაწვდომია!" : "Cashout available!";
 status.style.color = "var(--green)";
 form.style.display = "block";
 } else {
 const diff = 500 - myAkho;
 status.innerText = currentLang === 'ka' ? `გაკლიათ ${(diff/10).toFixed(2)} € გატანამდე` : `${(diff/10).toFixed(2)} € left until cashout`;
 status.style.color = "var(--red)";
 form.style.display = "none";
 }
 }

 function submitWithdraw() {
 const iban = document.getElementById('ibanInput').value;
 if(!iban || iban.length < 10) return alert("IBAN / PayPal Error");
 
 if(confirm(`Confirm ${(myAkho/10).toFixed(2)} €?`)) {
 const reqRef = db.ref('withdrawal_requests').push();
 reqRef.set({
 uid: auth.currentUser.uid,
 name: myName,
 amountEur: (myAkho/10).toFixed(2),
 amountAkho: myAkho,
 iban: iban,
 status: 'pending',
 ts: Date.now()
 }).then(() => {
 db.ref(`users/${auth.currentUser.uid}`).update({ akho: 0 });
 addToLog('Cashout Request', -myAkho);
 alert(currentLang === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request sent!");
 document.getElementById('walletUI').style.display = 'none';
 });
 }
 }

 function openAdminUI() {
 toggleSideMenu(false);
 document.getElementById('adminUI').style.display = 'flex';
 loadAdminRequests();
 }

 function adminSearchUsers(q) {
 const list = document.getElementById('admUserList');
 if(!q || q.length < 2) { list.innerHTML = ""; return; }
 db.ref('users').once('value', snap => {
 list.innerHTML = "";
 const data = snap.val();
 Object.entries(data).forEach(([uid, u]) => {
 if(u.name && u.name.toLowerCase().includes(q.toLowerCase())) {
 const div = document.createElement('div');
 div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;";
 div.innerHTML = `<span style="color:white; font-size:14px;">${u.name}</span><button class="profile-btn btn-outline" style="padding:5px 10px; font-size:12px;" onclick="selectAdmTarget('${uid}', '${u.name}')">Manage</button>`;
 list.appendChild(div);
 }
 });
 });
 }

 function selectAdmTarget(uid, name) {
 currentAdmTarget = uid;
 document.getElementById('admUserActions').style.display = 'block';
 document.getElementById('admTargetName').innerText = "Manage: " + name;
 }

 function adminAction(type) {
 if(!currentAdmTarget) return;
 if(type === 'warning') {
 const msg = prompt("Warning message:");
 if(msg) db.ref(`notifications/${currentAdmTarget}`).push({ text: "⚠️ Admin: " + msg, ts: Date.now(), fromPhoto: "https://emigrantbook.com/1000084015-removebg-preview.png" });
 } else if(type === 'ban') {
 if(confirm("Ban user?")) db.ref(`users/${currentAdmTarget}`).update({ isBanned: true });
 } else if(type === 'unban') {
 if(confirm("Unban user?")) db.ref(`users/${currentAdmTarget}`).update({ isBanned: false });
 } else if(type === 'addAkho') {
 const amt = prompt("AKHO amount:");
 if(amt) db.ref(`users/${currentAdmTarget}/akho`).transaction(c => (c || 0) + parseFloat(amt));
 } else if(type === 'resetAkho') {
 if(confirm("Reset balance?")) db.ref(`users/${currentAdmTarget}`).update({ akho: 0 });
 } else if(type === 'delete') {
 if(confirm("Delete account permanently?")) {
 db.ref(`users/${currentAdmTarget}`).remove();
 document.getElementById('admUserActions').style.display = 'none';
 }
 }
 alert("Done!");
 }

 function loadAdminRequests() {
 const list = document.getElementById('adminReqList');
 db.ref('withdrawal_requests').on('value', snap => {
 list.innerHTML = "";
 const data = snap.val();
 if(!data) { list.innerHTML = "<p style='color:gray;'>No requests</p>"; return; }
 Object.entries(data).forEach(([id, req]) => {
 if(req.status === 'pending') {
 list.innerHTML += `
 <div class="admin-req-card">
 <b>User: ${req.name}</b>
 <span>Amt: ${req.amountEur} € (${req.amountAkho} AKHO)</span>
 <span>IBAN: ${req.iban}</span>
 <div style="display:flex; gap:10px;">
 <button class="withdraw-btn" style="background:var(--green);" onclick="approveReq('${id}')">Approve</button>
 <button class="withdraw-btn" style="background:var(--red);" onclick="declineReq('${id}', '${req.uid}', ${req.amountAkho})">Decline</button>
 </div>
 </div>`;
 }
 });
 });
 }

 function approveReq(id) {
 if(confirm("Paid?")) {
 db.ref(`withdrawal_requests/${id}`).update({ status: 'approved' });
 alert("Approved!");
 }
 }

 function declineReq(id, uid, amount) {
 if(confirm("Decline? Coins will return.")) {
 db.ref(`users/${uid}/akho`).transaction(current => (current || 0) + amount);
 db.ref(`withdrawal_requests/${id}`).update({ status: 'declined' });
 alert("Declined.");
 }
 }

 function openWalletUI() {
 document.getElementById('walletUI').style.display = 'flex';
 document.getElementById('walletMain').style.display = 'block';
 document.getElementById('paymentPending').style.display = 'none';
 loadActivityLog();
 }
 function openInfoUI() {
 document.getElementById('infoUI').style.display = 'flex';
 }
 function initStripePayment(url) {
 const user = auth.currentUser;
 if (!user) return alert("Please Login");
 const finalUrl = url + "?client_reference_id=" + user.uid;
 document.getElementById('walletMain').style.display = 'none';
 document.getElementById('paymentPending').style.display = 'block';
 window.open(finalUrl, "_blank");
 }
 function canAfford(cost) {
 if (myAkho >= cost) return true;
 alert(currentLang === 'ka' ? "შეავსეთ ბალანსი!" : "Top up your balance!");
 openWalletUI();
 return false;
 }
 function spendAkho(cost, reason = 'Action') {
 const newBalance = myAkho - cost;
 db.ref(`users/${auth.currentUser.uid}`).update({ akho: newBalance });
 addToLog(reason, -cost);
 }
 function earnAkho(targetUid, amount, reason = 'Impact Reward') {
 db.ref(`users/${targetUid}/akho`).transaction(current => (current || 0) + amount);
 // Log for the receiver
 db.ref(`activity_logs/${targetUid}`).push({
 type: reason,
 amt: amount,
 ts: Date.now()
 });
 }

 function addToLog(type, amt) {
 db.ref(`activity_logs/${auth.currentUser.uid}`).push({
 type: type,
 amt: amt,
 ts: Date.now()
 });
 }

 function loadActivityLog() {
 const box = document.getElementById('logContent');
 db.ref(`activity_logs/${auth.currentUser.uid}`).limitToLast(15).on('value', snap => {
 box.innerHTML = "";
 const data = snap.val();
 if(!data) { box.innerHTML = "<p style='color:gray; font-size:12px;'>ისტორია ცარიელია</p>"; return; }
 Object.values(data).reverse().forEach(log => {
 const isPos = log.amt > 0;
 box.innerHTML += `
 <div class="log-item">
 <div class="log-info">
 <span class="log-type">${log.type}</span>
 <span class="log-time">${new Date(log.ts).toLocaleString()}</span>
 </div>
 <span class="log-amt ${isPos ? 'amt-pos' : 'amt-neg'}">${isPos ? '+' : ''}${log.amt.toFixed(2)}</span>
 </div>`;
 });
 });
 }

 function openComments(postId) {
 activePostId = postId;
 activeReplyTo = null;
 document.getElementById('commentsUI').style.display = 'flex';
 loadComments(postId);
 }
 function loadComments(postId) {
 const list = document.getElementById('commList');
 db.ref(`comments/${postId}`).on('value', snap => {
 list.innerHTML = "";
 const data = snap.val();
 if(!data) return;
 Object.entries(data).forEach(([id, comm]) => {
 const isLiked = comm.likes && comm.likes[auth.currentUser.uid];
 let html = `
 <div class="comment-item">
 <div class="comment-top">
 <img src="${comm.authorPhoto}" class="comm-ava">
 <div class="comm-body">
 <div class="comm-name">${comm.authorName}</div>
 <div class="comm-text">${comm.text}</div>
 <div class="comm-actions">
 <span class="comm-like-btn ${isLiked ? 'liked' : ''}" onclick="likeComment('${id}')">
 <i class="fas fa-heart"></i> ${comm.likes ? Object.keys(comm.likes).length : 0}
 </span>
 <span onclick="prepareReply('${id}', '${comm.authorName}')" style="cursor:pointer;">Reply/პასუხი</span>
 </div>
 </div>
 </div>
 <div id="replies-${id}" class="reply-list"></div>
 </div>`;
 list.innerHTML += html;
 if(comm.replies) {
 const rList = document.getElementById(`replies-${id}`);
 Object.values(comm.replies).forEach(r => {
 rList.innerHTML += `
 <div style="display:flex; gap:10px; margin-bottom:10px;">
 <img src="${r.authorPhoto}" style="width:28px; height:28px; border-radius:50%; border:1px solid var(--gold); object-fit:cover;">
 <div>
 <div style="font-size:11px; color:var(--gold); font-weight:900;">${r.authorName}</div>
 <div style="font-size:13px; color:white;">${r.text}</div>
 </div>
 </div>`;
 });
 }
 });
 });
 }
 function prepareReply(commId, name) {
 activeReplyTo = commId;
 document.getElementById('commInp').focus();
 }
 function postComment() {
 if (!canAfford(0.5)) return;
 const text = document.getElementById('commInp').value;
 if(!text.trim() || !activePostId) return;
 if(activeReplyTo) {
 db.ref(`comments/${activePostId}/${activeReplyTo}/replies`).push({
 authorId: auth.currentUser.uid, authorName: myName, authorPhoto: myPhoto, text: text, ts: Date.now()
 });
 } else {
 db.ref(`comments/${activePostId}`).push({
 authorId: auth.currentUser.uid, authorName: myName, authorPhoto: myPhoto, text: text, ts: Date.now()
 });
 }
 spendAkho(0.5, 'Comment');
 document.getElementById('commInp').value = "";
 activeReplyTo = null;
 }
 function likeComment(commId) {
 if (!canAfford(0.1)) return;
 const ref = db.ref(`comments/${activePostId}/${commId}/likes/${auth.currentUser.uid}`);
 ref.once('value', snap => {
 if(snap.exists()) {
 ref.remove();
 } else {
 ref.set(true);
 spendAkho(0.1, 'Comment Like'); 
 }
 });
 }
 function openMessenger() {
 stopMainFeedVideos();
 document.getElementById('messengerUI').style.display = 'flex';
 const list = document.getElementById('chatList');
 list.innerHTML = "";
 db.ref(`users/${auth.currentUser.uid}/following`).on('value', snap => {
 list.innerHTML = "";
 const followers = snap.val();
 if(followers) {
 Object.entries(followers).forEach(([uid, data]) => {
 list.innerHTML += `
 <div class="chat-list-item" onclick="startChat('${uid}', '${data.name}', '${data.photo}')">
 <img src="${data.photo}" class="chat-list-ava">
 <b>${data.name}</b>
 </div>`;
 });
 } else { list.innerHTML = "<p style='padding:20px; color:gray;'>No contacts</p>"; }
 });
 }
 function startChat(uid, name, photo) {
 currentChatId = uid;
 document.getElementById('socialListsUI').style.display = 'none';
 document.getElementById('individualChat').style.display = 'flex';
 document.getElementById('chatTargetName').innerText = name;
 document.getElementById('chatTargetAva').src = photo;
 loadMessages(uid);
 listenToTyping(uid);
 }
 function closeChat() {
 if (currentChatId) db.ref(`typing/${getChatId(auth.currentUser.uid, currentChatId)}/${auth.currentUser.uid}`).remove();
 document.getElementById('individualChat').style.display = 'none';
 currentChatId = null;
 }

 function getChatId(u1, u2) {
 return u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`;
 }

 function handleTyping() {
 if (!currentChatId) return;
 const chatId = getChatId(auth.currentUser.uid, currentChatId);
 db.ref(`typing/${chatId}/${auth.currentUser.uid}`).set(true);
 
 if (typingTimeout) clearTimeout(typingTimeout);
 typingTimeout = setTimeout(() => {
 db.ref(`typing/${chatId}/${auth.currentUser.uid}`).remove();
 }, 3000);
 }

 function listenToTyping(targetUid) {
 const chatId = getChatId(auth.currentUser.uid, targetUid);
 db.ref(`typing/${chatId}/${targetUid}`).on('value', snap => {
 const indicator = document.getElementById('typingIndicator');
 if (snap.exists()) {
 indicator.style.display = 'flex';
 document.getElementById('typingSound').play().catch(e => {});
 } else {
 indicator.style.display = 'none';
 }
 });
 }

 function listenToGlobalMessages() {
 const myUid = auth.currentUser.uid;
 db.ref('messages').on('child_added', snap => {
 snap.ref.limitToLast(1).on('child_added', mSnap => {
 const msg = mSnap.val();
 if (!msg || msg.senderId === myUid) return;
 if (Date.now() - msg.ts > 10000) return;
 if (currentChatId && getChatId(myUid, currentChatId) === snap.key) return;
 db.ref(`users/${msg.senderId}`).once('value', uSnap => {
 const u = uSnap.val();
 showGlobalPush(u.name, u.photo, msg.text);
 });
 });
 });
 }

 function showGlobalPush(name, photo, text) {
 const push = document.getElementById('globalPush');
 document.getElementById('pushName').innerText = name;
 document.getElementById('pushAva').src = photo;
 document.getElementById('pushTxt').innerText = text.substring(0, 40) + (text.length > 40 ? '...' : '');
 push.classList.add('show');
 document.getElementById('msgSound').play().catch(e => {});
 setTimeout(() => push.classList.remove('show'), 4000);
 }

 function loadMessages(targetUid) {
 const myUid = auth.currentUser.uid;
 const chatId = getChatId(myUid, targetUid);
 const box = document.getElementById('chatMessages');
 db.ref(`messages/${chatId}`).on('value', snap => {
 box.innerHTML = "";
 snap.forEach(child => {
 const msg = child.val();
 const type = msg.senderId === myUid ? 'sent' : 'received';
 let content = msg.text ? msg.text : `<audio src="${msg.audio}" controls style="width:200px; height:35px; outline:none;"></audio>`;
 box.innerHTML += `<div class="msg-bubble msg-${type}">${content}</div>`;
 });
 box.scrollTop = box.scrollHeight;
 });
}
 function sendMessage() {
 if (!canAfford(0.2)) return;
 const inp = document.getElementById('messageInp');
 if(!inp.value.trim() || !currentChatId) return;
 const myUid = auth.currentUser.uid;
 const chatId = getChatId(myUid, currentChatId);
 db.ref(`messages/${chatId}`).push({
 senderId: myUid,
 text: inp.value,
 ts: Date.now()
 });
 db.ref(`typing/${chatId}/${myUid}`).remove();
 spendAkho(0.2, 'Message');
 inp.value = "";
 }
 function openDiscovery() { 
 stopMainFeedVideos();
 document.getElementById('discoveryUI').style.display = 'flex'; 
 loadDiscoveryUsers();
 }
 function closeDiscovery() { 
 document.getElementById('discoveryUI').style.display = 'none'; 
 refreshHomeFeed();
 }
 function loadDiscoveryUsers() {
 db.ref('users').on('value', snap => {
 const users = snap.val();
 if (!users) return;
 const grid = document.getElementById('discoverGrid');
 grid.innerHTML = "";
 Object.entries(users).forEach(([uid, user]) => {
 if (uid === auth.currentUser.uid) return;
 const card = `
 <div class="user-card" onclick="openProfile('${uid}')">
 <div class="card-inner">
 <img src="${user.photo || 'https://ui-avatars.com/api/?name='+user.name}" class="discover-ava">
 <div class="discover-name">${user.name}</div>
 <div class="discover-status">EMIGRANT</div>
 </div>
 </div>`;
 grid.innerHTML += card;
 });
 });
 }

 function openSettings() {
 toggleSideMenu(false);
 stopMainFeedVideos();
 const ui = document.getElementById('settingsUI');
 ui.style.display = 'flex';
 const privacy = currentUserData.privacy || 'public';
 document.getElementById(`priv${privacy.charAt(0).toUpperCase() + privacy.slice(1)}`).checked = true;
 }

 function updatePrivacy(val) {
 db.ref(`users/${auth.currentUser.uid}`).update({ privacy: val });
 }

 function openProfile(uid) {
 stopMainFeedVideos();
 document.getElementById('profileUI').style.display = 'flex';
 if(uid !== auth.currentUser.uid) {
 db.ref(`profile_views/${uid}/${auth.currentUser.uid}`).set({
 uid: auth.currentUser.uid, name: myName, photo: myPhoto, ts: Date.now()
 });
 }
 db.ref('users/' + uid).on('value', async snap => {
 const user = snap.val();
 if(!user) return;
 const dot = document.getElementById('profStatusDot');
 const lastSeenSpan = document.getElementById('profLastSeenText');
 if(user.presence === 'online') {
 dot.className = 'status-dot online';
 lastSeenSpan.innerText = '';
 } else {
 const dynamicTime = formatTimeShort(user.presence);
 if(dynamicTime) {
 dot.className = 'status-dot offline';
 lastSeenSpan.innerText = dynamicTime;
 } else {
 dot.className = 'status-dot';
 }
 }
 document.getElementById('profAva').src = user.photo || "https://ui-avatars.com/api/?name=" + user.name;
 document.getElementById('profName').innerText = user.name;
 const followersCount = user.followers ? Object.keys(user.followers).length : 0;
 const followingCount = user.following ? Object.keys(user.following).length : 0;
 document.getElementById('statFollowersCount').innerText = followersCount;
 document.getElementById('statFollowingCount').innerText = followingCount;
 document.getElementById('followersStatBtn').onclick = () => openSocialList(uid, 'followers');
 document.getElementById('followingStatBtn').onclick = () => openSocialList(uid, 'following');
 const controls = document.getElementById('profControls');
 controls.innerHTML = "";
 document.querySelector('.profile-nav').style.display = 'flex';
 document.getElementById('feetStats').style.display = (uid === auth.currentUser.uid) ? 'block' : 'none';
 document.getElementById('profTabs').style.display = 'flex';
 document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);
 if(uid === auth.currentUser.uid) {
 controls.innerHTML = `<button class="profile-btn btn-gold" onclick="document.getElementById('avaInp').click()" data-key="edit">Edit</button>`;
 loadUserVideos(uid);
 applyLanguage();
 } else {
 const isFollowing = user.followers && user.followers[auth.currentUser.uid];
 const isFriend = user.following && user.following[auth.currentUser.uid] && isFollowing;
 let canView = false;
 if(!user.privacy || user.privacy === 'public') canView = true;
 if(user.privacy === 'friends' && isFriend) canView = true;
 if(canView) {
 loadUserVideos(uid);
 if(isFollowing) {
 controls.innerHTML = `
 <button class="profile-btn btn-outline" onclick="unfollowUser('${uid}')" data-key="following_btn">Following</button>
 <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>
 `;
 } else {
 controls.innerHTML = `
 <button class="profile-btn btn-gold" style="background:var(--gold); color:black;" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>
 <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>
 `;
 }
 } else {
 document.getElementById('profGrid').innerHTML = `<div class="private-lock-screen"><p data-key="private_profile">Private Profile</p></div>`;
 document.getElementById('profTabs').style.display = 'none';
 controls.innerHTML = `<button class="profile-btn btn-gold" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>`;
 }
 applyLanguage();
 }
 });
 }

 function showProfileVisitors() {
 document.getElementById('visitorsUI').style.display = 'flex';
 const list = document.getElementById('visitorsList');
 list.innerHTML = "Loading...";
 db.ref(`profile_views/${auth.currentUser.uid}`).once('value', async snap => {
 const data = snap.val();
 if(!data) { list.innerHTML = "No views"; return; }
 const myFollowingSnap = await db.ref(`users/${auth.currentUser.uid}/following`).once('value');
 const myFollowing = myFollowingSnap.val() || {};
 list.innerHTML = "";
 Object.values(data).reverse().forEach(v => {
 const isFollowing = myFollowing[v.uid];
 const followBtn = isFollowing ? 
 `<button class="profile-btn btn-outline" style="padding: 5px 12px; font-size: 11px;">${translations[currentLang].following_btn}</button>` :
 `<button class="profile-btn btn-gold" style="padding: 5px 12px; font-size: 11px;" onclick="followFromVisitors('${v.uid}', '${v.name}', '${v.photo}')">${translations[currentLang].follow}</button>`;
 list.innerHTML += `
 <div class="visitor-row">
 <div class="visitor-info" onclick="openProfile('${v.uid}'); document.getElementById('visitorsUI').style.display='none'">
 <img src="${v.photo}" class="visitor-ava">
 <b style="font-size:14px; color:white;">${v.name}</b>
 </div>
 <div>${v.uid !== auth.currentUser.uid ? followBtn : ''}</div>
 </div>`;
 });
 });
 }

 function openEditor() {
 toggleSideMenu(false);
 stopMainFeedVideos();
 const ui = document.getElementById('editProfileUI');
 ui.style.display = 'flex';
 document.getElementById('editName').value = currentUserData.name || "";
 document.getElementById('editCity').value = currentUserData.city || "";
 document.getElementById('editAge').value = currentUserData.age || "";
 document.getElementById('editRelation').value = currentUserData.relation || "Single";
 document.getElementById('editPhone').value = currentUserData.phone || "";
 }

 function saveProfileChanges() {
 const updates = {
 name: document.getElementById('editName').value,
 city: document.getElementById('editCity').value,
 age: document.getElementById('editAge').value,
 relation: document.getElementById('editRelation').value,
 phone: document.getElementById('editPhone').value
 };
 db.ref('users/' + auth.currentUser.uid).update(updates).then(() => {
 alert("Saved!");
 document.getElementById('editProfileUI').style.display = 'none';
 });
 }

 function showDetailedInfo(uid) {
 const panel = document.getElementById('userDetailedInfoUI');
 const content = document.getElementById('infoContent');
 panel.style.display = 'flex';
 content.innerHTML = "Loading...";
 db.ref('users/' + uid).once('value', snap => {
 const u = snap.val();
 if(!u) return;
 content.innerHTML = `
 <div class="info-row"><i class="fas fa-user"></i><div><span class="info-val-label">${translations[currentLang].full_name}</span><span class="info-val-text">${u.name || '-'}</span></div></div>
 <div class="info-row"><i class="fas fa-map-marker-alt"></i><div><span class="info-val-label">${translations[currentLang].location}</span><span class="info-val-text">${u.city || '-'}</span></div></div>
 <div class="info-row"><i class="fas fa-birthday-cake"></i><div><span class="info-val-label">${translations[currentLang].age}</span><span class="info-val-text">${u.age || '-'}</span></div></div>
 <div class="info-row"><i class="fas fa-heart"></i><div><span class="info-val-label">${translations[currentLang].relation}</span><span class="info-val-text">${u.relation || '-'}</span></div></div>
 <div class="info-row"><i class="fas fa-phone"></i><div><span class="info-val-label">${translations[currentLang].phone}</span><span class="info-val-text">${u.phone || '-'}</span></div></div>
 `;
 });
 }

 function followFromVisitors(uid, name, photo) {
 followUser(uid, name, photo);
 setTimeout(() => showProfileVisitors(), 500); 
 }

 function followUser(targetUid, name, photo) {
 if (!canAfford(1)) return;
 const myUid = auth.currentUser.uid;
 db.ref(`users/${myUid}/following/${targetUid}`).set({ name: name, photo: photo });
 db.ref(`users/${targetUid}/followers/${myUid}`).set({ name: myName, photo: myPhoto });
 db.ref(`notifications/${targetUid}`).push({
 text: `${myName} followed you`,
 ts: Date.now(),
 fromPhoto: myPhoto
 });
 spendAkho(1, 'Follow');
 }
 function unfollowUser(targetUid) {
 const myUid = auth.currentUser.uid;
 db.ref(`users/${myUid}/following/${targetUid}`).remove();
 db.ref(`users/${targetUid}/followers/${myUid}`).remove();
 }
 function listenToRequests() {
 const myUid = auth.currentUser.uid;
 db.ref(`notifications/${myUid}`).on('value', snap => {
 const data = snap.val();
 const count = data ? Object.keys(data).length : 0;
 const badge = document.getElementById('reqCount');
 if(count > 0) { badge.innerText = count; badge.style.display = 'block'; }
 else { badge.style.display = 'none'; }
 });
 }
 function openRequestsUI() {
 stopMainFeedVideos();
 document.getElementById('requestsUI').style.display = 'flex';
 const list = document.getElementById('reqList');
 db.ref(`notifications/${auth.currentUser.uid}`).once('value', snap => {
 list.innerHTML = "";
 const data = snap.val();
 if(data) {
 Object.entries(data).reverse().forEach(([id, notify]) => {
 list.innerHTML += `<div class="req-card"><div style="display:flex; align-items:center; gap:10px;"><img src="${notify.fromPhoto}" style="width:40px; height:40px; border-radius:50%;"><b style="font-size:14px; color:white;">${notify.text}</b></div><div><button class="profile-btn btn-outline" onclick="deleteNotification('${id}')">X</button></div></div>`;
 });
 } else { list.innerHTML = "<p style='text-align:center;'>No notifications</p>"; }
 });
 }
 function deleteNotification(id) {
 db.ref(`notifications/${auth.currentUser.uid}/${id}`).remove().then(() => openRequestsUI());
 }
 function loadUserVideos(uid) {
 const grid = document.getElementById('profGrid');
 grid.innerHTML = "";
 let vCount = 0;
 db.ref('posts').once('value', snap => {
 const posts = snap.val();
 if(!posts) return;
 Object.values(posts).forEach(post => {
 if(post.authorId === uid && post.media) {
 const video = post.media.find(m => m.type === 'video');
 if(video) {
 vCount++;
 const item = document.createElement('div');
 item.className = 'grid-item';
 item.innerHTML = `<video src="${video.url}" muted playsinline></video>`;
 item.onclick = () => playFullVideo(video.url);
 grid.appendChild(item);
 }
 }
 });
 document.getElementById('statVidsCount').innerText = vCount;
 });
 }
 function playFullVideo(url) {
 const overlay = document.getElementById('fullVideoOverlay');
 const vid = document.getElementById('fullVideoTag');
 vid.src = url; overlay.style.display = 'flex'; vid.play();
 }
 function closeFullVideo() {
 const overlay = document.getElementById('fullVideoOverlay');
 const vid = document.getElementById('fullVideoTag');
 vid.pause(); overlay.style.display = 'none';
 }
 function searchUsers(q) {
 const cards = document.querySelectorAll('.user-card');
 cards.forEach(c => {
 const name = c.querySelector('.discover-name').innerText.toLowerCase();
 c.style.display = name.includes(q.toLowerCase()) ? "block" : "none";
 });
 }

 function openSocialList(uid, type) {
 const ui = document.getElementById('socialListsUI');
 const title = document.getElementById('socialListTitle');
 const content = document.getElementById('socialContentArea');
 ui.style.display = 'flex';
 title.innerText = type === 'followers' ? 'გამომწერები' : 'გამოწერილია';
 content.innerHTML = "იტვირთება...";
 db.ref(`users/${uid}/${type}`).once('value', snap => {
 const list = snap.val();
 if(!list) { content.innerHTML = "<p style='text-align:center; margin-top:50px; color:gray;'>სია ცარიელია</p>"; return; }
 renderSocialList(list);
 });
 }

 function renderSocialList(list) {
 const content = document.getElementById('socialContentArea');
 content.innerHTML = "";
 Object.entries(list).forEach(([uid, u]) => {
 content.innerHTML += `
 <div class="social-item" data-name="${u.name.toLowerCase()}">
 <div class="social-user-info" onclick="document.getElementById('socialListsUI').style.display='none'; openProfile('${uid}')">
 <img src="${u.photo || 'https://ui-avatars.com/api/?name='+u.name}" class="social-ava">
 <div>
 <div class="social-name">${u.name}</div>
 <div class="social-status">Emigrant</div>
 </div>
 </div>
 <div class="social-actions-btns">
 <div class="social-msg-btn" onclick="startChat('${uid}', '${u.name}', '${u.photo}')">
 <i class="fas fa-comment"></i>
 </div>
 </div>
 </div>`;
 });
 }

 function filterSocialList(q) {
 const items = document.querySelectorAll('.social-item');
 items.forEach(item => {
 const name = item.getAttribute('data-name');
 item.style.display = name.includes(q.toLowerCase()) ? 'flex' : 'none';
 });
 }

 async function uploadNewAva(inp) {
 const file = inp.files[0];
 if(!file) return;
 const formData = new FormData();
 formData.append('image', file);
 try {
 const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { method: 'POST', body: formData });
 const data = await res.json();
 if(data.success) {
 await db.ref('users/' + auth.currentUser.uid).update({ photo: data.data.url });
 alert("Done!");
 }
 } catch(e) { alert("Error!"); }
 }
 function logoutUser() {
 if(confirm("Logout?")) { auth.signOut().then(() => { location.reload(); }); }
 }
 
 function toggleAuthBox(type) {
 const loginBox = document.getElementById('loginBox');
 const regBox = document.getElementById('regBox');
 if (type === 'reg') {
 loginBox.style.display = 'none';
 regBox.style.display = 'block';
 } else {
 loginBox.style.display = 'block';
 regBox.style.display = 'none';
 }
}
 
 function handleAuth(type) {
 if (type === 'reg') {
 const email = document.getElementById('rEmail').value;
 const pass = document.getElementById('rPass').value;
 const name = document.getElementById('rFirstName').value + " " + document.getElementById('rLastName').value;
 auth.createUserWithEmailAndPassword(email, pass).then(u => {
 db.ref('users/' + u.user.uid).set({ name: name, akho: 50.00, photo: "", hasSeenRules: false, role: 'user', privacy: 'public', presence: Date.now() });
 addToLog('Welcome Bonus', 50.00);
 }).catch(err => alert(err.message));
 } else {
 const email = document.getElementById('uEmail').value;
 const pass = document.getElementById('uPass').value;
 auth.signInWithEmailAndPassword(email, pass).catch(err => alert(err.message));
 }
 }
 async function startTokenUpload() {
 if (!canAfford(5)) return;
 const file = document.getElementById('videoInput').files[0];
 if (!file) return alert("Select video");
 const btn = document.getElementById('upBtn');
 btn.disabled = true; btn.innerText = "Uploading...";
 const formData = new FormData();
 formData.append("file", file); formData.append("upload_preset", "Emigrantbook.video");
 try {
 const res = await fetch(`https://api.cloudinary.com/v1_1/djbgqzf6l/video/upload`, { method: 'POST', body: formData });
 const data = await res.json();
 if (data.secure_url) {
 await db.ref('posts').push({
 authorId: auth.currentUser.uid, authorName: myName, authorPhoto: myPhoto,
 text: document.getElementById('videoDesc').value,
 media: [{ url: data.secure_url, type: 'video' }],
 timestamp: Date.now()
 });
 spendAkho(5, 'Token Upload');
 location.reload();
 }
 } catch (err) { alert("Error!"); btn.disabled = false; btn.innerText = "Upload"; }
 }

 function togglePlayPause(vid) {
 if (vid.paused) vid.play();
 else vid.pause();
 }

function renderTokenFeed() {
 // --- ეს ხაზი ბლოკავს ლაივიდან გაგდებას ---
 if (document.getElementById('liveUI').style.display === 'flex') return;

 const feed = document.getElementById('main-feed');
 db.ref('posts').on('value', snap => {
 feed.innerHTML = "";
 const data = snap.val(); if (!data) return;
 let postEntries = Object.entries(data);
 for (let i = postEntries.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [postEntries[i], postEntries[j]] = [postEntries[j], postEntries[i]];
 }
 postEntries.forEach(([id, post]) => {
 if (post.media && post.media.some(m => m.type === 'video')) {
 const videoUrl = post.media.find(m => m.type === 'video').url;
 const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
 const shareCount = post.shares || 0;
 const saveCount = post.saves || 0;
 const card = document.createElement('div');
 card.className = 'video-card';
 card.id = `card-${id}`;
 const isLikedByMe = post.likedBy && post.likedBy[auth.currentUser.uid];
 const isSavedByMe = post.savedBy && post.savedBy[auth.currentUser.uid];
 card.innerHTML = `
 <video src="${videoUrl}" loop playsinline muted onclick="togglePlayPause(this)"></video>
 <div class="side-actions">
 <div style="position:relative">
 <img id="ava-${id}" src="https://ui-avatars.com/api/?name=${post.authorName}" class="author-mini-ava" onclick="openProfile('${post.authorId}')">
 <div id="mini-status-${id}" style="position:absolute; bottom:0; right:0; width:12px; height:12px; background:var(--green); border-radius:50%; border:2px solid #000; display:none;"></div>
 </div>
 <div class="action-item ${isLikedByMe ? 'liked' : ''}" onclick="react('${id}', '${post.authorId}')">
 <i class="fas fa-heart"></i>
 <span id="like-count-${id}">${likeCount}</span>
 </div>
 <div class="action-item" onclick="openComments('${id}')">
 <i class="fas fa-comment-dots"></i>
 <span id="comm-count-${id}">0</span>
 </div>
 <div class="action-item ${isSavedByMe ? 'saved' : ''}" onclick="toggleSavePost('${id}')">
 <i class="fas fa-bookmark"></i>
 <span id="save-count-${id}">${saveCount}</span>
 </div>
 <div class="action-item" onclick="shareVideo('${id}', '${videoUrl}')">
 <i class="fas fa-share"></i>
 <span id="share-count-${id}">${shareCount}</span>
 </div>
 ${post.authorId === auth.currentUser.uid ? `
 <div class="action-item" onclick="deleteMyVideo('${id}')" style="margin-top: 5px;">
 <i class="fas fa-trash-alt" style="color: #ff4d4d; font-size: 20px;"></i>
 <span style="color: #ff4d4d; font-size: 10px;">DEL</span>
 </div>
 ` : ''}
 </div>
 <div style="position:absolute; left:15px; bottom:90px; text-shadow:2px 2px 4px #000; pointer-events:none;">
 <b id="name-${id}" style="color:var(--gold); cursor:pointer; pointer-events:auto;" onclick="openProfile('${post.authorId}')">@${post.authorName}</b>
 <p style="font-size:14px; margin-top:6px;">${post.text || ''}</p>
 </div>`;
 feed.appendChild(card);
 db.ref(`comments/${id}`).on('value', cSnap => {
 const count = cSnap.val() ? Object.keys(cSnap.val()).length : 0;
 if(document.getElementById(`comm-count-${id}`)) document.getElementById(`comm-count-${id}`).innerText = count;
 });
 db.ref(`users/${post.authorId}`).on('value', uSnap => {
 const u = uSnap.val();
 if(u && u.photo) document.getElementById(`ava-${id}`).src = u.photo;
 if(u && u.name) document.getElementById(`name-${id}`).innerText = "@" + u.name;
 if(u && u.presence === 'online') document.getElementById(`mini-status-${id}`).style.display = 'block';
 else if(document.getElementById(`mini-status-${id}`)) document.getElementById(`mini-status-${id}`).style.display = 'none';
 });
 }
 });
 setupAutoPlay();
 });
}

 function setupAutoPlay() {
 const observer = new IntersectionObserver((entries) => {
 entries.forEach(entry => {
 const video = entry.target.querySelector('video');
 if (entry.isIntersecting) { 
 if (document.getElementById('profileUI').style.display !== 'flex' && 
 document.getElementById('discoveryUI').style.display !== 'flex') {
 video.muted = false; 
 video.play().catch(e => {}); 
 }
 }
 else { video.pause(); video.muted = true; }
 });
 }, { root: document.getElementById('main-feed'), threshold: 0.6 });
 document.querySelectorAll('.video-card').forEach(card => observer.observe(card));
 }

 function react(postId, ownerUid) {
 if (!canAfford(0.1)) return;
 const user = auth.currentUser;
 if (!user) return;
 const likeRef = db.ref(`posts/${postId}/likedBy/${user.uid}`);
 likeRef.once('value', snap => {
 if (snap.exists()) {
 likeRef.remove();
 } else {
 likeRef.set({ type: '❤️', photo: myPhoto, name: myName });
 spendAkho(0.1, 'Like'); 
 if (ownerUid !== user.uid) {
 earnAkho(ownerUid, 2.00, 'Impact (Like)'); 
 }
 }
 });
}

 function toggleSavePost(postId) {
 const user = auth.currentUser;
 if(!user) return;
 const saveRef = db.ref(`posts/${postId}/savedBy/${user.uid}`);
 saveRef.once('value', snap => {
 if(snap.exists()) {
 saveRef.remove();
 db.ref(`posts/${postId}/saves`).transaction(c => (c || 1) - 1);
 } else {
 saveRef.set(true);
 db.ref(`posts/${postId}/saves`).transaction(c => (c || 0) + 1);
 }
 });
 }

 function shareVideo(postId, url) {
 if (navigator.share) {
 navigator.share({ url: url }).then(() => {
 db.ref(`posts/${postId}/shares`).transaction(c => (c || 0) + 1);
 });
 } else {
 alert("Link: " + url);
 db.ref(`posts/${postId}/shares`).transaction(c => (c || 0) + 1);
 }
 }
 
function openCommunityWall() {
 stopMainFeedVideos(); 
 document.getElementById('communityWallUI').style.display = 'flex';
 document.getElementById('wallMyAva').src = myPhoto;
 loadCommunityPosts();
}
function closeCommunityWall() {
 document.getElementById('communityWallUI').style.display = 'none';
}
function previewWallImage(input) {
 if (input.files && input.files[0]) {
 const reader = new FileReader();
 reader.onload = e => {
 document.getElementById('wallImgPreview').src = e.target.result;
 document.getElementById('wallImgPreviewBox').style.display = 'block';
 }
 reader.readAsDataURL(input.files[0]);
 }
}
function cancelWallImg() {
 document.getElementById('wallImgInput').value = "";
 document.getElementById('wallImgPreviewBox').style.display = 'none';
}
async function submitWallPost() {
 const text = document.getElementById('wallPostText').value;
 const file = document.getElementById('wallImgInput').files[0];
 if(!text.trim() && !file) return alert("დაწერეთ რამე");
 if(!canAfford(2)) return; 
 const btn = document.querySelector('[onclick="submitWallPost()"]');
 btn.disabled = true; btn.innerText = "...";
 let finalUrl = "";
 if(file) {
 const formData = new FormData();
 formData.append("file", file); formData.append("upload_preset", "Emigrantbook.video"); 
 try {
 const res = await fetch(`https://api.cloudinary.com/v1_1/djbgqzf6l/auto/upload`, { method: 'POST', body: formData });
 const data = await res.json();
 if (data.secure_url) finalUrl = data.secure_url;
 } catch (err) { alert("კავშირის შეცდომა!"); btn.disabled = false; btn.innerText = "გამოქვეყნება"; return; }
 }
 await db.ref('community_posts').push({
 authorId: auth.currentUser.uid, authorName: myName, authorPhoto: myPhoto,
 text: text, image: finalUrl, timestamp: Date.now()
 });
 spendAkho(2, 'Community Post');
 document.getElementById('wallPostText').value = "";
 cancelWallImg();
 btn.disabled = false; btn.innerText = "გამოქვეყნება";
}
function loadCommunityPosts() {
 const box = document.getElementById('communityPostsList');
 db.ref('community_posts').orderByChild('timestamp').on('value', snap => {
 box.innerHTML = "";
 const data = snap.val(); if(!data) return;
 Object.entries(data).reverse().forEach(([id, post]) => {
 const card = document.createElement('div');
 card.style = "background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 15px;";
 card.innerHTML = `
 <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
 <img src="${post.authorPhoto}" style="width: 35px; height: 35px; border-radius: 50%; border: 1px solid var(--gold);">
 <b style="color: white; font-size: 14px;">${post.authorName}</b>
 </div>
 ${post.text ? `<p style="font-size: 15px; margin-bottom: 10px; color: #E4E6EB;">${post.text}</p>` : ''}
 ${post.image ? `<img src="${post.image}" style="width: 100%; border-radius: 10px; margin-bottom: 10px;">` : ''}
 <div style="display: flex; gap: 20px; color: var(--gold); border-top: 1px solid #333; padding-top: 10px;">
 <i class="far fa-heart" style="cursor:pointer;"></i>
 <i class="far fa-comment" style="cursor:pointer;" onclick="openComments('${id}')"></i>
 </div>`;
 box.appendChild(card);
 });
 });
}

let mediaRecorder;
let audioChunks = [];
async function toggleVoiceRecord() {
 const micIcon = document.getElementById('micIcon');
 if (!mediaRecorder || mediaRecorder.state === "inactive") {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 mediaRecorder = new MediaRecorder(stream);
 audioChunks = [];
 mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
 mediaRecorder.onstop = async () => {
 const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
 sendVoiceMessage(audioBlob);
 };
 mediaRecorder.start();
 micIcon.classList.replace('fa-microphone', 'fa-stop-circle');
 micIcon.style.color = "var(--red)";
 } else {
 mediaRecorder.stop();
 micIcon.classList.replace('fa-stop-circle', 'fa-microphone');
 micIcon.style.color = "var(--gold)";
 }
}
async function sendVoiceMessage(blob) {
 if (!canAfford(0.5)) return; 
 const formData = new FormData();
 formData.append("file", blob); formData.append("upload_preset", "Emigrantbook.video"); 
 try {
 const res = await fetch(`https://api.cloudinary.com/v1_1/djbgqzf6l/auto/upload`, { method: 'POST', body: formData });
 const data = await res.json();
 if (data.secure_url) {
 const myUid = auth.currentUser.uid;
 const chatId = getChatId(myUid, currentChatId);
 db.ref(`messages/${chatId}`).push({ senderId: myUid, audio: data.secure_url, ts: Date.now() });
 spendAkho(0.5, 'Voice Message');
 }
 } catch (err) { alert("ხმის გაგზავნა ვერ მოხერხდა"); }
}
function deleteMyVideo(postId) {
 if(confirm("ნამდვილად გსურთ წაშლა?")) {
 db.ref(`posts/${postId}`).remove();
 }
}

let localTracks = { videoTrack: null, audioTrack: null };
async function startVideoCall(existingChannel = null) {
 const appId = "7290502fac7f4feb82b021ccde79988a"; 
 const token = "007eJxTYHjuUsbf/kPswi7dW9OuT2ywvjBtv5XPYkdtPofrzS5ztX4oMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgkMk/ryWwIZGRotNBnYmSAQBCfmyEnsyw1vrikKDUxl4EBAEnPIfQ=";
 const channel = "live_stream"; 
 const ui = document.getElementById('videoCallUI');
 ui.style.display = 'flex'; ui.style.zIndex = "200000";
 try {
 const uid = Math.floor(Math.random() * 10000);
 await client.join(appId, channel, token, uid);
 localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
 localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
 localTracks.videoTrack.play("local-video");
 await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
 if (!existingChannel) {
 db.ref(`video_calls/${currentChatId}`).set({ callerName: myName, callerPhoto: myPhoto, callerUid: auth.currentUser.uid, channel: channel, status: 'calling', ts: Date.now() });
 }
 } catch (err) { endVideoCall(); }
}
async function endVideoCall() {
 if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
 if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
 localTracks = { videoTrack: null, audioTrack: null };
 await client.leave();
 document.getElementById('videoCallUI').style.display = 'none';
 if(currentChatId) db.ref(`video_calls/${currentChatId}`).remove();
 db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}
function minimizeVideoCall() {
 const ui = document.getElementById('videoCallUI');
 if(ui.style.width === '100%') {
 ui.style.width = '140px'; ui.style.height = '200px'; ui.style.top = '70px'; ui.style.left = '10px'; ui.style.borderRadius = '15px'; ui.style.border = '2px solid var(--gold)';
 } else {
 ui.style.width = '100%'; ui.style.height = '100%'; ui.style.top = '0'; ui.style.left = '0'; ui.style.borderRadius = '0'; ui.style.border = 'none';
 }
}

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
 
