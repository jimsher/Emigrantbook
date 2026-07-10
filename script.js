// Supabase-ის ახალი კავშირი კლიენტისთვის
const SUPABASE_URL = "https://mohkxmwphwywkqkoairj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGt4bXdwaHd5d2txa29haXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM6MDc3MzEsImV4cCI6MjA5OTE4MzczMX0.IVGUFWGJAa4X-R6Ul8m4XMpcw1MdP4pcRfwzG9C70ag";

// ინიციალიზაცია
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = supabase;

// ორიგინალი აუდიო ცვლადები - ხელუხლებელი
let audioCtx, audioSource, audioDest;

// Stripe-ის ორიგინალი Live გასაღები - ხელუხლებელი
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

async function updatePresence(userId) {
    if (!userId) return;
    await supabase
        .from('users')
        .update({ presence: 'online' })
        .eq('id', userId);
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

async function finishOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('users').update({ hasSeenRules: true }).eq('id', user.id);
    }
    document.getElementById('onboardingUI').style.display = 'none';
}

supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session ? session.user : null;
  
  applyLanguage();
  if (user) {
    setTimeout(() => { askInitialPermissions(); }, 1500);

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const packAmount = urlParams.get('pack');

    if (sessionId && packAmount) {
        const amountToAdd = parseFloat(packAmount);
        const { data: paySnap } = await supabase.from('payments_processed').select('*').eq('id', sessionId).maybeSingle();

        if (!paySnap) {
            const { data: userData } = await supabase.from('users').select('akho').eq('id', user.id).single();
            const currentAkho = userData ? (userData.akho || 0) : 0;
            const newAkho = currentAkho + amountToAdd;

            await supabase.from('users').update({ akho: newAkho }).eq('id', user.id);
            await supabase.from('payments_processed').insert({ id: sessionId, uid: user.id, amount: amountToAdd, ts: new Date().toISOString() });

            addToLog('Stripe Purchase', amountToAdd);
            if (typeof showCustomAlert === "function") {
                showCustomAlert("წარმატება", `თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
            } else {
                alert(`წარმატება: თქვენ დაგერიცხათ ${amountToAdd} AKHO! ✅`);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    setTimeout(async () => {
      await supabase.from('users').update({ test_field: "მუშაობს" }).eq('id', user.id);
      saveMessagingToken(user);
    }, 2000);

    supabase.channel('euro-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
            const euro = payload.new.euro_balance || 0;
            const euroEl = document.getElementById('euroBalanceDisplay');
            if (euroEl) { euroEl.innerText = euro.toFixed(2) + " €"; }
        }).subscribe();

    supabase.from('users').select('euro_balance').eq('id', user.id).single().then(({ data }) => {
        const euro = data ? (data.euro_balance || 0) : 0;
        const euroEl = document.getElementById('euroBalanceDisplay');
        if (euroEl) { euroEl.innerText = euro.toFixed(2) + " €"; }
    });

    updatePresence(user.id);
    listenToGlobalMessages();
    startNotificationListener();
    checkDailyBonus();
    startGlobalUnreadCounter();
    listenForIncomingCalls(user);
    startWallNotificationListener();
    
    // ... გაგრძელება მომდევნო 1000 ხაზში ...
    
    setTimeout(async function() {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session ? session.user : null;
    if (currentUser) {
        const tokenKey = 'fcm_token_sent_' + currentUser.id;
        if (localStorage.getItem(tokenKey)) return; 

        // Supabase-ში FCM ტოკენის შენახვა (თუ ვებ-პუშებს იყენებ)
        // გაითვალისწინე: თუ FCM-ს ტოვებ, საჭიროა firebase-ის SDK-ის ინიციალიზაცია
        // თუ სრულად Supabase-ზე გადადიხარ, პუშები უნდა მართო Supabase Edge Functions-ით.
        try {
            // მაგალითი: ტოკენის დაწერა პირდაპირ Supabase-ში
            // თუ firebase.messaging() გაქვს, დატოვე ისე, როგორც იყო,
            // უბრალოდ ჩანაწერის ფუნქცია გადავაკეთე:
            const messaging = firebase.messaging();
            const token = await messaging.getToken({ 
                vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk' 
            });
            
            if (token) {
                await supabase.from('users').update({ fcm_token: token }).eq('id', currentUser.id);
                showTestNotification(); 
                localStorage.setItem(tokenKey, 'true'); 
            }
        } catch (e) {
            console.log("Messaging skip or error:", e);
        }
    }
}, 3000);

let currentIncomingCall = null;
supabase
    .channel('video-calls')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'video_calls', filter: `receiver_id=eq.${user.id}` }, payload => {
        const call = payload.new;
        // Supabase-ში თარიღი არის ISO String, ამიტომ Date.now() შეადარე new Date(call.ts).getTime()
        if (call && call.status === 'calling' && (Date.now() - new Date(call.ts).getTime() < 60000)) {
            currentIncomingCall = call; 
            document.getElementById('callerNameDisplay').innerText = call.callerName;
            document.getElementById('callerAva').src = call.callerPhoto || 'token-avatar.png';
            const modal = document.getElementById('incomingCallModal');
            modal.style.display = 'flex';
        } else {
            document.getElementById('incomingCallModal').style.display = 'none';
        }
    })
    .subscribe();

document.getElementById('authUI').style.display = 'none';

supabase
    .channel('user-data')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
        handleUserData(payload.new);
    })
    .subscribe();

const { data: d } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
if(d) { handleUserData(d); }

function handleUserData(dataVal) {
    currentUserData = dataVal;
    if(dataVal.is_banned) {
        document.body.innerHTML = '<div style="background:#000; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif; text-align:center; padding:20px;"><i class="fas fa-gavel" style="font-size:80px; color:#ff4d4d; margin-bottom:20px;"></i><h1>Banned / დაბლოკილია</h1></div>';
        return;
    }
    myName = dataVal.name || "User";
    myPhoto = dataVal.photo || "token-avatar.png";
    myAkho = dataVal.akho || 0;
    document.getElementById('userAkho').innerText = Number(myAkho).toFixed(2);
    document.getElementById('realCash').innerText = (Number(myAkho) / 10).toFixed(2);
    document.getElementById('bottomNavAva').src = myPhoto;
    
    // Supabase-ში ველები იწერება როგორც has_seen_rules (snake_case)
    if(!dataVal.has_seen_rules) document.getElementById('onboardingUI').style.
    
 display = 'flex';
    if(dataVal.role === 'admin') { document.getElementById('adminMenuBtn').style.display = 'flex'; }

    updateCashoutUI();
    loadActivityLog();
}

renderTokenFeed();
loadDiscoveryUsers();
listenToRequests();

async function acceptCall() {
    const { data: { user } } = await supabase.auth.getUser();
    if (currentIncomingCall && user) {
        window.currentChatId = currentIncomingCall.callerUid; 
        await supabase
            .from('video_calls')
            .update({ status: 'accepted' })
            .eq('receiver_id', user.id);
        
        document.getElementById('incomingCallModal').style.display = 'none';
        document.getElementById('videoCallUI').style.display = 'flex';
        if (typeof startVideoCall === "function") {
            startVideoCall();
        }
    }
}

async function declineCall() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('video_calls')
            .delete()
            .eq('receiver_id', user.id);
        document.getElementById('incomingCallModal').style.display = 'none';
    }
}

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

async function submitWithdraw() {
    const iban = document.getElementById('ibanInput').value;
    const { data: { user } } = await supabase.auth.getUser();
    if(!iban || iban.length < 10) return alert("IBAN / PayPal Error");
    
    if(confirm(`Confirm ${(myAkho/10).toFixed(2)} €?`)) {
        // insert() აბრუნებს ახალ ჩანაწერს
        const { error } = await supabase.from('withdrawal_requests').insert({
            uid: user.id,
            name: myName,
            amountEur: (myAkho/10).toFixed(2),
            amountAkho: myAkho,
            iban: iban,
            status: 'pending',
            ts: new Date().toISOString()
        });

        if (!error) {
            await supabase.from('users').update({ akho: 0 }).eq('id', user.id);
            addToLog('Cashout Request', -myAkho);
            alert(currentLang === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request sent!");
            document.getElementById('walletUI').style.display = 'none';
        }
    }
}

function openAdminUI() {
    toggleSideMenu(false);
    document.getElementById('adminUI').style.display = 'flex';
    loadAdminRequests();
    renderAdminOrders();
}

async function adminSearchUsers(q) {
    const list = document.getElementById('admUserList');
    if(!q || q.length < 2) { list.innerHTML = ""; return; }
    
    // ilike - Case insensitive search
    const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', `%${q}%`);

    list.innerHTML = "";
    if (users) {
        users.forEach(u => {
            const div = document.createElement('div');
            div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;";
            div.innerHTML = `<span style="color:white; font-size:14px;">${u.name}</span><button class="profile-btn btn-outline" style="padding:5px 10px; font-size:12px;" onclick="selectAdmTarget('${u.id}', '${u.name}')">Manage</button>`;
            list.appendChild(div);
        });
    }
}

function selectAdmTarget(uid, name) {
    currentAdmTarget = uid;
    document.getElementById('admUserActions').style.display = 'block';
    document.getElementById('admTargetName').innerText = "Manage: " + name;
}

async function adminAction(type) {
    if(!currentAdmTarget) return;

    if(type === 'warning') {
        const msg = prompt("Warning message:");
        if(msg) {
            await supabase.from('notifications').insert({
                user_id: currentAdmTarget,
                text: "⚠️ Admin: " + msg,
                ts: new Date().toISOString(),
                from_photo: "https://emigrantbook.com/1000084015-removebg-preview.png"
            });
        }
    } else if(type === 'ban') {
        if(confirm("Ban user?")) await supabase.from('users').update({ is_banned: true }).eq('id', currentAdmTarget);
    } else if(type === 'unban') {
        if(confirm("Unban user?")) await supabase.from('users').update({ is_banned: false }).eq('id', currentAdmTarget);
    } else if(type === 'addAkho') {
        const amt = prompt("AKHO amount:");
        if(amt) {
            const { data: user } = await supabase.from('users').select('akho').eq('id', currentAdmTarget).single();
            const newBal = (user.akho || 0) + parseFloat(amt);
            await supabase.from('users').update({ akho: newBal }).eq('id', currentAdmTarget);
        }
    } else if(type === 'resetAkho') {
        if(confirm("Reset balance?")) await supabase.from('users').update({ akho: 0 }).eq('id', currentAdmTarget);
    } else if(type === 'delete') {
        if(confirm("Delete account permanently?")) {
            await supabase.from('users').delete().eq('id', currentAdmTarget);
            document.getElementById('admUserActions').style.display = 'none';
        }
    }
    alert("Done!");
}

function loadAdminRequests() {
    const list = document.getElementById('adminReqList');
    // რეალურ დროში განახლება
    supabase.channel('admin-withdrawals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
            renderRequests();
        }).subscribe();
    renderRequests();
}

async function renderRequests() {
    const list = document.getElementById('adminReqList');
    const { data: reqs } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending');

    list.innerHTML = "";
    if(!reqs || reqs.length === 0) { list.innerHTML = "<p style='color:gray;'>No requests</p>"; return; }
    
    reqs.forEach(req => {
        list.innerHTML += `
            <div class="admin-req-card">
                <b>User: ${req.name}</b>
                <span>Amt: ${req.amount_eur} € (${req.amount_akho} AKHO)</span>
                <span>IBAN: ${req.iban}</span>
                <div style="display:flex; gap:10px;">
                    <button class="withdraw-btn" style="background:var(--green);" onclick="approveReq('${req.id}')">Approve</button>
                    <button class="withdraw-btn" style="background:var(--red);" onclick="declineReq('${req.id}', '${req.uid}', ${req.amount_akho})">Decline</button>
                </div>
            </div>`;
    });
}

async function approveReq(id) {
    if(confirm("Paid?")) {
        await supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', id);
        alert("Approved!");
    }
}

async function declineReq(id, uid, amount) {
    if(confirm("Decline? Coins will return.")) {
        // ჯერ ვიღებთ მიმდინარე ბალანსს
        const { data: userData } = await supabase.from('users').select('akho').eq('id', uid).single();
        const currentAkho = userData ? userData.akho : 0;
        
        await supabase.from('users').update({ akho: currentAkho + amount }).eq('id', uid);
        await supabase.from('withdrawal_requests').update({ status: 'declined' }).eq('id', id);
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

async function initStripePayment(url) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please Login");
    const finalUrl = url + "?client_reference_id=" + user.id;
    document.getElementById('walletMain').style.display = 'none';
    document.getElementById('paymentPending').style.display = 'block';
    window.location.href = finalUrl; 
}

function canAffOut(cost) {
    if (myAkho >= cost) return true;
    alert(currentLang === 'ka' ? "შეავსეთ ბალანსი!" : "Top up your balance!");
    openWalletUI();
    return false;
}

function canAfford(cost) {
    if (myAkho >= cost) return true;
    alert(currentLang === 'ka' ? "შეავსეთ ბალანსი!" : "Top up your balance!");
    openWalletUI();
    return false;
}

async function spendAkho(cost, reason = 'Action') {
    const { data: { user } } = await supabase.auth.getUser();
    const newBalance = myAkho - cost;
    await supabase.from('users').update({ akho: newBalance }).eq('id', user.id);
    addToLog(reason, -cost);
}

async function earnAkho(targetUid, amount, reason = 'Impact Reward') {
    const { data: userData } = await supabase.from('users').select('akho').eq('id', targetUid).single();
    const currentAkho = userData ? userData.akho : 0;
    
    await supabase.from('users').update({ akho: currentAkho + amount }).eq('id', targetUid);
    await supabase.from('activity_logs').insert({
        user_id: targetUid,
        type: reason,
        amt: amount,
        ts: new Date().toISOString()
    });
}

async function addToLog(type, amt) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
        user_id: user.id,
        type: type,
        amt: amt,
        ts: new Date().toISOString()
    });
}

async function loadActivityLog() {
    const box = document.getElementById('logContent');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('ts', { ascending: false })
        .limit(15);

    box.innerHTML = "";
    if(!logs || logs.length === 0) { box.innerHTML = "<p style='color:gray; font-size:12px;'>ისტორია ცარიელია</p>"; return; }
    
    logs.forEach(log => {
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

async function loadComments(postId, isGallery = false) {
    const list = document.getElementById('commList');
    const { data: { user } } = await supabase.auth.getUser();
    const myUid = user.id;
    const postOwnerId = window.currentPostOwnerId;

    window.isGalleryMode = isGallery;
    activePostId = postId;

    // ველი 'table_name' იცვლება gallery_comments ან comments ცხრილის სახელით
    const tableName = isGallery ? 'gallery_comments' : 'comments';

    const { data: comments } = await supabase
        .from(tableName)
        .select('*')
        .eq('post_id', postId)
        .order('ts', { ascending: true });

    list.innerHTML = "";
    if (!comments) return;

    comments.forEach(comm => {
        // შემოწმება თუ მომხმარებელს აქვს დალაიქებული (JSONB ველის დამუშავება)
        const isLiked = comm.likes && comm.likes[myUid];
        const canDeleteComm = (myUid === comm.author_id) || (myUid === postOwnerId);

        let html = `
        <div class="comment-item">
            <div class="comment-top">
                <img src="${comm.author_photo}" class="comm-ava">
                <div class="comm-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div class="comm-name">${comm.author_name}</div>
                        ${canDeleteComm ? `<i class="fas fa-trash-alt" style="color:#555; cursor:pointer; font-size:11px; padding:5px;" onclick="window.deleteComment('${postId}', '${comm.id}')"></i>` : ''}
                    </div>
                    <div class="comm-text">${comm.text}</div>
                    <div class="comm-actions">
                        <span class="comm-like-btn ${isLiked ? 'liked' : ''}" onclick="likeComment('${comm.id}')">
                            <i class="fas fa-heart"></i> ${comm.likes ? Object.keys(comm.likes).length : 0}
                        </span>
                        <span onclick="prepareReply('${comm.id}', '${comm.author_name}')" style="cursor:pointer;">Reply/პასუხი</span>
                    </div>
                </div>
            </div>
            <div id="replies-${comm.id}" class="reply-list"></div>
        </div>`;
        
        list.innerHTML += html;
        // პასუხების რენდერი (თუ replies JSONB ველშია)
        if(comm.replies) {
            const rList = document.getElementById(`replies-${comm.id}`);
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
                    ${canDeleteReply ? `<i class="fas fa-trash-alt" style="color:#444; cursor:pointer; font-size:10px;" onclick="window.deleteReply('${postId}', '${comm.id}', '${rId}')"></i>` : ''}
                </div>`;
            });
        }
    });
}

window.deleteComment = async function(postId, commentId) {
    if (confirm("ნამდვილად გსურთ კომენტარის წაშლა?")) {
        const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';
        await supabase.from(tableName).delete().eq('id', commentId);
        loadComments(postId, window.isGalleryMode);
    }
};

async function postComment() {
    if (!canAfford(0.5)) return;
    const text = document.getElementById('commInp').value;
    const { data: { user } } = await supabase.auth.getUser();
    if(!text.trim() || !activePostId) return;

    const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';

    if(activeReplyTo) {
        // Supabase-ში JSONB ველის განახლება (replies)
        // საჭიროა წაკითხვა -> განახლება -> ჩაწერა
        const { data: parent } = await supabase.from(tableName).select('replies').eq('id', activeReplyTo).single();
        let replies = parent.replies || {};
        replies[Date.now()] = { authorId: user.id, authorName: myName, authorPhoto: myPhoto, text: text, ts: new Date().toISOString() };
        await supabase.from(tableName).update({ replies: replies }).eq('id', activeReplyTo);
    } else {
        await supabase.from(tableName).insert({
            post_id: activePostId,
            author_id: user.id,
            author_name: myName,
            author_photo: myPhoto,
            text: text,
            ts: new Date().toISOString()
        });
    }
    
    spendAkho(0.5, 'Comment');
    document.getElementById('commInp').value = "";
    activeReplyTo = null;
    loadComments(activePostId, window.isGalleryMode);
}

async function likeComment(commId) {
    if (!canAfford(0.1)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';
    
    const { data: comm } = await supabase.from(tableName).select('likes').eq('id', commId).single();
  {}  let likes = comm.likes || {};

    if(likes[user.id]) {
        delete likes[user.id];
    } else {
        likes[user.id] = true;
        spendAkho(0.1, 'Comment Like');
    }
    
    await supabase.from(tableName).update({ likes: likes }).eq('id', commId);
    loadComments(activePostId, window.isGalleryMode);
}

async function openMessenger() {
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
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ვიღებთ მომხმარებლის მიერ გამოწერილებს
    const { data: userData } = await supabase.from('users').select('following').eq('id', user.id).single();
    const following = userData?.following;

    if(!following) { 
        list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No active chats yet.</p>";
        return; 
    }

    let chatArray = [];
    // Promise.all ყველა ჩატის მონაცემის გამოსატანად
    const promises = Object.entries(following).map(async ([uid, data]) => {
        const chatId = getChatId(user.id, uid);
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('ts', { ascending: false })
            .limit(1);
            
        chatArray.push({ uid, data, lastTs: messages?.length ? new Date(messages[0].ts).getTime() : 0 });
    });

    await Promise.all(promises);
    chatArray.sort((a, b) => b.lastTs - a.lastTs);
    list.innerHTML = "";

    chatArray.forEach(({ uid, data }) => {
        const chatId = getChatId(user.id, uid);
        const item = document.createElement('div');
        item.className = 'chat-list-item';
        item.style = "border:none; background:#000; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
        
        item.onclick = async () => {
            await supabase.from('users').update({ [`last_read_${chatId}`]: new Date().toISOString() }).eq('id', user.id);
            document.getElementById('messengerUI').style.display = 'none';
            startChat(uid, data.name, data.photo);
        };

        // ბოლო მესიჯის და წაკითხვის სტატუსის შემოწმება
        supabase.from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('ts', { ascending: false })
            .limit(1)
            .then(({ data: msgs }) => {
                let lastMsg = "Tap to chat";
                let msgTimeFormatted = "";
                let isUnread = false;

                if (msgs && msgs.length > 0) {
                    const msgData = msgs[0];
                    lastMsg = msgData.text || "📷 Media/Voice";
                    const ts = new Date(msgData.ts).getTime();
                    const msgDate = new Date(ts);
                    
                    // დროის ფორმატირება
                    msgTimeFormatted = msgDate.toDateString() === new Date().toDateString() 
                        ? msgDate.getHours() + ":" + msgDate.getMinutes().toString().padStart(2, '0')
                        : msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    // შემოწმება unread-ზე (უნდა გქონდეს last_read სვეტი)
                    isUnread = (msgData.sender_id !== user.id); // მარტივი ლოგიკა
                }

                supabase.from('users').select('presence').eq('id', uid).single().then(({ data: u }) => {
                    const isOnline = u?.presence === 'online';
                    item.innerHTML = `
                        <div style="position:relative; flex-shrink:0;">
                            <img src="${data.photo || 'token-avatar.png'}" style="width:56px; height:56px; border-radius:50%; object-fit:cover;">
                            <div style="position:absolute; bottom:2px; right:2px; width:14px; height:14px; background:#4ade80; border-radius:50%; border:3px solid #000; display:${isOnline ? 'block' : 'none'};"></div>
                        </div>
                        <div style="display:flex; flex-direction:column; overflow:hidden; flex:1; margin-left:5px;">
                            <b style="color:white; font-size:16px; margin-bottom:2px;">${data.name}</b>
                            <div style="display:flex; align-items:center; gap:5px;">
                                <span style="color:${isUnread ? 'white' : '#888'}; font-weight:${isUnread ? 'bold' : 'normal'}; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${lastMsg}</span>
                                <span style="color:#888; font-size:12px;"> · ${msgTimeFormatted}</span>
                            </div>
                        </div>
                    `;
                    list.appendChild(item);
                });
            });
    });
}

async function startChat(uid, name, photo) {
    stopMainFeedVideos();
    if(typeof setAppBadge === 'function') setAppBadge(0);
    
    window.currentChatId = uid;
    currentChatId = uid; 

    document.getElementById('socialListsUI').style.display = 'none';
    document.getElementById('individualChat').style.display = 'flex';
    document.getElementById('chatTargetName').innerText = name;
    document.getElementById('chatTargetAva').src = photo;

    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, uid);

    // მესიჯების "seen" სტატუსის განახლება
    await supabase
        .from('messages')
        .update({ seen: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('seen', false);

    const statusEl = document.getElementById('chatTargetStatus');
    if (statusEl) {
        // რეალურ დროში სტატუსის მოსმენა
        supabase.channel('user-presence')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, payload => {
                const presence = payload.new.presence;
                if (presence === 'online') {
                    statusEl.innerText = 'საიტზეა';
                    statusEl.style.color = '#4ade80';
                } else {
                    const timeAgo = (typeof formatTimeShort === 'function') ? formatTimeShort(presence) : '';
                    statusEl.innerText = timeAgo ? timeAgo + ' ago' : 'offline';
                    statusEl.style.color = '#888';
                }
            }).subscribe();
    }
    loadMessages(uid);
    listenToTyping(uid);
}

let currentChatLimit = 20;
async function loadMessages(targetUid) {
    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, targetUid);
    const box = document.getElementById('chatMessages');

    const { data: targetUser } = await supabase.from('users').select('photo').eq('id', targetUid).single();
    const tPhoto = targetUser?.photo || 'token-avatar.png';

    // რეალურ დროში მესიჯების მოსმენა
    supabase.channel('messages-' + chatId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, payload => {
            // აქ დაამატე ლოგიკა ახალი მესიჯის ეკრანზე გამოსაჩენად
            renderMessages(chatId, targetUid, tPhoto);
        }).subscribe();

    renderMessages(chatId, targetUid, tPhoto);
}

async function renderMessages(chatId, targetUid, tPhoto) {
    const { data: { user } } = await supabase.auth.getUser();
    const box = document.getElementById('chatMessages');
    
    // წაშლილი მესიჯების მიღება
    const { data: userData } = await supabase.from('users').select('deleted_messages').eq('id', user.id).single();
    const deletedMsgs = userData?.deleted_messages || {};

    const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('ts', { ascending: false })
        .limit(currentChatLimit);

    box.innerHTML = "";
    [...(msgs || [])].reverse().forEach((msg, index) => {
        if (deletedMsgs[msg.id]) return;
        const isMine = (msg.sender_id === user.id);
        // აქ გააგრძელე შენი UI-ის აგება (bubble style და ა.შ.)
        // მნიშვნელოვანი: msg.sender_id გამოიყენე senderId-ის ნაცვლად
    });
}

function closeChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (currentChatId) {
        supabase.from('typing').delete().eq('chat_id', getChatId(user.id, currentChatId)).eq('user_id', user.id);
    }
    document.getElementById('individualChat').style.display = 'none';
    currentChatId = null;
}

function getChatId(u1, u2) {
    return u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`;
}

async function handleTyping() {
    if (!currentChatId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, currentChatId);
    
    await supabase.from('typing').upsert({ chat_id: chatId, user_id: user.id, typing: true });
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
        await supabase.from('typing').delete().eq('chat_id', chatId).eq('user_id', user.id);
    }, 3000);
}

function listenToTyping(targetUid) {
    const chatId = getChatId(supabase.auth.user().id, targetUid);
    supabase.channel('typing-' + chatId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'typing', filter: `chat_id=eq.${chatId}` }, payload => {
            const indicator = document.getElementById('typingIndicator');
            // ამოწმებს არის თუ არა რაიმე ჩანაწერი ამ ჩატისთვის
            if (payload.new && payload.new.user_id === targetUid) {
                indicator.style.display = 'flex';
                document.getElementById('typingSound').play().catch(e => {});
            } else {
                indicator.style.display = 'none';
            }
        }).subscribe();
}

function listenToGlobalMessages() {
    const myUid = supabase.auth.user().id;
    supabase.channel('global-msgs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
            const msg = payload.new;
            // ვამოწმებთ არის თუ არა ჩვენი ჩატი და არ არის თუ არა ჩვენი გაგზავნილი
            if (!msg.chat_id.includes(myUid) || msg.sender_id === myUid) return;

            const { data: u } = await supabase.from('users').select('name, photo').eq('id', msg.sender_id).single();
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
        }).subscribe();
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

async function sendMessage() {
    if (!canAfford(0.2)) return;
    const inp = document.getElementById('messageInp');
    const myUid = supabase.auth.user().id;
    let msgText = inp.value.trim();

    if (!msgText) msgText = "👍";
    if (!currentChatId) return;
    const chatId = getChatId(myUid, currentChatId);

    // შემოწმება მიმდევრობაზე
    const { data: targetUser } = await supabase.from('users').select('following').eq('id', currentChatId).single();
    const heFollowsMe = targetUser?.following?.[myUid];
    
    const targetTable = heFollowsMe ? 'messages' : 'message_requests';

    await supabase.from(targetTable).insert({
        chat_id: chatId,
        sender_id: myUid,
        text: msgText,
        ts: new Date().toISOString(),
        seen: false
    });

    if (typeof sendPushToUser === "function") {
        sendPushToUser(currentChatId, myName, msgText);
    }

    await supabase.from('typing').delete().eq('chat_id', chatId).eq('user_id', myUid);
    spendAkho(0.2, 'Message');
    inp.value = ""; 

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

async function loadDiscoveryUsers() {
    const { data: users } = await supabase.from('users').select('id, name, photo');
    const myUid = supabase.auth.user().id;
    
    const grid = document.getElementById('discoverGrid');
    grid.innerHTML = "";
    if (!users) return;
    
    users.forEach(user => {
        if (user.id === myUid) return;
        grid.innerHTML += `
        <div class="user-card" onclick="openProfile('${user.id}')">
            <div class="card-inner">
                <img src="${user.photo || 'token-avatar.png'}" class="discover-ava">
                <div class="discover-name">${user.name}</div>
                <div class="discover-status">EMIGRANT</div>
            </div>
        </div>`;
    });
}

async function openSettings() {
    toggleSideMenu(false);
    stopMainFeedVideos();
    const ui = document.getElementById('settingsUI');
    ui.style.display = 'flex';
    
    // currentUserData უკვე განახლებულია handleUserData ფუნქციით
    const privacy = currentUserData?.privacy || 'public';
    const privEl = document.getElementById(`priv${privacy.charAt(0).toUpperCase() + privacy.slice(1)}`);
    if (privEl) privEl.checked = true;
}

async function updatePrivacy(val) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('users').update({ privacy: val }).eq('id', user.id);
    }
}

async function openProfile(uid) {
    stopMainFeedVideos();
    document.getElementById('profileUI').style.display = 'flex';

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // UI ელემენტების გასუფთავება
    const taggedList = document.getElementById('userTaggedPostsList');
    if (taggedList) { taggedList.style.display = 'none'; taggedList.innerHTML = ''; }
 
    document.getElementById('profName').setAttribute('data-view-uid', uid);
    document.getElementById('userPhotosGrid').style.display = 'none';
    document.getElementById('profGrid').style.display = 'grid';
    document.getElementById('noPhotosMsg').style.display = 'none';

    const galleryUploadContainer = document.getElementById('galleryUploadBtnContainer');
    if (galleryUploadContainer && currentUser) {
        galleryUploadContainer.style.display = (uid === currentUser.id) ? 'block' : 'none';
    }

    document.querySelectorAll('.p-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('infoBtn').classList.add('active');

    // პროფილის ნახვების ჩაწერა
    if(uid !== currentUser?.id) {
        await supabase.from('profile_views').upsert({
            viewed_id: uid,
            visitor_id: currentUser.id,
            name: myName,
            photo: myPhoto,
            ts: new Date().toISOString()
        });
    }
 
    // პროფილის მონაცემების წაკითხვა
    supabase.from('users').select('*').eq('id', uid).single().then(({ data: user }) => {
        if(!user) return;
        
        const dot = document.getElementById('profStatusDot');
        const lastSeenSpan = document.getElementById('profLastSeenText');
        
        if(user.presence === 'online') {
            dot.className = 'status-dot online';
            lastSeenSpan.innerText = '';
        } else {
            const dynamicTime = (typeof formatTimeShort === 'function') ? formatTimeShort(user.presence) : '';
            dot.className = dynamicTime ? 'status-dot offline' : 'status-dot';
            lastSeenSpan.innerText = dynamicTime;
        }
        
        document.getElementById('profAva').src = user.photo || "token-avatar.png";
        document.getElementById('profName').innerText = user.name;

        const locRow = document.getElementById('profLocationRow');
        const locText = document.getElementById('profLocationText');
        if (user.city && user.city.trim() !== "") {
            locText.innerText = user.city;
            locRow.style.display = 'flex';
        } else {
            locRow.style.display = 'none';
        }

        // followers/following-ის დათვლა (თუ ეს მონაცემები JSONB-შია)
        const followersCount = user.followers ? Object.keys(user.followers).length : 0;
        const followingCount = user.following ? Object.keys(user.following).length : 0;
        document.getElementById('statFollowersCount').innerText = followersCount;
        document.getElementById('statFollowingCount').innerText = followingCount;
        document.getElementById('followersStatBtn').onclick = () => openSocialList(uid, 'followers');
        document.getElementById('followingStatBtn').onclick = () => openSocialList(uid, 'following');
        
        const controls = document.getElementById('profControls');
        controls.innerHTML = "";
        document.querySelector('.profile-nav').style.display = 'flex';
        document.getElementById('feetStats').style.display = (uid === currentUser.id) ? 'block' : 'none';
        document.getElementById('profTabs').style.display = 'flex';
        document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);
        
        // დანარჩენი UI ლოგიკა (Gifts, Follow buttons) აქ დაამატე იგივე პრინციპით
        // ...
        loadUserVideos(uid);
        applyLanguage();
    });
}

async function showProfileVisitors() {
    document.getElementById('visitorAvaNav').style.display = 'none';
    document.getElementById('feetStats').style.display = 'block';
    localStorage.setItem('last_seen_visitor_ts', Date.now());
    document.getElementById('visitorsUI').style.display = 'flex';
    const list = document.getElementById('visitorsList');
    list.innerHTML = "Loading...";
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: views } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewed_id', user.id)
        .order('ts', { ascending: false });

    if(!views || views.length === 0) { list.innerHTML = "No views"; return; }
    
    const { data: userData } = await supabase.from('users').select('following').eq('id', user.id).single();
    const myFollowing = userData?.following || {};

    list.innerHTML = "";
    views.forEach(v => {
        const isFollowing = myFollowing[v.visitor_id];
        const followBtn = isFollowing ? 
            `<button class="profile-btn btn-outline" style="padding: 5px 12px; font-size: 11px;">${translations[currentLang].following_btn}</button>` :
            `<button class="profile-btn btn-gold" style="padding: 5px 12px; font-size: 11px;" onclick="followFromVisitors('${v.visitor_id}', '${v.name}', '${v.photo}')">${translations[currentLang].follow}</button>`;
        
        list.innerHTML += `
            <div class="visitor-row">
                <div class="visitor-info" onclick="openProfile('${v.visitor_id}'); document.getElementById('visitorsUI').style.display='none'">
                    <img src="${v.photo}" class="visitor-ava">
                    <b style="font-size:14px; color:white;">${v.name}</b>
                </div>
                <div>${v.visitor_id !== user.id ? followBtn : ''}</div>
            </div>`;
    });
}

async function saveProfileChanges() {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = {
        name: document.getElementById('editName').value,
        city: document.getElementById('editCity').value,
        age: document.getElementById('editAge').value,
        relation: document.getElementById('editRelation').value,
        phone: document.getElementById('editPhone').value
    };
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (!error) {
        alert("Saved!");
        document.getElementById('editProfileUI').style.display = 'none';
    }
}

async function showDetailedInfo(uid) {
    const panel = document.getElementById('userDetailedInfoUI');
    const content = document.getElementById('infoContent');
    panel.style.display = 'flex';
    content.innerHTML = "Loading...";
    
    const { data: u } = await supabase.from('users').select('*').eq('id', uid).single();
    if(!u) return;
    
    content.innerHTML = `
        <div class="info-row"><i class="fas fa-user"></i><div><span class="info-val-label">${translations[currentLang].full_name}</span><span class="info-val-text">${u.name || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-map-marker-alt"></i><div><span class="info-val-label">${translations[currentLang].location}</span><span class="info-val-text">${u.city || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-birthday-cake"></i><div><span class="info-val-label">${translations[currentLang].age}</span><span class="info-val-text">${u.age || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-heart"></i><div><span class="info-val-label">${translations[currentLang].relation}</span><span class="info-val-text">${u.relation || '-'}</span></div></div>
        <div class="info-row"><i class="fas fa-phone"></i><div><span class="info-val-label">${translations[currentLang].phone}</span><span class="info-val-text">${u.phone || '-'}</span></div></div>`;
}

async function followUser(targetUid, name, photo) {
    if (!canAfford(1)) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    // აქ უნდა განახლდეს followers/following ცხრილები ან JSONB ველები
    await supabase.rpc('follow_user', { follower_id: user.id, target_id: targetUid }); 
    
    await supabase.from('notifications').insert({
        user_id: targetUid,
        text: `${myName} followed you`,
        ts: new Date().toISOString(),
        from_photo: myPhoto
    });
    spendAkho(1, 'Follow');
}

async function listenToRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    supabase.channel('notifications-' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
            // განაახლე შეტყობინებების ბეჯი
            updateReqBadge();
        }).subscribe();
}

async function loadUserVideos(uid) {
    const grid = document.getElementById('profGrid');
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', uid)
        .order('timestamp', { ascending: false });

    grid.innerHTML = ""; 
    if(!posts) {
        document.getElementById('statVidsCount').innerText = 0;
        return;
    }
    // ... გააგრძელე ვიდეოების ლოგიკა ...
}

async function playFullVideo(url, postId, currentIndex) {
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

    // Touch სვაიპის ლოგიკა რჩება უცვლელი (ის კლიენტურ ნაწილს ეკუთვნის)
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
        // ნახვების მატება (Supabase RPC-ით ან პირდაპირ Update-ით)
        await supabase.rpc('increment_post_views', { p_id: postId });

        const { data: post } = await supabase
            .from('posts')
            .select('*, author_id, author_name, author_photo, views, liked_by, saved_by')
            .eq('id', postId)
            .single();

        if (!post) return;

        window.currentFullVideoAuthorId = post.author_id;
        const ava = document.getElementById('fullVideoAva');
        if (ava) {
            ava.src = post.author_photo || 'https://ui-avatars.com/api/?name=' + post.author_name;
            ava.parentElement.onclick = () => {
                closeFullVideo();
                openProfile(post.author_id);
            };
        }

        const vText = document.getElementById('fullVideoViewsText');
        if (vText) {
            vText.innerText = post.views >= 1000 ? (post.views / 1000).toFixed(1) + 'K' : post.views;
        }

        const lElem = document.getElementById('fullLikeCount');
        const lIcon = document.getElementById('fullLikeIcon');
        const { data: { user } } = await supabase.auth.getUser();
        
        // JSONB ველების შემოწმება
        const likedBy = post.liked_by || {};
        const likesCount = Object.keys(likedBy).length;
        
        if (lElem) lElem.innerText = likesCount;
        if (lIcon) lIcon.style.color = likedBy[user.id] ? '#ff4d4d' : 'white';

        const sIcon = document.getElementById('fullSaveIcon');
        if (sIcon) sIcon.style.color = (post.saved_by && post.saved_by[user.id]) ? 'var(--gold)' : 'white';

        // კომენტარების რაოდენობა
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
        const cElem = document.getElementById('fullCommCount');
        if (cElem) cElem.innerText = count;
    }
}

// --- სოციალური ფუნქციები ---

async function uploadNewAva(inp) {
    const file = inp.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.success) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('users').update({ photo: data.data.url }).eq('id', user.id);
            alert("Done!");
        }
    } catch(e) { alert("Error!"); }
}

async function logoutUser() {
    if(confirm("Logout?")) {
        await supabase.auth.signOut();
        location.reload();
    }
}

// --- ავტორიზაციის ფუნქციები (Supabase Auth) ---

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

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: pass,
            options: { data: { name: name } }
        });

        if (error) {
            showAuthError(error.message);
        } else if (data.user) {
            await supabase.from('users').insert({
                id: data.user.id,
                name: name,
                akho: 50.00,
                photo: "",
                has_seen_rules: false,
                role: 'user',
                privacy: 'public',
                presence: new Date().toISOString()
            });
            if(typeof addToLog === "function") addToLog('Welcome Bonus', 50.00);
            showCustomAlert("მოგესალმებით", "რეგისტრაცია წარმატებულია!");
        }

    } else {
        const email = document.getElementById('uEmail').value.trim();
        const pass = document.getElementById('uPass').value.trim();

        if (!email || !pass) return showAuthError("შეიყვანეთ მეილი და პაროლი");

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass
        });

        if (error) {
            showAuthError("ელფოსტა ან პაროლი არასწორია");
        } else {
            showCustomAlert("მოგესალმებით", "წარმატებით შეხვედით სისტემაში!");
        }
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
        const { data: { user } } = await supabase.auth.getUser();
        const videoName = Date.now() + "_" + file.name;

        // 1. ფაილის ატვირთვა Supabase Storage-ში
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('videos') // დარწმუნდი რომ 'videos' ბაკეტი შექმნილია
            .upload(videoName, file);

        if (uploadError) throw uploadError;

        // 2. საჯარო URL-ის მიღება
        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(videoName);

        // 3. პოსტის ჩაწერა მონაცემთა ბაზაში
        await supabase.from('posts').insert({
            author_id: user.id,
            author_name: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
            author_photo: typeof myPhoto !== 'undefined' ? myPhoto : "",
            text: document.getElementById('videoDesc').value || "",
            media: [{ url: publicUrl, type: 'video' }],
            timestamp: new Date().toISOString()
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

    } catch (err) {
        console.error("კრიტიკული შეცდომა:", err);
        if (progressModal) progressModal.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            btn.innerText = "ატვირთვა";
        }
        alert("შეცდომა: " + err.message);
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
    // ვინაიდან Supabase-დან შესაძლოა ISO სტრინგი მოვიდეს, 
    // New Date(ts) ავტომატურად სწორად დამუშავდება
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
}

async function renderTokenFeed() {
    if (document.getElementById('liveUI').style.display === 'flex') return;
    if (isFeedLoading) return;
    
    isFeedLoading = true;
    const feed = document.getElementById('main-feed');

    // Supabase-ში პოსტების წამოღება თარიღის მიხედვით
    let query = supabase.from('posts').select('*').order('timestamp', { ascending: false });

    if (lastVisibleTimestamp) {
        query = query.lt('timestamp', lastVisibleTimestamp);
    }

    const { data: posts, error } = await query.limit(FEED_LIMIT);
    isFeedLoading = false;

    if (error || !posts || posts.length === 0) return;

    lastVisibleTimestamp = posts[posts.length - 1].timestamp;

    // პოსტების დალაგება (Promoted პოსტები პირველ ადგილზე)
    const sortedPosts = posts.sort((a, b) => {
        const now = new Date().toISOString();
        const aIsPromoted = a.is_promoted && a.promote_expires > now;
        const bIsPromoted = b.is_promoted && b.promote_expires > now;
        if (aIsPromoted && !bIsPromoted) return -1;
        if (!aIsPromoted && bIsPromoted) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    sortedPosts.forEach(post => {
        if (!post.media || !post.media.some(m => m.type === 'video') || document.getElementById(`card-${post.id}`)) return;

        const videoUrl = post.media.find(m => m.type === 'video').url;
        const likeCount = post.liked_by ? Object.keys(post.liked_by).length : 0;
        const isLikedByMe = post.liked_by && post.liked_by[supabase.auth.user().id];
        
        const card = document.createElement('div');
        card.className = 'video-card';
        card.id = `card-${post.id}`;
        
        // UI რენდერი (იგივე რაც გქონდა)
        card.innerHTML = `...`; 
        feed.appendChild(card);
    });
}

async function deleteMyVideo(postId, fileUrl) {
    if (!confirm("ნამდვილად გსურთ ვიდეოს სამუდამოდ წაშლა?")) return;

    try {
        // 1. ფაილის წაშლა Storage-დან
        const fileName = fileUrl.split('/').pop();
        await supabase.storage.from('videos').remove([fileName]);

        // 2. პოსტის წაშლა DB-დან
        await supabase.from('posts').delete().eq('id', postId);
        await supabase.from('comments').delete().eq('post_id', postId);

        const card = document.getElementById(`card-${postId}`);
        if (card) {
            const video = card.querySelector('video');
            if (video) { video.pause(); video.src = ""; video.remove(); }
            card.remove();
        }
        alert("პოსტი წარმატებით წაიშალა!");
    } catch (error) {
        console.error("წაშლის შეცდომა:", error);
        alert("შეცდომა: " + error.message);
    }
}

function setupAutoPlay() {
    if (document.getElementById('messengerUI').style.display === 'flex') return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(async entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            const postId = entry.target.id.replace('card-', '');

            if (entry.isIntersecting) {
                video.style.opacity = "1";
                video.play().catch(e => {}); 
                video.muted = false;

                if (postId && postId !== "") {
                    // Supabase RPC-ით ნახვების ზრდა
                    await supabase.rpc('increment_post_views', { p_id: postId });
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

window.processGift = async function(targetUid, cost, giftUrl) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (user.id === targetUid) return alert("საკუთარ თავს ვერ აჩუქებთ!");
    
    // ბალანსის შემოწმება
    const { data: myData } = await supabase.from('users').select('akho, name, photo').eq('id', user.id).single();
    if (!myData) return alert("მონაცემები ვერ მოიძებნა!");

    const myBalance = myData.akho || 0;
    if (myBalance < cost) return alert("არ გაქვთ საკმარისი AKHO! ❌");

    // ბალანსის დაკლება და საჩუქრის ჩაწერა
    await supabase.from('users').update({ akho: myBalance - cost }).eq('id', user.id);
    
    // target-ისთვის gift_balance-ის გაზრდა
    await supabase.rpc('increment_gift_balance', { t_id: targetUid, amount: cost });

    await supabase.from('received_gifts').insert({
        receiver_id: targetUid,
        gift_url: giftUrl,
        price: cost,
        from_name: myData.name || "მეგობარი", 
        from_photo: myData.photo || "",      
        timestamp: new Date().toISOString()
    });

    // ... ანიმაციის ლოგიკა რჩება უცვლელი ...
};

window.transferToMainBalance = async function(amount) {
    if (!amount || amount <= 0) return alert("გადასატანი არაფერია!");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    await supabase.from('users').update({ gift_balance: 0 }).eq('id', user.id);
    await supabase.rpc('increment_akho_balance', { u_id: user.id, amount: amount });
    await supabase.from('received_gifts').delete().eq('receiver_id', user.id);

    alert("AKHO გადატანილია და კოლექცია გასუფთავდა! ✅");
    // ... modal-ების დახურვის ლოგიკა ...
};

window.buyEuroWithGift = async function(amount) {
    if (!amount || amount < 100) return alert("მინიმუმ 100 AKHO საჭიროა! 💶");

    const euroValue = (amount / 100).toFixed(2);
    if (confirm(`თქვენი ${amount} AKHO გადაიცვლება ${euroValue} ევროდ.\n\nგსურთ გაგრძელება?`)) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('users').update({ gift_balance: 0 }).eq('id', user.id);
        await supabase.rpc('increment_euro_balance', { u_id: user.id, amount: parseFloat(euroValue) });
        
        await supabase.from('euro_history').insert({
            user_id: user.id,
            type: "გადაცვლა",
            amount: euroValue,
            akho_amount: amount,
            timestamp: new Date().toISOString()
        });

        await supabase.from('received_gifts').delete().eq('receiver_id', user.id);
        alert(`წარმატებით გადაიცვალა! ✅`);
        // ... დახურვა და განახლება ...
    }
};

async function showGiftsCollection(uid) {
    const { data: { user } } = await supabase.auth.getUser();
    const isMyProfile = (user && user.id === uid);

    // ... (modal UI კოდი რჩება უცვლელი) ...

    const container = document.getElementById('giftsContainer');
    
    if (isMyProfile) {
        document.getElementById('giftWalletSection').style.display = "block";
        // რეალურ დროში ბალანსის მოსმენა
        supabase.channel('user-gift-bal')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, payload => {
                const bal = payload.new.gift_balance || 0;
                document.getElementById('giftBalanceDisplay').innerText = `${bal} AKHO`;
                document.getElementById('transferBtn').onclick = () => window.transferToMainBalance(bal);
                document.getElementById('buyEuroBtn').onclick = () => window.buyEuroWithGift(bal);
            }).subscribe();
    }

    const { data: gifts } = await supabase
        .from('received_gifts')
        .select('*')
        .eq('receiver_id', uid)
        .order('timestamp', { ascending: false });

    container.innerHTML = "";
    if(!gifts || gifts.length === 0) { 
        container.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:gray;'>საჩუქრები არ არის</p>"; 
        return; 
    }

    gifts.forEach(gift => {
        container.innerHTML += `
            <div style="background:rgba(255,255,255,0.05); border:1px solid #333; border-radius:15px; padding:15px; text-align:center;">
                <img src="${gift.gift_url}" style="width:80px; height:80px; object-fit:contain; margin-bottom:10px;">
                <div style="color:#d4af37; font-weight:bold; font-size:14px;">${gift.price} AKHO</div>
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid #222;">
                    <img src="${gift.from_photo || 'https://ui-avatars.com/api/?name='+gift.from_name}" style="width:20px; height:20px; border-radius:50%; border:1px solid #d4af37;">
                    <span style="font-size:11px; color:#aaa;">${gift.from_name}</span>
                </div>
            </div>`;
    });
}

window.showFinancialWallet = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    // მონაცემების წამოღება ერთ ჯერზე
    const { data: userData } = await supabase.from('users').select('euro_balance').eq('id', user.id).single();
    const euroBal = userData?.euro_balance || 0;
    const canCashOut = euroBal >= 50;

    const modal = document.createElement('div');
    modal.id = "financialWalletModal";
    // ... (შემდგომი UI ლოგიკა, სადაც euroBal გამოიყენება) ...
};

window.showEuroHistory = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    const historyModal = document.createElement('div');
    // ... (UI კოდი) ...

    const { data: history } = await supabase
        .from('euro_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

    const list = document.getElementById('euroHistoryList');
    list.innerHTML = "";
    
    if(!history || history.length === 0) {
        list.innerHTML = "<div style='text-align:center; margin-top:50px;'><i class='fas fa-receipt' style='font-size:40px; color:#333;'></i><p style='color:gray; margin-top:10px;'>ისტორია ცარიელია</p></div>";
        return;
    }

    history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString('ka-GE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        const isWithdraw = (item.type === "გატანა" || item.type === "withdraw");
        // ... (დარჩენილი რენდერის ლოგიკა) ...
    });
};

window.showRechargeAKHO = async function() {
    const modal = document.createElement('div');
    modal.id = "rechargeAkhoModal";
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000050; display:flex; flex-direction:column; color:white; font-family:sans-serif;";
    
    // ... (packages და modal.innerHTML რჩება უცვლელი) ...
    
    document.body.appendChild(modal);

    const { data: { user } } = await supabase.auth.getUser();
    
    // რეალურ დროში ბალანსის განახლება
    supabase.channel('user-akho-bal')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
            if(document.getElementById('currentCoinBalance')) {
                document.getElementById('currentCoinBalance').innerText = payload.new.akho || 0;
            }
        }).subscribe();
        
    // საწყისი მნიშვნელობის წამოღება
    const { data: userData } = await supabase.from('users').select('akho').eq('id', user.id).single();
    if(document.getElementById('currentCoinBalance')) {
        document.getElementById('currentCoinBalance').innerText = userData?.akho || 0;
    }
};

// ... (selectPackage და confirmPurchase რჩება უცვლელი) ...

async function react(postId, ownerUid) {
    if (!canAfford(0.1)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: post } = await supabase.from('posts').select('liked_by').eq('id', postId).single();
    let likedBy = post?.liked_by || {};
    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likeSpan = document.getElementById(`like-count-${postId}`);

    if (likedBy[user.id]) {
        // მოხსნა
        delete likedBy[user.id];
        if(likeBtn) likeBtn.classList.remove('liked');
        likeSpan.innerText = parseInt(likeSpan.innerText) - 1;
    } else {
        // დამატება
        likedBy[user.id] = { type: '❤️', photo: myPhoto, name: myName };
        if(likeBtn) likeBtn.classList.add('liked');
        likeSpan.innerText = parseInt(likeSpan.innerText) + 1;
        
        if(typeof showFloatingLike === "function") showFloatingLike(postId, myPhoto);
        spendAkho(0.1, 'Like'); 
        
        if (ownerUid !== user.id) {
            earnAkho(ownerUid, 2.00, 'Impact (Like)'); 
        }
    }

    await supabase.from('posts').update({ liked_by: likedBy }).eq('id', postId);
}

async function toggleSavePost(postId) {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    
    const { data: post } = await supabase.from('posts').select('saved_by, saves').eq('id', postId).single();
    let savedBy = post.saved_by || {};
    let saves = post.saves || 0;

    if(savedBy[user.id]) {
        delete savedBy[user.id];
        saves = Math.max(0, saves - 1);
        document.getElementById(`save-btn-${postId}`).classList.remove('saved');
    } else {
        savedBy[user.id] = true;
        saves = saves + 1;
        document.getElementById(`save-btn-${postId}`).classList.add('saved');
    }

    await supabase.from('posts').update({ saved_by: savedBy, saves: saves }).eq('id', postId);
    document.getElementById(`save-count-${postId}`).innerText = saves;
}

function shareVideo(postId, url) {
    if (navigator.share) {
        navigator.share({ url: url }).then(() => {
            supabase.rpc('increment_post_shares', { p_id: postId });
        });
    } else {
        alert("Link: " + url);
        supabase.rpc('increment_post_shares', { p_id: postId });
    }
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
            const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) finalUrl = data.data.url;
            else { alert("ფოტოს ატვირთვა ვერ მოხერხდა"); btn.disabled = false; return; }
        }

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('community_posts').insert({
            author_id: user.id,
            author_name: myName,
            author_photo: myPhoto,
            text: text,
            image: finalUrl,
            timestamp: new Date().toISOString()
        });

        spendAkho(2, 'Community Post');
        document.getElementById('wallPostText').value = "";
        cancelWallImg();
        loadCommunityPosts();
        alert("პოსტი გამოქვეყნდა!");
    } catch (err) {
        alert("კავშირის შეცდომა!");
    } finally {
        btn.disabled = false; btn.innerText = "გამოქვეყნება";
    }
}

async function loadCommunityPosts() {
    const box = document.getElementById('communityPostsList');
    if (!box) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: posts } = await supabase
        .from('community_posts')
        .select('*')
        .order('timestamp', { ascending: false });

    box.innerHTML = "";
    if (!posts) return;

    for (const post of posts) {
        const isLiked = (user && post.likes && post.likes[user.id]);
        const likeCount = post.likes ? Object.keys(post.likes).length : 0;
        
        // კომენტარების დათვლა
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        const card = document.createElement('div');
        card.className = "post-card";
        card.innerHTML = `
            <div class="post-header">...</div>
            ${post.text ? `<p>${post.text}</p>` : ''}
            ${post.image ? `<img src="${post.image}" onclick="previewImage('${post.image}')">` : ''}
            <div class="actions">
                <div onclick="window.toggleWallLike('${post.id}', '${post.author_id}')">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span>${likeCount}</span>
                </div>
                <div onclick="openComments('${post.id}', '${post.author_id}')">
                    <i class="far fa-comment"></i>
                    <span>${count}</span>
                </div>
            </div>`;
        box.appendChild(card);
    }
}

window.reportPost = async function(postId, authorId, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    
    if (confirm("ნამდვილად გსურთ ამ პოსტის დარეპორტება?")) {
        await supabase.from('reports').insert({
            post_id: postId,
            author_id: authorId,
            reporter_id: user.id,
            reporter_name: myName,
            content_preview: content.substring(0, 100),
            timestamp: new Date().toISOString()
        });
        alert("მადლობა, რეპორტი გაიგზავნა.");
    }
};

window.toggleWallLike = async function(postId, ownerUid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");

    const { data: post } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
    let likes = post?.likes || {};

    if (likes[user.id]) {
        delete likes[user.id];
    } else {
        likes[user.id] = { name: myName, photo: myPhoto };
        if (ownerUid && ownerUid !== user.id) {
            await supabase.from('notifications').insert({
                user_id: ownerUid,
                text: myName + "-მა თქვენი პოსტი დააგულა ❤️",
                from_photo: myPhoto || '',
                from_uid: user.id,
                timestamp: new Date().toISOString(),
                type: 'like'
            });
        }
    }
    await supabase.from('community_posts').update({ likes: likes }).eq('id', postId);
    loadCommunityPosts();
};

window.deleteWallPost = async function(postId) {
    if (confirm("ნამდვილად გსურთ პოსტის წაშლა?")) {
        await supabase.from('community_posts').delete().eq('id', postId);
        loadCommunityPosts();
    }
};

async function sendVoiceMessage(blob) {
    const targetId = window.currentChatId; 
    if (!targetId) return alert("ჯერ აირჩიეთ ჩატი!");
    if (!canAfford(0.5)) return; 

    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, targetId);
    const fileName = `voice_${Date.now()}.mp3`;

    try {
        // 1. ფაილის ატვირთვა Supabase Storage-ში
        const { error: uploadError } = await supabase.storage
            .from('chat_audio')
            .upload(`${chatId}/${fileName}`, blob);
            
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('chat_audio').getPublicUrl(`${chatId}/${fileName}`);

        // 2. მესიჯის ჩაწერა DB-ში
        await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: user.id,
            audio: publicUrl,
            ts: new Date().toISOString(),
            seen: false
        });

        spendAkho(0.5, 'Voice Message');
        if (typeof sendPushToUser === "function") {
            sendPushToUser(targetId, myName, "🎤 Voice Message");
        }
    } catch (err) { 
        alert("ატვირთვის შეცდომა: " + err.message); 
    }
}

// --- აუდიო და ინტერფეისის მართვა ---
function playPauseAudio(msgId) {
    const ws = waveSurfers[msgId];
    const icon = document.getElementById(`icon-${msgId}`);
    if (!ws) return;

    if (ws.isPlaying()) {
        ws.pause();
        icon.className = 'fas fa-play';
    } else {
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

function toggleMoreMenu(postId) {
    const panel = document.getElementById('more-menu-panel');
    panel.classList.toggle('active');
    if (postId) window.currentSelectedPost = postId;
}

function downloadVideo(postId) {
    alert("ვიდეოს გადმოწერა დაიწყო პოსტისთვის: " + postId);
    toggleMoreMenu();
}

// --- გლობალური გაუხსნელი მესიჯების მრიცხველი ---
async function startGlobalUnreadCounter() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const chatBadge = document.getElementById('chatCountBadge');

    // 1. ვიღებთ მომხმარებლის ბოლო წაკითხვის დროს
    const { data: userData } = await supabase.from('users').select('last_read').eq('id', user.id).single();
    const lastReadData = userData?.last_read || {};

    // 2. ვუსმენთ მესიჯებს რეალურ დროში
    supabase.channel('unread-counter')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
            updateUnreadCount(user.id, lastReadData, chatBadge);
        }).subscribe();
        
    updateUnreadCount(user.id, lastReadData, chatBadge);
}

async function updateUnreadCount(myUid, lastReadData, chatBadge) {
    // 3. ვიღებთ ყველა ჩატს, სადაც მომხმარებელი მონაწილეობს
    const { data: msgs } = await supabase
        .from('messages')
        .select('chat_id, sender_id, ts')
        .or(`chat_id.ilike.%${myUid}%`); // მარტივი ფილტრი chat_id-სთვის

    let totalUnread = 0;
    const latestMessages = {};

    // ვპოულობთ თითოეული ჩატის ბოლო მესიჯს
    msgs?.forEach(m => {
        if (!latestMessages[m.chat_id] || new Date(m.ts) > new Date(latestMessages[m.chat_id].ts)) {
            latestMessages[m.chat_id] = m;
        }
    });

    Object.keys(latestMessages).forEach(chatId => {
        const lastMsg = latestMessages[chatId];
        const lastRead = lastReadData[chatId] || 0;

        if (lastMsg.sender_id !== myUid && new Date(lastMsg.ts).getTime() > new Date(lastRead).getTime()) {
            totalUnread++;
        }
    });

    if (chatBadge) {
        chatBadge.innerText = totalUnread;
        chatBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
    }
}

async function loadMySavedPosts() {
    const grid = document.getElementById('profGrid');
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid');
    grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>იტვირთება შენახულები...</p>";
    
    // Supabase-ში ვეძებთ პოსტებს, სადაც saved_by JSONB ველში არის ეს მომხმარებელი
    // ვინაიდან JSONB-ში პირდაპირი ძებნა რთულია, ყველაზე მარტივი გზაა 
    // წამოვიღოთ ყველა პოსტი და გავფილტროთ კლიენტის მხარეს:
    const { data: posts, error } = await supabase.from('posts').select('*');
    
    grid.innerHTML = "";
    if(!posts || error) {
        grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>შენახული ვიდეოები არ არის</p>";
        return;
    }

    let savedCount = 0;
    posts.forEach(post => {
        // saved_by ველი უნდა იყოს ობიექტი { uid: true }
        if(post.saved_by && post.saved_by[viewUid]) {
            const video = post.media ? post.media.find(m => m.type === 'video') : null;
            if(video) {
                savedCount++;
                const item = document.createElement('div');
                item.className = 'grid-item';
                item.innerHTML = `
                    <video src="${video.url}" muted></video>
                    <i class="fas fa-bookmark" style="position:absolute; top:8px; right:8px; color:var(--gold); font-size:12px; filter: drop-shadow(0 0 2px black);"></i>`;
                item.onclick = () => playFullVideo(video.url, post.id, 0);
                grid.appendChild(item);
            }
        }
    });

    if(savedCount === 0) {
        grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; grid-column: 1 / -1;'>შენახული ვიდეოები არ არის</p>";
    }
}

// openUploadModal ფუნქციაში კამერის ლოგიკა რჩება უცვლელი, 
// რადგან ის ბრაუზერის MediaDevices API-ს იყენებს და არა Firebase-ს.
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

            // კამერის და მიკროფონის კონფიგურაცია რჩება უცვლელი
            window.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 }, aspectRatio: 9/16 },
                audio: { echoCancellation: { ideal: false }, noiseSuppression: { ideal: false }, autoGainControl: { ideal: false }, sampleRate: 48000, sampleSize: 16, channelCount: 1, latency: 0 } 
            });
            
            if (video) {
                video.srcObject = window.videoStream;
                video.setAttribute('playsinline', '');
                video.setAttribute('autoplay', '');
                video.muted = true; 
                video.style.transform = "scaleX(-1)"; 
                video.style.display = 'block';
                video.play().catch(e => console.log("ავტომატური გაშვების შეცდომა:", e));
                if (placeholder) placeholder.style.display = 'none';
            }
        } catch (err) {
            alert("კამერა ვერ ჩაირთო. შეამოწმეთ ნებართვები პარამეტრებში.");
        }
   }
}

// კამერის გაშვება და სტრიმის მართვა
async function startLiveCamera() {
    const video = document.getElementById('cameraStream');
    const placeholder = document.getElementById('placeholderText');
    const recordInner = document.getElementById('recordInner');

    if (window.videoStream) {
        window.videoStream.getTracks().forEach(track => track.stop());
    }

    try {
        window.videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        if (video) {
            video.srcObject = window.videoStream;
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            video.muted = true; 
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
        console.error("კამერის შეცდომა:", err);
        alert("კამერა ვერ ჩაირთო: " + err.message);
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
    stopCamera();
}

function stopCamera() {
    if (window.videoStream) {
        window.videoStream.getTracks().forEach(track => track.stop());
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

// ჩაწერის ტაიმერის ლოგიკა
let timerInterval = null;
let seconds = 0;
const RECORDING_LIMIT = 60;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    seconds = 0;
    const minElem = document.getElementById('timerMinutes');
    const secElem = document.getElementById('timerSeconds');
    const timerElement = document.getElementById('recordingTimer');

    if (timerElement) timerElement.style.display = 'flex';
    
    timerInterval = setInterval(() => {
        seconds++;
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        
        if (minElem) minElem.innerText = mins;
        if (secElem) secElem.innerText = secs;

        if (seconds >= RECORDING_LIMIT) {
            stopTimer();
            if (window.globalMediaRecorder) {
                window.globalMediaRecorder.stop();
            }
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
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const timerElement = document.getElementById('recordingTimer');
    if (timerElement) timerElement.style.display = 'none';
}

// კამერის გადართვა (front/back)
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

// ჩაწერის ლოგიკა (Canvas ფილტრებით და აუდიოს შერწყმით)
async function toggleRecording() {
    const btnInner = document.getElementById('recordInner');
    const videoInput = document.getElementById('videoInput');
    const video = document.getElementById('cameraStream');

    const isActuallyRecording = typeof globalMediaRecorder !== 'undefined' && globalMediaRecorder && globalMediaRecorder.state === "recording";

    // ქაუნთდაუნის ლოგიკა (რჩება უცვლელი)
    if (countdownTime > 0 && !isActuallyRecording && !isCounting) {
        // ... (countdown ლოგიკა შენი კოდიდან) ...
        return; 
    }

    try {
        if (!isActuallyRecording) {
            // ... (MediaRecorder-ის ინიციალიზაცია და DrawFrame ლოგიკა შენი კოდიდან) ...
            globalMediaRecorder.start();
            if (typeof startTimer === "function") startTimer();
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
        console.error("Recording error:", err);
    }
}

// --- პაროლის აღდგენა ---
async function handleForgotPassword() {
    const emailInput = document.getElementById('uEmail'); // შენს კოდში 'uEmail' გამოიყენება
    const emailValue = emailInput.value.trim();

    if (!emailValue) {
        alert("გთხოვთ, ჯერ ჩაწეროთ მეილი Email / ელფოსტა ველში!");
        emailInput.focus();
        return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: 'https://emigrantbook.com/reset-password',
    });

    if (error) {
        alert("შეცდომა: " + error.message);
    } else {
        alert("პაროლის აღდგენის ინსტრუქცია გამოგზავნილია თქვენს მეილზე: " + emailValue);
    }
}

// --- PWA და ინსტალაცია (რჩება უცვლელი) ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
        });
    }
}

// --- შეტყობინებები და Push ---
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

// Push შეტყობინების გაგზავნა Supabase Edge Function-ის მეშვეობით
async function sendPushToUser(targetUid, senderName, text) {
    // ვღებულობთ ტოკენს ჩვენი Supabase ცხრილიდან
    const { data: userData } = await supabase.from('users').select('fcm_token').eq('id', targetUid).single();
    const token = userData?.fcm_token;

    if (token) {
        // აქ იძახებ შენს Supabase Edge Function-ს, რომელიც გააგზავნის FCM შეტყობინებას
        // ეს უფრო დაცულია, ვიდრე კლიენტში API KEY-ს შენახვა
        await supabase.functions.invoke('send-push', {
            body: {
                token: token,
                title: senderName,
                body: text
            }
        });
    }
}

// ბეჯის ფუნქციები რჩება უცვლელი
function setAppBadge(count) {
    if ('setAppBadge' in navigator) {
        if (count > 0) navigator.setAppBadge(count).catch(e => {});
        else navigator.clearAppBadge().catch(e => {});
    }
}

async function saveMessagingToken(user) {
    console.log("ნაბიჯი 1: ვიწყებთ FCM ტოკენის მიღებას...");

    try {
        // FCM-ის ინიციალიზაცია (აუცილებელია firebase-messaging SDK)
        const messaging = firebase.messaging();
        
        await messaging.requestPermission();
        const token = await messaging.getToken({
            vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk'
        });

        if (token) {
            // ტოკენის შენახვა Supabase-ში
            await supabase
                .from('users')
                .update({ 
                    fcm_token: token,
                    messaging_status: "active" 
                })
                .eq('id', user.uid);
            
            console.log("ნაბიჯი 4: Supabase-ში ჩაიწერა! ✅");
        }
    } catch (err) {
        console.error("კრიტიკული შეცდომა:", err);
    }
}

async function handleLikeFromFull() {
    const postId = window.currentFullVideoId;
    if (!postId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ვიღებთ მიმდინარე ლაიქების სიას
    const { data: post } = await supabase
        .from('posts')
        .select('liked_by, author_id')
        .eq('id', postId)
        .single();

    let likedBy = post?.liked_by || {};

    if (likedBy[user.id]) {
        // ლაიქის მოხსნა
        delete likedBy[user.id];
    } else {
        // ლაიქის დამატება
        likedBy[user.id] = { 
            type: '❤️', 
            photo: myPhoto, 
            name: myName 
        };
        
        // თუ პოსტის ავტორი სხვაა, ვარიცხავთ AKHO-ს
        if (post && post.author_id !== user.id) {
            earnAkho(post.author_id, 2.00, 'Impact (Like from Full)');
        }
    }

    // მონაცემების განახლება
    await supabase.from('posts').update({ liked_by: likedBy }).eq('id', postId);

    // ეკრანის განახლება
    setTimeout(() => {
        playFullVideo(document.getElementById('fullVideoTag').src, postId, window.currentVideoIndex);
    }, 300);
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

function openCommentsFromFull() {
    if (!window.currentFullVideoId) return;

    const commUI = document.getElementById('commentsUI');
    const overlay = document.getElementById('fullVideoOverlay');
    const vid = document.getElementById('fullVideoTag');
    const sideMenu = document.querySelector('#fullVideoOverlay .video-side-menu');

    if (commUI && overlay) {
        overlay.appendChild(commUI);
        commUI.style.display = "flex";
        commUI.style.zIndex = "9999999";

        overlay.classList.add('hide-menu-now');
        if (sideMenu) {
            sideMenu.style.opacity = "0";
            sideMenu.style.pointerEvents = "none";
        }
        if (vid) vid.pause();

        const closeBtn = commUI.querySelector('span[onclick*="commentsUI"]');
        if (closeBtn) {
            closeBtn.onclick = function() {
                commUI.style.display = 'none';
                if (vid) vid.play();
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

async function saveVideoFromFull() {
    const postId = window.currentFullVideoId;
    if (!postId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ვიღებთ პოსტს, რომ ვნახოთ ვინ შეინახა
    const { data: post } = await supabase.from('posts').select('saved_by').eq('id', postId).single();
    let savedBy = post?.saved_by || {};

    if (savedBy[user.id]) {
        // წაშლა
        delete savedBy[user.id];
        document.getElementById('fullSaveIcon').style.color = 'white';
    } else {
        // დამატება
        savedBy[user.id] = true;
        document.getElementById('fullSaveIcon').style.color = 'var(--gold)';
    }

    // განახლება Supabase-ში
    await supabase.from('posts').update({ saved_by: savedBy }).eq('id', postId);
}

// --- ვიდეოს გაზიარება და UI მართვა ---
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

// --- ინიციალიზაცია და ნებართვები ---
async function askInitialPermissions() {
    if (localStorage.getItem('initial_permissions_asked')) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(track => track.stop());
        if ("geolocation" in navigator) navigator.geolocation.getCurrentPosition(() => {}, () => {});
        if ("Notification" in window) await Notification.requestPermission();
        localStorage.setItem('initial_permissions_asked', 'true');
    } catch (err) { console.warn(err); }
}

// FCM ტოკენის დაყენება (Supabase-ში)
window.addEventListener('load', async () => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // აქ FCM ტოკენის მიღება ხდება Firebase-ის მეშვეობით, 
            // ხოლო შედეგი იწერება Supabase-ში
            const reg = await navigator.serviceWorker.ready;
            const messaging = firebase.messaging(); // Firebase Messaging რჩება FCM-ისთვის
            const token = await messaging.getToken({
                vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk',
                serviceWorkerRegistration: reg
            });
            
            const { data: { user } } = await supabase.auth.getUser();
            if (user && token) {
                await supabase.from('users').update({ fcm_token: token }).eq('id', user.id);
            }
        }
    }
});

// --- ინვოისების გაგზავნა ---
async function sendRealInvoice() {
    const btn = document.getElementById('send_inv_btn');
    const name = document.getElementById('inv_customer_name').value;
    const email = document.getElementById('inv_customer_email').value;
    const amount = document.getElementById('inv_amount').value;
    const inv_no = "EB-" + Math.floor(1000 + Math.random() * 9000);

    if(!name || !email || !amount) {
        alert("გთხოვთ, შეავსოთ სახელი, მეილი და თანხა!");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> იგზავნება...';

    try {
        // EmailJS რჩება როგორც გარე სერვისი
        await emailjs.send('service_hjiqge4', 'template_50xhnnm', {
            to_name: name,
            to_email: email,
            order_id: inv_no,
            total_price: amount + " €",
            reply_to: "support@emigrantbook.com"
        });

        // ინვოისის ჩაწერა Supabase-ში
        await supabase.from('sent_invoices').insert({
            customer: name,
            email: email,
            amount: amount,
            date: new Date().toISOString(),
            invoice_no: inv_no,
            status: "Sent"
        });

        alert("✅ ინვოისი წარმატებით გაეგზავნა!");
    } catch (error) {
        alert("შეცდომა გაგზავნისას");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> ინვოისის გაგზავნა';
    }
}

// --- ინვოისების ისტორია ---
async function loadInvoiceHistory() {
    const tableBody = document.getElementById('invoice_history_body');
    const { data, error } = await supabase
        .from('sent_invoices')
        .select('*')
        .order('date', { ascending: false });

    tableBody.innerHTML = "";
    if (error || !data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">ისტორია ცარიელია</td></tr>';
        return;
    }

    data.forEach((item) => {
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #eee";
        row.innerHTML = `
            <td style="padding: 15px; color: #aaa;">${new Date(item.date).toLocaleDateString()}</td>
            <td style="padding: 15px; font-weight: bold; color: white;">${item.customer}</td>
            <td style="padding: 15px; color: var(--gold); font-family: monospace;">${item.invoice_no || '---'}</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; color: #4ade80;">${item.amount} €</td>
            <td style="padding: 15px; text-align: center;">
                <span style="background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 10px; border: 1px solid rgba(74, 222, 128, 0.2);">
                    ${item.status}
                </span>
            </td>`;
        tableBody.appendChild(row);
    });
}

// --- ჩატის სურათის ატვირთვა ---
async function uploadChatImage(input) {
    if (!input.files || !input.files[0] || !currentChatId) return;
    const file = input.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, currentChatId);

    try {
        const filePath = `chat_images/${chatId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('chat_images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('chat_images').getPublicUrl(filePath);

        await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: user.id,
            image: publicUrl,
            ts: new Date().toISOString(),
            seen: false
        });

        if (typeof sendPushToUser === "function") sendPushToUser(currentChatId, myName, "📷 Photo");
        input.value = ""; 
    } catch (error) {
        alert("ვერ მოხერხდა ფოტოს გაგზავნა: " + error.message);
    }
}

// --- ვიზიტორების შემოწმება ---
async function checkNewVisitors(myUid) {
    const feet = document.getElementById('feetStats');
    const ava = document.getElementById('visitorAvaNav');
    if (!feet || !ava) return;

    const { data: visitor } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewed_id', myUid)
        .order('ts', { ascending: false })
        .limit(1)
        .single();

    if (!visitor) {
        feet.style.display = 'block';
        return;
    }

    const lastSeenTs = localStorage.getItem('last_seen_visitor_ts') || 0;
    if (new Date(visitor.ts).getTime() > lastSeenTs) {
        feet.style.display = 'none';
        ava.src = visitor.photo || "token-avatar.png";
        ava.style.display = 'block';
    } else {
        feet.style.display = 'block';
        ava.style.display = 'none';
    }
}

// --- გაზიარება და Wall-ის მართვა ---
window.openShare = async function(postId, url) {
    const siteLink = `https://emigrantbook.com/?v=${postId}`;
    if (navigator.share) {
        navigator.share({ title: 'Emigrantbook', url: siteLink });
    } else {
        navigator.clipboard.writeText(siteLink);
        alert("ბმული დაკოპირებულია! ✅");
    }
    // გაზიარებების მატება RPC-ით
    await supabase.rpc('increment_post_shares', { p_id: postId });
};

window.toggleWallTag = async function(postId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    
    const { data: post } = await supabase.from('community_posts').select('tagged_by').eq('id', postId).single();
    let taggedBy = post?.tagged_by || {};

    const btn = event.currentTarget.querySelector('i');
    const span = event.currentTarget.querySelector('span');

    if (taggedBy[user.id]) {
        delete taggedBy[user.id];
        btn.className = "far fa-user-tag";
        btn.style.color = "#888";
        span.innerText = "მონიშვნა";
    } else {
        taggedBy[user.id] = true;
        btn.className = "fas fa-user-tag";
        btn.style.color = "var(--gold)";
        span.innerText = "მონიშნულია";
    }
    await supabase.from('community_posts').update({ tagged_by: taggedBy }).eq('id', postId);
};

window.loadMyTaggedWallPosts = async function(targetUid) {
    let box = document.getElementById('userTaggedPostsList');
    const profGrid = document.getElementById('profGrid');
    
    // UI სტრუქტურის შექმნა (იგივეა)
    if (!box) {
        box = document.createElement('div');
        box.id = 'userTaggedPostsList';
        box.style = 'display:flex; flex-direction:column; gap:15px; padding:10px;';
        if (profGrid && profGrid.parentNode) {
            profGrid.parentNode.insertBefore(box, profGrid.nextSibling);
        } else {
            document.body.appendChild(box);
        }
    }
    
    box.style.display = 'flex';
    box.innerHTML = "<p style='color:var(--gold); text-align:center; padding:20px;'>იტვირთება...</p>";

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>გთხოვთ გაიაროთ ავტორიზაცია</p>";
        return;
    }

    const uidToLoad = targetUid ? targetUid : user.id;

    // პოსტების წამოღება
    const { data: posts, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('timestamp', { ascending: false });

    box.innerHTML = ""; 
    if (error || !posts) {
        box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>ბაზაში პოსტები არ არის</p>";
        return;
    }

    let count = 0;
    posts.forEach(post => {
        // შემოწმება: tagged_by არის JSONB, ვამოწმებთ შეიცავს თუ არა uidToLoad-ს
        if (post.tagged_by && post.tagged_by[uidToLoad]) {
            count++;
            const isLiked = (post.likes && post.likes[user.id]);
            const likeCount = post.likes ? Object.keys(post.likes).length : 0;
            const postTime = post.timestamp ? formatTimeShort(post.timestamp) : "";
            
            const card = document.createElement('div');
            card.className = "post-card";
            card.innerHTML = `
                <div class="post-header" style="display:flex; align-items:center; margin-bottom:10px; cursor:pointer;" onclick="openProfile('${post.author_id}')">
                    <img src="${post.author_photo || 'https://ui-avatars.com/api/?name='+post.author_name}" style="width:35px; height:35px; border-radius:50%; border:1px solid var(--gold); object-fit:cover; margin-right:10px;">
                    <div style="display:flex; flex-direction:column;">
                        <b style="color:white; font-size:14px;">${post.author_name}</b>
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
};

// --- ფილტრები და ეფექტები (რჩება უცვლელი) ---
// ეს ფუნქციები მუშაობენ DOM-ზე და Canvas-ზე, ამიტომ არ საჭიროებენ ცვლილებას.

// --- მუსიკის ჩამტვირთავი (Supabase Storage-ზე გადაყვანილი) ---
async function renderSongs() {
    const list = document.getElementById('music-list');
    if (!list) return;
    list.innerHTML = "<p style='color:white; padding:15px;'>იტვირთება მუსიკები...</p>";

    try {
        // Supabase Storage-დან ფაილების ჩამოსათვლელად ვიყენებთ list მეთოდს
        const { data: files, error } = await supabase.storage
            .from('musics') // უნდა გქონდეს შექმნილი bucket 'musics'
            .list('', { limit: 100 });

        if (error || !files || files.length === 0) {
            list.innerHTML = "<p style='color:white; padding:15px;'>საქაღალდე 'musics' ცარიელია ან შეცდომაა.</p>";
            return;
        }

        const promises = files.map(async (file) => {
            const { data: { publicUrl } } = supabase.storage.from('musics').getPublicUrl(file.name);
            const duration = await getDuration(publicUrl);
            const fileName = file.name.replace('.mp3', '').replace(/_/g, ' ');
            return { url: publicUrl, name: fileName, duration: duration };
        });

        const songsData = await Promise.all(promises);
        list.innerHTML = songsData.map(s => `
            <div class="music-item-row" onclick="pickSong('${s.url}', '${s.name}')" style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #222; cursor:pointer;">
                <div style="width:50px; height:50px; border-radius:4px; margin-right:15px; background:#333; display:flex; align-items:center; justify-content:center; font-size:20px;">🎵</div>
                <div style="flex:1;">
                    <div style="font-weight:500; color:white; font-size:15px;">${s.name}</div>
                    <div style="color:#888; font-size:13px;">Storage · ${s.duration}</div>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error("მუსიკის ჩატვირთვის შეცდომა:", error);
        loadMusicFromDB(); // თუ საჭიროა ალტერნატიული მეთოდი მონაცემთა ბაზიდან
    }
}

// დამხმარე ფუნქცია მუსიკის ხანგრძლივობისთვის
async function getDuration(url) {
    return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            resolve(`${mins}:${secs.toString().padStart(2, '0')}`);
        };
        audio.onerror = () => resolve("0:00");
    });
}

// --- მუსიკების ჩატვირთვა მონაცემთა ბაზიდან ---
async function loadMusicFromDB() {
    const list = document.getElementById('music-list');
    if (!list) return;

    try {
        const { data: musics, error } = await supabase.from('musics').select('*');
        if (error || !musics || musics.length === 0) return;

        list.innerHTML = "";
        for (const s of musics) {
            const realTime = await getDuration(s.url);
            const row = document.createElement('div');
            row.className = "music-item-row";
            row.style = "display:flex; align-items:center; padding:12px; border-bottom:1px solid #222; cursor:pointer;";
            row.innerHTML = `
                <img src="${s.img || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:4px; margin-right:15px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:500; color:white;">${s.name || s.title}</div>
                    <div style="color:#888; font-size:12px;">${s.artist || 'Artist'} · ${realTime}</div>
                </div>`;
            row.onclick = () => pickSong(s.url, s.name || s.title);
            list.appendChild(row);
        }
    } catch (e) {
        console.error("მუსიკის ჩატვირთვის შეცდომა:", e);
    }
}

// --- ვიდეოს პრომოუტი ---
async function openPromoteUI() {
    const menu = document.getElementById('more-menu-panel');
    if (menu) menu.classList.remove('active'); 
    document.getElementById('promoteUI').style.display = 'flex';
    selectedEbVideoId = null;
    window.selectedEbPrice = 0;
    
    const btn = document.getElementById('ebPayBtn');
    btn.disabled = true;
    btn.style.opacity = "0.5";
    document.getElementById('ebTotal').innerText = "0,00 $";

    const grid = document.getElementById('promoteVideoGrid');
    grid.innerHTML = "";
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, media, views')
        .eq('author_id', user.id)
        .order('timestamp', { ascending: false });

    if (posts) {
        posts.forEach(post => {
            const video = post.media ? post.media.find(m => m.type === 'video') : null;
            if (video) {
                grid.innerHTML += `
                <div onclick="selectEbVideo('${post.id}')" id="vid-${post.id}" style="min-width:100px; height:130px; background:#1a1a1a; border-radius:8px; overflow:hidden; border:2px solid transparent; position:relative; flex-shrink:0;">
                    <video src="${video.url}" style="width:100%; height:100%; object-fit:cover; opacity:0.7;"></video>
                    <div style="position:absolute; bottom:5px; left:5px; font-size:10px;"><i class="fas fa-play"></i> ${post.views || 0}</div>
                </div>`;
            }
        });
    }
}

async function startPayment() {
    if (!selectedEbVideoId || !window.selectedEbPrice) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const akhoPrice = Math.ceil(window.selectedEbPrice * 10); 

    // 1. მომხმარებლის ბალანსის წამოღება
    const { data: userData } = await supabase.from('users').select('akho').eq('id', user.id).single();
    const currentBalance = userData?.akho || 0;

    if (currentBalance < akhoPrice) {
        alert("ბალანსი არ გყოფნით!");
        return;
    }

    // 2. ბალანსის განახლება და პოსტის დაწინაურება
    try {
        // ბალანსის დაკლება
        await supabase.from('users').update({ akho: currentBalance - akhoPrice }).eq('id', user.id);
        
        // პოსტის დაწინაურება (timestamp-ის განახლებაც ხდება)
        const now = new Date().toISOString();
        const expireDate = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();
        
        await supabase.from('posts').update({
            is_promoted: true,
            promote_expires: expireDate,
            promote_weight: window.selectedEbPrice,
            timestamp: now 
        }).eq('id', selectedEbVideoId);

        alert("ვიდეო დაწინაურდა და ამოვარდა სათავეში! 🚀");
        closePromoteUI();
        location.reload(); 
    } catch (err) {
        console.error("Payment error:", err);
        alert("შეცდომა გადახდისას!");
    }
}

// --- PWA ინსტალაციის ლოგიკა (უცვლელი, მუშაობს ბრაუზერის დონეზე) ---
(function() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btn = document.getElementById('installAppBtn');
        if (btn) btn.style.setProperty('display', 'flex', 'important');
    });

    document.addEventListener('click', async (e) => {
        if (e.target && (e.target.id === 'installAppBtn' || e.target.closest('#installAppBtn'))) {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
                const btn = document.getElementById('installAppBtn');
                if (btn) btn.style.setProperty('display', 'none', 'important');
            }
        }
    });
})();

// --- iOS PWA ინსტრუქცია (უცვლელი) ---
(function() {
    const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
    };
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIos() && !isInStandaloneMode()) {
        const iosModal = document.getElementById('pwa-ios-instruction');
        if (iosModal) {
            setTimeout(() => {
                iosModal.style.display = 'block';
            }, 3000);
        }
    }
})();

// მესიჯების მოთხოვნების მეთვალყურეობა (Badge)
async function monitorMessageRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // რეალურ დროში მოსმენა
    supabase.channel('msg-requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests', filter: `receiver_id=eq.${user.id}` }, 
            payload => updateReqBadge(user.id))
        .subscribe();

    updateReqBadge(user.id);
}

async function updateReqBadge(myId) {
    const { count } = await supabase
        .from('message_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', myId);

    const badge = document.getElementById('msgReqBadge');
    if (badge) {
        badge.innerText = count || 0;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// მოთხოვნების სიის გახსნა
async function openMessageRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    const list = document.getElementById('msgReqList');
    document.getElementById('messageRequestsUI').style.display = 'flex';
    list.innerHTML = '<div style="text-align:center; color:gray; padding:20px;">იტვირთება...</div>';

    const { data: requests } = await supabase
        .from('message_requests')
        .select('*, users:sender_id(name, photo)') // JOIN მომხმარებლის მონაცემებთან
        .eq('receiver_id', user.id);

    list.innerHTML = '';
    if (!requests || requests.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:gray; padding:20px;">ახალი მოთხოვნები არ არის.</div>';
        return;
    }

    requests.forEach(req => {
        const item = document.createElement('div');
        item.style = "display:flex; align-items:center; padding:15px; border-bottom:1px solid #1a1a1a; gap:12px;";
        item.innerHTML = `
            <img src="${req.users.photo || 'token-avatar.png'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">
            <div style="flex:1;">
                <div style="color:white; font-weight:bold;">${req.users.name || 'User'}</div>
                <div style="color:#888; font-size:12px;">${req.text || '📷 Media'}</div>
            </div>
            <button onclick="acceptMsgReq('${req.sender_id}')" style="background:var(--gold); border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold;">Accept</button>`;
        list.appendChild(item);
    });
}

// მოთხოვნის მიღება
async function acceptMsgReq(senderId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. მესიჯის გადატანა messages ცხრილში (ამ შემთხვევაში უბრალოდ ვნიშნავთ მოთხოვნას როგორც მიღებულს)
    // აქ შეგიძლია ჩაამატო მესიჯის insert ლოგიკა messages ცხრილში
    
    // 2. ურთიერთობის გაფორმება (following)
    await supabase.rpc('add_friendship', { user1: user.id, user2: senderId });

    // 3. მოთხოვნის წაშლა
    await supabase.from('message_requests').delete().eq('sender_id', senderId).eq('receiver_id', user.id);
    
    closeMessageRequests();
    // startChat(...)
}

// აუთენტიფიკაციის მონიტორინგი
supabase.auth.onAuthStateChange((event, session) => {
    if (session) monitorMessageRequests();
});
