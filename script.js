const firebaseConfig = {
    apiKey: "AIzaSyA6FGTJch13HCEGXeKEGDxGMEcqg3GPeb4",
    authDomain: "emigrantbook-4b7bd.firebaseapp.com",
    databaseURL: "https://emigrantbook-4b7bd-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "emigrantbook-4b7bd",
    storageBucket: "emigrantbook-4b7bd.firebasestorage.app",
    messagingSenderId: "109907338554",
    appId: "1:109907338554:web:fde6c296d9ff56f6305c03",
    measurementId: "G-MRPP7G4H30"
};

let audioCtx, audioSource, audioDest;

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage(); 
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
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
  if (typeof applyLanguage === "function") applyLanguage();
  if (user) {
    setTimeout(() => {
        askInitialPermissions(); 
    }, 1500);

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const packAmount = urlParams.get('pack');

    if (sessionId && packAmount) {
        const amountToAdd = parseFloat(packAmount);
        db.ref(`payments_processed/${sessionId}`).once('value', snap => {
            if (!snap.exists()) {
                db.ref(`users/${user.uid}/akho`).transaction(current => {
                    return (current || 0) + amountToAdd;
                }).then(() => {
                    db.ref(`payments_processed/${sessionId}`).set({
                        uid: user.uid,
                        amount: amountToAdd,
                        ts: Date.now()
                    });
                    addToLog('Stripe Purchase', amountToAdd);
                    if (typeof showCustomAlert === "function") {
                        showCustomAlert("წარმატება", `თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
                    } else {
                        alert(`წარმატება: თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        });
    }
    
    setTimeout(() => {
      console.log("ვცდილობ ჩაწერას...");
      db.ref('users/' + user.uid + '/test').set("მუშაობს");
      saveMessagingToken(user);
    }, 2000);

    db.ref(`users/${user.uid}/euro_balance`).on('value', snap => {
        const euro = snap.val() || 0;
        const euroEl = document.getElementById('euroBalanceDisplay');
        if (euroEl) {
            euroEl.innerText = euro.toFixed(2) + " €";
        }
    });

    updatePresence();
    listenToGlobalMessages();
    if (typeof startNotificationListener === "function") startNotificationListener();
    if (typeof checkDailyBonus === "function") checkDailyBonus();
    startGlobalUnreadCounter();
    if (typeof listenForIncomingCalls === "function") listenForIncomingCalls(user);
    startWallNotificationListener();
    
    setTimeout(function() {
        const user = firebase.auth().currentUser;
        if (user) {
            const tokenKey = 'fcm_token_sent_' + user.uid;
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
                            if (typeof showTestNotification === "function") showTestNotification(); 
                            localStorage.setItem(tokenKey, 'true'); 
                        }
                    })
                    .catch((err) => console.log("Push error or denied"));
            } catch (e) {
                console.log("Messaging skip");
            }
        }
    }, 3000);

    let currentIncomingCall = null;
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling' && (Date.now() - call.ts < 60000)) {
            currentIncomingCall = call; 
            document.getElementById('callerNameDisplay').innerText = call.callerName;
            document.getElementById('callerAva').src = call.callerPhoto || 'token-avatar.png';
            const modal = document.getElementById('incomingCallModal');
            modal.style.display = 'flex';
        } else {
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'none';
        }
    });

    const authUI = document.getElementById('authUI');
    if (authUI) authUI.style.display = 'none';

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
            const akhoEl = document.getElementById('userAkho');
            if(akhoEl) akhoEl.innerText = myAkho.toFixed(2);
            const cashEl = document.getElementById('realCash');
            if(cashEl) cashEl.innerText = (myAkho / 10).toFixed(2);
            const navAva = document.getElementById('bottomNavAva');
            if(navAva) navAva.src = myPhoto;
            
            const obUI = document.getElementById('onboardingUI');
            if(!d.hasSeenRules && obUI) obUI.style.display = 'flex';
            
            const admBtn = document.getElementById('adminMenuBtn');
            if(d.role === 'admin' && admBtn) { admBtn.style.display = 'flex'; }
          
            updateCashoutUI();
            loadActivityLog();
        }
    });
    renderTokenFeed();
    loadDiscoveryUsers();
    listenToRequests();
  } else {
    const authUI = document.getElementById('authUI');
    if (authUI) authUI.style.display = 'flex';
    document.getElementById('main-feed').innerHTML = "";
  }
});

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

function declineCall() {
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    document.getElementById('incomingCallModal').style.display = 'none';
}

function updateCashoutUI() {
    const status = document.getElementById('cashoutStatus');
    const form = document.getElementById('cashoutForm');
    if (!status || !form) return;
    const cLang = typeof currentLang !== 'undefined' ? currentLang : 'ka';
    if (myAkho >= 500) {
        status.innerText = cLang === 'ka' ? "გატანა ხელმისაწვდომია!" : "Cashout available!";
        status.style.color = "var(--green)";
        form.style.display = "block";
    } else {
        const diff = 500 - myAkho;
        status.innerText = cLang === 'ka' ? `გაკლიათ ${(diff/10).toFixed(2)} € გატანამდე` : `${(diff/10).toFixed(2)} € left until cashout`;
        status.style.color = "var(--red)";
        form.style.display = "none";
    }
}

function submitWithdraw() {
    const iban = document.getElementById('ibanInput').value;
    if(!iban || iban.length < 10) return alert("IBAN / PayPal Error");
    const cLang = typeof currentLang !== 'undefined' ? currentLang : 'ka';
    
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
            alert(cLang === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request sent!");
            document.getElementById('walletUI').style.display = 'none';
        });
    }
}

function openAdminUI() {
    toggleSideMenu(false);
    document.getElementById('adminUI').style.display = 'flex';
    loadAdminRequests();
    if (typeof renderAdminOrders === "function") renderAdminOrders();
}

function adminSearchUsers(q) {
    const list = document.getElementById('admUserList');
    if(!q || q.length < 2) { list.innerHTML = ""; return; }
    db.ref('users').once('value', snap => {
        list.innerHTML = "";
        const data = snap.val();
        if (!data) return;
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
    window.location.href = finalUrl; 
}

function canAfford(cost) {
    const cLang = typeof currentLang !== 'undefined' ? currentLang : 'ka';
    if (myAkho >= cost) return true;
    alert(cLang === 'ka' ? "შეავსეთ ბალანსი!" : "Top up your balance!");
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
    db.ref(`activity_logs/${targetUid}`).push({
        type: reason,
        amt: amount,
        ts: Date.now()
    });
}

function addToLog(type, amt) {
    if (!auth.currentUser) return;
    db.ref(`activity_logs/${auth.currentUser.uid}`).push({
        type: type,
        amt: amt,
        ts: Date.now()
    });
}

function loadActivityLog() {
    const box = document.getElementById('logContent');
    if (!box || !auth.currentUser) return;
    db.ref(`activity_logs/${auth.currentUser.uid}`).limitToLast(15).once('value', snap => {
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
    
    const closeBtn = commUI.querySelector('span[onclick*="commentsUI"]');
    if (closeBtn) {
        closeBtn.onclick = function() {
            commUI.style.display = 'none';
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
    if(!list || !auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    const postOwnerId = window.currentPostOwnerId;

    window.isGalleryMode = isGallery;
    activePostId = postId;

    const commentPath = isGallery ? `gallery_comments/${postId}` : `comments/${postId}`;

    db.ref(commentPath).once('value', snap => {
        list.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).forEach(([id, comm]) => {
            const isLiked = comm.likes && comm.likes[myUid];
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

window.deleteComment = function(postId, commentId) {
    if (confirm("ნამდვილად გსურთ კომენტარის წაშლა?")) {
        db.ref(`comments/${postId}/${commentId}`).remove().then(() => loadComments(postId));
    }
};

window.deleteReply = function(postId, commentId, replyId) {
    if (confirm("ნამდვილად გსურთ პასუხის წაშლა?")) {
        db.ref(`comments/${postId}/${commentId}/replies/${replyId}`).remove().then(() => loadComments(postId));
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

    const commentPath = window.isGalleryMode ? `gallery_comments/${activePostId}` : `comments/${activePostId}`;

    if(activeReplyTo) {
        db.ref(`${commentPath}/${activeReplyTo}/replies`).push({
            authorId: auth.currentUser.uid, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
        }).then(() => loadComments(activePostId, window.isGalleryMode));
    } else {
        db.ref(commentPath).push({
            authorId: auth.currentUser.uid, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
        }).then(() => loadComments(activePostId, window.isGalleryMode));
    }
    
    spendAkho(0.5, 'Comment');
    document.getElementById('commInp').value = "";
    activeReplyTo = null;
}

function likeComment(commId) {
    if (!canAfford(0.1)) return;
    const commentPath = window.isGalleryMode ? `gallery_comments/${activePostId}` : `comments/${activePostId}`;
    const ref = db.ref(`${commentPath}/${commId}/likes/${auth.currentUser.uid}`);
    ref.once('value', snap => {
        if(snap.exists()) {
            ref.remove().then(() => loadComments(activePostId, window.isGalleryMode));
        } else {
            ref.set(true).then(() => {
                spendAkho(0.1, 'Comment Like'); 
                loadComments(activePostId, window.isGalleryMode);
            });
        }
    });
}

function openMessenger() {
    stopMainFeedVideos();
    const ui = document.getElementById('messengerUI');
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

    db.ref(`users/${auth.currentUser.uid}/following`).once('value', async snap => {
        if (!list) return;
        const followers = snap.val();
        if(!followers) { 
            list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No active chats yet.</p>";
            return; 
        }

        let chatArray = [];
        const promises = Object.entries(followers).map(async ([uid, data]) => {
            const chatId = getChatId(auth.currentUser.uid, uid);
            const mSnap = await db.ref(`messages/${chatId}`).limitToLast(1).once('value');
            let lastTs = 0;
            if (mSnap.exists()) {
                const msgs = mSnap.val();
                lastTs = Object.values(msgs)[0].ts;
            }
            chatArray.push({ uid, data, lastTs });
        });

        await Promise.all(promises);
        chatArray.sort((a, b) => b.lastTs - a.lastTs);
        list.innerHTML = "";

        chatArray.forEach(({ uid, data }) => {
            const chatId = getChatId(auth.currentUser.uid, uid);
            const item = document.createElement('div');
            item.className = 'chat-list-item';
            item.style = "border:none; background:#000; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
            
            item.onclick = () => {
                db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).set(Date.now());
                document.getElementById('messengerUI').style.display = 'none';
                startChat(uid, data.name, data.photo);
            };
            
            db.ref(`users/${auth.currentUser.uid}/last_read/${chatId}`).once('value', readSnap => {
                const lastRead = readSnap.val() || 0;
                db.ref(`messages/${chatId}`).limitToLast(1).once('value', mSnap => {
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
                        if (msgData.senderId !== auth.currentUser.uid && ts > lastRead) {
                            isUnread = true;
                        }
                    }

                    db.ref(`users/${uid}/presence`).once('value', presenceSnap => {
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
    if(typeof setAppBadge === 'function') setAppBadge(0);
    
    window.currentChatId = uid;
    currentChatId = uid; 

    document.getElementById('socialListsUI').style.display = 'none';
    document.getElementById('individualChat').style.display = 'flex';
    document.getElementById('chatTargetName').innerText = name;
    document.getElementById('chatTargetAva').src = photo;

    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, uid);

    db.ref(`messages/${chatId}`).orderByChild('seen').equalTo(false).once('value', snap => {
        const updates = {};
        snap.forEach(child => {
            const m = child.val();
            if (m.senderId !== myUid) {
                updates[`${child.key}/seen`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            db.ref(`messages/${chatId}`).update(updates);
        }
    });

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

let currentChatLimit = 20;
function loadMessages(targetUid) {
    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, targetUid);
    const box = document.getElementById('chatMessages');

    db.ref(`users/${targetUid}`).once('value', targetSnap => {
        const tData = targetSnap.val();
        const tPhoto = (tData && tData.photo) ? tData.photo : 'token-avatar.png';

        db.ref(`users/${myUid}/deleted_messages/${chatId}`).once('value', deletedSnap => {
            const deletedMsgs = deletedSnap.val() || {};

            db.ref(`messages/${chatId}`).limitToLast(currentChatLimit).once('value', snap => {
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

                if (currentChatLimit === 20) {
                    box.scrollTop = box.scrollHeight;
                }
            });
        });
    });

    box.onscroll = function() {
        if (box.scrollTop === 0) {
            const oldScrollHeight = box.scrollHeight;
            currentChatLimit += 20;
            loadMessages(targetUid);
            setTimeout(() => {
                box.scrollTop = box.scrollHeight - oldScrollHeight;
            }, 100);
        }
    };
}

function closeChat() {
    if (currentChatId && auth.currentUser) db.ref(`typing/${getChatId(auth.currentUser.uid, currentChatId)}/${auth.currentUser.uid}`).remove();
    document.getElementById('individualChat').style.display = 'none';
    currentChatId = null;
}

function getChatId(u1, u2) {
    return u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`;
}

function handleTyping() {
    if (!currentChatId || !auth.currentUser) return;
    const chatId = getChatId(auth.currentUser.uid, currentChatId);
    db.ref(`typing/${chatId}/${auth.currentUser.uid}`).set(true);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        db.ref(`typing/${chatId}/${auth.currentUser.uid}`).remove();
    }, 3000);

    const inp = document.getElementById('messageInp');
    const sendIcon = document.getElementById('sendBtnIcon'); 
    
    if (inp && sendIcon) {
        if (inp.value.trim().length > 0) {
            sendIcon.className = 'fas fa-paper-plane';
        } else {
            sendIcon.className = 'fas fa-thumbs-up';
        }
    }
}

function listenToTyping(targetUid) {
    if(!auth.currentUser) return;
    const chatId = getChatId(auth.currentUser.uid, targetUid);
    db.ref(`typing/${chatId}/${targetUid}`).on('value', snap => {
        const indicator = document.getElementById('typingIndicator');
        if(!indicator) return;
        if (snap.exists()) {
            indicator.style.display = 'flex';
            const audio = document.getElementById('typingSound');
            if(audio) audio.play().catch(e => {});
        } else {
            indicator.style.display = 'none';
        }
    });
}

function listenToGlobalMessages() {
    if(!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    db.ref('messages').on('child_added', snap => {
        if (!snap.key.includes(myUid)) return;

        snap.ref.limitToLast(1).on('child_added', mSnap => {
            const msg = mSnap.val();
            if (!msg || msg.senderId === myUid) return;
            if (Date.now() - msg.ts > 10000) return;
            if (currentChatId && getChatId(myUid, currentChatId) === snap.key) return;

            db.ref(`users/${msg.senderId}`).once('value', uSnap => {
                const u = uSnap.val();
                if (!u) return;
                
                const senderName = u.name || "მომხმარებელი";
                const messageText = msg.text || "📷 Voice/Media";
                const sound = document.getElementById('msgSound');
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(e => console.log("ხმის დაკვრა დაიბლოკა."));
                }
                setAppBadge(1);
                showLocalNotification("ახალი მესიჯი: " + senderName, messageText);
                showGlobalPush(senderName, u.photo, messageText);
            });
        });
    });
}

function showGlobalPush(name, photo, text) {
    const push = document.getElementById('globalPush');
    if(!push) return;
    document.getElementById('pushName').innerText = name;
    document.getElementById('pushAva').src = photo;
    document.getElementById('pushTxt').innerText = text.substring(0, 40) + (text.length > 40 ? '...' : '');
    push.classList.add('show');
    const sound = document.getElementById('msgSound');
    if(sound) sound.play().catch(e => {});
    setTimeout(() => push.classList.remove('show'), 4000);
}

function sendMessage() {
    if (!canAfford(0.2)) return;
    const inp = document.getElementById('messageInp');
    const myUid = auth.currentUser.uid;
    let msgText = inp.value.trim();

    if (!msgText) msgText = "👍";
    if (!currentChatId) return;
    const chatId = getChatId(myUid, currentChatId);

    db.ref(`users/${currentChatId}/following/${myUid}`).once('value', snapshot => {
        const heFollowsMe = snapshot.exists();
        const targetPath = heFollowsMe ? `messages/${chatId}` : `message_requests/${currentChatId}/${myUid}`;

        db.ref(targetPath).push({
            senderId: myUid,
            text: msgText,
            ts: Date.now(),
            seen: false
        });

        if (typeof sendPushToUser === "function") {
            sendPushToUser(currentChatId, myName, msgText);
        }

        db.ref(`typing/${chatId}/${myUid}`).remove();
        spendAkho(0.2, 'Message');
        inp.value = ""; 

        if (typeof handleTyping === "function") {
            handleTyping();
        }
    });
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
    db.ref('users').once('value', snap => {
        const users = snap.val();
        if (!users) return;
        const grid = document.getElementById('discoverGrid');
        if(!grid) return;
        grid.innerHTML = "";
        Object.entries(users).forEach(([uid, user]) => {
            if (auth.currentUser && uid === auth.currentUser.uid) return;
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
    const privacy = (currentUserData && currentUserData.privacy) ? currentUserData.privacy : 'public';
    const rad = document.getElementById(`priv${privacy.charAt(0).toUpperCase() + privacy.slice(1)}`);
    if(rad) rad.checked = true;
}

function updatePrivacy(val) {
    if(auth.currentUser) db.ref(`users/${auth.currentUser.uid}`).update({ privacy: val });
}

function openProfile(uid) {
    stopMainFeedVideos();
    document.getElementById('profileUI').style.display = 'flex';

    const taggedList = document.getElementById('userTaggedPostsList');
    if (taggedList) {
        taggedList.style.display = 'none';
        taggedList.innerHTML = ''; 
    }
 
    const profNameEl = document.getElementById('profName');
    profNameEl.setAttribute('data-view-uid', uid);

    document.getElementById('userPhotosGrid').style.display = 'none';
    document.getElementById('profGrid').style.display = 'grid';
    document.getElementById('noPhotosMsg').style.display = 'none';

    const galleryUploadContainer = document.getElementById('galleryUploadBtnContainer');
    if (galleryUploadContainer && auth.currentUser) {
        galleryUploadContainer.style.display = (uid === auth.currentUser.uid) ? 'block' : 'none';
    }

    document.querySelectorAll('.p-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('infoBtn').classList.add('active');

    if(auth.currentUser && uid !== auth.currentUser.uid) {
        db.ref(`profile_views/${uid}/${auth.currentUser.uid}`).set({
            uid: auth.currentUser.uid, name: myName, photo: myPhoto, ts: Date.now()
        });
    }
 
    db.ref('users/' + uid).once('value', async snap => {
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

        const locRow = document.getElementById('profLocationRow');
        const locText = document.getElementById('profLocationText');

        if (user.city && user.city.trim() !== "") {
            locText.innerText = user.city;
            locRow.style.display = 'flex';
        } else {
            locRow.style.display = 'none';
        }

        const followersCount = user.followers ? Object.keys(user.followers).length : 0;
        const followingCount = user.following ? Object.keys(user.following).length : 0;
        document.getElementById('statFollowersCount').innerText = followersCount;
        document.getElementById('statFollowingCount').innerText = followingCount;
        document.getElementById('followersStatBtn').onclick = () => openSocialList(uid, 'followers');
        document.getElementById('followingStatBtn').onclick = () => openSocialList(uid, 'following');
        
        const controls = document.getElementById('profControls');
        controls.innerHTML = "";
        document.querySelector('.profile-nav').style.display = 'flex';
        document.getElementById('feetStats').style.display = (auth.currentUser && uid === auth.currentUser.uid) ? 'block' : 'none';
        document.getElementById('profTabs').style.display = 'flex';
        document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);

        const euroBtn = document.getElementById('euroBalanceBtn');
        if (euroBtn) {
            euroBtn.style.display = (auth.currentUser && uid === auth.currentUser.uid) ? 'inline-flex' : 'none';
        }

        const editNameBtn = document.getElementById('editNameBtn');
        if (editNameBtn) {
            editNameBtn.style.display = (auth.currentUser && uid === auth.currentUser.uid) ? 'flex' : 'none';
        }
       
        if(auth.currentUser && uid === auth.currentUser.uid) {
            controls.innerHTML = `<button class="profile-btn btn-gold" onclick="document.getElementById('avaInp').click()" data-key="edit">Edit</button>`;
            if (galleryUploadContainer) {
                galleryUploadContainer.style.marginTop = "0";
                controls.appendChild(galleryUploadContainer);
            }
            controls.innerHTML += `
                <button class="profile-btn btn-outline" onclick="showGiftsCollection('${uid}')" style="margin-left:5px;">
                    <i class="fas fa-gift"></i> Gifts
                </button>`;
            
            loadUserVideos(uid);
            if(typeof applyLanguage === "function") applyLanguage();
        } else {
            const isFollowing = user.followers && auth.currentUser && user.followers[auth.currentUser.uid];
            const isFriend = user.following && auth.currentUser && user.following[auth.currentUser.uid] && isFollowing;
            let canView = false;
            if(!user.privacy || user.privacy === 'public') canView = true;
            if(user.privacy === 'friends' && isFriend) canView = true;
            
            if(canView) {
                loadUserVideos(uid);
                if(isFollowing) {
                    controls.innerHTML = `
                    <button class="profile-btn btn-outline" onclick="unfollowUser('${uid}')" data-key="following_btn">Following</button>
                    <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>`;
                } else {
                    controls.innerHTML = `
                    <button class="profile-btn btn-gold" style="background:var(--gold); color:black;" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>
                    <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>`;
                }
                
                controls.innerHTML += `
                <button id="gifts-btn-${uid}" class="profile-btn btn-outline" onclick="showGiftsCollection('${uid}')" style="margin-left:5px; white-space: nowrap;">
                    <i class="fas fa-gift"></i> Gifts
                </button>`;

                db.ref(`received_gifts/${uid}`).once('value', snap => {
                    const count = snap.numChildren() || 0;
                    const giftsBtn = document.getElementById(`gifts-btn-${uid}`);
                    if (giftsBtn) {
                        giftsBtn.innerHTML = `<i class="fas fa-gift"></i> Gifts (${count})`;
                    }
                });
            } else {
                document.getElementById('profGrid').innerHTML = `<div class="private-lock-screen"><p data-key="private_profile">Private Profile</p></div>`;
                document.getElementById('profTabs').style.display = 'none';
                controls.innerHTML = `<button class="profile-btn btn-gold" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>`;
            }
            if(typeof applyLanguage === "function") applyLanguage();
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
        const trLang = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {following_btn: 'Following', follow: 'Follow'};
        Object.values(data).reverse().forEach(v => {
            const isFollowing = myFollowing[v.uid];
            const followBtn = isFollowing ? 
            `<button class="profile-btn btn-outline" style="padding: 5px 12px; font-size: 11px;">${trLang.following_btn}</button>` :
            `<button class="profile-btn btn-gold" style="padding: 5px 12px; font-size: 11px;" onclick="followFromVisitors('${v.uid}', '${v.name}', '${v.photo}')">${trLang.follow}</button>`;
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
    document.getElementById('editName').value = (currentUserData && currentUserData.name) || "";
    document.getElementById('editCity').value = (currentUserData && currentUserData.city) || "";
    document.getElementById('editAge').value = (currentUserData && currentUserData.age) || "";
    document.getElementById('editRelation').value = (currentUserData && currentUserData.relation) || "Single";
    document.getElementById('editPhone').value = (currentUserData && currentUserData.phone) || "";
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
    const trLang = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {full_name:'Name', location:'Location', age:'Age', relation:'Relation', phone:'Phone'};
    db.ref('users/' + uid).once('value', snap => {
        const u = snap.val();
        if(!u) return;
        content.innerHTML = `
        <div class="info-row"><i class="fas fa-user"></i><div><span class="info-val-label">${trLang.full_name}</span><span class="info-val-text">${u.name || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-map-marker-alt"></i><div><span class="info-val-label">${trLang.location}</span><span class="info-val-text">${u.city || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-birthday-cake"></i><div><span class="info-val-label">${trLang.age}</span><span class="info-val-text">${u.age || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-heart"></i><div><span class="info-val-label">${trLang.relation}</span><span class="info-val-text">${u.relation || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-phone"></i><div><span class="info-val-label">${trLang.phone}</span><span class="info-val-text">${u.phone || '-'}</span></div></div>`;
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
    if(!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    db.ref(`notifications/${myUid}`).on('value', snap => {
        const data = snap.val();
        const count = data ? Object.keys(data).length : 0;
        const badge = document.getElementById('reqCount');
        if(!badge) return;
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
    db.ref('posts').orderByChild('authorId').equalTo(uid).once('value', snap => {
        grid.innerHTML = ""; 
        const posts = snap.val();
        if(!posts) {
            const vCount = document.getElementById('statVidsCount');
            if(vCount) vCount.innerText = 0;
            return;
        }

        let vCount = 0;
        let videoList = [];
        const postEntries = Object.entries(posts).reverse();

        postEntries.forEach(([id, post]) => {
            if(post.media) {
                const video = post.media.find(m => m.type === 'video');
                if(video) {
                    videoList.push({ id, post, video });
                    vCount++;
                }
            }
        });

        const vCountEl = document.getElementById('statVidsCount');
        if(vCountEl) vCountEl.innerText = vCount;

        let currentlyShown = 0;

        function showNextSix() {
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
                        </div>`;
                
                const globalIndex = currentlyShown; 
                item.onclick = () => playFullVideo(video.url, id, globalIndex);
                
                grid.appendChild(item);
                currentlyShown++; 
            });

            const oldBtn = document.getElementById('loadMoreBtn');
            if(oldBtn) oldBtn.remove(); 

            if (currentlyShown < videoList.length) {
                const loadMoreBtn = document.createElement('div');
                loadMoreBtn.id = 'loadMoreBtn';
                loadMoreBtn.innerHTML = 'მეტის ნახვა <i class="fas fa-chevron-down" style="margin-left:5px;"></i>';
                loadMoreBtn.style = "grid-column: 1 / -1; text-align: center; padding: 15px; color: #aaa; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 15px 0; cursor: pointer; font-size: 14px;";
                loadMoreBtn.onclick = () => showNextSix(); 
                grid.appendChild(loadMoreBtn);
            }
        }
        showNextSix();
    });
}

function playFullVideo(url, postId, currentIndex) {
    killVideo();
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');

    vid.setAttribute('poster', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    vid.muted = false; 
    vid.playsInline = true;
    vid.src = url; 
    overlay.style.display = 'block'; 
    
    vid.play().catch(error => {
        vid.muted = true;
        vid.play();
    });

    window.currentFullVideoId = postId; 
    window.currentVideoIndex = currentIndex; 

    let startY = 0;
    vid.ontouchstart = (e) => { startY = e.touches[0].clientY; };
    vid.ontouchend = (e) => {
        let endY = e.changedTouches[0].clientY;
        let diff = startY - endY;

        if (Math.abs(diff) > 50) {
            const allItems = Array.from(document.querySelectorAll('#profGrid .grid-item'));
            if (window.currentVideoIndex !== undefined) {
                if (diff > 0 && window.currentVideoIndex < allItems.length - 1) {
                    allItems[window.currentVideoIndex + 1].click();
                } else if (diff < 0 && window.currentVideoIndex > 0) {
                    allItems[window.currentVideoIndex - 1].click();
                }
            }
        }
    };

    if (postId) {
        db.ref(`posts/${postId}/views`).transaction(c => (c || 0) + 1);

        db.ref(`posts/${postId}`).once('value', snap => {
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
            const myUid = auth.currentUser ? auth.currentUser.uid : null;
            const likesKeys = data.likedBy ? Object.keys(data.likedBy) : [];
            
            if (lElem) lElem.innerText = likesKeys.length;
            if (lIcon && myUid) lIcon.style.color = likesKeys.includes(myUid) ? '#ff4d4d' : 'white';

            const sIcon = document.getElementById('fullSaveIcon');
            if (sIcon && myUid) sIcon.style.color = (data.savedBy && data.savedBy[myUid]) ? 'var(--gold)' : 'white';

            const giftBtn = document.querySelector('#fullVideoOverlay .side-action-item[onclick*="openGiftPanel"]');
            if (giftBtn) {
                giftBtn.onclick = () => openGiftPanel(window.currentFullVideoId, window.currentFullVideoAuthorId);
            }
          
            const moreBtn = document.querySelector('#fullVideoOverlay .more-btn'); 
            if (moreBtn && myUid) {
                if (data.authorId === myUid) {
                    moreBtn.style.display = 'flex'; 
                    moreBtn.onclick = () => toggleMoreMenu(window.currentFullVideoId);
                } else {
                    moreBtn.style.display = 'none'; 
                }
            }
        });

        db.ref(`comments/${postId}`).once('value', cSnap => {
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
                if(typeof showCustomAlert === "function") showCustomAlert("მოგესალმებით", "რეგისტრაცია წარმატებულია!");
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
            if(typeof showCustomAlert === "function") showCustomAlert("მოგესალმებით", "წარმატებით შეხვედით სისტემაში!");
        }).catch(err => {
            let msg = "ავტორიზაცია ვერ მოხერხდა";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = "ელფოსტა ან პაროლი არასწორია";
            }
            showAuthError(msg);
        });
    }
}

async function startTokenUpload() {
    if (!canAfford(5)) return;

    const fileInput = document.getElementById('videoInput');
    const file = fileInput.files[0];
    if (!file) return alert("აირჩიეთ ვიდეო");

    const progressModal = document.getElementById('uploadProgressModal');
    const statusTitle = document.getElementById('uploadStatusTitle');
    const statusText = document.getElementById('uploadStatusText');
    const progressBtn = document.getElementById('uploadProgressBtn');
    const percentText = document.getElementById('uploadPercent');

    if (progressModal) {
        progressModal.style.display = 'flex';
        statusTitle.innerText = "Uploading Post!";
        statusText.innerText = "Your video is processing.";
        if (percentText) percentText.innerText = "0%";
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
        const storageRef = firebase.storage().ref();
        const videoName = Date.now() + "_" + file.name;
        const videoRef = storageRef.child('videos/' + videoName);
        const uploadTask = videoRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (percentText) percentText.innerText = progress + "%";
                if (progressBtn) progressBtn.innerText = "Uploading " + progress + "%";
            }, 
            (error) => {
                console.error("ატვირთვის შეცდომა:", error);
                if (progressModal) progressModal.style.display = 'none';
                alert("შეცდომა: " + error.message);
            }, 
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                await db.ref('posts').push({
                    authorId: auth.currentUser.uid,
                    authorName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
                    authorPhoto: typeof myPhoto !== 'undefined' ? myPhoto : "",
                    text: document.getElementById('videoDesc').value || "",
                    media: [{ url: downloadURL, type: 'video' }],
                    timestamp: Date.now()
                });

                spendAkho(5, 'Video Upload');

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
 
let lastVisibleTimestamp = null; 
let isFeedLoading = false;
const FEED_LIMIT = 15;

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

// 🚀 ოპტიმიზირებული IntersectionObserver (გლობალური ეგზემპლარი)
const feedVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;

        const postId = entry.target.id.replace('card-', '');

        if (entry.isIntersecting) {
            video.style.opacity = "1";
            video.play().catch(e => {}); 
            video.muted = false;

            if (postId && postId !== "") {
                db.ref(`posts/${postId}/views`).transaction(currentViews => {
                    return (currentViews || 0) + 1;
                });
            }
        } else {
            video.pause();
            video.muted = true;
            video.style.opacity = "0.5";
            video.preload = "metadata";
        }
    });
}, { threshold: 0.5 });

function renderTokenFeed() {
    const liveUI = document.getElementById('liveUI');
    if (liveUI && liveUI.style.display === 'flex') return;
    if (isFeedLoading) return;
    
    isFeedLoading = true;
    const feed = document.getElementById('main-feed');
    if(!feed) return;

    let query = db.ref('posts').orderByChild('timestamp');
    if (lastVisibleTimestamp) {
        query = query.endAt(lastVisibleTimestamp - 1);
    }

    query.limitToLast(FEED_LIMIT).once('value', snap => {
        const data = snap.val(); 
        isFeedLoading = false;
        if (!data) return;

        let rawEntries = Object.entries(data);
        lastVisibleTimestamp = rawEntries[0][1].timestamp;

        let postEntries = rawEntries.sort((a, b) => {
            const now = Date.now();
            const aIsPromoted = a[1].isPromoted && a[1].promoteExpires > now;
            const bIsPromoted = b[1].isPromoted && b[1].promoteExpires > now;

            if (aIsPromoted && !bIsPromoted) return -1;
            if (!aIsPromoted && bIsPromoted) return 1;
            
            if (aIsPromoted && bIsPromoted) {
                return (b[1].promoteWeight || 0) - (a[1].promoteWeight || 0);
            }
            return b[1].timestamp - a[1].timestamp;
        });
      
        lastVisibleTimestamp = postEntries[postEntries.length - 1][1].timestamp;

        postEntries.forEach(([id, post]) => {
            if (!post || !post.media || !post.media.some(m => m.type === 'video') || document.getElementById(`card-${id}`)) return;

            const videoUrl = post.media.find(m => m.type === 'video').url;
            const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
            const shareCount = post.shares || 0;
            const saveCount = post.saves || 0;
            
            const myUid = auth.currentUser ? auth.currentUser.uid : null;
            const isLikedByMe = myUid && post.likedBy && post.likedBy[myUid];
            const isSavedByMe = myUid && post.savedBy && post.savedBy[myUid];      
            
            const card = document.createElement('div');
            card.className = 'video-card';
            card.id = `card-${id}`;
            
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
    <div id="ava-wrapper-${id}" style="position:relative; width:48px; height:48px; border-radius:50%;">
        <img id="ava-${id}" src="token-avatar.png" class="author-mini-ava" onclick="openProfile('${post.authorId}')" style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:2px solid #000; display:block;">
        <div id="mini-status-${id}" style="position:absolute; bottom:0; right:0; width:12px; height:12px; background:var(--green); border-radius:50%; border:2px solid #000; display:none; z-index:10;"></div>
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
                  ${myUid && post.authorId === myUid ? `
                    <div class="action-item" onclick="deleteMyVideo('${id}')" style="margin-top: 5px;">
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
            feedVideoObserver.observe(card); // 🚀 ერთჯერადი გლობალური ობზერვერი
            cleanupOldVideos();

            db.ref(`comments/${id}`).once('value', cSnap => {
                const count = cSnap.val() ? Object.keys(cSnap.val()).length : 0;
                const el = document.getElementById(`comm-count-${id}`);
                if(el) el.innerText = count;
            });

            db.ref(`users/${post.authorId}`).once('value', uSnap => {
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

            const liveChannelName = "live_" + post.authorId;
            db.ref(`lives_active/${liveChannelName}`).on('value', lSnap => {
                const wrapper = document.getElementById(`ava-wrapper-${id}`);
                const ava = document.getElementById(`ava-${id}`);
                
                if(lSnap.exists() && wrapper) {
                    wrapper.classList.add('is-live-now');
                    if(ava && typeof joinLive === 'function') ava.onclick = () => joinLive(liveChannelName);
                } else if(wrapper) {
                    wrapper.classList.remove('is-live-now');
                    if(ava) ava.onclick = () => openProfile(post.authorId);
                }
            });
        });
    });
}

// 🚀 Debounced Infinite Scroll Listener
let scrollTimeout = null;
window.addEventListener('scroll', function() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        const feed = document.getElementById('main-feed');
        if (!feed || isFeedLoading) return;

        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 800) {
            renderTokenFeed();
        }
    }, 200);
}, { passive: true });

async function deleteMyVideo(postId) {
    if (!confirm("ნამდვილად გსურთ ვიდეოს სამუდამოდ წაშლა?")) return;

    try {
        const snap = await db.ref(`posts/${postId}`).once('value');
        const post = snap.val();

        if (!post) {
            console.error("პოსტი ვერ მოიძებნა!");
            return;
        }

        const videoMedia = post.media ? post.media.find(m => m.type === 'video') : null;
        if (videoMedia && videoMedia.url) {
            try {
                const storageRef = firebase.storage().refFromURL(videoMedia.url);
                await storageRef.delete();
                console.log("ფაილი წაიშალა Storage-დან ✅");
            } catch (storageErr) {
                console.warn("ფაილი Storage-ში უკვე აღარ არსებობს:", storageErr);
            }
        }

        await db.ref(`posts/${postId}`).remove();
        await db.ref(`comments/${postId}`).remove();

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

window.openGiftPanel = function(postId, authorId) {
    if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
    const panel = document.createElement('div');
    panel.id = "dynamicGiftPanel";
    panel.style = "position:fixed; bottom:0; left:0; width:100%; background:rgba(10,10,10,0.98); border-top:2px solid #d4af37; border-radius:20px 20px 0 0; padding:25px 20px; z-index:200005; backdrop-filter:blur(15px); color:white; font-family:sans-serif;";
    
    const gifts = [
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Begemot.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava1.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yvavili.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Egvipte.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Guli.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Saati.gif",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Sunduk.png",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Gogo3.png",
        "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Romeo.gif"
    ];

    let giftItemsHTML = gifts.map((g, index) => {
        const cost = (index + 1) * 5;
        return `<div onclick="window.processGift('${authorId}', ${cost}, '${g}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;"><img src="${g}" style="width:60px; height:60px; object-fit:contain;"><div style="color:#d4af37; font-weight:bold; font-size:12px;">${cost} AKHO</div></div>`;
    }).join('');

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <b style="color:#d4af37;">აირჩიე საჩუქარი</b>
            <i class="fas fa-times" onclick="document.getElementById('dynamicGiftPanel').remove()" style="cursor:pointer; font-size:20px; color:gray;"></i>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-height:400px; overflow-y:auto;">
            ${giftItemsHTML}
        </div>`;
    document.body.appendChild(panel);
};

window.processGift = function(targetUid, cost, giftUrl) {
    const user = firebase.auth().currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (user.uid === targetUid) return alert("საკუთარ თავს ვერ აჩუქებთ!");
    
    db.ref(`users/${user.uid}`).once('value', snap => {
        const myData = snap.val();
        if (!myData) return alert("მონაცემები ვერ მოიძებნა!");

        const myBalance = myData.akho || 0;
        if (myBalance < cost) return alert("არ გაქვთ საკმარისი AKHO! ❌");

        db.ref(`users/${user.uid}/akho`).set(myBalance - cost);
        db.ref(`users/${targetUid}/gift_balance`).transaction(c => (c || 0) + cost);

        db.ref(`received_gifts/${targetUid}`).push({
            giftUrl: giftUrl,
            price: cost,
            fromName: myData.name || "მეგობარი", 
            fromPhoto: myData.photo || "",      
            timestamp: Date.now()
        });

        if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
        
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

    db.ref(`users/${user.uid}/gift_balance`).set(0);
    db.ref(`users/${user.uid}/akho`).transaction(c => (c || 0) + amount);
    db.ref(`received_gifts/${user.uid}`).remove();

    alert("AKHO გადაიტანილა და კოლექცია გასუფთავდა! ✅");

    const modal = document.getElementById('giftWalletModal');
    if(modal) {
        modal.remove();
    } else {
        const modals = document.querySelectorAll('div[style*="z-index: 2000020"]');
        modals.forEach(m => m.remove());
    }
};

window.buyEuroWithGift = function(amount) {
    if (!amount || amount < 100) return alert("მინიმუმ 100 AKHO საჭიროა! 💶");

    const euroValue = (amount / 100).toFixed(2);
    const confirmExchange = confirm(`თქვენი ${amount} AKHO გადაიცვლება ${euroValue} ევროდ.\n\nგსურთ გაგრძელება?`);
    
    if (confirmExchange) {
        const user = firebase.auth().currentUser;
        db.ref(`users/${user.uid}/gift_balance`).set(0);
        db.ref(`users/${user.uid}/euro_balance`).transaction(c => (c || 0) + parseFloat(euroValue));
        
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
                <button onclick="if(typeof sendToFriendFromGift==='function')sendToFriendFromGift()" style="flex: 1; padding: 12px 5px; background: #e0e0e0; border: none; border-radius: 10px; color: #333; font-weight: bold; font-size: 10px; cursor: pointer;">მეგობარს</button>
            </div>
        </div>

        <div id="giftsContainer" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; overflow-y:auto; padding-bottom:50px;">
            <p style="text-align:center; grid-column:1/-1;">იტვირთება...</p>
        </div>`;
    document.body.appendChild(modal);

    const container = document.getElementById('giftsContainer');
    if (isMyProfile) {
        document.getElementById('giftWalletSection').style.display = "block";
        db.ref(`users/${uid}/gift_balance`).on('value', snap => {
            const bal = snap.val() || 0;
            document.getElementById('giftBalanceDisplay').innerText = `${bal} AKHO`;
            document.getElementById('transferBtn').onclick = () => window.transferToMainBalance(bal);
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

window.showFinancialWallet = function() {
    const user = firebase.auth().currentUser;
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    const modal = document.createElement('div');
    modal.id = "financialWalletModal";
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000030; display:flex; flex-direction:column; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:white;";
    
    db.ref(`users/${user.uid}/euro_balance`).on('value', snap => {
        const euroBal = snap.val() || 0;
        const canCashOut = euroBal >= 50;

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
                    <input type="text" id="payoutIbanField" placeholder="IBAN / PayPal" ${!canCashOut ? 'disabled' : ''} style="width:100%; padding:12px; border-radius:8px; border:1px solid #333; background:#121212; color:white; outline:none; margin-bottom:15px;">
                    <button onclick="${canCashOut ? `window.processWithdrawRequest(${euroBal})` : ''}" style="width:100%; padding:12px; border:none; border-radius:8px; color:${!canCashOut ? '#666' : 'black'}; background:${!canCashOut ? '#333' : '#2ecc71'}; font-weight:bold; cursor:${!canCashOut ? 'not-allowed' : 'pointer'};">
                        გატანის მოთხოვნა
                    </button>
                    <div style="margin-top:10px; font-size:12px; color:${canCashOut ? '#2ecc71' : '#ff4d4d'};">
                        ${canCashOut ? '● გატანა ხელმისაწვდომია!' : '● ბალანსი 50 ევროზე ნაკლებია!'}
                    </div>
                </div>
            </div>`;
    });
    document.body.appendChild(modal);
};

window.showEuroHistory = function() {
    const user = firebase.auth().currentUser;
    if(!user) return;
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
        </div>`;
    document.body.appendChild(historyModal);

    db.ref(`euro_history/${user.uid}`).orderByChild('timestamp').once('value', snap => {
        const list = document.getElementById('euroHistoryList');
        if(!list) return;
        list.innerHTML = "";
        const data = snap.val();
        
        if(!data) {
            list.innerHTML = "<div style='text-align:center; margin-top:50px;'><i class='fas fa-receipt' style='font-size:40px; color:#333;'></i><p style='color:gray; margin-top:10px;'>ისტორია ცარიელია</p></div>";
            return;
        }

        Object.values(data).reverse().forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('ka-GE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
            const isWithdraw = item.type === "გატანა";
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
                </div>`;
        });
    });
};

window.showRechargeAKHO = function() {
    const modal = document.createElement('div');
    modal.id = "rechargeAkhoModal";
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000050; display:flex; flex-direction:column; color:white; font-family:sans-serif;";
    
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
        </div>`;

    document.body.appendChild(modal);

    const user = firebase.auth().currentUser;
    if(user) {
        db.ref(`users/${user.uid}/akho`).on('value', snap => {
            const el = document.getElementById('currentCoinBalance');
            if(el) el.innerText = snap.val() || 0;
        });
    }
};

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

window.confirmPurchase = function() {
    if (selectedAkhoAmount === 0) return alert("გთხოვთ აირჩიოთ პაკეტი!");
    alert("გადახდის სისტემა მზადების პროცესშია. არჩეულია: " + selectedAkhoAmount + " AKHO");
};

function openWithdrawHistory() {
    document.getElementById('withdrawHistoryUI').style.display = 'flex';
    stopMainFeedVideos();
    if(typeof loadMyWithdrawalHistory === "function") loadMyWithdrawalHistory();
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
            if(typeof showFloatingLike === "function") showFloatingLike(postId, myPhoto);
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
                alert("ფოტოს ატვირთვა ვერ მოხერხდა");
                btn.disabled = false; btn.innerText = "გამოქვეყნება";
                return;
            }
        }

        await db.ref('community_posts').push({
            authorId: auth.currentUser.uid,
            authorName: myName,
            authorPhoto: myPhoto,
            text: text,
            image: finalUrl,
            timestamp: Date.now()
        });

        if(typeof sendOneSignalPush === 'function') sendOneSignalPush(myName, text || "ახალი ფოტო გამოქვეყნდა!");
        spendAkho(2, 'Community Post');
        document.getElementById('wallPostText').value = "";
        cancelWallImg();
        alert("პოსტი გამოქვეყნდა!");
    } catch (err) {
        alert("კავშირის შეცდომა!");
    } finally {
        btn.disabled = false; btn.innerText = "გამოქვეყნება";
    }
}

function loadCommunityPosts() {
    const box = document.getElementById('communityPostsList');
    if (!box) return;
    const myUid = auth.currentUser ? auth.currentUser.uid : null;

    db.ref('community_posts').orderByChild('timestamp').once('value', snap => {
        box.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).reverse().forEach(([id, post]) => {
            const isLiked = (myUid && post.likes && post.likes[myUid]);
            const likeCount = post.likes ? Object.keys(post.likes).length : 0;
            const isTagged = (myUid && post.taggedBy && post.taggedBy[myUid]);
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
                        <span style="font-size:14px; font-weight:bold;">${isTagged ? 'მონიშნულია' : 'მონიშნვა'}</span>
                    </div>
                </div>
                ${post.text ? `<p style="font-size:15px; margin:10px 0; color:#E4E6EB; line-height:1.4;">${post.text}</p>` : ''}
                ${post.image ? `<img src="${post.image}" style="width:100%; border-radius:10px; margin-bottom:10px; cursor:pointer;" onclick="if(typeof previewImage==='function')previewImage('${post.image}')">` : ''}
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

            db.ref('comments/' + id).once('value', cSnap => {
                const count = cSnap.numChildren();
                const cElem = document.getElementById('comm-count-' + id);
                if (cElem) cElem.innerText = count;
            });
        });
    });
}

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

window.toggleWallLike = function(postId, ownerUid) {
    if (!auth.currentUser) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    const myUid = auth.currentUser.uid;
    const likeRef = db.ref('community_posts/' + postId + '/likes/' + myUid);

    likeRef.once('value').then(snap => {
        if (snap.exists()) {
            likeRef.remove().then(() => loadCommunityPosts());
        } else {
            likeRef.set(true).then(() => {
                if (ownerUid && ownerUid !== myUid) {
                    db.ref('notifications/' + ownerUid).push({
                        text: myName + "-მა თქვენი პოსტი დააგულა ❤️",
                        fromPhoto: myPhoto || '',
                        fromUid: myUid,
                        timestamp: Date.now(),
                        type: 'like'
                    });
                }
                loadCommunityPosts();
            });
        }
    });
};

window.deleteWallPost = function(postId) {
    if (confirm("ნამდვილად გსურთ პოსტის წაშლა?")) {
        db.ref('community_posts/' + postId).remove().then(() => loadCommunityPosts());
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
    const targetId = window.currentChatId; 
    if (!targetId) return alert("ჯერ აირჩიეთ ჩატი!");
    if (!canAfford(0.5)) return; 

    const myUid = auth.currentUser.uid;
    const chatId = getChatId(myUid, targetId);
    const fileName = `voice_${Date.now()}.mp3`;

    try {
        const storageRef = firebase.storage().ref(`chat_audio/${chatId}/${fileName}`);
        const snapshot = await storageRef.put(blob);
        const downloadURL = await snapshot.ref.getDownloadURL();

        if (downloadURL) {
            db.ref(`messages/${chatId}`).push({ 
                senderId: myUid, 
                audio: downloadURL, 
                ts: Date.now(),
                seen: false
            }).then(() => {
                spendAkho(0.5, 'Voice Message');
            });

            if (typeof sendPushToUser === "function") {
                sendPushToUser(targetId, myName, "🎤 Voice Message");
            }
        }
    } catch (err) { 
        alert("ატვირთვის შეცდომა"); 
    }
}       

function toggleMoreMenu(postId) {
    const panel = document.getElementById('more-menu-panel');
    if(panel) panel.classList.toggle('active');
    if (postId) window.currentSelectedPost = postId;
}

function downloadVideo(postId) {
    alert("ვიდეოს გადმოწერა დაიწყო პოსტისთვის: " + postId);
    toggleMoreMenu();
}

// 🚀 ოპტიმიზირებული Global Unread Counter
function startGlobalUnreadCounter() {
    if(!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    const chatBadge = document.getElementById('chatCountBadge');

    db.ref(`users/${myUid}/last_read`).on('value', readSnap => {
        const lastReadData = readSnap.val() || {};
        let totalUnread = 0;

        db.ref('messages').once('value', snap => {
            const allChats = snap.val();
            if (!allChats) return;

            Object.keys(allChats).forEach(chatId => {
                if (chatId.includes(myUid)) {
                    const lastRead = lastReadData[chatId] || 0;
                    const msgs = Object.values(allChats[chatId]);
                    const lastMsg = msgs[msgs.length - 1];

                    if (lastMsg && lastMsg.senderId !== myUid && lastMsg.ts > lastRead) {
                        totalUnread++;
                    }
                }
            });

            if (chatBadge) {
                if (totalUnread > 0) {
                    chatBadge.innerText = totalUnread;
                    chatBadge.style.display = 'flex';
                } else {
                    chatBadge.style.display = 'none';
                }
            }
        });
    });
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.p-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const taggedPostsList = document.getElementById('userTaggedPostsList');
    if (taggedPostsList) taggedPostsList.style.display = 'none';

    const profGrid = document.getElementById('profGrid');
    const userPhotosGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid');

    profGrid.innerHTML = ""; 
    userPhotosGrid.innerHTML = "";
    
    profGrid.style.display = 'none';
    userPhotosGrid.style.display = 'none';
    noMsg.style.display = 'none';

    if (tabName === 'info' || tabName === 'reels') {
        profGrid.style.display = 'grid';
        loadUserVideos(viewUid); 
    } 
    else if (tabName === 'photos') {
        userPhotosGrid.style.display = 'grid';
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
            loadMyTaggedWallPosts(viewUid);
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
            if(post.savedBy && post.savedBy[viewUid]) {
                const video = post.media ? post.media.find(m => m.type === 'video') : null;
                if(video) {
                    savedCount++;
                    const item = document.createElement('div');
                    item.className = 'grid-item';
                    item.innerHTML = `
                        <video src="${video.url}" muted></video>
                        <i class="fas fa-bookmark" style="position:absolute; top:8px; right:8px; color:var(--gold); font-size:12px; filter: drop-shadow(0 0 2px black);"></i>`;
                    item.onclick = () => playFullVideo(video.url, id, 0);
                    grid.appendChild(item);
                }
            }
        });

        if(savedCount === 0) {
            grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>შენახული ვიდეოები არ არის</p>";
        }
    });
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
    stopCamera();
}

function stopCamera() {
    const activeStream = window.videoStream;
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        window.videoStream = null;
    }

    const video = document.getElementById('cameraStream');
    const placeholder = document.getElementById('placeholderText');
    const recordInner = document.getElementById('recordInner');
    
    if (video) {
        video.pause();
        video.srcObject = null;
        video.style.display = 'none';
        video.load(); 
    }

    if (placeholder) placeholder.style.display = 'block';
    
    if (recordInner) {
        recordInner.style.borderRadius = "50%";
        recordInner.style.background = "#ff4d4d";
        recordInner.style.transform = "scale(1)";
        recordInner.style.boxShadow = "none";
    }
}

function killVideo() {
    const v = document.getElementById('fullVideoTag');
    if (v) v.pause();
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
}

function closeFullVideo() {
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');
    const sideMenu = document.querySelector('#fullVideoOverlay .video-side-menu');

    if (vid) vid.pause(); 
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('hide-menu-now'); 
    }
    if (sideMenu) {
        sideMenu.style.opacity = "1";
        sideMenu.style.visibility = "visible";
        sideMenu.style.pointerEvents = "auto";
    }
}

function askInitialPermissions() {
    if (localStorage.getItem('initial_permissions_asked')) return;
    try {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
        localStorage.setItem('initial_permissions_asked', 'true');
    } catch (err) {
        console.warn(err);
    }
}

function startWallNotificationListener() {
    if(!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    let isInitialLoad = true;

    db.ref('community_posts').orderByChild('timestamp').limitToLast(1).on('child_added', snap => {
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }
        const post = snap.val();
        if (post && post.authorId !== myUid) {
            let badge = document.getElementById('newPostsBadge');
            if (badge) {
                let currentVal = parseInt(badge.innerText) || 0;
                badge.innerText = currentVal + 1;
                badge.style.display = 'inline-block';
            }
        }
    });
}

function monitorMessageRequests() {
    const myId = auth.currentUser ? auth.currentUser.uid : null;
    if (!myId) return;

    db.ref(`message_requests/${myId}`).on('value', snapshot => {
        const badge = document.getElementById('msgReqBadge');
        if (badge) {
            if (snapshot.exists()) {
                badge.innerText = snapshot.numChildren();
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}
