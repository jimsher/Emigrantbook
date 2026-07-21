// Stripe & Global variables
const stripe = Stripe('pk_live_51TCrgOK0YcbjyHRbMu9SzwKtqhsqx4FQC6ZJpta54mxfTIuwWVxmLjwh3TZ9TnK8YAtQp7hk4VU65XD45ZBQSt2Z00SXSc5ir9');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered! ✅'))
            .catch(err => console.log('SW Registration Failed ❌', err));
    });
}

let audioCtx, audioSource, audioDest;
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
    const user = window.auth.currentUser;
    if (!user) return;
    const { ref, onValue, set, onDisconnect, serverTimestamp } = window.fbDb;
    
    const onlineRef = ref(window.db, `.info/connected`);
    const userPresenceRef = ref(window.db, `users/${user.uid}/presence`);
    
    onValue(onlineRef, snap => {
        if (snap.val() === false) return;
        onDisconnect(userPresenceRef).set(serverTimestamp()).then(() => {
            set(userPresenceRef, 'online');
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
    const user = window.auth.currentUser;
    if (user) window.fbDb.update(window.fbDb.ref(window.db, 'users/' + user.uid), { hasSeenRules: true });
    document.getElementById('onboardingUI').style.display = 'none';
}

// Auth State Observer
window.fbAuth.onAuthStateChanged(window.auth, user => {
    if (typeof applyLanguage === "function") applyLanguage();
    
    if (user) {
        setTimeout(() => {
            if (typeof askInitialPermissions === "function") askInitialPermissions(); 
        }, 1500);

        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const packAmount = urlParams.get('pack');

        if (sessionId && packAmount) {
            const amountToAdd = parseFloat(packAmount);
            const { ref, get, set, runTransaction } = window.fbDb;
            
            get(ref(window.db, `payments_processed/${sessionId}`)).then(snap => {
                if (!snap.exists()) {
                    runTransaction(ref(window.db, `users/${user.uid}/akho`), current => {
                        return (current || 0) + amountToAdd;
                    }).then(() => {
                        set(ref(window.db, `payments_processed/${sessionId}`), {
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
            window.fbDb.set(window.fbDb.ref(window.db, 'users/' + user.uid + '/test'), "მუშაობს");
            if (typeof saveMessagingToken === "function") saveMessagingToken(user);
        }, 2000);

        window.fbDb.onValue(window.fbDb.ref(window.db, `users/${user.uid}/euro_balance`), snap => {
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
        if (typeof startGlobalUnreadCounter === "function") startGlobalUnreadCounter();
        if (typeof listenForIncomingCalls === "function") listenForIncomingCalls(user);
        if (typeof startWallNotificationListener === "function") startWallNotificationListener();

        let currentIncomingCall = null;
        window.fbDb.onValue(window.fbDb.ref(window.db, `video_calls/${user.uid}`), snap => {
            const call = snap.val();
            if (call && call.status === 'calling' && (Date.now() - call.ts < 60000)) {
                currentIncomingCall = call; 
                document.getElementById('callerNameDisplay').innerText = call.callerName;
                document.getElementById('callerAva').src = call.callerPhoto || 'token-avatar.png';
                const modal = document.getElementById('incomingCallModal');
                modal.style.display = 'flex';
            } else {
                document.getElementById('incomingCallModal').style.display = 'none';
            }
        });

        document.getElementById('authUI').style.display = 'none';
        
        window.fbDb.onValue(window.fbDb.ref(window.db, 'users/' + user.uid), snap => {
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

function acceptCall() {
    if (currentIncomingCall) {
        window.currentChatId = currentIncomingCall.callerUid; 
        window.fbDb.update(window.fbDb.ref(window.db, `video_calls/${window.auth.currentUser.uid}`), { status: 'accepted' });
        document.getElementById('incomingCallModal').style.display = 'none';
        document.getElementById('videoCallUI').style.display = 'flex';
        if (typeof startVideoCall === "function") {
            startVideoCall();
        }
    }
}

function declineCall() {
    window.fbDb.remove(window.fbDb.ref(window.db, `video_calls/${window.auth.currentUser.uid}`));
    document.getElementById('incomingCallModal').style.display = 'none';
}

function updateCashoutUI() {
    const status = document.getElementById('cashoutStatus');
    const form = document.getElementById('cashoutForm');
    const currentLang = window.currentLang || 'ka';
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
    const currentLang = window.currentLang || 'ka';
    
    if(confirm(`Confirm ${(myAkho/10).toFixed(2)} €?`)) {
        const reqRef = window.fbDb.push(window.fbDb.ref(window.db, 'withdrawal_requests'));
        window.fbDb.set(reqRef, {
            uid: window.auth.currentUser.uid,
            name: myName,
            amountEur: (myAkho/10).toFixed(2),
            amountAkho: myAkho,
            iban: iban,
            status: 'pending',
            ts: Date.now()
        }).then(() => {
            window.fbDb.update(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}`), { akho: 0 });
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
    if (typeof renderAdminOrders === "function") renderAdminOrders();
}

function adminSearchUsers(q) {
    const list = document.getElementById('admUserList');
    if(!q || q.length < 2) { list.innerHTML = ""; return; }
    
    window.fbDb.get(window.fbDb.ref(window.db, 'users')).then(snap => {
        list.innerHTML = "";
        const data = snap.val();
        if(!data) return;
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
    const { ref, push, update, remove, runTransaction } = window.fbDb;
    
    if(type === 'warning') {
        const msg = prompt("Warning message:");
        if(msg) push(ref(window.db, `notifications/${currentAdmTarget}`), { text: "⚠️ Admin: " + msg, ts: Date.now(), fromPhoto: "https://emigrantbook.com/1000084015-removebg-preview.png" });
    } else if(type === 'ban') {
        if(confirm("Ban user?")) update(ref(window.db, `users/${currentAdmTarget}`), { isBanned: true });
    } else if(type === 'unban') {
        if(confirm("Unban user?")) update(ref(window.db, `users/${currentAdmTarget}`), { isBanned: false });
    } else if(type === 'addAkho') {
        const amt = prompt("AKHO amount:");
        if(amt) runTransaction(ref(window.db, `users/${currentAdmTarget}/akho`), c => (c || 0) + parseFloat(amt));
    } else if(type === 'resetAkho') {
        if(confirm("Reset balance?")) update(ref(window.db, `users/${currentAdmTarget}`), { akho: 0 });
    } else if(type === 'delete') {
        if(confirm("Delete account permanently?")) {
            remove(ref(window.db, `users/${currentAdmTarget}`));
            document.getElementById('admUserActions').style.display = 'none';
        }
    }
    alert("Done!");
}

function loadAdminRequests() {
    const list = document.getElementById('adminReqList');
    window.fbDb.onValue(window.fbDb.ref(window.db, 'withdrawal_requests'), snap => {
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
        window.fbDb.update(window.fbDb.ref(window.db, `withdrawal_requests/${id}`), { status: 'approved' });
        alert("Approved!");
    }
}

function declineReq(id, uid, amount) {
    if(confirm("Decline? Coins will return.")) {
        window.fbDb.runTransaction(window.fbDb.ref(window.db, `users/${uid}/akho`), current => (current || 0) + amount);
        window.fbDb.update(window.fbDb.ref(window.db, `withdrawal_requests/${id}`), { status: 'declined' });
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
    const user = window.auth.currentUser;
    if (!user) return alert("Please Login");
    const finalUrl = url + "?client_reference_id=" + user.uid;
    document.getElementById('walletMain').style.display = 'none';
    document.getElementById('paymentPending').style.display = 'block';
    window.location.href = finalUrl; 
}

function canAfford(cost) {
    const currentLang = window.currentLang || 'ka';
    if (myAkho >= cost) return true;
    alert(currentLang === 'ka' ? "შეავსეთ ბალანსი!" : "Top up your balance!");
    openWalletUI();
    return false;
}

function spendAkho(cost, reason = 'Action') {
    const newBalance = myAkho - cost;
    window.fbDb.update(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}`), { akho: newBalance });
    addToLog(reason, -cost);
}

function earnAkho(targetUid, amount, reason = 'Impact Reward') {
    window.fbDb.runTransaction(window.fbDb.ref(window.db, `users/${targetUid}/akho`), current => (current || 0) + amount);
    window.fbDb.push(window.fbDb.ref(window.db, `activity_logs/${targetUid}`), {
        type: reason,
        amt: amount,
        ts: Date.now()
    });
}

function addToLog(type, amt) {
    window.fbDb.push(window.fbDb.ref(window.db, `activity_logs/${window.auth.currentUser.uid}`), {
        type: type,
        amt: amt,
        ts: Date.now()
    });
}

function loadActivityLog() {
    const box = document.getElementById('logContent');
    const { ref, query, limitToLast, onValue } = window.fbDb;
    
    onValue(limitToLast(ref(window.db, `activity_logs/${window.auth.currentUser.uid}`), 15), snap => {
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
    const myUid = window.auth.currentUser.uid;
    const postOwnerId = window.currentPostOwnerId;

    window.isGalleryMode = isGallery;
    activePostId = postId;

    const commentPath = isGallery ? `gallery_comments/${postId}` : `comments/${postId}`;

    window.fbDb.get(window.fbDb.ref(window.db, commentPath)).then(snap => {
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
        window.fbDb.remove(window.fbDb.ref(window.db, `comments/${postId}/${commentId}`)).then(() => loadComments(postId));
    }
};

window.deleteReply = function(postId, commentId, replyId) {
    if (confirm("ნამდვილად გსურთ პასუხის წაშლა?")) {
        window.fbDb.remove(window.fbDb.ref(window.db, `comments/${postId}/${commentId}/replies/${replyId}`)).then(() => loadComments(postId));
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
        window.fbDb.push(window.fbDb.ref(window.db, `${commentPath}/${activeReplyTo}/replies`), {
            authorId: window.auth.currentUser.uid, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
        }).then(() => loadComments(activePostId, window.isGalleryMode));
    } else {
        window.fbDb.push(window.fbDb.ref(window.db, commentPath), {
            authorId: window.auth.currentUser.uid, 
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
    const targetRef = window.fbDb.ref(window.db, `${commentPath}/${commId}/likes/${window.auth.currentUser.uid}`);
    
    window.fbDb.get(targetRef).then(snap => {
        if(snap.exists()) {
            window.fbDb.remove(targetRef).then(() => loadComments(activePostId, window.isGalleryMode));
        } else {
            window.fbDb.set(targetRef, true).then(() => {
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
    if (!window.auth.currentUser) return;

    window.fbDb.get(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}/following`)).then(async snap => {
        if (!list) return;
        const followers = snap.val();
        if(!followers) { 
            list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No active chats yet.</p>";
            return; 
        }

        let chatArray = [];
        const promises = Object.entries(followers).map(async ([uid, data]) => {
            const chatId = getChatId(window.auth.currentUser.uid, uid);
            const mSnap = await window.fbDb.get(window.fbDb.limitToLast(window.fbDb.ref(window.db, `messages/${chatId}`), 1));
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
            const chatId = getChatId(window.auth.currentUser.uid, uid);
            const item = document.createElement('div');
            item.className = 'chat-list-item';
            item.style = "border:none; background:#000; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
            
            item.onclick = () => {
                window.fbDb.set(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}/last_read/${chatId}`), Date.now());
                document.getElementById('messengerUI').style.display = 'none';
                startChat(uid, data.name, data.photo);
            };
            
            window.fbDb.get(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}/last_read/${chatId}`)).then(readSnap => {
                const lastRead = readSnap.val() || 0;
                window.fbDb.get(window.fbDb.limitToLast(window.fbDb.ref(window.db, `messages/${chatId}`), 1)).then(mSnap => {
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
                        if (msgData.senderId !== window.auth.currentUser.uid && ts > lastRead) {
                            isUnread = true;
                        }
                    }

                    window.fbDb.get(window.fbDb.ref(window.db, `users/${uid}/presence`)).then(presenceSnap => {
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

    const myUid = window.auth.currentUser.uid;
    const chatId = getChatId(myUid, uid);

    const { ref, query, orderByChild, equalTo, get, update } = window.fbDb;
    get(query(ref(window.db, `messages/${chatId}`), orderByChild('seen'), equalTo(false))).then(snap => {
        const updates = {};
        snap.forEach(child => {
            const m = child.val();
            if (m.senderId !== myUid) {
                updates[`${child.key}/seen`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            update(ref(window.db, `messages/${chatId}`), updates);
        }
    });

    const statusEl = document.getElementById('chatTargetStatus');
    if (statusEl) {
        window.fbDb.onValue(window.fbDb.ref(window.db, `users/${uid}/presence`), snap => {
            const presence = snap.val();
            if (presence === 'online') {
                statusEl.innerText = 'საიტზეა';
                statusEl.style.color = '#4ade80';
            } else {
                const timeAgo = (typeof formatTimeShort === 'function') ? formatTimeShort(presence) : '';
                statusEl.innerText = timeAgo ? timeAgo + ' ago' : 'offline';
                statusEl.style.color = '#888';
            }
        });
    }
    loadMessages(uid);
    listenToTyping(uid);
}

let currentChatLimit = 20;
function loadMessages(targetUid) {
    const myUid = window.auth.currentUser.uid;
    const chatId = getChatId(myUid, targetUid);
    const box = document.getElementById('chatMessages');

    window.fbDb.get(window.fbDb.ref(window.db, `users/${targetUid}`)).then(targetSnap => {
        const tData = targetSnap.val();
        const tPhoto = (tData && tData.photo) ? tData.photo : 'token-avatar.png';

        window.fbDb.onValue(window.fbDb.ref(window.db, `users/${myUid}/deleted_messages/${chatId}`), deletedSnap => {
            const deletedMsgs = deletedSnap.val() || {};

            window.fbDb.onValue(window.fbDb.limitToLast(window.fbDb.ref(window.db, `messages/${chatId}`), currentChatLimit), snap => {
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
    if (currentChatId) window.fbDb.remove(window.fbDb.ref(window.db, `typing/${getChatId(window.auth.currentUser.uid, currentChatId)}/${window.auth.currentUser.uid}`));
    document.getElementById('individualChat').style.display = 'none';
    currentChatId = null;
}

function getChatId(u1, u2) {
    return u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`;
}

function handleTyping() {
    if (!currentChatId) return;
    const chatId = getChatId(window.auth.currentUser.uid, currentChatId);
    window.fbDb.set(window.fbDb.ref(window.db, `typing/${chatId}/${window.auth.currentUser.uid}`), true);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        window.fbDb.remove(window.fbDb.ref(window.db, `typing/${chatId}/${window.auth.currentUser.uid}`));
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
    const chatId = getChatId(window.auth.currentUser.uid, targetUid);
    window.fbDb.onValue(window.fbDb.ref(window.db, `typing/${chatId}/${targetUid}`), snap => {
        const indicator = document.getElementById('typingIndicator');
        if (snap.exists()) {
            indicator.style.display = 'flex';
            const sound = document.getElementById('typingSound');
            if (sound) sound.play().catch(e => {});
        } else {
            indicator.style.display = 'none';
        }
    });
}

function listenToGlobalMessages() {
    const myUid = window.auth.currentUser.uid;
    window.fbDb.onValue(window.fbDb.ref(window.db, 'messages'), snap => {
        const data = snap.val();
        if(!data) return;
        Object.keys(data).forEach(key => {
            if(key.includes(myUid)) {
                window.fbDb.onValue(window.fbDb.limitToLast(window.fbDb.ref(window.db, `messages/${key}`), 1), mSnap => {
                    if(!mSnap.exists()) return;
                    const msgs = mSnap.val();
                    const msg = Object.values(msgs)[0];
                    if (!msg || msg.senderId === myUid) return;
                    if (Date.now() - msg.ts > 10000) return;
                    if (currentChatId && getChatId(myUid, currentChatId) === key) return;

                    window.fbDb.get(window.fbDb.ref(window.db, `users/${msg.senderId}`)).then(uSnap => {
                        const u = uSnap.val();
                        if (!u) return;
                        
                        const senderName = u.name || "მომხმარებელი";
                        const messageText = msg.text || "📷 Voice/Media";
                        const sound = document.getElementById('msgSound');
                        if (sound) {
                            sound.currentTime = 0;
                            sound.play().catch(e => console.log("ხმის დაკვრა დაიბლოკა."));
                        }
                        if (typeof setAppBadge === "function") setAppBadge(1);
                        if (typeof showLocalNotification === "function") showLocalNotification("ახალი მესიჯი: " + senderName, messageText);
                        showGlobalPush(senderName, u.photo, messageText);
                    });
                });
            }
        });
    });
}

function showGlobalPush(name, photo, text) {
    const push = document.getElementById('globalPush');
    document.getElementById('pushName').innerText = name;
    document.getElementById('pushAva').src = photo;
    document.getElementById('pushTxt').innerText = text.substring(0, 40) + (text.length > 40 ? '...' : '');
    push.classList.add('show');
    const sound = document.getElementById('msgSound');
    if (sound) sound.play().catch(e => {});
    setTimeout(() => push.classList.remove('show'), 4000);
}

function sendMessage() {
    if (!canAfford(0.2)) return;
    const inp = document.getElementById('messageInp');
    const myUid = window.auth.currentUser.uid;
    let msgText = inp.value.trim();

    if (!msgText) msgText = "👍";
    if (!currentChatId) return;
    const chatId = getChatId(myUid, currentChatId);

    window.fbDb.get(window.fbDb.ref(window.db, `users/${currentChatId}/following/${myUid}`)).then(snapshot => {
        const heFollowsMe = snapshot.exists();
        const targetPath = heFollowsMe ? `messages/${chatId}` : `message_requests/${currentChatId}/${myUid}`;

        window.fbDb.push(window.fbDb.ref(window.db, targetPath), {
            senderId: myUid,
            text: msgText,
            ts: Date.now(),
            seen: false
        });

        if (typeof sendPushToUser === "function") {
            sendPushToUser(currentChatId, myName, msgText);
        }

        window.fbDb.remove(window.fbDb.ref(window.db, `typing/${chatId}/${myUid}`));
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
    window.fbDb.get(window.fbDb.ref(window.db, 'users')).then(snap => {
        const users = snap.val();
        if (!users) return;
        const grid = document.getElementById('discoverGrid');
        grid.innerHTML = "";
        Object.entries(users).forEach(([uid, user]) => {
            if (uid === window.auth.currentUser.uid) return;
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
    window.fbDb.update(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}`), { privacy: val });
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
    if (galleryUploadContainer && window.auth.currentUser) {
        galleryUploadContainer.style.display = (uid === window.auth.currentUser.uid) ? 'block' : 'none';
    }

    document.querySelectorAll('.p-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('infoBtn').classList.add('active');

    if(uid !== window.auth.currentUser.uid) {
        window.fbDb.set(window.fbDb.ref(window.db, `profile_views/${uid}/${window.auth.currentUser.uid}`), {
            uid: window.auth.currentUser.uid, name: myName, photo: myPhoto, ts: Date.now()
        });
    }

    window.fbDb.onValue(window.fbDb.ref(window.db, 'users/' + uid), async snap => {
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
        document.getElementById('feetStats').style.display = (uid === window.auth.currentUser.uid) ? 'block' : 'none';
        document.getElementById('profTabs').style.display = 'flex';
        document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);

        const euroBtn = document.getElementById('euroBalanceBtn');
        if (euroBtn) {
            euroBtn.style.display = (uid === window.auth.currentUser.uid) ? 'inline-flex' : 'none';
        }

        const editNameBtn = document.getElementById('editNameBtn');
        if (editNameBtn) {
            editNameBtn.style.display = (uid === window.auth.currentUser.uid) ? 'flex' : 'none';
        }
       
        if(uid === window.auth.currentUser.uid) {
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
            if (typeof applyLanguage === "function") applyLanguage();
        } else {
            const isFollowing = user.followers && user.followers[window.auth.currentUser.uid];
            const isFriend = user.following && user.following[window.auth.currentUser.uid] && isFollowing;
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

                window.fbDb.get(window.fbDb.ref(window.db, `received_gifts/${uid}`)).then(snap => {
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
            if (typeof applyLanguage === "function") applyLanguage();
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
    
    window.fbDb.get(window.fbDb.ref(window.db, `profile_views/${window.auth.currentUser.uid}`)).then(async snap => {
        const data = snap.val();
        if(!data) { list.innerHTML = "No views"; return; }
        const myFollowingSnap = await window.fbDb.get(window.fbDb.ref(window.db, `users/${window.auth.currentUser.uid}/following`));
        const myFollowing = myFollowingSnap.val() || {};
        list.innerHTML = "";
        const translations = window.translations || { ka: { following_btn: "Following", follow: "Follow" } };
        const currentLang = window.currentLang || 'ka';

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
            <div>${v.uid !== window.auth.currentUser.uid ? followBtn : ''}</div>
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
    window.fbDb.update(window.fbDb.ref(window.db, 'users/' + window.auth.currentUser.uid), updates).then(() => {
        alert("Saved!");
        document.getElementById('editProfileUI').style.display = 'none';
    });
}

function showDetailedInfo(uid) {
    const panel = document.getElementById('userDetailedInfoUI');
    const content = document.getElementById('infoContent');
    panel.style.display = 'flex';
    content.innerHTML = "Loading...";
    const translations = window.translations || { ka: { full_name: "სახელი", location: "ადგილი", age: "ასაკი", relation: "ურთიერთობა", phone: "ტელეფონი" } };
    const currentLang = window.currentLang || 'ka';

    window.fbDb.get(window.fbDb.ref(window.db, 'users/' + uid)).then(snap => {
        const u = snap.val();
        if(!u) return;
        content.innerHTML = `
        <div class="info-row"><i class="fas fa-user"></i><div><span class="info-val-label">${translations[currentLang].full_name}</span><span class="info-val-text">${u.name || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-map-marker-alt"></i><div><span class="info-val-label">${translations[currentLang].location}</span><span class="info-val-text">${u.city || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-birthday-cake"></i><div><span class="info-val-label">${translations[currentLang].age}</span><span class="info-val-text">${u.age || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-heart"></i><div><span class="info-val-label">${translations[currentLang].relation}</span><span class="info-val-text">${u.relation || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-phone"></i><div><span class="info-val-label">${translations[currentLang].phone}</span><span class="info-val-text">${u.phone || '-'}</span></div></div>`;
    });
}

function followFromVisitors(uid, name, photo) {
    followUser(uid, name, photo);
    setTimeout(() => showProfileVisitors(), 500); 
}

function followUser(targetUid, name, photo) {
    if (!canAfford(1)) return;
    const myUid = window.auth.currentUser.uid;
    window.fbDb.set(window.fbDb.ref(window.db, `users/${myUid}/following/${targetUid}`), { name: name, photo: photo });
    window.fbDb.set(window.fbDb.ref(window.db, `users/${targetUid}/followers/${myUid}`), { name: myName, photo: myPhoto });
    window.fbDb.push(window.fbDb.ref(window.db, `notifications/${targetUid}`), {
        text: `${myName} followed you`,
        ts: Date.now(),
        fromPhoto: myPhoto
    });
    spendAkho(1, 'Follow');
}

function unfollowUser(targetUid) {
    const myUid = window.auth.currentUser.uid;
    window.fbDb.remove(window.fbDb.ref(window.db, `users/${myUid}/following/${targetUid}`));
    window.fbDb.remove(window.fbDb.ref(window.db, `users/${targetUid}/followers/${myUid}`));
}

function listenToRequests() {
    const myUid = window.auth.currentUser.uid;
    window.fbDb.onValue(window.fbDb.ref(window.db, `notifications/${myUid}`), snap => {
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
    window.fbDb.get(window.fbDb.ref(window.db, `notifications/${window.auth.currentUser.uid}`)).then(snap => {
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
    window.fbDb.remove(window.fbDb.ref(window.db, `notifications/${window.auth.currentUser.uid}/${id}`)).then(() => openRequestsUI());
}

function loadUserVideos(uid) {
    const grid = document.getElementById('profGrid');
    const { ref, query, orderByChild, equalTo, get } = window.fbDb;
    
    get(query(ref(window.db, 'posts'), orderByChild('authorId'), equalTo(uid))).then(snap => {
        grid.innerHTML = ""; 
        const posts = snap.val();
        if(!posts) {
            document.getElementById('statVidsCount').innerText = 0;
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

        document.getElementById('statVidsCount').innerText = vCount;

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
    if (typeof killVideo === "function") killVideo();
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
        window.fbDb.runTransaction(window.fbDb.ref(window.db, `posts/${postId}/views`), c => (c || 0) + 1);

        window.fbDb.get(window.fbDb.ref(window.db, `posts/${postId}`)).then(snap => {
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
            const myUid = window.auth.currentUser.uid;
            const likesKeys = data.likedBy ? Object.keys(data.likedBy) : [];
            
            if (lElem) lElem.innerText = likesKeys.length;
            if (lIcon) lIcon.style.color = likesKeys.includes(myUid) ? '#ff4d4d' : 'white';

            const sIcon = document.getElementById('fullSaveIcon');
            if (sIcon) sIcon.style.color = (data.savedBy && data.savedBy[myUid]) ? 'var(--gold)' : 'white';

            const giftBtn = document.querySelector('#fullVideoOverlay .side-action-item[onclick*="openGiftPanel"]');
            if (giftBtn) {
                giftBtn.onclick = () => openGiftPanel(window.currentFullVideoId, window.currentFullVideoAuthorId);
            }
          
            const moreBtn = document.querySelector('#fullVideoOverlay .more-btn'); 
            if (moreBtn) {
                if (data.authorId === window.auth.currentUser.uid) {
                    moreBtn.style.display = 'flex'; 
                    moreBtn.onclick = () => toggleMoreMenu(window.currentFullVideoId);
                } else {
                    moreBtn.style.display = 'none'; 
                }
            }
        });

        window.fbDb.get(window.fbDb.ref(window.db, `comments/${postId}`)).then(cSnap => {
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
    
    window.fbDb.get(window.fbDb.ref(window.db, `users/${uid}/${type}`)).then(snap => {
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
            await window.fbDb.update(window.fbDb.ref(window.db, 'users/' + window.auth.currentUser.uid), { photo: data.data.url });
            alert("Done!");
        }
    } catch(e) { alert("Error!"); }
}

function logoutUser() {
    if(confirm("Logout?")) { window.fbAuth.signOut(window.auth).then(() => { location.reload(); }); }
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

        window.fbAuth.createUserWithEmailAndPassword(window.auth, email, pass).then(u => {
            window.fbDb.set(window.fbDb.ref(window.db, 'users/' + u.user.uid), { 
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

        window.fbAuth.signInWithEmailAndPassword(window.auth, email, pass).then(u => {
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
        const videoName = Date.now() + "_" + file.name;
        const videoRef = window.fbStorage.sRef(window.storage, 'videos/' + videoName);
        const uploadTask = window.fbStorage.uploadBytesResumable(videoRef, file);

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
                const downloadURL = await window.fbStorage.getDownloadURL(uploadTask.snapshot.ref);
                await window.fbDb.push(window.fbDb.ref(window.db, 'posts'), {
                    authorId: window.auth.currentUser.uid,
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

function renderTokenFeed() {
    if (document.getElementById('liveUI').style.display === 'flex') return;
    if (isFeedLoading) return;
    
    isFeedLoading = true;
    const feed = document.getElementById('main-feed');

    const { ref, query, orderByChild, limitToLast, endAt, get } = window.fbDb;
    let q = query(ref(window.db, 'posts'), orderByChild('timestamp'));
    if (lastVisibleTimestamp) {
        q = query(ref(window.db, 'posts'), orderByChild('timestamp'), endAt(lastVisibleTimestamp - 1), limitToLast(FEED_LIMIT));
    } else {
        q = query(ref(window.db, 'posts'), orderByChild('timestamp'), limitToLast(FEED_LIMIT));
    }

    get(q).then(snap => {
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
            
            const card = document.createElement('div');
            card.className = 'video-card';
            card.id = `card-${id}`;
            
            const isLikedByMe = post.likedBy && post.likedBy[window.auth.currentUser.uid];
            const isSavedByMe = post.savedBy && post.savedBy[window.auth.currentUser.uid];      
            
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
    ${post.authorId === window.auth.currentUser.uid ? `
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
            cleanupOldVideos();

            function startLikeCycle() {
                if (post.authorId !== window.auth.currentUser.uid) return;
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
                                <img src="${person.photo || 'token-avatar.png'}" 
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

            window.fbDb.get(window.fbDb.ref(window.db, `comments/${id}`)).then(cSnap => {
                const count = cSnap.val() ? Object.keys(cSnap.val()).length : 0;
                const el = document.getElementById(`comm-count-${id}`);
                if(el) el.innerText = count;
            });

            window.fbDb.get(window.fbDb.ref(window.db, `users/${post.authorId}`)).then(uSnap => {
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
            window.fbDb.onValue(window.fbDb.ref(window.db, `lives_active/${liveChannelName}`), lSnap => {
                const wrapper = document.getElementById(`ava-wrapper-${id}`);
                const ava = document.getElementById(`ava-${id}`);
                
                if(lSnap.exists() && wrapper) {
                    wrapper.classList.add('is-live-now');
                    if(ava) ava.onclick = () => joinLive(liveChannelName);
                } else if(wrapper) {
                    wrapper.classList.remove('is-live-now');
                    if(ava) ava.onclick = () => openProfile(post.authorId);
                }
            });
        });
        setupAutoPlay();
    });

    feed.onscroll = function() {
        if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 800) {
            renderTokenFeed();
        }
    };
}

let feedLimit = 15;
window.addEventListener('scroll', function() {
    const feed = document.getElementById('main-feed');
    if (!feed || isFeedLoading) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 800) {
        feedLimit += 15; 
        renderTokenFeed();
    }
}, { passive: true });

async function deleteMyVideo(postId) {
    if (!confirm("ნამდვილად გსურთ ვიდეოს სამუდამოდ წაშლა?")) return;

    try {
        const snap = await window.fbDb.get(window.fbDb.ref(window.db, `posts/${postId}`));
        const post = snap.val();

        if (!post) {
            console.error("პოსტი ვერ მოიძებნა!");
            return;
        }

        const videoMedia = post.media ? post.media.find(m => m.type === 'video') : null;
        if (videoMedia && videoMedia.url) {
            try {
                const videoRef = window.fbStorage.sRef(window.storage, videoMedia.url);
                await window.fbStorage.deleteObject(videoRef);
                console.log("ფაილი წაიშალა Storage-დან ✅");
            } catch (storageErr) {
                console.warn("ფაილი Storage-ში უკვე აღარ არსებობს:", storageErr);
            }
        }

        await window.fbDb.remove(window.fbDb.ref(window.db, `posts/${postId}`));
        await window.fbDb.remove(window.fbDb.ref(window.db, `comments/${postId}`));

        const card = document.getElementById(`card-${postId}`);
        if (card) {
            const video = card.querySelector('video');
            if (video) {
                video.pause();
                video.src = "";
                video.load();
                video.remove();
            }
            card.remove();
        }
        console.log("პოსტი წარმატებით წაიშალა ყველგან!");
    } catch (error) {
        console.error("წაშლისას მოხდა შეცდომა:", error);
        alert("შეცდომა წაშლისას: " + error.message);
    }
}

function setupAutoPlay() {
    if (document.getElementById('messengerUI').style.display === 'flex') return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            const postId = entry.target.id.replace('card-', '');

            if (entry.isIntersecting) {
                video.style.opacity = "1";
                video.play().catch(e => {}); 
                video.muted = false;

                if (postId && postId !== "") {
                    window.fbDb.runTransaction(window.fbDb.ref(window.db, `posts/${postId}/views`), currentViews => {
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

    document.querySelectorAll('.video-card').forEach(card => observer.observe(card));
}

window.openGiftPanel = function(postId, authorId) {
    if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
    const panel = document.createElement('div');
    panel.id = "dynamicGiftPanel";
    panel.style = "position:fixed; bottom:0; left:0; width:100%; background:rgba(10,10,10,0.98); border-top:2px solid #d4af37; border-radius:20px 20px 0 0; padding:25px 20px; z-index:200005; backdrop-filter:blur(15px); color:white; font-family:sans-serif;";
    
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <b style="color:#d4af37;">აირჩიე საჩუქარი</b>
            <i class="fas fa-times" onclick="document.getElementById('dynamicGiftPanel').remove()" style="cursor:pointer; font-size:20px; color:gray;"></i>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-height:400px; overflow-y:auto;">
            <p style="color:gray; font-size:12px; grid-column: 1 / -1; text-align:center;">საჩუქრების სია</p>
        </div>`;
    document.body.appendChild(panel);
};
