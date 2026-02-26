const firebaseConfig = { 
 apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk", 
 authDomain: "emigrantbook.firebaseapp.com", 
 databaseURL: "https://emigrantbook-default-rtdb.europe-west1.firebasedatabase.app", 
 projectId: "emigrantbook", 
 appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f" 
 };
 firebase.initializeApp(firebaseConfig);
 const db = firebase.database(), auth = firebase.auth();


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
 startNotificationListener();
 checkDailyBonus();
 startGlobalUnreadCounter();
 listenForIncomingCalls(user);

// აი ეს არის ის ადგილი, სადაც "ნაღმია" და სადაც უნდა ჩაანაცვლო:
let currentIncomingCall = null; // აქ შევინახავთ ზარის მონაცემებს

db.ref(`video_calls/${user.uid}`).on('value', snap => {
    const call = snap.val();
    if (call && call.status === 'calling' && (Date.now() - call.ts < 60000)) {
        currentIncomingCall = call; // ვინახავთ ინფორმაციას
        
        // ვავსებთ ფანჯარას მონაცემებით
        document.getElementById('callerNameDisplay').innerText = call.callerName;
        document.getElementById('callerAva').src = call.callerPhoto || 'https://ui-avatars.com/api/?name=' + call.callerName;
        
        // ვაჩენთ ლამაზ ფანჯარას
        const modal = document.getElementById('incomingCallModal');
        modal.style.display = 'flex';
    } else {
        // თუ ზარი გაუქმდა გამომძახებლის მიერ
        document.getElementById('incomingCallModal').style.display = 'none';
    }
});

// ფუნქცია: ზარის აღება
function acceptCall() {
    if (currentIncomingCall) {
        window.currentChatId = currentIncomingCall.callerUid; 
        db.ref(`video_calls/${auth.currentUser.uid}`).update({ status: 'accepted' });
        
        document.getElementById('incomingCallModal').style.display = 'none';
        document.getElementById('videoCallUI').style.display = 'flex';
        
        if (typeof startVideoCall === "function") {
            startVideoCall();
        }
    }
}

// ფუნქცია: ზარის გათიშვა
function declineCall() {
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    document.getElementById('incomingCallModal').style.display = 'none';
}











  

  
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









function openComments(postId, postOwnerId) {
    activePostId = postId;
    // ვინახავთ პოსტის პატრონის ID-ს გლობალურად
    window.currentPostOwnerId = postOwnerId;
    activeReplyTo = null;
    document.getElementById('commentsUI').style.display = 'flex';
    loadComments(postId);
}

function loadComments(postId) {
    const list = document.getElementById('commList');
    const myUid = auth.currentUser.uid;
    const postOwnerId = window.currentPostOwnerId; // ვიღებთ შენახულ ID-ს

    db.ref(`comments/${postId}`).on('value', snap => {
        list.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).forEach(([id, comm]) => {
            const isLiked = comm.likes && comm.likes[myUid];
            
            // ლოგიკა: გამოჩნდეს ნაგვის ურნა, თუ ჩემი კომენტარია ან ჩემს პოსტზეა
            const canDeleteComm = (myUid === comm.authorId) || (myUid === postOwnerId);

            let html = `
            <div class="comment-item">
                <div class="comment-top">
                    <img src="${comm.authorPhoto}" class="comm-ava">
                    <div class="comm-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <div class="comm-name">${comm.authorName}</div>
                            ${canDeleteComm ? `<i class="fas fa-trash-alt" style="color:#555; cursor:pointer; font-size:11px; padding:5px;" onclick="window.deleteComment('${postId}', '${id}')"></i>` : ''}
                        </div>
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
                Object.entries(comm.replies).forEach(([rId, r]) => {
                    // პასუხის წაშლის უფლება
                    const canDeleteReply = (myUid === r.authorId) || (myUid === postOwnerId);

                    rList.innerHTML += `
                    <div style="display:flex; gap:10px; margin-bottom:10px; justify-content:space-between; align-items:flex-start;">
                        <div style="display:flex; gap:10px;">
                            <img src="${r.authorPhoto}" style="width:28px; height:28px; border-radius:50%; border:1px solid var(--gold); object-fit:cover;">
                            <div>
                                <div style="font-size:11px; color:var(--gold); font-weight:900;">${r.authorName}</div>
                                <div style="font-size:13px; color:white;">${r.text}</div>
                            </div>
                        </div>
                        ${canDeleteReply ? `<i class="fas fa-trash-alt" style="color:#444; cursor:pointer; font-size:10px;" onclick="window.deleteReply('${postId}', '${id}', '${rId}')"></i>` : ''}
                    </div>`;
                });
            }
        });
    });
}

// წაშლის რეალური ფუნქციები
window.deleteComment = function(postId, commentId) {
    if (confirm("ნამდვილად გსურთ კომენტარის წაშლა?")) {
        db.ref(`comments/${postId}/${commentId}`).remove();
    }
};

window.deleteReply = function(postId, commentId, replyId) {
    if (confirm("ნამდვილად გსურთ პასუხის წაშლა?")) {
        db.ref(`comments/${postId}/${commentId}/replies/${replyId}`).remove();
    }
};







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
    const ui = document.getElementById('messengerUI');
    ui.style.display = 'flex';
    ui.style.backgroundColor = '#000';

    const list = document.getElementById('chatList');
    list.innerHTML = "";
    
    db.ref(`users/${auth.currentUser.uid}/following`).on('value', snap => {
        list.innerHTML = "";
        const followers = snap.val();
        if(followers) {
            Object.entries(followers).forEach(([uid, data]) => {
                const chatId = getChatId(auth.currentUser.uid, uid);
                const item = document.createElement('div');
                item.className = 'chat-list-item';
                item.style = "border:none; background:#000; padding:10px 15px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
                
                item.onclick = () => {
                    db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).set(Date.now());
                    startChat(uid, data.name, data.photo);
                };
                
                db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).on('value', readSnap => {
                    const lastRead = readSnap.val() || 0;
                    db.ref(`messages/${chatId}`).limitToLast(1).on('value', mSnap => {
                        let lastMsg = "No messages yet";
                        let showBadge = false;
                        if(mSnap.exists()) {
                            const msgs = mSnap.val();
                            const msgData = Object.values(msgs)[0];
                            lastMsg = msgData.text || "📷 Voice/Media";
                            if (msgData.senderId !== auth.currentUser.uid && msgData.ts > lastRead) showBadge = true;
                        }
                        item.innerHTML = `
                            <div style="position:relative;">
                                <img src="${data.photo}" class="chat-list-ava">
                                <div id="badge-${uid}" style="position:absolute; top:-2px; right:-2px; background:red; color:white; border-radius:50%; width:16px; height:16px; font-size:10px; display:${showBadge ? 'flex' : 'none'}; align-items:center; justify-content:center; border:2px solid black; font-weight:bold;">!</div>
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <b style="color:white; font-size:15px;">${data.name}</b>
                                <span style="color:${showBadge ? 'white' : '#888'}; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${lastMsg}</span>
                            </div>`;
                    });
                });
                list.appendChild(item);
            });
        } else { list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No contacts</p>"; }
    });
}

function startChat(uid, name, photo) {
    // ეს ხაზი აცოცხლებს ხმოვანის გაგზავნას
    window.currentChatId = uid;
    currentChatId = uid; 

    document.getElementById('socialListsUI').style.display = 'none';
    document.getElementById('individualChat').style.display = 'flex';
    document.getElementById('chatTargetName').innerText = name;
    document.getElementById('chatTargetAva').src = photo;

    const statusEl = document.getElementById('chatTargetStatus');
    if (statusEl) {
        db.ref(`users/${uid}/presence`).on('value', snap => {
            const presence = snap.val();
            if (presence === 'online') {
                statusEl.innerText = 'საიტზეა';
                statusEl.style.color = '#4ade80';
            } else {
                const timeAgo = (typeof formatTimeShort === 'function') ? formatTimeShort(presence) : '';
                statusEl.innerText = timeAgo ? timeAgo + ' წინ იყო' : 'offline';
                statusEl.style.color = '#888';
            }
        });
    }
    loadMessages(uid);
    listenToTyping(uid);
}







function loadMessages(targetUid) {
    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, targetUid);
    const box = document.getElementById('chatMessages');
    
    db.ref(`users/${myUid}/deleted_messages/${chatId}`).on('value', deletedSnap => {
        const deletedMsgs = deletedSnap.val() || {};

        db.ref(`messages/${chatId}`).on('value', snap => {
            box.innerHTML = "";
            snap.forEach(child => {
                const msgId = child.key;
                if (deletedMsgs[msgId]) return;

                const msg = child.val();
                const type = msg.senderId === myUid ? 'sent' : 'received';
                
                const d = new Date(msg.ts);
                const fullDateTime = d.getDate().toString().padStart(2, '0') + "/" + (d.getMonth() + 1).toString().padStart(2, '0') + " " + d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
                
                let content = msg.text ? msg.text : `<audio src="${msg.audio}" controls style="width:200px; height:35px; display:block; outline:none;"></audio>`;
                
                const wrapperStyle = type === 'sent' ? 'align-items: flex-end;' : 'align-items: flex-start;';
                const timeAlign = type === 'sent' ? 'text-align: right;' : 'text-align: left;';

                box.innerHTML += `
                    <div style="display: flex; flex-direction: column; margin-bottom: 12px; width: 100%; ${wrapperStyle}" 
                         oncontextmenu="event.preventDefault(); window.deleteMessage('${chatId}', '${msgId}', '${msg.senderId}')">
                        <div class="msg-bubble msg-${type}" style="width: fit-content; max-width: 80%; margin-bottom: 2px; cursor: pointer;">
                            <div class="msg-content" style="word-break: break-word;">${content}</div>
                        </div>
                        <div style="font-size: 8px; color: gray; padding: 0 5px; width: fit-content; ${timeAlign}">${fullDateTime}</div>
                    </div>`;
            });
            box.scrollTop = box.scrollHeight;
        });
    });
}





window.deleteMessage = function(chatId, msgId, senderId) {
    const myUid = auth.currentUser.uid;
    if (senderId === myUid) {
        if (confirm("გსურთ შეტყობინების წაშლა ყველასთვის?")) {
            db.ref(`messages/${chatId}/${msgId}`).remove();
        }
    } else {
        if (confirm("გსურთ ამ შეტყობინების წაშლა მხოლოდ თქვენთვის?")) {
            db.ref(`users/${myUid}/deleted_messages/${chatId}/${msgId}`).set(true);
        }
    }
};








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
 
 // ვინახავთ UID-ს, რომ ფოტოების სექციამ იცოდეს ვისი სურათები წამოიღოს
 const profNameEl = document.getElementById('profName');
 profNameEl.setAttribute('data-view-uid', uid);

 // პროფილის გახსნისას ვასუფთავებთ ძველ მდგომარეობას
 document.getElementById('userPhotosGrid').style.display = 'none';
 document.getElementById('profGrid').style.display = 'grid';
 document.getElementById('noPhotosMsg').style.display = 'none';

 // --- აქედან იწყება ჩამატებული ლოგიკა ღილაკისთვის ---
 const galleryUploadContainer = document.getElementById('galleryUploadBtnContainer');
 if (galleryUploadContainer && auth.currentUser) {
     galleryUploadContainer.style.display = (uid === auth.currentUser.uid) ? 'block' : 'none';
 }
 // --- აქ მთავრდება ჩამატებული ლოგიკა ---

 document.querySelectorAll('.p-nav-btn').forEach(btn => btn.classList.remove('active'));
 document.getElementById('infoBtn').classList.add('active');

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
     profNameEl.innerText = user.name;
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
         
         // --- ახალი ლოგიკა: კამერის ღილაკის ჩასმა Edit-ის გვერდით ---
         if (galleryUploadContainer) {
             galleryUploadContainer.style.marginTop = "0"; // მოვაშოროთ ზედა დაშორება
             controls.appendChild(galleryUploadContainer); // ჩავსვათ კონტროლებში
         }
         
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

    const fileInput = document.getElementById('videoInput');
    const file = fileInput.files[0];
    if (!file) return alert("გთხოვთ, აირჩიოთ ვიდეო");

    const btn = document.getElementById('upBtn');
    btn.disabled = true;
    btn.innerText = "სერვერის მომზადება...";

    const myToken = "PYgf3g33GkpEfBNJHBYrwM2cw6sEM2vh";

    try {
        // 1. სერვერის მოძიება (აქ Proxy არ გვჭირდება)
        const srvRes = await fetch('https://api.gofile.io/servers');
        const srvData = await srvRes.json();
        const serverName = srvData.data.servers[0].name;

        btn.innerText = "ვიდეო იტვირთება (CORS Proxy-ით)...";

        const formData = new FormData();
        formData.append("file", file);

        // 2. ატვირთვა PROXY-ის საშუალებით (ეს აგვარებს ბლოკირებას)
        // ვიყენებთ ყველაზე პოპულარულ პროქსის: cors-anywhere
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";
        const targetUrl = `https://${serverName}.gofile.io/contents/uploadfile`;

        const uploadRes = await fetch(proxyUrl + targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${myToken}`,
                'Origin': window.location.origin // ვაჩვენებთ საიდან მოდის მოთხოვნა
            },
            body: formData
        });

        const response = await uploadRes.json();

        if (response.status === 'ok') {
            const finalLink = `https://${serverName}.gofile.io/download/web/${response.data.id}/${response.data.fileName}`;

            await db.ref('posts').push({
                authorId: auth.currentUser.uid,
                authorName: myName,
                authorPhoto: myPhoto,
                text: document.getElementById('videoDesc').value,
                media: [{ url: finalLink, type: 'video' }],
                timestamp: Date.now()
            });

            spendAkho(5, 'Token Upload');
            alert("ვიდეო წარმატებით აიტვირთა Gofile-ზე!");
            location.reload();
        } else {
            alert("Gofile შეცდომა: " + response.status);
            btn.disabled = false;
        }

    } catch (err) {
        console.error("Upload error:", err);
        // თუ Proxy-ზე ჯერ არ გაგივლია ავტორიზაცია, ამას დაგიწერს
        alert("საჭიროა Proxy-ს გააქტიურება. გადადით ბმულზე: https://cors-anywhere.herokuapp.com/corsdemo და დააჭირეთ 'Request temporary access', შემდეგ სცადეთ ატვირთვა თავიდან.");
        btn.disabled = false;
        btn.innerText = "ატვირთვა";
    }
}

                



function togglePlayPause(vid) {
    if (vid.paused) vid.play();
    else vid.pause();
}
    



function renderTokenFeed() {
    if (document.getElementById('liveUI').style.display === 'flex') return;

    const feed = document.getElementById('main-feed');
    // შეცვლილია ON -> ONCE-ით, რომ ლაიქზე ვიდეო არ გადახტეს
    db.ref('posts').once('value', snap => {
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
                    <div id="like-btn-${id}" class="action-item ${isLikedByMe ? 'liked' : ''}" onclick="react('${id}', '${post.authorId}')">
                        <i class="fas fa-heart"></i>
                        <span id="like-count-${id}">${likeCount}</span>
                    </div>
                    <div class="action-item" onclick="openComments('${id}')">
                        <i class="fas fa-comment-dots"></i>
                        <span id="comm-count-${id}">0</span>
                    </div>
                    <div id="save-btn-${id}" class="action-item ${isSavedByMe ? 'saved' : ''}" onclick="toggleSavePost('${id}')">
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

                // კომენტარების მთვლელი მაინც რეალურ დროში იყოს
                db.ref(`comments/${id}`).on('value', cSnap => {
                    const count = cSnap.val() ? Object.keys(cSnap.val()).length : 0;
                    const el = document.getElementById(`comm-count-${id}`);
                    if(el) el.innerText = count;
                });

                // ავტორის სტატუსის განახლება
                db.ref(`users/${post.authorId}`).on('value', uSnap => {
                    const u = uSnap.val();
                    const ava = document.getElementById(`ava-${id}`);
                    const name = document.getElementById(`name-${id}`);
                    const status = document.getElementById(`mini-status-${id}`);
                    if(u && u.photo && ava) ava.src = u.photo;
                    if(u && u.name && name) name.innerText = "@" + u.name;
                    if(u && u.presence === 'online' && status) status.style.display = 'block';
                    else if(status) status.style.display = 'none';
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
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeSpan = document.getElementById(`like-count-${postId}`);

    likeRef.once('value').then(snap => {
        let currentLikes = parseInt(likeSpan.innerText);
        if (snap.exists()) {
            likeRef.remove();
            if(likeBtn) likeBtn.classList.remove('liked');
            likeSpan.innerText = currentLikes - 1;
        } else {
            likeRef.set({ type: '❤️', photo: myPhoto, name: myName });
            if(likeBtn) likeBtn.classList.add('liked');
            likeSpan.innerText = currentLikes + 1;
            
            // --- აი ეს ხაზი ჩავამატე ეფექტისთვის ---
            showFloatingLike(postId, myPhoto);
            
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
    const saveBtn = document.getElementById(`save-btn-${postId}`);
    const saveSpan = document.getElementById(`save-count-${postId}`);

    saveRef.once('value').then(snap => {
        let currentSaves = parseInt(saveSpan.innerText);
        if(snap.exists()) {
            saveRef.remove();
            db.ref(`posts/${postId}/saves`).transaction(c => (c || 1) - 1);
            if(saveBtn) saveBtn.classList.remove('saved');
            saveSpan.innerText = currentSaves - 1;
        } else {
            saveRef.set(true);
            db.ref(`posts/${postId}/saves`).transaction(c => (c || 0) + 1);
            if(saveBtn) saveBtn.classList.add('saved');
            saveSpan.innerText = currentSaves + 1;
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

    try {
        if(file) {
            // Cloudinary-ს ნაცვლად ვიყენებთ ImgBB-ს, რომელიც ფოტოებს უპრობლემოდ იღებს
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { 
                method: 'POST', 
                body: formData 
            });
            const data = await res.json();
            
            if (data.success) {
                finalUrl = data.data.url;
            } else {
                alert("ფოტოს ატვირთვა ვერ მოხერხდა (ImgBB Error)");
                btn.disabled = false; btn.innerText = "გამოქვეყნება";
                return;
            }
        }

        // მონაცემების შენახვა Firebase-ში
        await db.ref('community_posts').push({
            authorId: auth.currentUser.uid,
            authorName: myName,
            authorPhoto: myPhoto,
            text: text,
            image: finalUrl, // აქ უკვე იქნება ImgBB-ს ლინკი
            timestamp: Date.now()
        });

        spendAkho(2, 'Community Post');
        document.getElementById('wallPostText').value = "";
        cancelWallImg();
        alert("პოსტი გამოქვეყნდა!");

    } catch (err) {
        alert("კავშირის შეცდომა!");
        console.error(err);
    } finally {
        btn.disabled = false; btn.innerText = "გამოქვეყნება";
    }
}















function loadCommunityPosts() {
    const box = document.getElementById('communityPostsList');
    if (!box) return;
    const myUid = auth.currentUser ? auth.currentUser.uid : null;

    db.ref('community_posts').orderByChild('timestamp').on('value', snap => {
        box.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).reverse().forEach(([id, post]) => {
            const isLiked = (myUid && post.likes && post.likes[myUid]);
            const likeCount = post.likes ? Object.keys(post.likes).length : 0;

            const card = document.createElement('div');
            card.className = "post-card";
            card.innerHTML = `
                <div class="post-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="openProfile('${post.authorId}')">
                        <img src="${post.authorPhoto || 'https://ui-avatars.com/api/?name='+post.authorName}" style="width:35px; height:35px; border-radius:50%; border:1px solid var(--gold); object-fit:cover;">
                        <b style="color:white; font-size:14px;">${post.authorName}</b>
                    </div>
                    <div>
                        ${post.authorId === myUid ? 
                            `<i class="fas fa-trash-alt" style="color:#ff4d4d; cursor:pointer; font-size:14px; padding:5px;" onclick="window.deleteWallPost('${id}')"></i>` : 
                            `<i class="fas fa-flag" style="color:#666; cursor:pointer; font-size:13px; padding:5px;" onclick="window.reportPost('${id}', '${post.authorId}', '${(post.text || "ფოტო").replace(/'/g, "\\'")}')"></i>`
                        }
                    </div>
                </div>
                
                ${post.text ? `<p style="font-size:15px; margin:10px 0; color:#E4E6EB; line-height:1.4;">${post.text}</p>` : ''}
                ${post.image ? `<img src="${post.image}" style="width:100%; border-radius:10px; margin-bottom:10px; cursor:pointer;" onclick="previewImage('${post.image}')">` : ''}
                
                <div style="display:flex; gap:25px; color:var(--gold); border-top:1px solid #333; padding-top:10px; margin-top:5px;">
                    <div onclick="window.toggleWallLike('${id}', '${post.authorId}')" style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                        <i class="${isLiked ? 'fas' : 'far'} fa-heart" style="${isLiked ? 'color:#ff4d4d;' : ''}"></i>
                        <span style="font-size:14px; font-weight:bold;">${likeCount}</span>
                    </div>

                    <div onclick="openComments('${id}', '${post.authorId}')" style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                        <i class="far fa-comment"></i>
                        <span id="comm-count-${id}" style="font-size:14px; font-weight:bold;">0</span>
                    </div>
                </div>`;
            box.appendChild(card);

            db.ref('comments/' + id).on('value', cSnap => {
                const count = cSnap.numChildren();
                const cElem = document.getElementById('comm-count-' + id);
                if (cElem) cElem.innerText = count;
            });
        });
    });
}

// კომენტარების წაშლის კონტროლი (შენი ორიგინალი)
window.deleteComment = function(postId, commentId) {
    if (confirm("ნამდვილად გსურთ კომენტარის წაშლა?")) {
        db.ref('comments/' + postId + '/' + commentId).remove()
            .then(() => console.log("Comment deleted"))
            .catch(err => alert("შეცდომა: " + err.message));
    }
};

// რეპორტის ფუნქცია (ახალი)
window.reportPost = function(postId, authorId, content) {
    if (!auth.currentUser) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (confirm("ნამდვილად გსურთ ამ პოსტის დარეპორტება?")) {
        db.ref('reports').push({
            postId: postId,
            authorId: authorId,
            reporterId: auth.currentUser.uid,
            reporterName: myName,
            contentPreview: content.substring(0, 100),
            timestamp: Date.now()
        }).then(() => alert("მადლობა, რეპორტი გაიგზავნა."));
    }
};






// ლაიქის ლოგიკა
window.toggleWallLike = function(postId, ownerUid) {
    if (!auth.currentUser) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    const myUid = auth.currentUser.uid;
    const likeRef = db.ref('community_posts/' + postId + '/likes/' + myUid);

    likeRef.once('value').then(snap => {
        if (snap.exists()) {
            likeRef.remove();
        } else {
            likeRef.set(true).then(() => {
                // ნოტიფიკაციის გაგზავნა (მხოლოდ თუ სხვის პოსტს აგულებ)
                if (ownerUid && ownerUid !== myUid) {
                    db.ref('notifications/' + ownerUid).push({
                        text: myName + "-მა თქვენი პოსტი დააგულა ❤️",
                        fromPhoto: myPhoto || '', // შენი ფოტო
                        fromUid: myUid,
                        timestamp: Date.now(),
                        type: 'like'
                    });
                }
            });
        }
    }).catch(err => console.error("Like Error:", err));
};

// წაშლის ლოგიკა
window.deleteWallPost = function(postId) {
    if (confirm("ნამდვილად გსურთ პოსტის წაშლა?")) {
        db.ref('community_posts/' + postId).remove()
            .then(() => console.log("Post deleted"))
            .catch(err => alert("შეცდომა წაშლისას: " + err.message));
    }
};








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
    // 1. ვამოწმებთ, არჩეულია თუ არა ჩატი
    const targetId = window.currentChatId; 
    if (!targetId) {
        console.error("Chat ID missing!");
        return alert("ჯერ აირჩიეთ ჩატი (დააწკაპეთ მომხმარებელს)!");
    }

    if (!canAfford(0.5)) return; 

    const formData = new FormData();
    formData.append("file", blob); 
    formData.append("upload_preset", "Emigrantbook.video"); 

    try {
        console.log("ხმა იგზავნება Cloudinary-ზე...");
        const res = await fetch(`https://api.cloudinary.com/v1_1/djbgqzf6l/auto/upload`, { 
            method: 'POST', 
            body: formData 
        });
        const data = await res.json();
        
        if (data.secure_url) {
            console.log("Cloudinary-მ ატვირთა:", data.secure_url);
            const myUid = auth.currentUser.uid;
            const chatId = getChatId(myUid, targetId);
            
            // 2. ვწერთ Firebase-ში
            db.ref(`messages/${chatId}`).push({ 
                senderId: myUid, 
                audio: data.secure_url, 
                ts: Date.now() 
            }).then(() => {
                spendAkho(0.5, 'Voice Message');
                console.log("Firebase-ში წარმატებით ჩაიწერა!");
            }).catch(e => {
                console.error("Firebase Error:", e);
                alert("Firebase შეცდომა: " + e.message);
            });

        } else {
            console.error("Cloudinary Error Data:", data);
            alert("Cloudinary შეცდომა: " + (data.error ? data.error.message : "უცნობი"));
        }
    } catch (err) { 
        console.error("Network Error:", err);
        alert("ინტერნეტის შეცდომა: ვერ მოხერხდა სერვერთან კავშირი"); 
    }
}



function deleteMyVideo(postId) {
 if(confirm("ნამდვილად გსურთ წაშლა?")) {
 db.ref(`posts/${postId}`).remove();
 }
}







// ქვედა ნევბარის ჩატის ლოგოზე წითელი ნიშანის გამოსაჩენი ლოგიკა
function startGlobalUnreadCounter() {
    const myUid = auth.currentUser.uid;
    const chatBadge = document.getElementById('chatCountBadge'); // ეს ID უნდა ქონდეს შენს წითელ ნიშანს

    // ვუსმენთ ყველა ჩატს, სადაც მე ვმონაწილეობ
    db.ref('messages').on('value', snap => {
        let totalUnread = 0;
        const allChats = snap.val();
        if (!allChats) return;

        // გადავუყვებით ყველა ჩატს
        Object.keys(allChats).forEach(chatId => {
            if (chatId.includes(myUid)) {
                // ვნახულობთ ამ კონკრეტულ ჩატში ბოლო ნახვის დროს
                db.ref(`users/${myUid}/last_read/${chatId}`).once('value', readSnap => {
                    const lastRead = readSnap.val() || 0;
                    
                    // ვიღებთ ამ ჩატის ბოლო მესიჯს
                    const msgs = Object.values(allChats[chatId]);
                    const lastMsg = msgs[msgs.length - 1];

                    if (lastMsg.senderId !== myUid && lastMsg.ts > lastRead) {
                        totalUnread++;
                    }

                    // თუ არის წაუკითხავები, ავანთოთ ნიშანი ქვევით ნავბარში
                    if (chatBadge) {
                        if (totalUnread > 0) {
                            chatBadge.innerText = totalUnread;
                            chatBadge.style.display = 'flex';
                        } else {
                            chatBadge.style.display = 'none';
                        }
                    }
                });
            }
        });
    });
}






















// ზარის მესიჯის და ვიდიეო ჩატის ხმები
const messaging = firebase.messaging();

function requestPushPermission() {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('შეტყობინებებზე უფლება მიღებულია.');
            // ვიღებთ უნიკალურ Token-ს ამ მომხმარებლისთვის
            messaging.getToken({ vapidKey: 'აქ_უნდა_ჩაისვას_შენი_VAPID_KEY' })
            .then((currentToken) => {
                if (currentToken) {
                    // ვინახავთ ამ ტოკენს ბაზაში მომხმარებლის ID-სთან ერთად
                    if (auth.currentUser) {
                        db.ref('users/' + auth.currentUser.uid).update({
                            pushToken: currentToken
                        });
                    }
                }
            });
        }
    });
}

// გამოიძახე ეს ფუნქცია როცა მომხმარებელი შედის სისტემაში
auth.onAuthStateChanged(user => {
    if (user) {
        requestPushPermission();
    }
});
