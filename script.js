const firebaseConfig = { 
  apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk", 
  authDomain: "emigrantbook.firebaseapp.com", 
  databaseURL: "https://emigrantbook-default-rtdb.europe-west1.firebasedatabase.app", 
  projectId: "emigrantbook", 
  storageBucket: "emigrantbook.firebasestorage.app", // <-- ეს ხაზი აუცილებლად უნდა იყოს აქ!
  appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f" 
};

// ინიციალიზაცია
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// გლობალური ცვლადები
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage(); // <-- აქ ვააქტიურებთ Storage-ს
const stripe = Stripe('pk_live_51TCrgOK0YcbjyHRbMu9SzwKtqhsqx4FQC6ZJpta54mxfTIuwWVxmLjwh3TZ9TnK8YAtQp7hk4VU65XD45ZBQSt2Z00SXSc5ir9');


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered! ✅'))
            .catch(err => console.log('SW Registration Failed ❌', err));
    });
}












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
    const date = new Date(timestamp);
    // საათი და წუთი (მაგ: 12:45)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    // დღე და თვე (მაგ: 28 Feb)
    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    // აბრუნებს ფორმატს: "12:45, 28 Feb"
    return `${hours}:${minutes}, ${day} ${month}`;
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
    // --- ახალი: ნებართვების მოთხოვნა ავტორიზაციისთანავე ---
    setTimeout(() => {
        askInitialPermissions(); 
    }, 1500);

//სკრიპის ფუნქცია რომ ფული დარიცხოს აკნო
// --- 💰 Stripe-იდან დაბრუნების და ავტომატური დარიცხვის ლოგიკა ---
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const packAmount = urlParams.get('pack'); // ვიღებთ AKHO-ს რაოდენობას URL-იდან

    if (sessionId && packAmount) {
        const amountToAdd = parseFloat(packAmount);
        
        // ვამოწმებთ, ეს კონკრეტული სესია უკვე დამუშავებული ხომ არ არის
        db.ref(`payments_processed/${sessionId}`).once('value', snap => {
            if (!snap.exists()) {
                // ბალანსის გაზრდა
                db.ref(`users/${user.uid}/akho`).transaction(current => {
                    return (current || 0) + amountToAdd;
                }).then(() => {
                    // სესიის მონიშვნა, რომ მეორედ აღარ დაერიცხოს
                    db.ref(`payments_processed/${sessionId}`).set({
                        uid: user.uid,
                        amount: amountToAdd,
                        ts: Date.now()
                    });
                    
                    addToLog('Stripe Purchase', amountToAdd);
                    
                    // მომხმარებლისთვის ლამაზი შეტყობინება
                    if (typeof showCustomAlert === "function") {
                        showCustomAlert("წარმატება", `თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
                    } else {
                        alert(`წარმატება: თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
                    }
                    
                    // URL-ის გასუფთავება (პარამეტრების მოცილება)
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        });
    }
    // --- 💰 დასასრული ---
// აქ მთავრდება ეს ფუნქცია
    
    setTimeout(() => {
      console.log("ვცდილობ ჩაწერას...");
      db.ref('users/' + user.uid + '/test').set("მუშაობს");
      saveMessagingToken(user);
    }, 2000);


   // 🚀 აი აქ ჩაამატე ევროს ბალანსის მოსმენაც:
        db.ref(`users/${user.uid}/euro_balance`).on('value', snap => {
            const euro = snap.val() || 0;
            const euroEl = document.getElementById('euroBalanceDisplay');
            if (euroEl) {
                euroEl.innerText = euro.toFixed(2) + " €";
            }
        });


    
    updatePresence();
    listenToGlobalMessages();
    startNotificationListener();
    checkDailyBonus();
    startGlobalUnreadCounter();
    listenForIncomingCalls(user);

    startWallNotificationListener();
    
    // ... დანარჩენი შენი კოდი უცვლელად ...
   


// ეს არის შეტყობინების ველი
setTimeout(function() {
    const user = firebase.auth().currentUser;
    if (user) {
        const tokenKey = 'fcm_token_sent_' + user.uid;
        
        // ვამოწმებთ, უკვე გავუგზავნეთ თუ არა ეს შეტყობინება ამ იუზერს
        if (localStorage.getItem(tokenKey)) return; 

        try {
            const messaging = firebase.messaging();
            messaging.requestPermission()
                .then(() => messaging.getToken({ 
                    vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk' 
                }))
                .then((token) => {
                    if (token) {
                        db.ref('users/' + user.uid + '/fcmToken').set(token);
                        
                        // აი აქ ერთხელ გამოვუგზავნოთ დასტური
                        showTestNotification(); 
                        
                        // დავიმახსოვროთ ბრაუზერში, რომ მეორედ აღარ შევაწუხოთ
                        localStorage.setItem(tokenKey, 'true'); 
                    }
                })
                .catch((err) => console.log("Push error or denied"));
        } catch (e) {
            console.log("Messaging skip");
        }
    }
}, 3000);



// აი ეს არის ის ადგილი, სადაც "ნაღმია" და სადაც უნდა ჩაანაცვლო:
let currentIncomingCall = null; // აქ შევინახავთ ზარის მონაცემებს

db.ref(`video_calls/${user.uid}`).on('value', snap => {
    const call = snap.val();
    if (call && call.status === 'calling' && (Date.now() - call.ts < 60000)) {
        currentIncomingCall = call; // ვინახავთ ინფორმაციას
        
        // ვავსებთ ფანჯარას მონაცემებით
        document.getElementById('callerNameDisplay').innerText = call.callerName;
        document.getElementById('callerAva').src = call.callerPhoto || 'token-avatar.png';
        
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
 myPhoto = d.photo || "token-avatar.png";
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
 renderAdminOrders();
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

  // აქ 'url' უნდა იყოს შენი ახალი LIVE ლინკი (რომელსაც არ აქვს სიტყვა test_)
  const finalUrl = url + "?client_reference_id=" + user.uid;

  document.getElementById('walletMain').style.display = 'none';
  document.getElementById('paymentPending').style.display = 'block';

  // ეს გადაგიყვანს პირდაპირ Stripe-ის რეალურ გვერდზე
  window.location.href = finalUrl; 
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
    window.currentPostOwnerId = postOwnerId;
    activeReplyTo = null;
    
    const commUI = document.getElementById('commentsUI');
    commUI.style.display = 'flex';
    
    // ვპოულობთ "X" ღილაკს და ვასწავლით, რომ დახურვისას ვიდეო ჩართოს
    const closeBtn = commUI.querySelector('span[onclick*="commentsUI"]');
    if (closeBtn) {
        closeBtn.onclick = function() {
            // კომენტარების დახურვა
            commUI.style.display = 'none';
            
            // თუ უკან ვიდეოა ჩართული, გააგრძელოს Play
            const vid = document.getElementById('fullVideoTag');
            const overlay = document.getElementById('fullVideoOverlay');
            if (overlay && overlay.style.display === 'block') {
                if (vid) vid.play();
            }
        };
    }

    loadComments(postId);
}




function loadComments(postId, isGallery = false) {
    const list = document.getElementById('commList');
    const myUid = auth.currentUser.uid;
    const postOwnerId = window.currentPostOwnerId; // ვიღებთ შენახულ ID-ს

    // ვინახავთ მდგომარეობას გლობალურად, რომ postComment-მაც იცოდეს სად გააგზავნოს
    window.isGalleryMode = isGallery;
    activePostId = postId;

    // სწორი ნაბიჯი: თუ გალერეიდანაა, ვიყენებთ gallery_comments-ს, სხვა შემთხვევაში ორიგინალ comments-ს
    const commentPath = isGallery ? `gallery_comments/${postId}` : `comments/${postId}`;

    db.ref(commentPath).on('value', snap => {
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

    // სწორი ნაბიჯი: თუ window.isGalleryMode არის true, ვიყენებთ სხვა სახელს
    const commentPath = window.isGalleryMode ? `gallery_comments/${activePostId}` : `comments/${activePostId}`;

    if(activeReplyTo) {
        db.ref(`${commentPath}/${activeReplyTo}/replies`).push({
            authorId: auth.currentUser.uid, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
        });
    } else {
        db.ref(commentPath).push({
            authorId: auth.currentUser.uid, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
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
    
    // აპლიკაციის Badge-ის განულება
    if ('setAppBadge' in navigator) {
        navigator.setAppBadge(0).catch(err => console.log("Badge error:", err));
    }

    if (ui) {
        ui.style.display = 'flex';
        ui.style.flexDirection = 'column';
        ui.style.backgroundColor = '#000';
    }

    const list = document.getElementById('chatList');
    if (list) list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>Loading Impact Chats...</p>";
    
    if (!auth.currentUser) return;

    // ვუსმენთ 'following' სიას Firebase-ში
    db.ref(`users/${auth.currentUser.uid}/following`).on('value', async snap => {
        if (!list) return;
        const followers = snap.val();
        
        if(!followers) { 
            list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No active chats yet.</p>";
            return; 
        }

        // --- 📊 დახარისხების ლოგიკა (Sorting) ---
        let chatArray = [];
        const promises = Object.entries(followers).map(async ([uid, data]) => {
            const chatId = getChatId(auth.currentUser.uid, uid);
            // ვიღებთ ბოლო მესიჯს, რომ გავიგოთ დრო (ts) სორტირებისთვის
            const mSnap = await db.ref(`messages/${chatId}`).limitToLast(1).once('value');
            let lastTs = 0;
            if (mSnap.exists()) {
                const msgs = mSnap.val();
                lastTs = Object.values(msgs)[0].ts;
            }
            chatArray.push({ uid, data, lastTs });
        });

        // ველოდებით ყველა ჩატის მონაცემის წამოღებას
        await Promise.all(promises);

        // ვახარისხებთ: ვინც ბოლოს მოგწერა, ის პირველია
        chatArray.sort((a, b) => b.lastTs - a.lastTs);

        list.innerHTML = ""; // ვასუფთავებთ სიას გამოჩენამდე

        chatArray.forEach(({ uid, data }) => {
            const chatId = getChatId(auth.currentUser.uid, uid);
            const item = document.createElement('div');
            item.className = 'chat-list-item';
            item.style = "border:none; background:#000; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
            
            item.onclick = () => {
                db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).set(Date.now());
                document.getElementById('messengerUI').style.display = 'none';
                document.getElementById('messengerCloseLogo').onclick = () => { 
                    document.getElementById('messengerUI').style.display = 'none'; 
                };
                startChat(uid, data.name, data.photo);
            };
            
            // ვუსმენთ წაკითხვის სტატუსს (Badge-ისთვის)
            db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).on('value', readSnap => {
                const lastRead = readSnap.val() || 0;
                
                // ვუსმენთ ბოლო მესიჯს რეალურ დროში (Real-time updates)
                db.ref(`messages/${chatId}`).limitToLast(1).on('value', mSnap => {
                    let lastMsg = "Tap to chat";
                    let msgTimeFormatted = "";
                    let isUnread = false;

                    if(mSnap.exists()) {
                        const msgs = mSnap.val();
                        const msgData = Object.values(msgs)[0];
                        lastMsg = msgData.text || "📷 Media/Voice";
                        const ts = msgData.ts;

                        const msgDate = new Date(ts);
                        const now = new Date();
                        if (msgDate.toDateString() === now.toDateString()) {
                            msgTimeFormatted = msgDate.getHours() + ":" + (msgDate.getMinutes() < 10 ? '0' : '') + msgDate.getMinutes();
                        } else {
                            msgTimeFormatted = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }

                        // თუ მესიჯი სხვისია და უფრო ახალია ვიდრე ჩემი ბოლო წაკითხული
                        if (msgData.senderId !== auth.currentUser.uid && ts > lastRead) {
                            isUnread = true;
                        }
                    }

                    // ონლაინ სტატუსის შემოწმება
                    db.ref(`users/${uid}/presence`).on('value', presenceSnap => {
                        const isOnline = presenceSnap.val() === 'online';

                        item.innerHTML = `
                            <div style="position:relative; flex-shrink:0;">
                                <img src="${data.photo || 'token-avatar.png'}" style="width:56px; height:56px; border-radius:50%; object-fit:cover;">
                                <div style="position:absolute; bottom:2px; right:2px; width:14px; height:14px; background:#4ade80; border-radius:50%; border:3px solid #000; display:${isOnline ? 'block' : 'none'};"></div>
                                <div id="badge-${uid}" style="position:absolute; top:-2px; right:-2px; background:red; color:white; border-radius:50%; width:18px; height:18px; font-size:10px; display:${isUnread ? 'flex' : 'none'}; align-items:center; justify-content:center; border:2px solid black; font-weight:bold;">!</div>
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden; flex:1; margin-left:5px;">
                                <b style="color:white; font-size:16px; margin-bottom:2px;">${data.name}</b>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span style="color:${isUnread ? 'white' : '#888'}; font-weight:${isUnread ? 'bold' : 'normal'}; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${lastMsg}</span>
                                    <span style="color:#888; font-size:12px;"> · ${msgTimeFormatted}</span>
                                </div>
                            </div>
                            <div style="width:12px; height:12px; background:#0084ff; border-radius:50%; display:${isUnread ? 'block' : 'none'}; margin-right:5px;"></div>
                        `;
                    });
                });
            });
            list.appendChild(item);
        });
    });
}
                



function startChat(uid, name, photo) {
    stopMainFeedVideos();
    setAppBadge(0);
    
    // ეს ხაზი აცოცხლებს ხმოვანის გაგზავნას
    window.currentChatId = uid;
    currentChatId = uid; 

    document.getElementById('socialListsUI').style.display = 'none';
    document.getElementById('individualChat').style.display = 'flex';
    document.getElementById('chatTargetName').innerText = name;
    document.getElementById('chatTargetAva').src = photo;

    // --- ✨ სწორი Seen Logic: მხოლოდ წაუკითხავებზე რეაგირება ---
    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, uid);

    // ვეძებთ მხოლოდ იმ მესიჯებს, რომლებიც ჩემი არაა და Seen არის false
    db.ref(`messages/${chatId}`).orderByChild('seen').equalTo(false).once('value', snap => {
        const updates = {};
        snap.forEach(child => {
            const m = child.val();
            if (m.senderId !== myUid) {
                // ვამზადებთ ერთიან ბრძანებას (Multipath update)
                updates[`${child.key}/seen`] = true;
            }
        });
        // ყველას ერთად ვაახლებთ ერთი ბრძანებით
        if (Object.keys(updates).length > 0) {
            db.ref(`messages/${chatId}`).update(updates);
        }
    });
    // -------------------------------------------------------

    const statusEl = document.getElementById('chatTargetStatus');
    if (statusEl) {
        db.ref(`users/${uid}/presence`).on('value', snap => {
            const presence = snap.val();
            if (presence === 'online') {
                statusEl.innerText = 'საიტზეა';
                statusEl.style.color = '#4ade80';
            } else {
                const timeAgo = (typeof formatTimeShort === 'function') ? formatTimeShort(presence) : '';
                statusEl.innerText = timeAgo ? timeAgo + '   ago' : 'offline';
                statusEl.style.color = '#888';
            }
        });
    }
    loadMessages(uid);
    listenToTyping(uid);

}





                                
                                                
let currentChatLimit = 20; // გლობალური ცვლადი ლიმიტისთვის

function loadMessages(targetUid) {
    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, targetUid);
    const box = document.getElementById('chatMessages');

    db.ref(`users/${targetUid}`).once('value', targetSnap => {
        const tData = targetSnap.val();
        const tPhoto = (tData && tData.photo) ? tData.photo : 'token-avatar.png';

        db.ref(`users/${myUid}/deleted_messages/${chatId}`).on('value', deletedSnap => {
            const deletedMsgs = deletedSnap.val() || {};

            // --- 🔄 აქ ჩაჯდა Pagination ლოგიკა (limitToLast) ---
            db.ref(`messages/${chatId}`).limitToLast(currentChatLimit).on('value', snap => {
                box.innerHTML = "";
                let lastTs = 0;
                let messagesArray = [];
                
                snap.forEach(child => {
                    if (!deletedMsgs[child.key]) {
                        messagesArray.push({ id: child.key, val: child.val() });
                    }
                });

                messagesArray.forEach((item, index) => {
                    const msgId = item.id;
                    const msg = item.val;
                    const type = msg.senderId === myUid ? 'sent' : 'received';
                    const isMine = type === 'sent';
                    
                    // --- 📅 დროის გამყოფი ---
                    if (msg.ts - lastTs > 3600000) {
                        const d = new Date(msg.ts);
                        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                        let h = d.getHours();
                        let ampm = h >= 12 ? 'PM' : 'AM';
                        h = h % 12 || 12;
                        let m = d.getMinutes().toString().padStart(2, '0');
                        box.innerHTML += `<div style="text-align:center; color:var(--gold, #d4af37); font-size:10px; margin:15px 0 5px; font-weight:bold; text-transform:uppercase; width:100%;">${days[d.getDay()]} AT ${h}:${m} ${ampm}</div>`;
                    }
                    lastTs = msg.ts;

                    // --- 🔍 ტიპის განსაზღვრა (ფოტო, ემოჯი, აუდიო თუ ტექსტი) ---
                    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\s)+$/g;
                    const isOnlyEmoji = msg.text && emojiRegex.test(msg.text.trim()) && msg.text.trim().length <= 10;
                    const isImg = msg.image ? true : false;

                    let content = "";
                    if (isImg) {
                        content = `<img src="${msg.image}" style="max-width:170px; height:auto; border-radius:12px; cursor:pointer;" onclick="window.open('${msg.image}', '_blank')">`;
                    } else if (msg.audio) {
                        content = `<audio src="${msg.audio}" controls style="width:200px; height:35px; display:block; outline:none;"></audio>`;
                    } else {
                        content = msg.text || "";
                    }
                    
                    const dynamicBubbleStyle = (isOnlyEmoji || isImg || msg.audio) ? 
                        `background: transparent; border: none; padding: 0; font-size: ${isOnlyEmoji ? '35px' : '15px'};` : 
                        `background: ${isMine ? 'var(--gold, #d4af37)' : '#222'}; color: ${isMine ? 'black' : 'white'}; border: ${isMine ? 'none' : '1px solid #333'}; padding: 8px 14px; border-radius: ${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};`;

                    box.innerHTML += `
                    <div style="display: flex; flex-direction: column; margin-bottom: 4px; width: 100%; align-items: ${isMine ? 'flex-end' : 'flex-start'};" 
                         oncontextmenu="event.preventDefault(); window.deleteMessage('${chatId}', '${msgId}', '${msg.senderId}')">
                        
                        <div style="display: flex; align-items: flex-end; gap: 8px; max-width: 85%; flex-direction: ${isMine ? 'row-reverse' : 'row'};">
                            
                            ${!isMine ? `<img src="${tPhoto}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--gold, #d4af37); flex-shrink:0;">` : ''}
                            
                            <div class="msg-bubble msg-${type}" style="
                                display: inline-block; 
                                min-width: 20px; 
                                max-width: 100%; 
                                width: fit-content; 
                                cursor: pointer; 
                                word-wrap: break-word;
                                text-align: left;
                                ${dynamicBubbleStyle}
                            ">
                                <div class="msg-content" style="${isOnlyEmoji ? '' : 'font-size: 15px; font-weight: ' + (isMine ? '500' : 'normal') + '; line-height: 1.4;'}">${content}</div>
                            </div>
                        </div>

                        ${isMine && msg.seen && index === messagesArray.length - 1 ? 
                            `<div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 2px; margin-right: 2px;">
                                <img src="${tPhoto}" style="width:14px; height:14px; border-radius:50%; border:1px solid var(--gold, #d4af37); object-fit:cover; opacity: 0.9;">
                            </div>` : ''}
                    </div>`;
                });

                // მხოლოდ პირველ ჩატვირთვაზე ჩავიდეს ბოლოში
                if (currentChatLimit === 20) {
                    box.scrollTop = box.scrollHeight;
                }
            });
        });
    });

    // --- 📜 სქროლვის დეტექტორი ძველი მესიჯებისთვის ---
    box.onscroll = function() {
        if (box.scrollTop === 0) {
            const oldScrollHeight = box.scrollHeight;
            currentChatLimit += 20; // ვზრდით ლიმიტს
            loadMessages(targetUid); // თავიდან ვიძახებთ იგივე ფუნქციას ახალი ლიმიტით
            
            // პატარა პაუზა, რომ სქროლი არ "გაიქცეს" ზემოთ
            setTimeout(() => {
                box.scrollTop = box.scrollHeight - oldScrollHeight;
            }, 100);
        }
    };
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
    // 1. შენი ორიგინალი Typing... სტატუსის ლოგიკა (უცვლელად)
    if (!currentChatId) return;
    const chatId = getChatId(auth.currentUser.uid, currentChatId);
    db.ref(`typing/${chatId}/${auth.currentUser.uid}`).set(true);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        db.ref(`typing/${chatId}/${auth.currentUser.uid}`).remove();
    }, 3000);

    // 2. ✨ ახალი: ღილაკის ხატულას შეცვლა (ლაიქი VS თვითმფრინავი)
    const inp = document.getElementById('messageInp');
    const sendIcon = document.getElementById('sendBtnIcon'); 
    
    if (inp && sendIcon) {
        // თუ ინპუტში რამე წერია (არაა ცარიელი), ხატულა ხდება თვითმფრინავი
        if (inp.value.trim().length > 0) {
            sendIcon.className = 'fas fa-paper-plane';
        } else {
            // თუ ცარიელია, ბრუნდება ლაიქი
            sendIcon.className = 'fas fa-thumbs-up';
        }
    }
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
        
        // ✨ კრიტიკული ჩამატება: ვამოწმებთ, შენი ჩატია თუ სხვისი
        // თუ ჩატის სახელი (snap.key) არ შეიცავს შენს UID-ს, ფუნქცია ჩერდება
        if (!snap.key.includes(myUid)) return;

        snap.ref.limitToLast(1).on('child_added', mSnap => {
            const msg = mSnap.val();
            // 1. თუ მესიჯი ჩემი გამოგზავნილია, ან ძალიან ძველია, არაფერს ვშვებით
            if (!msg || msg.senderId === myUid) return;
            if (Date.now() - msg.ts > 10000) return;
            
            // 2. თუ ამ ადამიანთან ჩატი უკვე გახსნილი მაქვს, ნოტიფიკაცია არ გვინდა
            if (currentChatId && getChatId(myUid, currentChatId) === snap.key) return;

            // 3. ვიგებთ ვინ მოგვწერა და ვუშვებთ ნოტიფიკაციებს
            db.ref(`users/${msg.senderId}`).once('value', uSnap => {
                const u = uSnap.val();
                if (!u) return;
                
                const senderName = u.name || "მომხმარებელი";
                const messageText = msg.text || "📷 Voice/Media";

                // --- 🔊 ხმის დაკვრის ახალი ბლოკი (არაფერს შლის) ---
                const sound = document.getElementById('msgSound');
                if (sound) {
                    sound.currentTime = 0; // აბრუნებს დასაწყისში, რომ გადაბმულ მესიჯებზეც დაიწკაპუნოს
                    sound.play().catch(e => console.log("ხმის დაკვრა დაიბლოკა."));
                }

                // --- აქ ჩაჯდა შენი ორიგინალი კოდი ---
                setAppBadge(1); // აანთებს ხატულას (Badge)
                showLocalNotification("ახალი მესიჯი: " + senderName, messageText); // გამოიტანს Push-ს
                
                // ასევე შენი ძველი ფუნქცია, რომელიც საიტის შიგნით აჩენს პატარა ფანჯარას
                showGlobalPush(senderName, u.photo, messageText);
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
    const myUid = auth.currentUser.uid;
    
    // ვიღებთ ტექსტს და ვაცილებთ ზედმეტ სფეისებს
    let msgText = inp.value.trim();

    // --- ✨ ახალი ლოგიკა: თუ ინპუტი ცარიელია, msgText ხდება ლაიქი ---
    // თუ ტექსტი ცარიელია, მაგრამ მომხმარებელმა მაინც დააჭირა ღილაკს
    if (!msgText) {
        msgText = "👍";
    }
    // --------------------------------------------------------

    if (!currentChatId) return;
    const chatId = getChatId(myUid, currentChatId);

    // 1. მესიჯის გაგზავნა ბაზაში (ტექსტი იქნება ან ნაწერი, ან ლაიქი)
    db.ref(`messages/${chatId}`).push({
        senderId: myUid,
        text: msgText,
        ts: Date.now(),
        seen: false
    });

    // 2. ნოტიფიკაციის გაგზავნა მეორე იუზერთან
    if (typeof sendPushToUser === "function") {
        sendPushToUser(currentChatId, myName, msgText);
    }

    // 3. სტატუსების გასუფთავება და გადახდა (შენი ორიგინალი ხაზები)
    db.ref(`typing/${chatId}/${myUid}`).remove();
    spendAkho(0.2, 'Message');
    
    inp.value = ""; // ვასუფთავებთ ინპუტს

    // აუცილებელია გამოვიძახოთ handleTyping, რომ ღილაკი ისევ ლაიქად იქცეს
    if (typeof handleTyping === "function") {
        handleTyping();
    }
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
 <img src="${user.photo || 'token-avatar.png'}" class="discover-ava">
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

   // ვმალავთ და ვასუფთავებთ მონიშნულების სივრცეს ახალ პროფილზე გადასვლისას
    const taggedList = document.getElementById('userTaggedPostsList');
    if (taggedList) {
        taggedList.style.display = 'none';
        taggedList.innerHTML = ''; 
    }
 
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
     document.getElementById('profAva').src = user.photo || "token-avatar.png";
     profNameEl.innerText = user.name;
     // --- ეს ნაწილი ჩასვი profNameEl.innerText-ის ქვემოთ ---
     const locRow = document.getElementById('profLocationRow');
     const locText = document.getElementById('profLocationText');

     if (user.city) {
     locText.innerText = user.city; // აჩვენებს იმ იუზერის ქალაქს, ვისზეც შედიხარ
     locRow.style.display = 'flex';
     } else {
     locRow.style.display = 'none'; // თუ არ უწერია, საერთოდ ქრება (შენიც აღარ დარჩება)
     }
     // ----------------------------------------------------
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

    // ევროს ღილაკის გამოჩენა მხოლოდ შენს პროფილზე
    const euroBtn = document.getElementById('euroBalanceBtn');
    if (euroBtn) {
     euroBtn.style.display = (uid === auth.currentUser.uid) ? 'inline-flex' : 'none';
     }


     // --- აი ეს ჩაამატე აქ ---
const editNameBtn = document.getElementById('editNameBtn');
if (editNameBtn) {
    editNameBtn.style.display = (uid === auth.currentUser.uid) ? 'flex' : 'none';
}
// -----------------------

   
     if(uid === auth.currentUser.uid) {
         controls.innerHTML = `<button class="profile-btn btn-gold" onclick="document.getElementById('avaInp').click()" data-key="edit">Edit</button>`;
         
         if (galleryUploadContainer) {
             galleryUploadContainer.style.marginTop = "0";
             controls.appendChild(galleryUploadContainer);
         }



         // ... (ზედა ნაწილი იგივე რჩება) ...
    document.getElementById('profAva').src = user.photo || "token-avatar.png";
     profNameEl.innerText = user.name;

     // --- ინდივიდუალური მისამართის ლოგიკა (ყველასთვის) ---
     const locRow = document.getElementById('profLocationRow');
     const locText = document.getElementById('profLocationText');

     if (user.city && user.city.trim() !== "") {
         locText.innerText = user.city; // აჩვენებს იმ იუზერის ქალაქს, ვისზეც შედიხარ
         locRow.style.display = 'flex';
     } else {
         locRow.style.display = 'none'; // თუ არ უწერია, ქრება (და შენიც აღარ გამოჩნდება)
     }
     // ----------------------------------------------------

     

       
       
         // შენს პროფილზეც რომ გამოჩნდეს "Gifts"
         controls.innerHTML += `
             <button class="profile-btn btn-outline" onclick="showGiftsCollection('${uid}')" style="margin-left:5px;">
                <i class="fas fa-gift"></i> Gifts
             </button>
         `;
         
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
             
             // სხვის პროფილზეც რომ გამოჩნდეს "Gifts"
             // 1. ვქმნით ღილაკს - დავამატე 'white-space: nowrap', რომ ციფრი ქვემოთ არ ჩავარდეს
            controls.innerHTML += `
            <button id="gifts-btn-${uid}" class="profile-btn btn-outline" onclick="showGiftsCollection('${uid}')" style="margin-left:5px; white-space: nowrap;">
            <i class="fas fa-gift"></i> Gifts
            </button>
            `;

            // 2. ვწერთ ციფრს პირდაპირ ტექსტის გვერდით
            db.ref(`received_gifts/${uid}`).once('value', snap => {
            const count = snap.numChildren() || 0;
            const giftsBtn = document.getElementById(`gifts-btn-${uid}`);
            if (giftsBtn) {
             // აქ Gifts და (${count}) ერთად წერია, რაც უზრუნველყოფს მათ გვერდიგვერდ ყოფნას
            giftsBtn.innerHTML = `<i class="fas fa-gift"></i> Gifts (${count})`;
            }
            });
            } else {
             // ... აქ რჩება "Private Profile" ლოგიკა ...
     
             document.getElementById('profGrid').innerHTML = `<div class="private-lock-screen"><p data-key="private_profile">Private Profile</p></div>`;
             document.getElementById('profTabs').style.display = 'none';
             controls.innerHTML = `<button class="profile-btn btn-gold" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>`;
         }
         applyLanguage();
     }
 });
}







 function showProfileVisitors() {
document.getElementById('visitorAvaNav').style.display = 'none';
document.getElementById('feetStats').style.display = 'block';
localStorage.setItem('last_seen_visitor_ts', Date.now());
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
    
    db.ref('posts').on('value', snap => {
        grid.innerHTML = ""; 
        const posts = snap.val();
        if(!posts) {
            document.getElementById('statVidsCount').innerText = 0;
            return;
        }

        let vCount = 0;
        let videoList = [];
        const postEntries = Object.entries(posts).reverse();

        // ვაგროვებთ ყველა ვიდეოს
        postEntries.forEach(([id, post]) => {
            if(post.authorId === uid && post.media) {
                const video = post.media.find(m => m.type === 'video');
                if(video) {
                    videoList.push({ id, post, video });
                    vCount++;
                }
            }
        });

        document.getElementById('statVidsCount').innerText = vCount;

        let currentlyShown = 0; // რამდენი გვაქვს ამჟამად ნაჩვენები

        function showNextSix() {
            // ვიღებთ შემდეგ 6 ვიდეოს
            const nextBatch = videoList.slice(currentlyShown, currentlyShown + 6);
            
            nextBatch.forEach((itemData) => {
                const { id, post, video } = itemData;
                const views = post.views || 0;
                const formattedViews = views >= 1000 ? (views/1000).toFixed(1) + 'K' : views;

                const item = document.createElement('div');
                item.className = 'grid-item';
                item.innerHTML = `
                    <video src="${video.url}#t=0.1" 
                               muted 
                               playsinline 
                               preload="metadata" 
                               poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                               style="object-fit: cover; width:100%; height:100%; background: #000;">
                        </video>
                        <div class="video-views-label">
                            <i class="fas fa-play"></i> ${formattedViews}
                        </div>
                    `;
                
                // ინდექსის გადაცემა სრული ვიდეოსთვის
                const globalIndex = currentlyShown; 
                item.onclick = () => playFullVideo(video.url, id, globalIndex);
                
                grid.appendChild(item);
                currentlyShown++; // ვზრდით მთლიან რაოდენობას
            });

            // ღილაკის მართვა
            const oldBtn = document.getElementById('loadMoreBtn');
            if(oldBtn) oldBtn.remove(); // ძველს ვშლით

            if (currentlyShown < videoList.length) {
                const loadMoreBtn = document.createElement('div');
                loadMoreBtn.id = 'loadMoreBtn';
                loadMoreBtn.innerHTML = 'მეტის ნახვა <i class="fas fa-chevron-down" style="margin-left:5px;"></i>';
                loadMoreBtn.style = "grid-column: 1 / -1; text-align: center; padding: 15px; color: #aaa; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 15px 0; cursor: pointer; font-size: 14px;";
                loadMoreBtn.onclick = () => showNextSix(); // კიდევ 6-ს დაამატებს
                grid.appendChild(loadMoreBtn);
            }
        }

        // პირველი 6-ის გამოჩენა
        showNextSix();
    });
}
                    






function playFullVideo(url, postId, currentIndex) {
  killVideo();
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');

   // --- ხატულას მოშორება და ხმის დაბრუნება ---
    vid.setAttribute('poster', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    vid.muted = false; // ვცდილობთ ხმით ჩართვას
    vid.playsInline = true;
    // -------------------------------------------

    vid.src = url; 
    overlay.style.display = 'block'; 
    
    // ვიდეოს ჩართვა
    vid.play().catch(error => {
        // თუ ბრაუზერმა დაბლოკა ხმიანი ავტოპლეი, მაშინ ვრთავთ უხმოდ, რომ არ გაჩერდეს
        vid.muted = true;
        vid.play();
    });

    // 🛑 ეს ორი ხაზი აცოცხლებს სქროლვას ყოველ გადასვლაზე:
    window.currentFullVideoId = postId; 
    window.currentVideoIndex = currentIndex; 

    // --- სქროლვის (Swipe) ლოგიკა ---
    let startY = 0;
    vid.ontouchstart = (e) => { startY = e.touches[0].clientY; };
    vid.ontouchend = (e) => {
        let endY = e.changedTouches[0].clientY;
        let diff = startY - endY;

        if (Math.abs(diff) > 50) {
            // ვიღებთ ყველა ვიდეოს პროფილის ბადიდან
            const allItems = Array.from(document.querySelectorAll('#profGrid .grid-item'));
            
            // ვამოწმებთ, რომ ინდექსი გვაქვს
            if (window.currentVideoIndex !== undefined) {
                if (diff > 0 && window.currentVideoIndex < allItems.length - 1) {
                    // გადავდივართ შემდეგზე და ფუნქცია თავიდან გაეშვება ახალი ინდექსით
                    allItems[window.currentVideoIndex + 1].click();
                } else if (diff < 0 && window.currentVideoIndex > 0) {
                    // გადავდივართ წინაზე
                    allItems[window.currentVideoIndex - 1].click();
                }
            }
        }
    };

    // --- შენი ყველა ორიგინალი ლოგიკა (ლაიქი, ნახვა, საჩუქარი) ---
    if (postId) {
        db.ref(`posts/${postId}/views`).transaction(c => (c || 0) + 1);

        db.ref(`posts/${postId}`).on('value', snap => {
            const data = snap.val();
            if (!data) return;

            window.currentFullVideoAuthorId = data.authorId;

            const ava = document.getElementById('fullVideoAva');
            if (ava) {
                ava.src = data.authorPhoto || 'https://ui-avatars.com/api/?name=' + data.authorName;
                ava.parentElement.onclick = () => {
                    closeFullVideo();
                    openProfile(data.authorId);
                };
            }

            const vText = document.getElementById('fullVideoViewsText');
            if (vText) {
                const views = data.views || 0;
                vText.innerText = views >= 1000 ? (views / 1000).toFixed(1) + 'K' : views;
            }

            const lElem = document.getElementById('fullLikeCount');
            const lIcon = document.getElementById('fullLikeIcon');
            const myUid = auth.currentUser.uid;
            const likesKeys = data.likedBy ? Object.keys(data.likedBy) : [];
            
            if (lElem) lElem.innerText = likesKeys.length;
            if (lIcon) lIcon.style.color = likesKeys.includes(myUid) ? '#ff4d4d' : 'white';

            const sIcon = document.getElementById('fullSaveIcon');
            if (sIcon) sIcon.style.color = (data.savedBy && data.savedBy[myUid]) ? 'var(--gold)' : 'white';

            const giftBtn = document.querySelector('#fullVideoOverlay .side-action-item[onclick*="openGiftPanel"]');
            if (giftBtn) {
                giftBtn.onclick = () => openGiftPanel(window.currentFullVideoId, window.currentFullVideoAuthorId);
            }
          
          // იპოვე ეს ადგილი playFullVideo-ში და ჩაანაცვლე ამით:
           const moreBtn = document.querySelector('#fullVideoOverlay .more-btn'); 
           if (moreBtn) {
           // 🔍 ვამოწმებთ: თუ ვიდეოს ავტორი მე ვარ, გამოჩნდეს, თუ არა - დაიმალოს
           if (data.authorId === auth.currentUser.uid) {
            moreBtn.style.display = 'flex'; // ჩანს
            moreBtn.onclick = () => toggleMoreMenu(window.currentFullVideoId);
            } else {
            moreBtn.style.display = 'none'; // იმალება სხვის პროფილზე
            }
           }
        });

        db.ref(`comments/${postId}`).on('value', cSnap => {
            const cElem = document.getElementById('fullCommCount');
            if (cElem) cElem.innerText = cSnap.numChildren();
        });
    }
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





// მეილის ვალიდაცია
    // 1. დამხმარე ფუნქციები (ესენი ჩასვი handleAuth-ის ზემოთ)
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function showAuthError(message) {
    const errorBox = document.getElementById('authError');
    const errorText = document.getElementById('errorText');
    if (errorBox && errorText) {
        errorText.innerText = message;
        errorBox.style.display = 'block';
        setTimeout(() => { errorBox.style.display = 'none'; }, 5000);
    }
}

// 2. მთავარი ფუნქცია (Firebase-ის ლოგიკით და ქართული შეცდომებით)
async function handleAuth(type) {
    if(document.getElementById('authError')) document.getElementById('authError').style.display = 'none';

    if (type === 'reg') {
        const email = document.getElementById('rEmail').value.trim();
        const pass = document.getElementById('rPass').value.trim();
        const passConfirm = document.getElementById('rPassConfirm').value.trim();
        const fName = document.getElementById('rFirstName').value.trim();
        const lName = document.getElementById('rLastName').value.trim();
        const name = fName + " " + lName;

        if (!fName || !lName || !email || !pass) return showAuthError("გთხოვთ, შეავსოთ ყველა ველი");
        if (!isValidEmail(email)) return showAuthError("ელფოსტის ფორმატი არასწორია");
        if (pass.length < 6) return showAuthError("პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო");
        if (pass !== passConfirm) return showAuthError("პაროლები არ ემთხვევა ერთმანეთს!");

        auth.createUserWithEmailAndPassword(email, pass).then(u => {
            db.ref('users/' + u.user.uid).set({ 
                name: name, 
                akho: 50.00, 
                photo: "", 
                hasSeenRules: false, 
                role: 'user', 
                privacy: 'public', 
                presence: Date.now() 
            }).then(() => {
                if(typeof addToLog === "function") addToLog('Welcome Bonus', 50.00);
                showCustomAlert("მოგესალმებით", "რეგისტრაცია წარმატებულია!");
            });
        }).catch(err => {
            let msg = "რეგისტრაცია ვერ მოხერხდა";
            if (err.code === 'auth/email-already-in-use') msg = "ეს ელფოსტა უკვე დაკავებულია";
            showAuthError(msg);
        });

    } else {
        const email = document.getElementById('uEmail').value.trim();
        const pass = document.getElementById('uPass').value.trim();

        if (!email || !pass) return showAuthError("შეიყვანეთ მეილი და პაროლი");

        auth.signInWithEmailAndPassword(email, pass).then(u => {
            showCustomAlert("მოგესალმებით", "წარმატებით შეხვედით სისტემაში!");
        }).catch(err => {
            let msg = "ავტორიზაცია ვერ მოხერხდა";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = "ელფოსტა ან პაროლი არასწორია";
            }
            showAuthError(msg);
        });
    }
}            
// აქ მთავრდება



async function startTokenUpload() {
    // 1. შემოწმება (ტოკენები გაქვს თუ არა)
    if (!canAfford(5)) return;

    const fileInput = document.getElementById('videoInput');
    const file = fileInput.files[0];
    if (!file) return alert("აირჩიეთ ვიდეო");

    // --- 🚀 ახალი ვიზუალის აქტივაცია ---
    const progressModal = document.getElementById('uploadProgressModal');
    const statusTitle = document.getElementById('uploadStatusTitle');
    const statusText = document.getElementById('uploadStatusText');
    const progressBtn = document.getElementById('uploadProgressBtn');
    const percentText = document.getElementById('uploadPercent'); // პროცენტის ტექსტი

    if (progressModal) {
        progressModal.style.display = 'flex';
        statusTitle.innerText = "Uploading Post!";
        statusText.innerText = "Your video is processing.";
        if (percentText) percentText.innerText = "0%"; // საწყისი მნიშვნელობა
        progressBtn.innerText = "Processing...";
        progressBtn.disabled = true;
        progressBtn.style.background = "rgba(212,175,55,0.3)";
    }

    const btn = document.getElementById('upBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "მიმდინარეობს ატვირთვა...";
    }

    try {
        // 2. Firebase Storage-ის რეფერენსი
        const storage = firebase.storage(); 
        const storageRef = storage.ref();
        const videoName = Date.now() + "_" + file.name;
        const videoRef = storageRef.child('videos/' + videoName);

        // 3. ატვირთვა (პროცენტების კონტროლით)
        const uploadTask = videoRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // პროცენტის გამოთვლა რეალურ დროში
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                
                // ციფრების განახლება შუაგულში
                if (percentText) percentText.innerText = progress + "%";
                
                // ღილაკზეც რომ ჩანდეს დინამიკურად
                if (progressBtn) progressBtn.innerText = "Uploading " + progress + "%";
            }, 
            (error) => {
                // შეცდომის დამუშავება
                console.error("ატვირთვის შეცდომა:", error);
                if (progressModal) progressModal.style.display = 'none';
                alert("შეცდომა: " + error.message);
            }, 
            async () => {
                // 4. წარმატებით დასრულება
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                // 5. მონაცემების შენახვა Realtime Database-ში
                await db.ref('posts').push({
                    authorId: auth.currentUser.uid,
                    authorName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
                    authorPhoto: typeof myPhoto !== 'undefined' ? myPhoto : "",
                    text: document.getElementById('videoDesc').value || "",
                    media: [{ url: downloadURL, type: 'video' }],
                    timestamp: Date.now()
                });

                // ტოკენის ჩამოჭრა
                spendAkho(5, 'Video Upload');

                // --- ✅ წარმატების ვიზუალი (100% და დასრულება) ---
                if (progressModal) {
                    if (percentText) percentText.innerText = "100%";
                    statusTitle.innerText = "Thank You!";
                    statusText.innerText = "Payment received.";
                    progressBtn.innerText = "Check Balance";
                    progressBtn.disabled = false;
                    progressBtn.style.background = "var(--gold)";
                    progressBtn.style.color = "black";
                    progressBtn.style.cursor = "pointer";
                    
                    progressBtn.onclick = () => {
                        progressModal.style.display = 'none';
                        location.reload();
                    };
                } else {
                    alert("ვიდეო წარმატებით აიტვირთა!");
                    location.reload();
                }
            }
        );

    } catch (err) {
        console.error("კრიტიკული შეცდომა:", err);
        if (progressModal) progressModal.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            btn.innerText = "ატვირთვა";
        }
    }
}

                



function togglePlayPause(vid) {
    if (vid.paused) vid.play();
    else vid.pause();
}
    


// აქ იწყება ტოკერის ვიდეოები
    // 1. ცვლადები (დატოვე გარეთ)
let lastVisibleTimestamp = null; 
let isFeedLoading = false;
const FEED_LIMIT = 15;

// 2. წმენდის ფუნქცია
function cleanupOldVideos() {
    const allCards = document.querySelectorAll('.video-card');
    if (allCards.length > 25) {
        for (let i = 0; i < 10; i++) {
            const videoTag = allCards[i].querySelector('video');
            if (videoTag) {
                videoTag.pause();
                videoTag.src = "";
                videoTag.load();
                videoTag.remove();
            }
            allCards[i].remove();
        }
    }
}






function formatPostDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
}
// 3. მთავარი ფუნქცია (შენი სრული ლოგიკით)
function renderTokenFeed() {
    if (document.getElementById('liveUI').style.display === 'flex') return;
    if (isFeedLoading) return;
    
    isFeedLoading = true;
    const feed = document.getElementById('main-feed');

    // Pagination ლოგიკა
    let query = db.ref('posts').orderByChild('timestamp');
    if (lastVisibleTimestamp) {
        query = query.endAt(lastVisibleTimestamp - 1);
    }

    query.limitToLast(FEED_LIMIT).once('value', snap => {
        const data = snap.val(); 
        isFeedLoading = false;
        if (!data) return;

        // მასივად გადაყვანა და დროით დალაგება
        let postEntries = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
      
        // ვიმახსოვრებთ ბოლო დროს შემდეგი სქროლისთვის
        lastVisibleTimestamp = postEntries[postEntries.length - 1][1].timestamp;

        postEntries.forEach(([id, post]) => {
            if (!post || !post.media || !post.media.some(m => m.type === 'video') || document.getElementById(`card-${id}`)) return;

            const videoUrl = post.media.find(m => m.type === 'video').url;
            const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
            const shareCount = post.shares || 0;
            const saveCount = post.saves || 0;
            
            const card = document.createElement('div');
            card.className = 'video-card';
            card.id = `card-${id}`;
            
            const isLikedByMe = post.likedBy && post.likedBy[auth.currentUser.uid];
            const isSavedByMe = post.savedBy && post.savedBy[auth.currentUser.uid];      
            
            // --- შენი სრული INNER HTML (არაფერია ამოკლებული) ---
            card.innerHTML = `
             <video src="${videoUrl}" 
             loop 
             playsinline 
             muted 
             autoplay
             preload="metadata" 
             poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
             style="background: black; object-fit: cover; width:100%; height:100%; transition: opacity 0.3s;"
             onclick="togglePlayPause(this)">
             </video>
                <div class="live-activity-overlay" id="live-activity-${id}" style="position: absolute; bottom: 110px; left: 15px; width: 220px; height: 250px; pointer-events: none;"></div>
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
                    <div class="action-item" onclick="openShare('${id}', '${videoUrl}')">
                        <i class="fas fa-share"></i>
                        <span id="share-count-${id}">${shareCount}</span>
                    </div>
                    <div class="action-item gift-btn" onclick="window.openGiftPanel('${id}', '${post.authorId}')">
                        <i class="fas fa-gift" style="color: #ff4d4d;"></i>
                        <span>Gift</span>
                    </div>
                  ${post.authorId === auth.currentUser.uid ? `
                  <div class="action-item" onclick="deleteMyVideo('${id}', '${post.media[0].url}')" style="margin-top: 5px;">
                  <i class="fas fa-trash-alt" style="color: #ff4d4d; font-size: 20px;"></i>
                  <span style="color: #ff4d4d; font-size: 10px;">DEL</span>
                 </div>
                 ` : ''}
                </div>
                  <div style="position:absolute; left:15px; bottom:90px; text-shadow:2px 2px 4px #000; pointer-events:none; max-width: 75%;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <b id="name-${id}" style="color:var(--gold); cursor:pointer; pointer-events:auto;" onclick="openProfile('${post.authorId}')">@${post.authorName}</b>
        
                <span style="color: rgba(255,255,255,0.6); font-size: 12px; font-weight: normal;"> • ${post.timestamp ? new Date(post.timestamp).toLocaleDateString('en-US', {month:'2-digit', day:'2-digit'}).replace('/', '-') : ''}</span>
              </div>
                 <p style="font-size:14px; margin-top:6px; pointer-events:auto; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; line-height: 1.3; color: #fff;">
                 ${post.text || ''}
                  </p>
               </div>`;
            
            feed.appendChild(card);
            cleanupOldVideos(); // 🧹 წმენდა

            // --- შენი ორიგინალი LIVE LIKE ციკლი ---
            function startLikeCycle() {
                if (post.authorId !== auth.currentUser.uid) return;
                const activityContainer = document.getElementById(`live-activity-${id}`);
                if (!activityContainer) return;
                const currentPostLikes = post.likedBy ? Object.values(post.likedBy) : [];
                if (currentPostLikes.length === 0 || document.visibilityState !== 'visible') {
                    setTimeout(startLikeCycle, 5000);
                    return;
                }
                let index = 0;
                function spawnNext() {
                    const container = document.getElementById(`live-activity-${id}`);
                    if (!container) return;
                    if (index < currentPostLikes.length) {
                        const person = currentPostLikes[index];
                        const avaBox = document.createElement('div');
                        avaBox.className = 'floating-avatar-box';
                        avaBox.style.position = 'absolute'; avaBox.style.bottom = '0px'; avaBox.style.left = '0px';
                        avaBox.innerHTML = `
                            <div style="position:relative; width:48px; height:48px;">
                                <img src="${person.photo || 'https://ui-avatars.com/api/?name=' + person.name}" 
                                     style="width:48px; height:48px; border-radius:50%; border:2px solid var(--gold); object-fit:cover;">
                                <i class="fas fa-heart" style="position:absolute; bottom:0px; right:0px; color:#ff4d4d; font-size:16px;"></i>
                            </div>`;
                        container.appendChild(avaBox);
                        setTimeout(() => { if(avaBox.parentNode) avaBox.remove(); }, 8000);
                        index++;
                        setTimeout(spawnNext, 1500);
                    } else {
                        setTimeout(startLikeCycle, 10000);
                    }
                }
                spawnNext();
            }
            startLikeCycle();

            // --- Realtime მსმენელები ---
            db.ref(`comments/${id}`).on('value', cSnap => {
                const count = cSnap.val() ? Object.keys(cSnap.val()).length : 0;
                const el = document.getElementById(`comm-count-${id}`);
                if(el) el.innerText = count;
            });
            db.ref(`users/${post.authorId}`).on('value', uSnap => {
                const u = uSnap.val();
                if(!u) return;
                const ava = document.getElementById(`ava-${id}`);
                const name = document.getElementById(`name-${id}`);
                const status = document.getElementById(`mini-status-${id}`);
                if(u.photo && ava) ava.src = u.photo;
                if(u.name && name) name.innerText = "@" + u.name;
                if(u.presence === 'online' && status) status.style.display = 'block';
                else if(status) status.style.display = 'none';
            });
        });
        setupAutoPlay();
    });

    // --- Infinite Scroll ---
    feed.onscroll = function() {
        if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 800) {
            renderTokenFeed();
        }
    };
}                                                     
// აქ მთავრდება


// უსასრულო სქროლვა - გაუმჯობესებული ვერსია
window.addEventListener('scroll', function() {
    const feed = document.getElementById('main-feed');
    if (!feed || isFeedLoading) return;

    // ვამოწმებთ რამდენია დარჩენილი გვერდის ბოლომდე
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
    const clientHeight = document.documentElement.clientHeight;

    // თუ ბოლოდან 800 პიქსელზე მიუახლოვდა (ტელეფონზე მეტი სივრცე გვინდა რეაგირებისთვის)
    if (scrollTop + clientHeight >= scrollHeight - 800) {
        console.log("ბოლოში ვართ, ვამატებთ ვიდეოებს..."); // ამას კონსოლში დაინახავ
        feedLimit += 15; 
        renderTokenFeed();
    }
}, { passive: true });
// აქ მთავრდება სქროლვა


// აქ იწყება სტორაგიდან წაშლა ვუდეოსი
async function deleteMyVideo(postId) {
    if (!confirm("ნამდვილად გსურთ ვიდეოს სამუდამოდ წაშლა?")) return;

    try {
        // 1. ჯერ ვიღებთ პოსტის მონაცემებს Database-დან
        const snap = await db.ref(`posts/${postId}`).once('value');
        const post = snap.val();

        if (!post) {
            console.error("პოსტი ვერ მოიძებნა!");
            return;
        }

        // 2. წაშლა Storage-დან (ვიდეო ფაილი)
        const videoMedia = post.media ? post.media.find(m => m.type === 'video') : null;
        if (videoMedia && videoMedia.url) {
            try {
                // firebase.storage().refFromURL პირდაპირ პოულობს ფაილს URL-ით
                const storageRef = firebase.storage().refFromURL(videoMedia.url);
                await storageRef.delete();
                console.log("ფაილი წაიშალა Storage-დან ✅");
            } catch (storageErr) {
                console.warn("ფაილი Storage-ში უკვე აღარ არსებობს:", storageErr);
            }
        }

        // 3. წაშლა Realtime Database-დან (პოსტის ჩანაწერი)
        await db.ref(`posts/${postId}`).remove();
        
        // 4. წაშლა კომენტარების ბაზიდან (რომ ნაგავი არ დარჩეს)
        await db.ref(`comments/${postId}`).remove();

        // 5. ვიზუალური წაშლა ეკრანიდან (რომ ეგრევე გაქრეს)
        const card = document.getElementById(`card-${postId}`);
        if (card) {
            const video = card.querySelector('video');
            if (video) {
                video.pause();
                video.src = "";
                video.load();
            }
            card.remove();
        }

        console.log("პოსტი წარმატებით წაიშალა ყველგან!");

    } catch (error) {
        console.error("წაშლისას მოხდა შეცდომა:", error);
        alert("შეცდომა წაშლისას: " + error.message);
    }
}
// აქ მთავრდება ყველაფერი 



function setupAutoPlay() {
    // 🚀 შენი ორიგინალი მესინჯერის შემოწმება
    if (document.getElementById('messengerUI').style.display === 'flex') return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            const postId = entry.target.id.replace('card-', '');

            if (entry.isIntersecting) {
                // 🚀 შენი ორიგინალი ჩართვის ლოგიკა
                video.style.opacity = "1";
                video.play().catch(e => {}); 
                video.muted = false;

                // --- 🔥 შენი ორიგინალი ნახვების მომატება ---
                if (postId && postId !== "") {
                    db.ref(`posts/${postId}/views`).transaction(currentViews => {
                        return (currentViews || 0) + 1;
                    });
                }

            } else {
                // 🚀 შენი ორიგინალი გათიშვის ლოგიკა
                video.pause();
                video.muted = true;
                video.style.opacity = "0.5";
                
                // 🔥 მხოლოდ ეს ხაზი დავამატოთ - ის აიძულებს ბრაუზერს
                // რომ ამ ვიდეოს ჩატვირთვაზე რესურსი აღარ დახარჯოს
                video.preload = "none";
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.video-card').forEach(card => observer.observe(card));
}




// --- GIFT SYSTEM LOGIC ---
// --- GIFT SYSTEM LOGIC ---
// --- GIFT SYSTEM LOGIC ---
window.openGiftPanel = function(postId, authorId) {
    if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
    const panel = document.createElement('div');
    panel.id = "dynamicGiftPanel";
    panel.style = "position:fixed; bottom:0; left:0; width:100%; background:rgba(10,10,10,0.98); border-top:2px solid #d4af37; border-radius:20px 20px 0 0; padding:25px 20px; z-index:2000005; backdrop-filter:blur(15px); color:white; font-family:sans-serif;";
    
    const gift1 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Begemot.gif";
    const gift2 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava.gif";
    const gift3 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava1.gif";
    const gift4 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yvavili.gif";
    const gift5 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Egvipte.gif";
    const gift6 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Guli.gif";
    const gift7 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Saati.gif";
    const gift8 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Sunduk.png";
    const gift9 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Gogo3.png";
    const gift10 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Romeo.gif";
    const gift11 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Gofo2.png";
    const gift12 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Namcxvari.gif";
    const gift13 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/aladin1.gif";
    const gift14 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/aladin2.gif";
    const gift15 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/aladin3.gif";
    const gift16 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/princesa1.gif";
    const gift17 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/princesa2.gif";
    const gift18 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/princesa3.gif";
    const gift19 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/princesa4.gif";
    const gift20 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/princesa5.gif";
    const gift21 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/iebi1.gif";
    const gift22 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/guli1.gif";
    const gift23 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/torti1.gif";
    const gift24 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/kocna1.gif";
    const gift25 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/qali1.png";
    const gift26 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/qali2.png";
    const gift27 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/spilo.png";
    const gift28 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/mikvarxar1.gif";
    const gift29 = "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/tagvi.png";

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <b style="color:#d4af37;">აირჩიე საჩუქარი</b>
            <i class="fas fa-times" onclick="document.getElementById('dynamicGiftPanel').remove()" style="cursor:pointer; font-size:20px; color:gray;"></i>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-height:400px; overflow-y:auto;">
            <div onclick="window.processGift('${authorId}', 5, '${gift1}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift1}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">5 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 10, '${gift2}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift2}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">10 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 15, '${gift3}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift3}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">15 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 20, '${gift4}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift4}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">20 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 25, '${gift5}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift5}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">25 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 50, '${gift6}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift6}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">50 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 80, '${gift7}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift7}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">80 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 100, '${gift8}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift8}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">100 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift9}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift9}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift10}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift10}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift11}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift11}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift12}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift12}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift13}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift13}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift14}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift14}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift15}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift15}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift16}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift16}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift17}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift17}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>     
            <div onclick="window.processGift('${authorId}', 150, '${gift18}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift18}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift19}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift19}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift20}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift20}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift21}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift21}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift22}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift22}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift23}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift23}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift24}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift24}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift25}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift25}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift26}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift26}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift27}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift27}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift28}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift28}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
            <div onclick="window.processGift('${authorId}', 150, '${gift29}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${gift29}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">150 AKHO</div></div>
           </div>`;
    document.body.appendChild(panel);
};

window.processGift = function(targetUid, cost, giftUrl) {
    const user = firebase.auth().currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (user.uid === targetUid) return alert("საკუთარ თავს ვერ აჩუქებთ!");
    
    // 1. შევდივართ შენს (მჩუქებლის) მონაცემებში
    db.ref(`users/${user.uid}`).once('value', snap => {
        const myData = snap.val();
        if (!myData) return alert("მონაცემები ვერ მოიძებნა!");

        const myBalance = myData.akho || 0;
        if (myBalance < cost) return alert("არ გაქვთ საკმარისი AKHO! ❌");

        // 2. ბალანსების განახლება
        db.ref(`users/${user.uid}/akho`).set(myBalance - cost);
        db.ref(`users/${targetUid}/gift_balance`).transaction(c => (c || 0) + cost);

        // 🚀 3. საჩუქრის ჩაწერა (ვიღებთ სახელს და ფოტოს პირდაპირ ბაზიდან - myData)
        db.ref(`received_gifts/${targetUid}`).push({
            giftUrl: giftUrl,
            price: cost,
            fromName: myData.name || "მეგობარი", // აქ აიღებს შენს ნამდვილ სახელს ბაზიდან
            fromPhoto: myData.photo || "",      // აქ აიღებს შენს ფოტოს ბაზიდან
            timestamp: Date.now()
        });

        if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
        
        
        // --- ანიმაცია ---
        const animWrapper = document.createElement('div');
        animWrapper.id = "activeGiftAnimation";
        animWrapper.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2000010; pointer-events:none; text-align:center; min-width:300px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;";
        animWrapper.innerHTML = `
            <div id="giftStep1" style="animation: giftStep1Anim 3s forwards;">
                <img src="${giftUrl}" style="width:140px; height:140px; object-fit:contain; filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));">
            </div>
            <div id="giftStep2" style="display:none; animation: giftStep2Anim 30s forwards; position:relative;">
                <div class="gift-image-container">
                    
                    <div class="golden-glow-overlay"></div>
                </div>
                <div class="gift-text-container" style="margin-top: -20px; position:relative; z-index:3;">
                    <h1 style="color:#fff3c3; text-shadow: 0 0 5px #fff, 0 0 10px #fbd14b, 0 0 15px #fbd14b, 0 0 20px #e0ac00; font-size:28px; font-weight:bold; margin:0 0 2px 0; text-transform: uppercase; letter-spacing: 1px;">საჩუქარი!</h1>
                    <h2 style="color:#fff3c3; text-shadow: 0 0 3px #fff, 0 0 8px #fbd14b; font-size:16px; margin:0 0 15px 0; font-weight:normal;">გადაეცათ ${cost} AKHO</h2>
                    <h1 style="color:#fbd14b; text-shadow: 1px 1px 2px rgba(0,0,0,0.8), 0 0 10px #e0ac00; font-size:26px; margin:0; font-weight:bold;">+${cost} AKHO</h1>
                </div>
            </div>`;
        document.body.appendChild(animWrapper);
        // აქ მთავრდება

        if (!document.getElementById('giftEnhancedStyles')) {
            const style = document.createElement('style');
            style.id = 'giftEnhancedStyles';
            style.innerHTML = `
                .gift-image-container { position: relative; display: inline-block; margin-bottom: 20px; }
                .golden-gift-img { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.8)); animation: giftPulse 2.5s infinite alternate; }
                .golden-glow-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0) 70%); border-radius: 50%; filter: blur(15px); z-index: 1; animation: glowPulse 2.5s infinite alternate; }
                @keyframes giftPulse { 0% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)); transform: scale(1); } 100% { filter: drop-shadow(0 0 40px rgba(255, 215, 0, 1)); transform: scale(1.03); } }
                @keyframes glowPulse { 0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); } }
                @keyframes giftStep1Anim { 0% { transform: scale(0); opacity: 0; } 15% { transform: scale(1.2); opacity: 1; } 85% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.3) translateY(-80px); opacity: 0; } }
                @keyframes giftStep2Anim { 0% { transform: scale(0.6); opacity: 0; } 4% { transform: scale(1.05); opacity: 1; } 8% { transform: scale(1); opacity: 1; } 96% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8) translateY(-120px); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            const s1 = document.getElementById('giftStep1');
            const s2 = document.getElementById('giftStep2');
            if(s1) s1.style.display = 'none';
            if(s2) s2.style.display = 'block';
        }, 3000);

        setTimeout(() => { if(animWrapper) animWrapper.remove(); }, 33000);
    });
};

window.transferToMainBalance = function(amount) {
    if (!amount || amount <= 0) return alert("გადასატანი არაფერია!");
    const user = firebase.auth().currentUser;
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    // 1. სასაჩუქრე ბალანსის განულება
    db.ref(`users/${user.uid}/gift_balance`).set(0);
    
    // 2. მთავარ ბალანსზე (akho) დამატება
    db.ref(`users/${user.uid}/akho`).transaction(c => (c || 0) + amount);
    
    // 🚀 3. საჩუქრების სიის სრული გასუფთავება (ეს დაემატა)
    db.ref(`received_gifts/${user.uid}`).remove();

    alert("AKHO გადაიტანილა და კოლექცია გასუფთავდა! ✅");

    // ფანჯრის დახურვა, რომ ცვლილება აისახოს
    if(document.getElementById('giftWalletModal')) {
        document.getElementById('giftWalletModal').remove();
    } else {
        // თუ პირდაპირ სიაში ხარ, უბრალოდ წაშალე მოდალი
        const modals = document.querySelectorAll('div[style*="z-index: 2000020"]');
        modals.forEach(m => m.remove());
    }
};



// --- ევროს და მეგობრის ფუნქციები (ჩამატებულია შენს კოდში) ---
window.buyEuroWithGift = function(amount) {
    if (!amount || amount < 100) return alert("მინიმუმ 100 AKHO საჭიროა! 💶");

    const euroValue = (amount / 100).toFixed(2);
    const confirmExchange = confirm(`თქვენი ${amount} AKHO გადაიცვლება ${euroValue} ევროდ.\n\nგსურთ გაგრძელება?`);
    
    if (confirmExchange) {
        const user = firebase.auth().currentUser;
        
        // 1. ბალანსების განახლება
        db.ref(`users/${user.uid}/gift_balance`).set(0);
        db.ref(`users/${user.uid}/euro_balance`).transaction(c => (c || 0) + parseFloat(euroValue));
        
        // 🚀 2. ისტორიაში ჩაწერა (ახალი ნაწილი)
        db.ref(`euro_history/${user.uid}`).push({
            type: "გადაცვლა",
            amount: euroValue,
            akhoAmount: amount,
            timestamp: Date.now()
        });

        db.ref(`received_gifts/${user.uid}`).remove();
        alert(`წარმატებით გადაიცვალა! ✅`);
        
        const modals = document.querySelectorAll('div[style*="z-index: 2000020"]');
        modals.forEach(m => m.remove());
        setTimeout(() => window.showFinancialWallet(), 500);
    }
};





 function showGiftsCollection(uid) {
    const user = firebase.auth().currentUser;
    const isMyProfile = (user && user.uid === uid);

    const modal = document.createElement('div');
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:2000020; display:flex; flex-direction:column; padding:20px; backdrop-filter:blur(10px); color:white;";
    
    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="color:#d4af37; margin:0;">საჩუქრების კოლექცია 🎁</h3>
            <i class="fas fa-times" onclick="this.parentElement.parentElement.remove()" style="cursor:pointer; font-size:24px;"></i>
        </div>

        <div id="giftWalletSection" style="display:none; margin-bottom:25px; background:linear-gradient(145deg, #1a1a1a, #111); padding:20px; border-radius:20px; text-align:center; box-shadow: 0 5px 15px rgba(212,175,55,0.1);">
            <div style="color:#aaa; font-size:13px; margin-bottom:5px;">საჩუქრებიდან დაგროვებული:</div>
            <div id="giftBalanceDisplay" style="font-size:32px; font-weight:bold; color:#fbd14b; margin-bottom:20px;">0 AKHO</div>
            
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button id="transferBtn" style="flex: 1; padding: 12px 5px; background: #d4af37; border: none; border-radius: 10px; color: black; font-weight: bold; font-size: 10px; cursor: pointer;">ბალანსზე</button>
                
                <button id="buyEuroBtn" style="flex: 1; padding: 12px 5px; background: #00a2ff; border: none; border-radius: 10px; color: white; font-weight: bold; font-size: 10px; cursor: pointer;">ევრო</button>
                
                <button onclick="window.sendToFriendFromGift()" style="flex: 1; padding: 12px 5px; background: #e0e0e0; border: none; border-radius: 10px; color: #333; font-weight: bold; font-size: 10px; cursor: pointer;">მეგობარს</button>
            </div>
        </div>

        <div id="giftsContainer" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; overflow-y:auto; padding-bottom:50px;">
            <p style="text-align:center; grid-column:1/-1;">იტვირთება...</p>
        </div>
    `;
    document.body.appendChild(modal);

    const container = document.getElementById('giftsContainer');
    if (isMyProfile) {
        document.getElementById('giftWalletSection').style.display = "block";
        db.ref(`users/${uid}/gift_balance`).on('value', snap => {
            const bal = snap.val() || 0;
            document.getElementById('giftBalanceDisplay').innerText = `${bal} AKHO`;
            
            // 1. მთავარ ბალანსზე გადატანის ღილაკი
            document.getElementById('transferBtn').onclick = () => window.transferToMainBalance(bal);
            
            // 2. ევროს ყიდვის ღილაკი - ახლა უკვე გადასცემს ბალანსს (bal)
            document.getElementById('buyEuroBtn').onclick = () => window.buyEuroWithGift(bal);
        });
    }

    firebase.database().ref(`received_gifts/${uid}`).once('value', snap => {
        container.innerHTML = "";
        const data = snap.val();
        if(!data) { container.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:gray;'>საჩუქრები არ არის</p>"; return; }

        Object.values(data).reverse().forEach(gift => {
            container.innerHTML += `
                <div style="background:rgba(255,255,255,0.05); border:1px solid #333; border-radius:15px; padding:15px; text-align:center;">
                    <img src="${gift.giftUrl}" style="width:80px; height:80px; object-fit:contain; margin-bottom:10px;">
                    <div style="color:#d4af37; font-weight:bold; font-size:14px;">${gift.price} AKHO</div>
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid #222;">
                        <img src="${gift.fromPhoto || 'https://ui-avatars.com/api/?name='+gift.fromName}" style="width:20px; height:20px; border-radius:50%; border:1px solid #d4af37;">
                        <span style="font-size:11px; color:#aaa;">${gift.fromName}</span>
                    </div>
                </div>`;
        });
    });
}
// აქ მთაცრდება



// ევროს ბალანსის ახალი გვერდი
window.showFinancialWallet = function() {
    const user = firebase.auth().currentUser;
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    const modal = document.createElement('div');
    modal.id = "financialWalletModal";
    // სრული ეკრანის მუქი ფონი
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000030; display:flex; flex-direction:column; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:white;";
    
    db.ref(`users/${user.uid}/euro_balance`).on('value', snap => {
        const euroBal = snap.val() || 0;
        const canCashOut = euroBal >= 50; // TikTok-ზე ხშირად 50-ია ლიმიტი

        modal.innerHTML = `
            <div style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #222;">
                <i class="fas fa-chevron-left" onclick="document.getElementById('financialWalletModal').remove()" style="font-size:20px; cursor:pointer; width:30px;"></i>
                <div style="flex:1; text-align:center; font-weight:bold; font-size:17px;">ბალანსი</div>
                <div style="width:30px;"></div>
            </div>

            <div style="flex:1; overflow-y:auto; padding:20px;">
                <div style="text-align:center; margin:30px 0;">
                    <div style="font-size:14px; color:#8a8a8a; margin-bottom:10px;">მოსალოდნელი თანხა EUR <i class="fas fa-caret-down"></i></div>
                    <div style="font-size:48px; font-weight:bold; margin-bottom:20px;">${euroBal.toFixed(2)} <span style="font-size:24px;">€</span></div>
                    
                    <div onclick="window.showRechargeAKHO()" style="display:inline-flex; align-items:center; background:#1f1f1f; padding:8px 15px; border-radius:20px; font-size:13px; color:#efefef; cursor:pointer;">
                        <img src="https://emigrantbook.com/token-avatar.png" style="width:16px; margin-right:8px;"> 
                        AKHO 0 | მონეტების შეძენა <i class="fas fa-chevron-right" style="font-size:10px; margin-left:8px;"></i>
                    </div>
                </div>

                <div onclick="window.showEuroHistory()" style="background:#1f1f1f; border-radius:12px; padding:15px; display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; cursor:pointer;">
                 <div style="font-size:15px; font-weight:500;">ტრანზაქციები</div>
                 <div style="color:#8a8a8a; font-size:13px;">ისტორია <i class="fas fa-chevron-right" style="margin-left:5px;"></i></div>
                 </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:25px;">
                    <div style="background:#1f1f1f; padding:20px; border-radius:12px; height:100px; display:flex; flex-direction:column; justify-content:space-between;">
                        <i class="fas fa-money-bill-wave" style="font-size:20px;"></i>
                        <div style="font-size:13px; font-weight:500; line-height:1.2;">საჩუქრების ჯილდოები</div>
                    </div>
                    <div style="background:#1f1f1f; padding:20px; border-radius:12px; height:100px; display:flex; flex-direction:column; justify-content:space-between;">
                        <i class="fas fa-chart-line" style="font-size:20px;"></i>
                        <div style="font-size:13px; font-weight:500; line-height:1.2;">მონეტიზაცია</div>
                    </div>
                </div>

                <div style="background:#1f1f1f; border-radius:12px; padding:20px; border: 1px solid ${canCashOut ? '#2ecc71' : '#333'};">
                    <h4 style="margin:0 0 10px 0; color:${canCashOut ? '#2ecc71' : '#d4af37'};">Cash Out</h4>
                    <p style="font-size:12px; color:#8a8a8a; margin-bottom:15px;">Minimum withdrawal: 50.00 €</p>
                    
                    <input type="text" id="payoutIbanField" placeholder="IBAN / PayPal" 
                        ${!canCashOut ? 'disabled' : ''} 
                        style="width:100%; padding:12px; border-radius:8px; border:1px solid #333; background:#121212; color:white; outline:none; margin-bottom:15px;">
                    
                    <button onclick="${canCashOut ? `window.processWithdrawRequest(${euroBal})` : ''}" 
                        style="width:100%; padding:12px; border:none; border-radius:8px; color:${!canCashOut ? '#666' : 'black'}; background:${!canCashOut ? '#333' : '#2ecc71'}; font-weight:bold; cursor:${!canCashOut ? 'not-allowed' : 'pointer'};">
                        გატანის მოთხოვნა
                    </button>
                    
                    <div style="margin-top:10px; font-size:12px; color:${canCashOut ? '#2ecc71' : '#ff4d4d'};">
                        ${canCashOut ? '● გატანა ხელმისაწვდომია!' : '● ბალანსი 50 ევროზე ნაკლებია!'}
                    </div>
                </div>

                <div style="margin-top:25px; background:#1f1f1f; border-radius:12px;">
                    <div style="padding:15px; display:flex; justify-content:space-between; border-bottom:1px solid #222;">
                        <div style="font-size:14px;"><i class="far fa-question-circle" style="margin-right:10px;"></i> დახმარება</div>
                        <i class="fas fa-chevron-right" style="color:#555;"></i>
                    </div>
                </div>
            </div>
        `;
    });

    document.body.appendChild(modal);
};
// აქ მთავრდება




window.showEuroHistory = function() {
    const user = firebase.auth().currentUser;
    const historyModal = document.createElement('div');
    historyModal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000040; display:flex; flex-direction:column; color:white; font-family:sans-serif;";
    
    historyModal.innerHTML = `
        <div style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #222; background:#121212;">
            <i class="fas fa-chevron-left" onclick="this.parentElement.parentElement.remove()" style="font-size:20px; cursor:pointer; width:30px;"></i>
            <div style="flex:1; text-align:center; font-weight:bold; font-size:16px;">ტრანზაქციების ისტორია</div>
            <div style="width:30px;"></div>
        </div>
        <div id="euroHistoryList" style="flex:1; overflow-y:auto; padding:15px; background:#121212;">
            <p style="text-align:center; color:gray;">იტვირთება...</p>
        </div>
    `;
    document.body.appendChild(historyModal);

    db.ref(`euro_history/${user.uid}`).orderByChild('timestamp').on('value', snap => {
        const list = document.getElementById('euroHistoryList');
        list.innerHTML = "";
        const data = snap.val();
        
        if(!data) {
            list.innerHTML = "<div style='text-align:center; margin-top:50px;'><i class='fas fa-receipt' style='font-size:40px; color:#333;'></i><p style='color:gray; margin-top:10px;'>ისტორია ცარიელია</p></div>";
            return;
        }

        Object.values(data).reverse().forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('ka-GE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
            const isWithdraw = item.type === "გატანა";
            
            // სტატუსის ფერები
            let statusHtml = "";
            if(isWithdraw) {
                const statusColor = item.status === "pending" ? "#fbd14b" : "#2ecc71";
                const statusText = item.status === "pending" ? "მოლოდინში" : "ჩარიცხულია";
                statusHtml = `<div style="font-size:10px; color:${statusColor}; margin-top:4px;">● ${statusText}</div>`;
            }

            list.innerHTML += `
                <div style="background:#1f1f1f; padding:15px; border-radius:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; border-radius:12px; background:${isWithdraw ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)'}; display:flex; align-items:center; justify-content:center;">
                            <i class="fas ${isWithdraw ? 'fa-arrow-up' : 'fa-arrow-down'}" style="color:${isWithdraw ? '#e74c3c' : '#2ecc71'};"></i>
                        </div>
                        <div>
                            <div style="font-size:14px; font-weight:bold;">${item.type}</div>
                            <div style="font-size:11px; color:gray;">${date}</div>
                            ${statusHtml}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:${isWithdraw ? '#fff' : '#2ecc71'}; font-weight:bold; font-size:16px;">
                            ${isWithdraw ? '-' : '+'} ${item.amount} €
                        </div>
                    </div>
                </div>
            `;
        });
    });
};
// აქ მთავრფება 

window.showRechargeAKHO = function() {
    const modal = document.createElement('div');
    modal.id = "rechargeAkhoModal";
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000050; display:flex; flex-direction:column; color:white; font-family:sans-serif;";
    
    // მონეტების პაკეტები (როგორც ფოტოზეა)
    const packages = [
        { akho: 5, price: "0.08 €" },
        { akho: 10, price: "0.16 €" },
        { akho: 20, price: "0.31 €" },
        { akho: 30, price: "0.46 €" },
        { akho: 50, price: "0.76 €" },
        { akho: 70, price: "1.06 €" },
        { akho: 139, price: "2.10 €" },
        { akho: 210, price: "3.19 €" }
    ];

    modal.innerHTML = `
        <div style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #222;">
            <i class="fas fa-times" onclick="this.parentElement.parentElement.remove()" style="font-size:20px; cursor:pointer; width:30px;"></i>
            <div style="flex:1; text-align:center; font-weight:bold;">Get Coins</div>
            <i class="fas fa-history" style="font-size:18px; width:30px; text-align:right;"></i>
        </div>

        <div style="padding:20px;">
            <div style="color:#888; font-size:14px; margin-bottom:10px;">Coin balance</div>
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="https://emigrantbook.com/token-avatar.png" style="width:30px;">
                <span id="currentCoinBalance" style="font-size:32px; font-weight:bold;">0</span>
            </div>
        </div>

        <div style="background:#1a1a1a; flex:1; padding:20px; border-radius:20px 20px 0 0;">
            <div style="color:#888; font-size:14px; margin-bottom:20px;">Recharge</div>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;" id="packageContainer">
                ${packages.map(p => `
                    <div onclick="window.selectPackage(this, ${p.akho})" style="background:#262626; padding:15px 10px; border-radius:12px; text-align:center; border:2px solid transparent; transition:0.2s; cursor:pointer;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:5px; margin-bottom:5px;">
                            <img src="https://emigrantbook.com/token-avatar.png" style="width:14px;">
                            <span style="font-weight:bold; font-size:16px;">${p.akho}</span>
                        </div>
                        <div style="color:#888; font-size:12px;">${p.price}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="padding:20px; background:#1a1a1a;">
            <button onclick="window.confirmPurchase()" style="width:100%; padding:15px; background:#fe2c55; border:none; border-radius:8px; color:white; font-weight:bold; font-size:16px; cursor:pointer;">Recharge</button>
        </div>
    `;

    document.body.appendChild(modal);

    // მიმდინარე ბალანსის წამოღება
    const user = firebase.auth().currentUser;
    db.ref(`users/${user.uid}/akho`).on('value', snap => {
        if(document.getElementById('currentCoinBalance')) {
            document.getElementById('currentCoinBalance').innerText = snap.val() || 0;
        }
    });
};

// პაკეტის მონიშვნის ლოგიკა
let selectedAkhoAmount = 0;
window.selectPackage = function(el, amount) {
    const all = document.querySelectorAll('#packageContainer > div');
    all.forEach(d => {
        d.style.borderColor = 'transparent';
        d.style.background = '#262626';
    });
    el.style.borderColor = '#fe2c55';
    el.style.background = 'rgba(254, 44, 85, 0.1)';
    selectedAkhoAmount = amount;
};

// ყიდვის დადასტურება (აქ შეგიძლია შენი გადახდის სისტემა ჩააყენო)
window.confirmPurchase = function() {
    if (selectedAkhoAmount === 0) return alert("გთხოვთ აირჩიოთ პაკეტი!");
    alert("გადახდის სისტემა მზადების პროცესშია. არჩეულია: " + selectedAkhoAmount + " AKHO");
};
// აქ მთავრდება


// რეალური თანხის გატანის ისტორია
function openWithdrawHistory() {
    // 1. გამოვაჩინოთ ფანჯარა
    document.getElementById('withdrawHistoryUI').style.display = 'flex';
    
    // 2. გავაჩეროთ ვიდეოები, რომ ხმამ არ შეგვაწუხოს
    if(typeof stopMainFeedVideos === "function") stopMainFeedVideos();
    
    // 3. ჩავტვირთოთ ისტორია (ის ფუნქცია, რაც წეღან დავწერეთ)
    loadMyWithdrawalHistory();
}
// აქ მთავრდება










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
            const isTagged = (myUid && post.taggedBy && post.taggedBy[myUid]);
            
            // --- დროის ფორმატირება ---
            const postTime = post.timestamp ? formatTimeShort(post.timestamp) : "";
            const card = document.createElement('div');
            card.className = "post-card";
            card.innerHTML = `
                <div class="post-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="openProfile('${post.authorId}')">
                   <img src="${post.authorPhoto || 'https://ui-avatars.com/api/?name='+post.authorName}" style="width:35px; height:35px; border-radius:50%; border:1px solid var(--gold); object-fit:cover;">
    
                   <div style="display:flex; flex-direction:column; align-items:flex-start;">
                   <b style="color:white; font-size:14px; margin:0; line-height:1.2;">${post.authorName}</b>
                    <span style="color:#888; font-size:10px; margin-top:2px; display:block;">${postTime}</span>
                    </div>
                    </div>
                    
                    
                    <div>
                        ${post.authorId === myUid ? 
                            `<i class="fas fa-trash-alt" style="color:#ff4d4d; cursor:pointer; font-size:14px; padding:5px;" onclick="window.deleteWallPost('${id}')"></i>` : 
                            `<i class="fas fa-flag" style="color:#666; cursor:pointer; font-size:13px; padding:5px;" onclick="window.reportPost('${id}', '${post.authorId}', '${(post.text || "ფოტო").replace(/'/g, "\\'")}')"></i>`
                        }
                    </div>

                    <div onclick="window.toggleWallTag('${id}')" style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                    <i class="${isTagged ? 'fas' : 'far'} fa-user-tag" style="${isTagged ? 'color:var(--gold);' : 'color:#888;'}"></i>
                    <span style="font-size:14px; font-weight:bold;">${isTagged ? 'მონიშნულია' : 'მონიშვნა'}</span>
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

    // შენი გადახდის ლოგიკა (0.5 აკო)
    if (!canAfford(0.5)) return; 

    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, targetId);
    const fileName = `voice_${Date.now()}.mp3`;

    try {
        console.log("ხმა იტვირთება Firebase Storage-ზე...");

        // 2. ვქმნით რეფერენსს Firebase Storage-ში
        const storageRef = firebase.storage().ref(`chat_audio/${chatId}/${fileName}`);

        // 3. ფაილის ატვირთვა
        const snapshot = await storageRef.put(blob);
        
        // 4. ვიღებთ ატვირთული აუდიოს პირდაპირ ლინკს
        const downloadURL = await snapshot.ref.getDownloadURL();

        if (downloadURL) {
            console.log("Firebase-მა ატვირთა:", downloadURL);
            
            // 5. ვწერთ Realtime Database-ში
            db.ref(`messages/${chatId}`).push({ 
                senderId: myUid, 
                audio: downloadURL, 
                ts: Date.now(),
                seen: false
            }).then(() => {
                // შენი ორიგინალი გადახდის ლოგიკა
                spendAkho(0.5, 'Voice Message');
                console.log("Firebase-ში წარმატებით ჩაიწერა!");
            }).catch(e => {
                console.error("Firebase DB Error:", e);
                alert("ბაზაში ჩაწერის შეცდომა: " + e.message);
            });

            // ნოტიფიკაციის გაგზავნა
            if (typeof sendPushToUser === "function") {
                sendPushToUser(targetId, myName, "🎤 Voice Message");
            }

        } else {
            alert("ვერ მოხერხდა აუდიო ფაილის ლინკის მიღება.");
        }
    } catch (err) { 
        console.error("Storage Error:", err);
        alert("ატვირთვის შეცდომა: ვერ მოხერხდა ფაილის შენახვა"); 
    }
}       


// ვოისის დიზაინი
// --- 🎤 MESSENGER STYLE AUDIO SYSTEM (WAVESURFER) ---
let waveSurfers = {}; 

function initWaveforms() {
    document.querySelectorAll('.waveform-container').forEach(container => {
        const msgId = container.id.split('-')[1];
        if (waveSurfers[msgId]) return;

        const audioUrl = container.getAttribute('data-url');
        const isSent = container.closest('.msg-sent'); 

        const ws = WaveSurfer.create({
            container: `#${container.id}`,
            waveColor: isSent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(212, 175, 55, 0.3)',
            progressColor: isSent ? 'black' : '#d4af37',
            barWidth: 2,
            barGap: 2,
            barRadius: 10,
            height: 30,
            url: audioUrl,
        });

        waveSurfers[msgId] = ws;

        ws.on('ready', () => {
            const durationEl = document.getElementById(`duration-${msgId}`);
            if (durationEl) durationEl.innerText = formatTime(ws.getDuration());
        });

        ws.on('finish', () => {
            const icon = document.getElementById(`icon-${msgId}`);
            if (icon) icon.className = 'fas fa-play';
        });
    });
}

function playPauseAudio(msgId) {
    const ws = waveSurfers[msgId];
    const icon = document.getElementById(`icon-${msgId}`);
    if (!ws) return;

    if (ws.isPlaying()) {
        ws.pause();
        icon.className = 'fas fa-play';
    } else {
        // სხვა ყველა პლეიერის გაჩერება
        Object.keys(waveSurfers).forEach(id => {
            if (waveSurfers[id].isPlaying()) {
                waveSurfers[id].pause();
                const otherIcon = document.getElementById(`icon-${id}`);
                if (otherIcon) otherIcon.className = 'fas fa-play';
            }
        });
        ws.play();
        icon.className = 'fas fa-pause';
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
// --- END OF AUDIO SYSTEM ---












async function deleteMyVideo(postId, videoUrl) {
    if (confirm("ნამდვილად გსურთ წაშლა?")) {
        try {
            // 1. ჯერ ვშლით ფაილს Storage-დან
            if (videoUrl) {
                const storageRef = firebase.storage().refFromURL(videoUrl);
                await storageRef.delete();
                console.log("ფაილი Storage-დან წაიშალა");
            }

            // 2. შემდეგ ვშლით ჩანაწერს ბაზიდან
            await db.ref(`posts/${postId}`).remove();
            console.log("მონაცემები ბაზიდან წაიშალა");

            // 3. რეალურ დროში ეკრანიდან გაქრობა
            // ვეძებთ ელემენტს, რომელსაც აქვს ID (მაგ: id="post-123")
            const element = document.getElementById(`post-${postId}`);
            if (element) {
                element.style.opacity = '0';
                setTimeout(() => element.remove(), 300); // ლამაზად გაქრობა
            }

            alert("წარმატებით წაიშალა!");
        } catch (error) {
            console.error("წაშლის შეცდომა:", error);
            // თუ ფაილი Storage-ში აღარ იყო, მაინც წავშალოთ ბაზიდან
            db.ref(`posts/${postId}`).remove();
        }
    }
}





// სამი წერტილის ლოგიკა და გახსნა
function toggleMoreMenu(postId) {
    const panel = document.getElementById('more-menu-panel');
    panel.classList.toggle('active');
    
    // თუ postId გადავეცით, შეგვიძლია ის გამოვიყენოთ ფუნქციებში
    if (postId) {
        window.currentSelectedPost = postId;
    }
}

// მაგალითისთვის ერთი ფუნქცია
function downloadVideo(postId) {
    alert("ვიდეოს გადმოწერა დაიწყო პოსტისთვის: " + postId);
    toggleMoreMenu(); // მენიუს დაკეტვა
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








function switchTab(tabName, btn) {
    // 1. მონიშვნა
    document.querySelectorAll('.p-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const taggedPostsList = document.getElementById('userTaggedPostsList');
    if (taggedPostsList) taggedPostsList.style.display = 'none';

    const profGrid = document.getElementById('profGrid');
    const userPhotosGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid');

    // 2. კრიტიკული ნაწილი: გასუფთავება (რომ დუბლიკატები არ დარჩეს)
    profGrid.innerHTML = ""; 
    userPhotosGrid.innerHTML = "";
    
    profGrid.style.display = 'none';
    userPhotosGrid.style.display = 'none';
    noMsg.style.display = 'none';

    // 3. ჩატვირთვა
    if (tabName === 'info' || tabName === 'reels') {
        profGrid.style.display = 'grid';
        loadUserVideos(viewUid); 
    } 
    else if (tabName === 'photos') {
        userPhotosGrid.style.display = 'grid';
        // ვიყენებთ timeout-ს 100 მილიწამით, რომ ბრაუზერმა მოასწროს გასუფთავება
        setTimeout(() => {
            if (typeof openPhotosSection === "function") openPhotosSection();
        }, 100);
    } 
    else if (tabName === 'saved') {
        profGrid.style.display = 'grid';
        loadMySavedPosts(); 
    } 
      
    else if (tabName === 'tagged') {
        if (typeof loadMyTaggedWallPosts === 'function') {
            loadMyTaggedWallPosts(viewUid); // 🔴 აუცილებლად გადავცეთ viewUid
        }
    }
}
  

function loadMySavedPosts() {
    const grid = document.getElementById('profGrid');
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid');
    grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>იტვირთება შენახულები...</p>";
    
    db.ref('posts').once('value', snap => {
        grid.innerHTML = "";
        const posts = snap.val();
        if(!posts) {
            grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>შენახული ვიდეოები არ არის</p>";
            return;
        }

        let savedCount = 0;
        Object.entries(posts).forEach(([id, post]) => {
            // ვამოწმებთ, არის თუ არა ეს ვიდეო ამ მომხმარებლის მიერ შენახული
            if(post.savedBy && post.savedBy[viewUid]) {
                const video = post.media ? post.media.find(m => m.type === 'video') : null;
                if(video) {
                    savedCount++;
                    const item = document.createElement('div');
                    item.className = 'grid-item';
                    item.innerHTML = `
                        <video src="${video.url}" muted></video>
                        <i class="fas fa-bookmark" style="position:absolute; top:8px; right:8px; color:var(--gold); font-size:12px; filter: drop-shadow(0 0 2px black);"></i>
                    `;
                    item.onclick = () => playFullVideo(video.url);
                    grid.appendChild(item);
                }
            }
        });

        if(savedCount === 0) {
            grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>შენახული ვიდეოები არ არის</p>";
        }
    });
}





















let videoStream = null;

// ეს ფუნქცია იხსნება ტოკენზე დაჭერისას
async function openUploadModal() {
   stopMainFeedVideos();
  
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
        
        const video = document.getElementById('cameraStream');
        const placeholder = document.getElementById('placeholderText');

        try {
            if (window.videoStream) {
                window.videoStream.getTracks().forEach(track => track.stop());
            }

            window.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, 
                audio: true 
            });
            
            if (video) {
                video.srcObject = window.videoStream;
                video.setAttribute('playsinline', '');
                video.setAttribute('autoplay', '');
                video.muted = true; 
                
                // --- შესწორებული: სარკისებური ეფექტი სელფისთვის ---
                video.style.transform = "scaleX(-1)"; 
                
                video.style.display = 'block';
                video.play().catch(e => console.log("ავტომატური გაშვების შეცდომა:", e));

                if (placeholder) placeholder.style.display = 'none';
                console.log("კამერა და მიკროფონი მზად არის ✅");
            }
        } catch (err) {
            console.error("კამერის ჩართვა ვერ მოხერხდა:", err);
            alert("კამერა ვერ ჩაირთო. შეამოწმეთ ნებართვები პარამეტრებში.");
        }
    }
}

async function startLiveCamera() {
    const video = document.getElementById('cameraStream');
    const placeholder = document.getElementById('placeholderText');
    const recordInner = document.getElementById('recordInner');

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        if (video) {
            video.srcObject = videoStream;
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.muted = true; 

            // --- შესწორებული: სარკისებური ეფექტი აქაც ---
            video.style.transform = "scaleX(-1)";

            video.play();
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            if (recordInner) {
                recordInner.style.background = '#00ff00';
                recordInner.style.boxShadow = '0 0 15px #00ff00';
            }
        }
    } catch (err) {
        console.error("Camera Error:", err);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                videoStream = stream;
                video.srcObject = stream;
                video.style.transform = "scaleX(-1)";
                video.play();
                video.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            })
            .catch(e => alert("კამერა ვერ ჩაირთო: " + e.message));
    }
}



// 1. ეს ფუნქცია კეტავს ფანჯარას და ეუბნება მეორე ფუნქციას "გათიშე კამერაო"
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
    stopCamera(); // იძახებს ქვედა ფუნქციას
}

// 2. ეს არის განახლებული ფუნქცია, რომელიც რეალურად თიშავს "თვალს"
function stopCamera() {
    // ვამოწმებთ ყველა შესაძლო სტრიმს
    const activeStream = window.videoStream || videoStream;

    if (activeStream) {
        activeStream.getTracks().forEach(track => {
            track.stop(); // აქ ითიშება ფიზიკურად კამერა
        });
        
        window.videoStream = null;
        if (typeof videoStream !== 'undefined') videoStream = null;
    }

    const video = document.getElementById('cameraStream');
    const placeholder = document.getElementById('placeholderText');
    const recordInner = document.getElementById('recordInner');
    
    if (video) {
        video.pause();
        video.srcObject = null;
        video.style.display = 'none';
        video.load(); // აიძულებს ბრაუზერს გაანთავისუფლოს კამერა
    }

    if (placeholder) placeholder.style.display = 'block';
    
    if (recordInner) {
        recordInner.style.borderRadius = "50%";
        recordInner.style.background = "#ff4d4d";
        recordInner.style.transform = "scale(1)";
        recordInner.style.boxShadow = "none";
    }
    console.log("კამერა წარმატებით გაითიშა ✅");
}




var globalMediaRecorder = null;
var globalChunks = [];
var currentFacingMode = "user"; 
var timerInterval = null;
var seconds = 0;

const RECORDING_LIMIT = 60; // ლიმიტი 60 წამი

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    seconds = 0;
    const minElem = document.getElementById('timerMinutes');
    const secElem = document.getElementById('timerSeconds');
    const timerElement = document.getElementById('recordingTimer');

    if (timerElement) timerElement.style.display = 'flex';
    
    timerInterval = setInterval(() => {
        seconds++;
        
        // დროის განახლება ეკრანზე
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        
        if (minElem) minElem.innerText = mins;
        if (secElem) secElem.innerText = secs;

        // 🛑 ლიმიტის შემოწმება
        if (seconds >= RECORDING_LIMIT) {
            console.log("ლიმიტი ამოიწურა!");
            
            // 1. ჯერ ვასუფთავებთ ტაიმერს, რომ აღარ გაგრძელდეს ათვლა
            stopTimer();

            // 2. ვაჩერებთ MediaRecorder-ს (ყველანაირი შემოწმების გარეშე, პირდაპირ)
            if (globalMediaRecorder) {
                globalMediaRecorder.stop();
            }

            // 3. ვიზუალურად ვაბრუნებთ ღილაკს საწყის ფორმაში
            const btnInner = document.getElementById('recordInner');
            if (btnInner) {
                btnInner.style.borderRadius = "50%";
                btnInner.style.background = "#ff4d4d";
            }

            alert("ჩაწერის ლიმიტი (60 წამი) ამოიწურა.");
        }
    }, 1000);
}

function stopTimer() {
    // ინტერვალის სრული გაჩერება და გასუფთავება
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const timerElement = document.getElementById('recordingTimer');
    if (timerElement) timerElement.style.display = 'none';
}




                    

async function switchCamera() {
    const video = document.getElementById('cameraStream');
    
    if (window.videoStream) {
        window.videoStream.getTracks().forEach(track => track.stop());
    }
    
    currentFacingMode = (currentFacingMode === "user") ? "environment" : "user";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: currentFacingMode,
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: true
        });

        window.videoStream = stream;
        if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                video.style.transform = (currentFacingMode === "user") ? "scaleX(-1)" : "scaleX(1)";
            };
        }
    } catch (err) {
        alert("კამერის გადართვა ვერ მოხერხდა.");
        currentFacingMode = "user"; 
    }
}



// აქედან იწყება
async function toggleRecording() {
    const btnInner = document.getElementById('recordInner');
    const videoInput = document.getElementById('videoInput');
    const video = document.getElementById('cameraStream');
    
    try {
        if (!globalMediaRecorder || globalMediaRecorder.state === "inactive") {
            if (!window.videoStream) return;

            globalChunks = [];
            globalMediaRecorder = new MediaRecorder(window.videoStream);
            
            globalMediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) globalChunks.push(e.data);
            };

            globalMediaRecorder.onstop = () => {
                stopTimer(); // აქედან ვთიშავთ ტაიმერს
                const blob = new Blob(globalChunks, { type: 'video/mp4' });
                const file = new File([blob], "recorded_video.mp4", { type: "video/mp4" });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                videoInput.files = dataTransfer.files;

                video.srcObject = null;
                video.src = URL.createObjectURL(blob);
                video.style.transform = "scaleX(1)";
                video.muted = false;
                video.play();

                if (typeof handleVideoSelect === "function") {
                    handleVideoSelect(videoInput);
                }
            };

            globalMediaRecorder.start();
            startTimer(); // აქედან ვიწყებთ ტაიმერს
            
            if (btnInner) {
                btnInner.style.borderRadius = "8px";
                btnInner.style.background = "#ff0000";
            }
        } else {
            globalMediaRecorder.stop();
            if (btnInner) {
                btnInner.style.borderRadius = "50%";
                btnInner.style.background = "#ff4d4d";
            }
        }
    } catch (err) {
        console.error(err);
    }
}
// აქ მთავრდება
            
 


// პაროლის აღდგენის ლოგიკა
function handleForgotPassword() {
    // 1. ვიღებთ მეილს ზუსტად uEmail აიდიდან
    const emailInput = document.getElementById('uEmail');
    const emailValue = emailInput.value.trim();

    // 2. ვამოწმებთ, ცარიელი ხომ არ არის
    if (!emailValue) {
        alert("გთხოვთ, ჯერ ჩაწეროთ მეილი Email / ელფოსტა ველში!");
        emailInput.focus(); // ავტომატურად გადაიყვანს კურსორს ველზე
        return;
    }

    // 3. Firebase-ის პაროლის აღდგენის მოთხოვნა
    auth.sendPasswordResetEmail(emailValue)
        .then(() => {
            // წარმატება
            alert("პაროლის აღდგენის ინსტრუქცია გამოგზავნილია თქვენს მეილზე: " + emailValue);
        })
        .catch((error) => {
            // შეცდომების დამუშავება
            console.error("Reset Error:", error);
            if (error.code === 'auth/user-not-found') {
                alert("ამ მეილით მომხმარებელი ვერ მოიძებნა.");
            } else if (error.code === 'auth/invalid-email') {
                alert("მეილის ფორმატი არასწორია.");
            } else {
                alert("შეცდომა: " + error.message);
            }
        });
}












// საიფის დროებითი აპლიკაციის ლოგიკა
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // ბრაუზერის სტანდარტული ფანჯრის დაბლოკვა
    e.preventDefault();
    deferredPrompt = e;
    
    // აქ შეგიძლია გამოაჩინო შენი საკუთარი "Install" ღილაკი საიტზე
    console.log("აპლიკაციის დაინსტალირება შესაძლებელია! ✅");
});

// ფუნქცია, რომელიც გამოიძახება "Install" ღილაკზე დაჭერისას
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('მომხმარებელმა დააინსტალირა აპლიკაცია');
            }
            deferredPrompt = null;
        });
    }
}










// შეტყობინების მონიჭება აპლიკაციაზე 
  // 1. სისტემური ნოტიფიკაციის გამოტანა
function showLocalNotification(title, body) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: 'logo.png',
                vibrate: [200, 100, 200],
                badge: 'logo.png',
                tag: 'msg-group',
                renotify: true
            });
            
            const sound = document.getElementById('msgSound');
            if (sound) sound.play().catch(e => {});
        });
    }
}

// 2. ხატულაზე ციფრის დაწერა (Badge)
function setAppBadge(count) {
    if ('setAppBadge' in navigator) {
        if (count > 0) {
            navigator.setAppBadge(count).catch(e => {});
        } else {
            navigator.clearAppBadge().catch(e => {});
        }
    }
}

// 4. ნოტიფიკაციის გაგზავნა მეორე იუზერთან (API-ს მეშვეობით)
function sendPushToUser(targetUid, senderName, text) {
    // ყურადღება: db უნდა იყოს გლობალურად განსაზღვრული შენს კოდში
    db.ref(`users/${targetUid}/fcmToken`).once('value', snap => {
        const token = snap.val();
        if (token) {
            fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'key=AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk' 
                },
                body: JSON.stringify({
                    to: token,
                    notification: {
                        title: senderName,
                        body: text,
                        icon: "logo.png",
                        click_action: "https://emigrantbook.com",
                        sound: "default",
                        badge: "1"
                    },
                    data: {
                        url: "https://emigrantbook.com"
                    },
                    priority: "high"
                })
            })
            .then(res => console.log("Push status:", res.status))
            .catch(e => console.log("Push error:", e));
        }
    });
}

// საიტის ჩატვირთვისას ნიშნის დაყენება
if ('setAppBadge' in navigator) {
    navigator.setAppBadge(7).catch(() => {});
}

// 5. ტოკენის აღება და ბაზაში შენახვა (შესწორებული კრიტიკული ადგილები)
    function saveMessagingToken(user) {
    const messaging = firebase.messaging();

    console.log("ნაბიჯი 1: ვიწყებთ...");

    messaging.requestPermission()
        .then(function() {
            console.log("ნაბიჯი 2: ნებართვა გვაქვს! ვიღებთ ტოკენს...");
            return messaging.getToken({
                vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk'
            });
        })
        .then(function(token) {
            if (token) {
                console.log("ნაბიჯი 3: ტოკენი ხელშია! ვწერთ ბაზაში:", token);
                // აუცილებლად დავაწეროთ 'test'-ის გვერდით
                return db.ref('users/' + user.uid).update({ 
                    fcmToken: token,
                    messagingStatus: "active" 
                });
            } else {
                console.warn("ნაბიჯი 3: ტოკენი ცარიელია.");
            }
        })
        .then(function() {
            console.log("ნაბიჯი 4: ბაზაში ჩაიწერა! ✅");
        })
        .catch(function(err) {
            console.error("კრიტიკული შეცდომა:", err);
        });
}                  
// 1. ტოკენის აღება და შენახვა Firebase-ში













// 1. ლაიქის (გულის) გაცოცხლება
function handleLikeFromFull() {
    const postId = window.currentFullVideoId;
    if (!postId) return;

    const myUid = auth.currentUser.uid;
    const likeRef = db.ref(`posts/${postId}/likedBy/${myUid}`);

    likeRef.once('value', snap => {
        if (snap.exists()) {
            // თუ უკვე დალაიქებულია - ვაშორებთ
            likeRef.remove();
        } else {
            // თუ არ არის - ვამატებთ (შენი სტრუქტურით: ტიპი, ფოტო, სახელი)
            likeRef.set({ 
                type: '❤️', 
                photo: myPhoto, 
                name: myName 
            });
            
            // ტოკენების ლოგიკა (თუ სხვისია, დაერიცხოს 2.00)
            db.ref(`posts/${postId}`).once('value', pSnap => {
                const post = pSnap.val();
                if (post && post.authorId !== myUid) {
                    earnAkho(post.authorId, 2.00, 'Impact (Like from Full)');
                }
            });
        }
        // ეკრანზე ციფრების მომენტალური განახლება
        setTimeout(() => playFullVideo(document.getElementById('fullVideoTag').src, postId), 300);
    });
}




// 2. კომენტარების პანელის 
// 1. ფუნქცია: ვიდეოს სრულად დახურვა (პროფილზე)
function closeFullVideo() {
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');
    const sideMenu = document.querySelector('#fullVideoOverlay .video-side-menu');

    if (vid) vid.pause(); 
    if (overlay) {
        overlay.style.display = 'none';
        // აუცილებლად ვაშორებთ დამალვის კლასს
        overlay.classList.remove('hide-menu-now'); 
    }
    // ძალთ დავაბრუნოთ მენიუ ხილვადობაში
    if (sideMenu) {
        sideMenu.style.opacity = "1";
        sideMenu.style.visibility = "visible";
        sideMenu.style.pointerEvents = "auto";
    }
}

// 2. ფუნქცია: კომენტარების გახსნა სრული ვიდეოდან
function openCommentsFromFull() {
    if (!window.currentFullVideoId) return;

    const commUI = document.getElementById('commentsUI');
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');
    const sideMenu = document.querySelector('#fullVideoOverlay .video-side-menu');

    if (commUI && overlay) {
        // კომენტარების ჩასმა ვიდეოს ფანჯარაში
        overlay.appendChild(commUI);
        commUI.style.display = "flex";
        commUI.style.zIndex = "9999999";

        // მენიუს დამალვა კლასით და პირდაპირი სტილით
        overlay.classList.add('hide-menu-now');
        if (sideMenu) {
            sideMenu.style.opacity = "0";
            sideMenu.style.pointerEvents = "none";
        }

        if (vid) vid.pause();

        // "X" ღილაკის (დახურვის) ლოგიკა
        const closeBtn = commUI.querySelector('span[onclick*="commentsUI"]');
        if (closeBtn) {
            closeBtn.onclick = function() {
                // ა) ვმალავთ კომენტარებს
                commUI.style.display = 'none';
                
                // ბ) ვაგრძელებთ ვიდეოს
                if (vid) vid.play();
                
                // გ) ვაბრუნებთ მენიუს - აი ეს არის მთავარი!
                overlay.classList.remove('hide-menu-now');
                if (sideMenu) {
                    sideMenu.style.opacity = "1";
                    sideMenu.style.visibility = "visible";
                    sideMenu.style.pointerEvents = "auto";
                }
            };
        }
        openComments(window.currentFullVideoId);
    }
}
                

        
 


// 3. ვიდეოს შენახვა (Bookmark)
function saveVideoFromFull() {
    const postId = window.currentFullVideoId;
    if (!postId) return;

    const myUid = auth.currentUser.uid;
    const saveRef = db.ref(`posts/${postId}/savedBy/${myUid}`);

    saveRef.once('value', snap => {
        if (snap.exists()) {
            saveRef.remove();
            document.getElementById('fullSaveIcon').style.color = 'white';
        } else {
            saveRef.set(true);
            document.getElementById('fullSaveIcon').style.color = 'var(--gold)';
        }
    });
}

// 4. გაზიარება (Share)
function shareVideoFromFull() {
    if (!window.currentFullVideoId) return;
    
    const shareUrl = window.location.origin + "?v=" + window.currentFullVideoId;
    
    if (navigator.share) {
        navigator.share({
            title: 'EmigrantBook Video',
            url: shareUrl
        }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("ბმული კოპირებულია!");
    }
}

// აუცილებელია: ფუნქციების გატანა window-ზე, რომ HTML-მა "დაინახოს"
window.handleLikeFromFull = handleLikeFromFull;
window.openCommentsFromFull = openCommentsFromFull;
window.saveVideoFromFull = saveVideoFromFull;
window.shareVideoFromFull = shareVideoFromFull;

















// ეს ფუნქცია სპეციალურად ვიდეოს დროს დახურვისთვისაა
function closeVideoComments() {
    // 1. ვთიშავთ კომენტარების ფანჯარას
    document.getElementById('commentsUI').style.display = 'none';

    // 2. თუ უკან ვიდეოს ფანჯარაა, გამოვაჩინოთ და გავაგრძელოთ
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');
    
    if (overlay && overlay.style.display === 'block') {
        overlay.style.opacity = "1"; // თუ opacity-თ გვქონდა დამალული
        if (vid) vid.play(); // ვიდეოს გაგრძელება
    }
}

// აი აქ ვპოულობთ შენს "X" ღილაკს და პროგრამულად ვაბამთ ამ ფუნქციას
// ამას ვუშვებთ ყოველ ჯერზე, როცა ვიდეოდან იხსნება კომენტარები
function fixCloseBtn() {
    const commUI = document.getElementById('commentsUI');
    const closeBtn = commUI.querySelector('span[onclick*="commentsUI"]');
    if (closeBtn) {
        closeBtn.onclick = closeVideoComments;
    }
}




















async function askInitialPermissions() {
    // 1. შემოწმება, ხომ არ არის უკვე მოთხოვნილი (რომ ყოველ შესვლაზე არ შეაწუხოს)
    if (localStorage.getItem('initial_permissions_asked')) return;

    console.log("ვითხოვ ყველა სისტემურ ნებართვას...");

    try {
        // ა) კამერა და მიკროფონი
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // თუ ნებართვა მოგვცა, ეგრევე ვთიშავთ სტრიმს (უბრალოდ დასტურისთვის გვჭირდებოდა)
        stream.getTracks().forEach(track => track.stop());

        // ბ) ლოკაცია (მაპი)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(() => {}, () => {});
        }

        // გ) ნოტიფიკაციები (უკვე გაქვს კოდში, მაგრამ აქაც იყოს გარანტიისთვის)
        if ("Notification" in window) {
            await Notification.requestPermission();
        }

        // დავიმახსოვროთ, რომ ერთხელ უკვე ვკითხეთ
        localStorage.setItem('initial_permissions_asked', 'true');
        console.log("ყველა ნებართვა დამუშავებულია ✅");

    } catch (err) {
        console.warn("ზოგიერთ ნებართვაზე მომხმარებელმა უარი თქვა ან ბრაუზერმა დაბლოკა:", err);
    }
}


























// ეს კოდი გაეშვება საიტის გახსნისთანავე
window.addEventListener('load', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            console.log("ნებართვის სტატუსი:", permission);
            if (permission === 'granted') {
                // თუ ნებართვა გვაქვს, ვცდილობთ ტოკენის აღებას
                navigator.serviceWorker.ready.then(reg => {
                    const messaging = firebase.messaging();
                    messaging.getToken({
                        vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk',
                        serviceWorkerRegistration: reg
                    }).then(token => {
                        console.log("ტოკენი პირდაპირი მოთხოვნით:", token);
                    });
                });
            }
        });
    }
});















// ინვოისი მეილზე გასაგზავნი შოპინგი
// 1. ინიციალიზაცია (ეს აუცილებელია!)
// 1. EmailJS-ის ინიციალიზაცია (აუცილებელია გაშვებისას)
// 1. ინიციალიზაცია (შენი Public Key-თ)
emailjs.init("oZOT_SZC1MfIZnil8");

async function sendRealInvoice() {
    const btn = document.getElementById('send_inv_btn');
    
    // მონაცემების წამოღება ინპუტებიდან
    const name = document.getElementById('inv_customer_name').value;
    const email = document.getElementById('inv_customer_email').value;
    const desc = document.getElementById('inv_product_desc').value;
    const amount = document.getElementById('inv_amount').value;
    
    // ავტომატური მონაცემები
    const date = new Date().toLocaleDateString('ka-GE');
    const inv_no = "EB-" + Math.floor(1000 + Math.random() * 9000);

    // ვალიდაცია
    if(!name || !email || !amount) {
        alert("გთხოვთ, შეავსოთ სახელი, მეილი და თანხა!");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> იგზავნება...';

    // პარამეტრები შენი EmailJS შაბლონისთვის
    const templateParams = {
        to_name: name,
        to_email: email,
        order_id: inv_no,
        order_date: date,
        product_description: desc || "შენაძენი",
        total_price: amount + " €",
        reply_to: "support@emigrantbook.com"
    };

    try {
        // შენი ზუსტი Service ID და Template ID
        await emailjs.send('service_hjiqge4', 'template_50xhnnm', templateParams);
        
        alert("✅ ინვოისი წარმატებით გაეგზავნა: " + name);
        
        // Firebase-ში ჩაწერა (თუ ბაზა ჩართულია)
        if(typeof db !== 'undefined') {
            db.ref('sent_invoices').push({
                customer: name,
                email: email,
                amount: amount,
                date: date,
                invoice_no: inv_no,
                status: "Sent"
            });
        }

        // ინპუტების გასუფთავება წარმატების შემდეგ
        document.getElementById('inv_product_desc').value = "";
        document.getElementById('inv_amount').value = "";

    } catch (error) {
        console.error("EmailJS Error:", error);
        alert("შეცდომა გაგზავნისას: " + (error.text || "გადაამოწმეთ EmailJS პანელი"));
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> ინვოისის გაგზავნა';
    }
}





// ინვოისის ისტორიების ლოგიკა
function loadInvoiceHistory() {
    const tableBody = document.getElementById('invoice_history_body');
    
    // ვუსმენთ 'sent_invoices' კვანძს Firebase-ში
    db.ref('sent_invoices').orderByChild('timestamp').on('value', (snapshot) => {
        tableBody.innerHTML = ""; // ვასუფთავებთ ძველ მონაცემებს
        
        let invoices = [];
        snapshot.forEach((childSnapshot) => {
            invoices.unshift(childSnapshot.val()); // ახალი ინვოისები ზემოთ მოექცეს
        });

        if (invoices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">ისტორია ცარიელია</td></tr>';
            return;
        }

        invoices.forEach((data) => {
            const row = document.createElement('tr');
            row.style.borderBottom = "1px solid #eee";
            
            // ამ ნაწილს ჩაასწორებ შენს loadInvoiceHistory ფუნქციაში:
row.innerHTML = `
    <td style="padding: 15px; color: #aaa;">${data.date}</td>
    <td style="padding: 15px; font-weight: bold; color: white;">${data.customer}</td>
    <td style="padding: 15px; color: var(--gold); font-family: monospace;">${data.invoice_no || '---'}</td>
    <td style="padding: 15px; text-align: right; font-weight: bold; color: #4ade80;">${data.amount} €</td>
    <td style="padding: 15px; text-align: center;">
        <span style="background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 10px; border: 1px solid rgba(74, 222, 128, 0.2);">
            SENT
        </span>
    </td>
`;
            tableBody.appendChild(row);
        });
    });
}

// ავტომატურად ჩავრთოთ ისტორიის ჩატვირთვა გვერდის გახსნისას
loadInvoiceHistory();















async function uploadChatImage(input) {
    // თუ ფაილი არ აურჩევია ან ჩატი არაა გახსნილი, გაჩერდეს
    if (!input.files || !input.files[0] || !currentChatId) return;
    
    const file = input.files[0];
    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, currentChatId);

    try {
        // 1. ვქმნით მისამართს Firebase Storage-ში
        const filePath = `chat_images/${chatId}/${Date.now()}_${file.name}`;
        const storageRef = firebase.storage().ref(filePath);

        // 2. ფაილის ატვირთვა (Upload)
        const snapshot = await storageRef.put(file);
        
        // 3. ვიღებთ ატვირთული ფოტოს პირდაპირ ლინკს
        const downloadURL = await snapshot.ref.getDownloadURL();

        // 4. ვაგზავნით მესიჯს (ტექსტის ნაცვლად ვატანთ image-ის ლინკს)
        db.ref(`messages/${chatId}`).push({
            senderId: myUid,
            image: downloadURL, // აი ეს აამუშავებს loadMessages-ში ფოტოს გამოჩენას
            ts: Date.now(),
            seen: false
        });

        // ნოტიფიკაციის გაგზავნა ადრესატთან
        if (typeof sendPushToUser === "function") {
            sendPushToUser(currentChatId, myName, "📷 Photo");
        }

        // ვასუფთავებთ ინპუტს, რომ შემდეგში იგივე ფოტოს არჩევა შევძლოთ
        input.value = ""; 

    } catch (error) {
        console.error("ფოტოს ატვირთვა ჩაიშალა:", error);
        alert("ვერ მოხერხდა ფოტოს გაგზავნა.");
    }
}




















// საჩუქრის ყუთის ვიზუალის ლოგიკა 
function showGiftAnimation(amount) {
    const container = document.getElementById('giftAnimationContainer');
    const amountSpan = document.getElementById('giftAmount');
    
    // 1. ვწერთ რაოდენობას
    amountSpan.innerText = amount;
    
    // 2. ვაჩენთ კონტეინერს
    container.style.display = 'block';
    
    // 3. ვამატებთ ანიმაციის კლასს
    const wrapper = container.querySelector('.gift-box-wrapper');
    wrapper.classList.remove('animate-gift');
    void wrapper.offsetWidth; // "Reflow" - ანიმაციის თავიდან დასაწყებად
    wrapper.classList.add('animate-gift');

    // 4. 30 წამში ვმალავთ ისევ
    setTimeout(() => {
        container.style.display = 'none';
    }, 30000);
}














// ავტომატური "დამჭერი" ვიდეოსთვის
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        // თუ ვიდეო აღარ ჩანს ეკრანზე (სხვა გვერდი გადაეფარა)
        if (!entry.isIntersecting) {
            video.pause();
            // ტელეფონის მედია პანელის გათიშვაც აქ ჩავამატოთ
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
        }
    });
}, { threshold: 0.1 }); // 0.1 ნიშნავს, რომ თუ 10% მაინც არ ჩანს, რეაგირებს

// მივაბათ ეს დამკვირვებელი შენს მთავარ ვიდეოს
const mainVid = document.getElementById('fullVideoTag');
if (mainVid) {
    videoObserver.observe(mainVid);
}








function killVideo() {
    const v = document.getElementById('fullVideoTag');
    if (v) {
        v.pause();
        // v.currentTime = 0; // თუ გინდა რომ თავიდან დაიწყოს შემდეგზე
    }
    // მედია პანელის გათიშვა ტელეფონის ეკრანზე
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
}












// პროფილის ნევბარში ავატარის გამოჩენა სტუმარი
// ეს ფუნქცია მართავს ხატულების შეცვლას
function checkNewVisitors(myUid) {
    const feet = document.getElementById('feetStats');
    const ava = document.getElementById('visitorAvaNav');
    
    // თუ ელემენტები ვერ იპოვა, აჩერებს ფუნქციას რომ საიტი არ გაჭედოს
    if (!feet || !ava) return;

    // ვამოწმებთ ბოლო სტუმარს შენს ბაზაში
    db.ref(`profile_views/${myUid}`).orderByChild('ts').limitToLast(1).once('value', snap => {
        const data = snap.val();
        if (!data) {
            feet.style.display = 'block';
            return;
        }

        const visitorData = Object.values(data)[0];
        const lastSeenTs = localStorage.getItem('last_seen_visitor_ts') || 0;

        // თუ ბოლო სტუმრის დრო (ts) უფრო ახალია, ვიდრე ჩვენი ნანახი დრო
        if (visitorData.ts > lastSeenTs) {
            feet.style.display = 'none'; // ვმალავთ ფეხებს
            ava.src = visitorData.photo || "token-avatar.png"; // ვსვამთ სტუმრის ფოტოს
            ava.style.display = 'block'; // ვაჩენთ ავატარს
        } else {
            // თუ უკვე ნანახი გვაქვს, რჩება ფეხები
            feet.style.display = 'block';
            ava.style.display = 'none';
        }
    });
}















window.openShare = function(postId, url) {
    // ვქმნით შენი საიტის ლინკს ვიდეოს ID-ით
    const siteLink = `https://emigrantbook.com/?v=${postId}`;

    if (navigator.share) {
        navigator.share({
            title: 'Emigrantbook',
            text: 'ნახე ეს ვიდეო Emigrantbook-ზე!',
            url: siteLink // აქ უკვე საიტის ლინკი წავა
        }).then(() => {
            db.ref(`posts/${postId}/shares`).transaction(c => (c || 0) + 1);
        }).catch(() => console.log("Share cancelled"));
    } else {
        // ლინკის დაკოპირება (აქაც საიტის ლინკი)
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = siteLink;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        alert("ბმული დაკოპირებულია! ✅");
        db.ref(`posts/${postId}/shares`).transaction(c => (c || 0) + 1);
    }
};

window.shareVideo = window.openShare;









// მესიჯის კლავიატურის კონტროლი
// 🚀 კლავიატურის ამოწევისას ვიდეოების ხელახლა ჩართვის საწინააღმდეგოდ
window.addEventListener('resize', () => {
    const messenger = document.getElementById('messengerUI');
    // თუ მესინჯერი ან ჩატის ველები ჩანს, მაშინვე ვთიშავთ ყველაფერს
    if (messenger && messenger.style.display === 'flex') {
        stopMainFeedVideos();
    }
});

// ასევე დავამატოთ Focus-ზე (როცა წერას იწყებ input-ში)
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        stopMainFeedVideos();
    }
});














// ვიდეოს პოპულიზაციის გვერდი
function openPromoteUI() {
    const menu = document.getElementById('more-menu-panel');
    if (menu) menu.classList.remove('active'); // ვხურავთ სამ წერტილს
    
    document.getElementById('promoteUI').style.display = 'flex';
    
    // ვიდეოების ჩატვირთვა
    const grid = document.getElementById('promoteVideoGrid');
    grid.innerHTML = "";
    db.ref('posts').orderByChild('authorId').equalTo(auth.currentUser.uid).once('value', snap => {
        const posts = snap.val();
        if (posts) {
            Object.entries(posts).reverse().forEach(([id, post]) => {
                const video = post.media ? post.media.find(m => m.type === 'video') : null;
                if (video) {
                    grid.innerHTML += `
                    <div onclick="selectEbVideo('${id}')" id="vid-${id}" style="min-width:100px; height:130px; background:#1a1a1a; border-radius:8px; overflow:hidden; border:2px solid transparent; position:relative;">
                        <video src="${video.url}" style="width:100%; height:100%; object-fit:cover; opacity:0.7;"></video>
                        <div style="position:absolute; bottom:5px; left:5px; font-size:10px;"><i class="fas fa-play"></i> ${post.views || 0}</div>
                    </div>`;
                }
            });
        }
    });
}

let selectedEbVideoId = null;
function selectEbVideo(id) {
    selectedEbVideoId = id;
    document.querySelectorAll('#promoteVideoGrid div').forEach(el => el.style.borderColor = "transparent");
    document.getElementById('vid-' + id).style.borderColor = "#fe2c55";
    checkEbReady();
}

function selectEbPack(el, price) {
    document.querySelectorAll('.eb-pack').forEach(p => p.style.background = "#1a1a1a");
    el.style.background = "#261014";
    document.getElementById('ebTotal').innerText = price.toFixed(2).replace('.', ',') + " $";
    window.selectedEbPrice = price;
    checkEbReady();
}

function checkEbReady() {
    if (selectedEbVideoId && window.selectedEbPrice) {
        const btn = document.getElementById('ebPayBtn');
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

function closePromoteUI() {
    document.getElementById('promoteUI').style.display = 'none';
}











// პოსტების ახალი ნიტიფიკაცია 
//პოსტის ღილაკზე
// ==========================================
// 🔴 პოსტების ნოტიფიკაციის (წითელი ბუშტის) ლოგიკა
// ==========================================
let newWallPostsCount = 0;

function startWallNotificationListener() {
    const myUid = auth.currentUser.uid;
    let isInitialLoad = true; // ვიყენებთ იმისთვის, რომ ძველ პოსტებზე არ აანთოს

    // ვუსმენთ მხოლოდ ახალ დამატებულ პოსტებს
    db.ref('community_posts').orderByChild('timestamp').limitToLast(1).on('child_added', snap => {
        // საიტის ჩატვირთვისას ბოლო არსებულ პოსტს ვაიგნორებთ
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }
        
        const post = snap.val();
        
        // თუ ახალი პოსტი ვიღაც სხვამ დადო (და არა მე)
        if (post && post.authorId !== myUid) {
            newWallPostsCount++; // ვზრდით ციფრს 1-ით
            
            const badge = document.getElementById('newPostsBadge');
            if (badge) {
                badge.innerText = newWallPostsCount;
                badge.style.display = 'inline-block'; // ვაჩენთ ეკრანზე
            }
        }
    });
}
// აქ მატავრდება











// პოსრის მონიშვნის ლოგიკა
window.toggleWallTag = function(postId) {
    const user = auth.currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    
    const myUid = user.uid;
    const tagRef = db.ref('community_posts/' + postId + '/taggedBy/' + myUid);

    tagRef.once('value').then(snap => {
        // ვპოულობთ ღილაკს ეკრანზე, რომ ფერი შევუცვალოთ მომენტალურად
        const btnElement = event.currentTarget.querySelector('i');
        const textElement = event.currentTarget.querySelector('span');

        if (snap.exists()) {
            tagRef.remove(); // ვშლით ბაზიდან
            if (btnElement) {
                btnElement.className = "far fa-user-tag";
                btnElement.style.color = "#888";
            }
            if (textElement) textElement.innerText = "მონიშვნა";
        } else {
            tagRef.set(true); // ვწერთ ბაზაში
            if (btnElement) {
                btnElement.className = "fas fa-user-tag";
                btnElement.style.color = "var(--gold)";
            }
            if (textElement) textElement.innerText = "მონიშნულია";
        }
    }).catch(err => console.error("Tag Error:", err));
};

// 1. ღილაკზე დაჭერის ლოგიკა კედლის პოსტებისთვის
  window.loadMyTaggedWallPosts = function(targetUid) {
    let box = document.getElementById('userTaggedPostsList');
    const profGrid = document.getElementById('profGrid');
    
    if (!box) {
        box = document.createElement('div');
        box.id = 'userTaggedPostsList';
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.gap = '15px';
        box.style.padding = '10px';
        if (profGrid && profGrid.parentNode) {
            profGrid.parentNode.insertBefore(box, profGrid.nextSibling);
        } else {
            document.body.appendChild(box);
        }
    }
    
    box.style.display = 'flex';
    box.innerHTML = "<p style='color:var(--gold); text-align:center; padding:20px;'>იტვირთება...</p>";

    const user = auth.currentUser;
    if (!user) {
        box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>გთხოვთ გაიაროთ ავტორიზაცია</p>";
        return;
    }

    // 🔴 მთავარი ლოგიკა: ვიგებთ ვისი პროფილის პოსტები უნდა ჩავტვირთოთ
    // თუ targetUid მოვიდა, ე.ი. სხვის (ან ჩვენს) პროფილზე ვართ. თუ არა - ავტომატურად ჩვენსას ვიღებთ.
    const uidToLoad = targetUid ? targetUid : user.uid;
    const myUid = user.uid; // ეს გვჭირდება იმისთვის, რომ გავიგოთ ჩვენ დავალაიქეთ თუ არა

    db.ref('community_posts').once('value', snap => {
        box.innerHTML = ""; 
        const data = snap.val();
        
        if (!data) {
            box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>ბაზაში პოსტები არ არის</p>";
            return;
        }

        let count = 0;
        
        Object.keys(data).reverse().forEach(id => {
            const post = data[id];
            
            // 🔴 ვამოწმებთ, აქვს თუ არა იმ იუზერს მონიშნული, ვის პროფილსაც ახლა ვუყურებთ
            if (post.taggedBy && post.taggedBy[uidToLoad]) {
                count++;
                
                const isLiked = (post.likes && post.likes[myUid]);
                const likeCount = post.likes ? Object.keys(post.likes).length : 0;
                const postTime = post.timestamp ? formatTimeShort(post.timestamp) : "";
                
                const card = document.createElement('div');
                card.className = "post-card";
                card.innerHTML = `
                    <div class="post-header" style="display:flex; align-items:center; margin-bottom:10px; cursor:pointer;" onclick="openProfile('${post.authorId}')">
                        <img src="${post.authorPhoto || 'https://ui-avatars.com/api/?name='+post.authorName}" style="width:35px; height:35px; border-radius:50%; border:1px solid var(--gold); object-fit:cover; margin-right:10px;">
                        <div style="display:flex; flex-direction:column;">
                            <b style="color:white; font-size:14px;">${post.authorName}</b>
                            <span style="color:#888; font-size:10px;">${postTime}</span>
                        </div>
                    </div>
                    
                    ${post.text ? `<p style="font-size:15px; margin:10px 0; color:#E4E6EB;">${post.text}</p>` : ''}
                    ${post.image ? `<img src="${post.image}" style="width:100%; border-radius:10px; margin-bottom:10px;">` : ''}
                    
                    <div style="display:flex; gap:25px; color:var(--gold); border-top:1px solid #333; padding-top:10px; margin-top:5px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <i class="${isLiked ? 'fas' : 'far'} fa-heart" style="${isLiked ? 'color:#ff4d4d;' : ''}"></i>
                            <span style="font-size:14px; font-weight:bold;">${likeCount}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-user-tag" style="color:var(--gold);"></i>
                            <span style="font-size:14px; font-weight:bold;">მონიშნულია</span>
                        </div>
                    </div>`;
                box.appendChild(card);
            }
        });

        if (count === 0) {
            box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>ამ მომხმარებელს მონიშნული პოსტები არ აქვს</p>";
        }
    });
};                    
                    
// აქ მთავრდება










// კამერის დროს გადაღების სახის ფილტრები
let faceMesh;

async function setupBeautyFilter() {
    faceMesh = new FaceMesh({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onBeautyResults);
    console.log("Beauty Filter სისტემა მზადაა!");
}

function onBeautyResults(results) {
    if (!results.multiFaceLandmarks) return;
    
    // აქ მოხდება ჯადოქრობა: 
    // 1. ავიღებთ სახის კანს
    // 2. დავადებთ ბლარს (Blur) რომ გასუფთავდეს
    // 3. დავაბრუნებთ ეკრანზე
    applySkinSmoothing(results);
}

// ამ ფუნქციას გამოვიძახებთ როცა კამერა ჩაირთვება
setupBeautyFilter();


let isBeautyOn = false;

function toggleBeautyMode() {
    isBeautyOn = !isBeautyOn;
    const video = document.getElementById('cameraStream');
    const icon = document.getElementById('beautyIcon');
    
    if (isBeautyOn) {
        // ეფექტის ჩართვა: კანს ოდნავ "აშავებს" და "აპრიალებს" (Soft Focus)
        video.style.filter = "contrast(1.1) brightness(1.1) saturate(1.1) blur(0.5px)";
        icon.style.color = "#ff4d4d"; // ღილაკი წითლდება
        console.log("Beauty Mode: ON");
    } else {
        // ეფექტის გამორთვა: აბრუნებს ორიგინალს
        video.style.filter = "none";
        icon.style.color = "white"; // ღილაკი თეთრდება
        console.log("Beauty Mode: OFF");
    }
}






// ფილტრი ფერის შეცვლა
// ფილტრების მენიუს გამოჩენა/დამალვა
function toggleFiltersMenu() {
    const menu = document.getElementById('filtersDropdown');
    if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "flex";
    } else {
        menu.style.display = "none";
    }
}

// ფილტრის დადება ვიდეოზე (და კანვასზეც, თუ ჩართულია)
function applyVideoFilter(filterValue) {
    const video = document.getElementById('cameraStream');
    const canvas = document.getElementById('beautyCanvas');
    
    // ვადებთ ფილტრს ვიდეოს
    video.style.filter = filterValue;
    
    // თუ Beauty Mode ჩართულია, კანვასსაც გადაედება იგივე ფილტრი
    if (canvas) {
        canvas.style.filter = filterValue;
    }
    
    console.log("Filter applied: " + filterValue);
    
    // ფილტრის არჩევის შემდეგ მენიუ რომ დაიმალოს
    document.getElementById('filtersDropdown').style.display = "none";
}






// ვიდეოს აჩქარება ან შენელება
let currentSpeed = 1.0;

// სიჩქარის მენიუს გამოჩენა/დამალვა
function toggleSpeedMenu() {
    const menu = document.getElementById('speedDropdown');
    menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "flex" : "none";
}

// სიჩქარის დაყენება
function setVideoSpeed(speed, element) {
    currentSpeed = speed;
    
    // ვიზუალური ეფექტი მენიუში
    const options = element.parentElement.querySelectorAll('div');
    options.forEach(opt => opt.style.color = 'white');
    element.style.color = '#ff4d4d';
    
    console.log("ჩაწერის სიჩქარე: " + currentSpeed + "x");
    
    // მენიუს დახურვა არჩევის შემდეგ
    document.getElementById('speedDropdown').style.display = "none";
}









// ტაიმერის ლოგიკა 
