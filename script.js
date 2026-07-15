// ==========================================
// 1. SUPABASE-ის კონფიგურაცია და ინიციალიზაცია
// ==========================================
const SUPABASE_URL = "https://your-supabase-project.supabase.co"; // ჩაწერე შენი პროექტის URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // ჩაწერე შენი Anon Key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let audioCtx, audioSource, audioDest;

const stripe = Stripe('pk_live_51TCrgOK0YcbjyHRbMu9SzwKtqhsqx4FQC6ZJpta54mxfTIuwWVxmLjwh3TZ9TnK8YAtQp7hk4VU65XD45ZBQSt2Z00SXSc5ir9');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered! ✅'))
            .catch(err => console.log('SW Registration Failed ❌', err));
    });
}

// ლოკალური მდგომარეობის ცვლადები
let myName = "User";
let myPhoto = "";
let myAkho = 0;
let currentChatId = null;
let activePostId = null;
let activeReplyTo = null;
let currentAdmTarget = null;
let currentUserData = null;
let typingTimeout = null;

// ==========================================
// 2. მომხმარებლის სტატუსის მართვა (Presence)
// ==========================================
async function updatePresence() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supabase Realtime Presence-ის გამოყენება სტატუსისთვის
    const channel = supabase.channel('online-users');
    channel
        .on('presence', { event: 'sync' }, () => {
            console.log('Presence synced');
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                });
                
                // ასევე ვანახლებთ ბაზაში ბოლო აქტივობას
                await supabase
                    .from('users')
                    .update({ presence: 'online' })
                    .eq('id', user.id);
            }
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

async function finishOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('users')
            .update({ hasSeenRules: true })
            .eq('id', user.id);
    }
    document.getElementById('onboardingUI').style.display = 'none';
}

// ==========================================
// 3. ავტორიზაციის და სესიის მსმენელი (Auth State)
// ==========================================
supabase.auth.onAuthStateChange(async (event, session) => {
    applyLanguage();
    const user = session?.user;

    if (user) {
        setTimeout(() => {
            askInitialPermissions(); 
        }, 1500);

        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const packAmount = urlParams.get('pack');

        if (sessionId && packAmount) {
            const amountToAdd = parseFloat(packAmount);
            
            // ვამოწმებთ, დამუშავებულია თუ არა გადახდა
            const { data: payProcessed } = await supabase
                .from('payments_processed')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (!payProcessed) {
                // ვუმატებთ AKHO-ს და ვინახავთ ტრანზაქციას
                const { data: userData } = await supabase
                    .from('users')
                    .select('akho')
                    .eq('id', user.id)
                    .single();

                const currentAkho = userData?.akho || 0;
                await supabase
                    .from('users')
                    .update({ akho: currentAkho + amountToAdd })
                    .eq('id', user.id);

                await supabase
                    .from('payments_processed')
                    .insert([{
                        session_id: sessionId,
                        uid: user.id,
                        amount: amountToAdd,
                        ts: new Date().toISOString()
                    }]);

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
            console.log("ვცდილობ ჩაწერას...");
            await supabase
                .from('users')
                .update({ test: "მუშაობს" })
                .eq('id', user.id);
            saveMessagingToken(user);
        }, 2000);

        // ევრო ბალანსის რეალურ დროში მოსმენა
        supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
                const euro = payload.new.euro_balance || 0;
                const euroEl = document.getElementById('euroBalanceDisplay');
                if (euroEl) {
                    euroEl.innerText = euro.toFixed(2) + " €";
                }
            })
            .subscribe();

        // პირველადი წამოღება ევრო ბალანსის
        const { data: initialUser } = await supabase
            .from('users')
            .select('euro_balance')
            .eq('id', user.id)
            .single();
            
        const euroEl = document.getElementById('euroBalanceDisplay');
        if (euroEl && initialUser) {
            euroEl.innerText = (initialUser.euro_balance || 0).toFixed(2) + " €";
        }

        updatePresence();
        listenToGlobalMessages();
        startNotificationListener();
        checkDailyBonus();
        startGlobalUnreadCounter();
        listenForIncomingCalls(user);
        startWallNotificationListener();
        
        // Push შეტყობინების ტოკენი
        setTimeout(function() {
            const tokenKey = 'fcm_token_sent_' + user.id;
            if (localStorage.getItem(tokenKey)) return; 

            try {
                const messaging = firebase.messaging();
                messaging.requestPermission()
                    .then(() => messaging.getToken({ 
                        vapidKey: 'BFi5rCCEsQ3sY5VzBTf6PXD5T_1JmLFI2oICpIBG8FoW5T_DxtxVdvTSFu0SjbZdSirYkYoyg4PIMotPD2YyFWk' 
                    }))
                    .then(async (token) => {
                        if (token) {
                            await supabase
                                .from('users')
                                .update({ fcmToken: token })
                                .eq('id', user.id);
                            showTestNotification(); 
                            localStorage.setItem(tokenKey, 'true'); 
                        }
                    })
                    .catch((err) => console.log("Push error or denied"));
            } catch (e) {
                console.log("Messaging skip");
            }
        }, 3000);

        // ვიდეო ზარების რეალურ დროში მოსმენა
        supabase
            .channel(`video_calls_${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'video_calls', filter: `receiver_uid=eq.${user.id}` }, payload => {
                const call = payload.new;
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

        // მომხმარებლის პროფილის მონაცემების მუდმივი სინქრონიზაცია
        supabase
            .channel(`user_profile_${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
                const d = payload.new;
                handleProfileDataUpdate(d);
            })
            .subscribe();

        // პირველადი წაკითხვა პროფილის
        const { data: myProf } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        if (myProf) handleProfileDataUpdate(myProf);

        renderTokenFeed();
        loadDiscoveryUsers();
        listenToRequests();
    } else {
        document.getElementById('authUI').style.display = 'flex';
        document.getElementById('main-feed').innerHTML = "";
    }
});

function handleProfileDataUpdate(d) {
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

// ==========================================
// 4. ვიდეო ზარები და გატანა
// ==========================================
async function acceptCall() {
    if (currentIncomingCall) {
        window.currentChatId = currentIncomingCall.callerUid; 
        await supabase
            .from('video_calls')
            .update({ status: 'accepted' })
            .eq('id', currentIncomingCall.id);

        document.getElementById('incomingCallModal').style.display = 'none';
        document.getElementById('videoCallUI').style.display = 'flex';
        if (typeof startVideoCall === "function") {
            startVideoCall();
        }
    }
}

async function declineCall() {
    if (currentIncomingCall) {
        await supabase
            .from('video_calls')
            .delete()
            .eq('id', currentIncomingCall.id);
    }
    document.getElementById('incomingCallModal').style.display = 'none';
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
    if(!iban || iban.length < 10) return alert("IBAN / PayPal Error");
    
    if(confirm(`Confirm ${(myAkho/10).toFixed(2)} €?`)) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase
            .from('withdrawal_requests')
            .insert([{
                uid: user.id,
                name: myName,
                amountEur: (myAkho/10).toFixed(2),
                amountAkho: myAkho,
                iban: iban,
                status: 'pending',
                ts: new Date().toISOString()
            }]);

        await supabase
            .from('users')
            .update({ akho: 0 })
            .eq('id', user.id);

        addToLog('Cashout Request', -myAkho);
        alert(currentLang === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request sent!");
        document.getElementById('walletUI').style.display = 'none';
    }
}

// ==========================================
// 5. ადმინისტრირების პანელი
// ==========================================
function openAdminUI() {
    toggleSideMenu(false);
    document.getElementById('adminUI').style.display = 'flex';
    loadAdminRequests();
    renderAdminOrders();
}

async function adminSearchUsers(q) {
    const list = document.getElementById('admUserList');
    if(!q || q.length < 2) { list.innerHTML = ""; return; }

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
            await supabase
                .from('notifications')
                .insert([{
                    uid: currentAdmTarget,
                    text: "⚠️ Admin: " + msg,
                    ts: new Date().toISOString(),
                    fromPhoto: "https://emigrantbook.com/1000084015-removebg-preview.png"
                }]);
        }
    } else if(type === 'ban') {
        if(confirm("Ban user?")) await supabase.from('users').update({ isBanned: true }).eq('id', currentAdmTarget);
    } else if(type === 'unban') {
        if(confirm("Unban user?")) await supabase.from('users').update({ isBanned: false }).eq('id', currentAdmTarget);
    } else if(type === 'addAkho') {
        const amt = prompt("AKHO amount:");
        if(amt) {
            const { data } = await supabase.from('users').select('akho').eq('id', currentAdmTarget).single();
            await supabase.from('users').update({ akho: (data?.akho || 0) + parseFloat(amt) }).eq('id', currentAdmTarget);
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

async function loadAdminRequests() {
    const list = document.getElementById('adminReqList');
    
    const { data: requests } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending');

    list.innerHTML = "";
    if(!requests || requests.length === 0) { 
        list.innerHTML = "<p style='color:gray;'>No requests</p>"; 
        return; 
    }

    requests.forEach(req => {
        list.innerHTML += `
        <div class="admin-req-card">
        <b>User: ${req.name}</b>
        <span>Amt: ${req.amountEur} € (${req.amountAkho} AKHO)</span>
        <span>IBAN: ${req.iban}</span>
        <div style="display:flex; gap:10px;">
        <button class="withdraw-btn" style="background:var(--green);" onclick="approveReq('${req.id}')">Approve</button>
        <button class="withdraw-btn" style="background:var(--red);" onclick="declineReq('${req.id}', '${req.uid}', ${req.amountAkho})">Decline</button>
        </div>
        </div>`;
    });
}

async function approveReq(id) {
    if(confirm("Paid?")) {
        await supabase
            .from('withdrawal_requests')
            .update({ status: 'approved' })
            .eq('id', id);
        alert("Approved!");
        loadAdminRequests();
    }
}

async function declineReq(id, uid, amount) {
    if(confirm("Decline? Coins will return.")) {
        const { data } = await supabase.from('users').select('akho').eq('id', uid).single();
        await supabase.from('users').update({ akho: (data?.akho || 0) + amount }).eq('id', uid);
        await supabase.from('withdrawal_requests').update({ status: 'declined' }).eq('id', id);
        alert("Declined.");
        loadAdminRequests();
    }
}

// ==========================================
// 6. საფულე და ტრანზაქციების ლოგი
// ==========================================
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
    const { data } = await supabase.from('users').select('akho').eq('id', targetUid).single();
    await supabase.from('users').update({ akho: (data?.akho || 0) + amount }).eq('id', targetUid);
    
    await supabase
        .from('activity_logs')
        .insert([{
            uid: targetUid,
            type: reason,
            amt: amount,
            ts: new Date().toISOString()
        }]);
}

async function addToLog(type, amt) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
        .from('activity_logs')
        .insert([{
            uid: user.id,
            type: type,
            amt: amt,
            ts: new Date().toISOString()
        }]);
}

async function loadActivityLog() {
    const box = document.getElementById('logContent');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('uid', user.id)
        .order('ts', { ascending: false })
        .limit(15);

    box.innerHTML = "";
    if(!logs || logs.length === 0) { 
        box.innerHTML = "<p style='color:gray; font-size:12px;'>ისტორია ცარიელია</p>"; 
        return; 
    }

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

// ==========================================
// 7. კომენტარები და რეაქციები
// ==========================================
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

    const tableName = isGallery ? 'gallery_comments' : 'comments';

    const { data: comments } = await supabase
        .from(tableName)
        .select('*')
        .eq('post_id', postId)
        .order('ts', { ascending: true });

    list.innerHTML = "";
    if (!comments) return;

    comments.forEach(comm => {
        const likes = comm.likes || {};
        const isLiked = likes[myUid];
        const canDeleteComm = (myUid === comm.authorId) || (myUid === postOwnerId);

        let html = `
        <div class="comment-item">
            <div class="comment-top">
                <img src="${comm.authorPhoto}" class="comm-ava">
                <div class="comm-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div class="comm-name">${comm.authorName}</div>
                        ${canDeleteComm ? `<i class="fas fa-trash-alt" style="color:#555; cursor:pointer; font-size:11px; padding:5px;" onclick="window.deleteComment('${postId}', '${comm.id}')"></i>` : ''}
                    </div>
                    <div class="comm-text">${comm.text}</div>
                    <div class="comm-actions">
                        <span class="comm-like-btn ${isLiked ? 'liked' : ''}" onclick="likeComment('${comm.id}')">
                            <i class="fas fa-heart"></i> ${Object.keys(likes).length}
                        </span>
                        <span onclick="prepareReply('${comm.id}', '${comm.authorName}')" style="cursor:pointer;">Reply/პასუხი</span>
                    </div>
                </div>
            </div>
            <div id="replies-${comm.id}" class="reply-list"></div>
        </div>`;
        
        list.innerHTML += html;

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

window.deleteReply = async function(postId, commentId, replyId) {
    if (confirm("ნამდვილად გსურთ პასუხის წაშლა?")) {
        const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';
        const { data: comm } = await supabase.from(tableName).select('replies').eq('id', commentId).single();
        if (comm && comm.replies) {
            const updatedReplies = { ...comm.replies };
            delete updatedReplies[replyId];
            await supabase.from(tableName).update({ replies: updatedReplies }).eq('id', commentId);
            loadComments(postId, window.isGalleryMode);
        }
    }
};

function prepareReply(commId, name) {
    activeReplyTo = commId;
    document.getElementById('commInp').focus();
}

async function postComment() {
    if (!canAfford(0.5)) return;
    const text = document.getElementById('commInp').value;
    if(!text.trim() || !activePostId) return;

    const { data: { user } } = await supabase.auth.getUser();
    const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';

    if(activeReplyTo) {
        const { data: comm } = await supabase.from(tableName).select('replies').eq('id', activeReplyTo).single();
        const replies = comm?.replies || {};
        const newReplyId = 'reply_' + Date.now();
        replies[newReplyId] = {
            authorId: user.id, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now()
        };
        await supabase.from(tableName).update({ replies: replies }).eq('id', activeReplyTo);
    } else {
        await supabase.from(tableName).insert([{
            post_id: activePostId,
            authorId: user.id, 
            authorName: myName, 
            authorPhoto: myPhoto, 
            text: text, 
            ts: Date.now(),
            replies: {}
        }]);
    }
    
    spendAkho(0.5, 'Comment');
    document.getElementById('commInp').value = "";
    activeReplyTo = null;
    loadComments(activePostId, window.isGalleryMode);
}

async function likeComment(commId) {
    if (!canAfford(0.1)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const myUid = user.id;
    const tableName = window.isGalleryMode ? 'gallery_comments' : 'comments';

    const { data: comm } = await supabase.from(tableName).select('likes').eq('id', commId).single();
    const likes = comm?.likes || {};

    if (likes[myUid]) {
        delete likes[myUid];
        await supabase.from(tableName).update({ likes: likes }).eq('id', commId);
    } else {
        likes[myUid] = true;
        await supabase.from(tableName).update({ likes: likes }).eq('id', commId);
        spendAkho(0.1, 'Comment Like'); 
    }
    loadComments(activePostId, window.isGalleryMode);
}

// ==========================================
// 8. ჩატები და მესინჯერი
// ==========================================
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

    // ჩატების წამოღება (following სია)
    const { data: followingList } = await supabase
        .from('following')
        .select('*')
        .eq('user_id', user.id);

    if(!followingList || followingList.length === 0) { 
        list.innerHTML = "<p style='padding:20px; color:gray; text-align:center;'>No active chats yet.</p>";
        return; 
    }

    list.innerHTML = "";
    followingList.forEach(async (friend) => {
        const chatId = getChatId(user.id, friend.friend_id);
        
        const { data: lastMsgData } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('ts', { ascending: false })
            .limit(1)
            .single();

        const item = document.createElement('div');
        item.className = 'chat-list-item';
        item.style = "border:none; background:#000; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; position:relative;";
        
        item.onclick = async () => {
            await supabase.from('last_read').upsert({ user_id: user.id, chat_id: chatId, last_read_at: Date.now() });
            document.getElementById('messengerUI').style.display = 'none';
            startChat(friend.friend_id, friend.friend_name, friend.friend_photo);
        };

        const { data: readData } = await supabase
            .from('last_read')
            .select('last_read_at')
            .eq('user_id', user.id)
            .eq('chat_id', chatId)
            .single();

        const lastRead = readData?.last_read_at || 0;
        let lastMsg = "Tap to chat";
        let msgTimeFormatted = "";
        let isUnread = false;

        if (lastMsgData) {
            lastMsg = lastMsgData.text || "📷 Media/Voice";
            const ts = lastMsgData.ts;
            const msgDate = new Date(ts);
            const now = new Date();
            if (msgDate.toDateString() === now.toDateString()) {
                msgTimeFormatted = msgDate.getHours() + ":" + (msgDate.getMinutes() < 10 ? '0' : '') + msgDate.getMinutes();
            } else {
                msgTimeFormatted = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            if (lastMsgData.senderId !== user.id && ts > lastRead) {
                isUnread = true;
            }
        }

        const { data: friendUser } = await supabase.from('users').select('presence').eq('id', friend.friend_id).single();
        const isOnline = friendUser?.presence === 'online';

        item.innerHTML = `
            <div style="position:relative; flex-shrink:0;">
                <img src="${friend.friend_photo || 'token-avatar.png'}" style="width:56px; height:56px; border-radius:50%; object-fit:cover;">
                <div style="position:absolute; bottom:2px; right:2px; width:14px; height:14px; background:#4ade80; border-radius:50%; border:3px solid #000; display:${isOnline ? 'block' : 'none'};"></div>
                <div id="badge-${friend.friend_id}" style="position:absolute; top:-2px; right:-2px; background:red; color:white; border-radius:50%; width:18px; height:18px; font-size:10px; display:${isUnread ? 'flex' : 'none'}; align-items:center; justify-content:center; border:2px solid black; font-weight:bold;">!</div>
            </div>
            <div style="display:flex; flex-direction:column; overflow:hidden; flex:1; margin-left:5px;">
                <b style="color:white; font-size:16px; margin-bottom:2px;">${friend.friend_name}</b>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="color:${isUnread ? 'white' : '#888'}; font-weight:${isUnread ? 'bold' : 'normal'}; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${lastMsg}</span>
                    <span style="color:#888; font-size:12px;"> · ${msgTimeFormatted}</span>
                </div>
            </div>
            <div style="width:12px; height:12px; background:#0084ff; border-radius:50%; display:${isUnread ? 'block' : 'none'}; margin-right:5px;"></div>`;
        
        list.appendChild(item);
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

    // ვნიშნავთ წაკითხულად
    await supabase
        .from('messages')
        .update({ seen: true })
        .eq('chat_id', chatId)
        .neq('senderId', user.id);

    const statusEl = document.getElementById('chatTargetStatus');
    if (statusEl) {
        const { data: friend } = await supabase.from('users').select('presence').eq('id', uid).single();
        if (friend?.presence === 'online') {
            statusEl.innerText = 'საიტზეა';
            statusEl.style.color = '#4ade80';
        } else {
            const timeAgo = (typeof formatTimeShort === 'function') ? formatTimeShort(friend?.presence) : '';
            statusEl.innerText = timeAgo ? timeAgo + '   ago' : 'offline';
            statusEl.style.color = '#888';
        }
    }
    loadMessages(uid);
    listenToTyping(uid);
}

let currentChatLimit = 20;
async function loadMessages(targetUid) {
    const { data: { user } } = await supabase.auth.getUser();
    const myUid = user.id;
    const chatId = getChatId(myUid, targetUid);
    const box = document.getElementById('chatMessages');

    const { data: targetUser } = await supabase.from('users').select('photo').eq('id', targetUid).single();
    const tPhoto = targetUser?.photo || 'token-avatar.png';

    const { data: deletedData } = await supabase
        .from('deleted_messages')
        .select('message_id')
        .eq('user_id', myUid)
        .eq('chat_id', chatId);

    const deletedMsgs = {};
    if (deletedData) {
        deletedData.forEach(d => deletedMsgs[d.message_id] = true);
    }

    // რეალურ დროში შეტყობინებების მოსმენა
    supabase
        .channel(`chat_${chatId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, () => {
            loadMessages(targetUid);
        })
        .subscribe();

    // შეტყობინებების წამოღება
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('ts', { ascending: true })
        .limit(currentChatLimit);

    box.innerHTML = "";
    if (!messages) return;

    let lastTs = 0;
    messages.forEach((msg, index) => {
        if (deletedMsgs[msg.id]) return;

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
             oncontextmenu="event.preventDefault(); window.deleteMessage('${chatId}', '${msg.id}', '${msg.senderId}')">
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
            ${isMine && msg.seen && index === messages.length - 1 ? 
                `<div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 2px; margin-right: 2px;">
                    <img src="${tPhoto}" style="width:14px; height:14px; border-radius:50%; border:1px solid var(--gold, #d4af37); object-fit:cover; opacity: 0.9;">
                </div>` : ''}
        </div>`;
    });

    if (currentChatLimit === 20) {
        box.scrollTop = box.scrollHeight;
    }
}

async function closeChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (currentChatId) {
        const chatId = getChatId(user.id, currentChatId);
        await supabase.from('typing').delete().eq('chat_id', chatId).eq('user_id', user.id);
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

    await supabase.from('typing').upsert({ chat_id: chatId, user_id: user.id, is_typing: true });
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
        await supabase.from('typing').delete().eq('chat_id', chatId).eq('user_id', user.id);
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
    const { data: { user } } = await supabase.auth.getUser();
    const chatId = getChatId(user.id, targetUid);

    supabase
        .channel(`typing_${chatId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'typing', filter: `chat_id=eq.${chatId}` }, payload => {
            const indicator = document.getElementById('typingIndicator');
            if (payload.new && payload.new.user_id === targetUid) {
                indicator.style.display = 'flex';
                document.getElementById('typingSound').play().catch(e => {});
            } else {
                indicator.style.display = 'none';
            }
        })
        .subscribe();
}

// ==========================================
// 9. შეტყობინებები და Push
// ==========================================
async function listenToGlobalMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    
    supabase
        .channel(`global_messages_${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
            const msg = payload.new;
            if (!msg || msg.senderId === user.id) return;
            if (Date.now() - new Date(msg.ts).getTime() > 10000) return;
            if (currentChatId && getChatId(user.id, currentChatId) === msg.chat_id) return;

            const { data: sender } = await supabase.from('users').select('name, photo').eq('id', msg.senderId).single();
            if (!sender) return;

            const senderName = sender.name || "მომხმარებელი";
            const messageText = msg.text || "📷 Voice/Media";
            const sound = document.getElementById('msgSound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log("ხმის დაკვრა დაიბლოკა."));
            }
            setAppBadge(1);
            showLocalNotification("ახალი მესიჯი: " + senderName, messageText);
            showGlobalPush(senderName, sender.photo, messageText);
        })
        .subscribe();
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
    const { data: { user } } = await supabase.auth.getUser();
    let msgText = inp.value.trim();

    if (!msgText) msgText = "👍";
    if (!currentChatId) return;
    const chatId = getChatId(user.id, currentChatId);

    // ვამოწმებთ, გვადევნებს თუ არა თვალს
    const { data: isFollowing } = await supabase
        .from('followers')
        .select('*')
        .eq('user_id', currentChatId)
        .eq('follower_id', user.id)
        .single();

    if (isFollowing) {
        await supabase.from('messages').insert([{
            chat_id: chatId,
            senderId: user.id,
            text: msgText,
            ts: Date.now(),
            seen: false
        }]);
    } else {
        await supabase.from('message_requests').insert([{
            receiver_id: currentChatId,
            sender_id: user.id,
            text: msgText,
            ts: Date.now()
        }]);
    }

    if (typeof sendPushToUser === "function") {
        sendPushToUser(currentChatId, myName, msgText);
    }

    await supabase.from('typing').delete().eq('chat_id', chatId).eq('user_id', user.id);
    spendAkho(0.2, 'Message');
    inp.value = ""; 

    if (typeof handleTyping === "function") {
        handleTyping();
    }
}

// ==========================================
// 10. აღმოჩენა (Discovery) და პროფილის პარამეტრები
// ==========================================
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data: users } = await supabase.from('users').select('*').neq('id', user.id);

    const grid = document.getElementById('discoverGrid');
    grid.innerHTML = "";
    if (users) {
        users.forEach(u => {
            const card = `
            <div class="user-card" onclick="openProfile('${u.id}')">
                <div class="card-inner">
                    <img src="${u.photo || 'token-avatar.png'}" class="discover-ava">
                    <div class="discover-name">${u.name}</div>
                    <div class="discover-status">EMIGRANT</div>
                </div>
            </div>`;
            grid.innerHTML += card;
        });
    }
}

function openSettings() {
    toggleSideMenu(false);
    stopMainFeedVideos();
    const ui = document.getElementById('settingsUI');
    ui.style.display = 'flex';
    const privacy = currentUserData.privacy || 'public';
    document.getElementById(`priv${privacy.charAt(0).toUpperCase() + privacy.slice(1)}`).checked = true;
}

async function updatePrivacy(val) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('users').update({ privacy: val }).eq('id', user.id);
}

// ==========================================
// 11. პროფილები და მნახველები
// ==========================================
async function openProfile(uid) {
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

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const galleryUploadContainer = document.getElementById('galleryUploadBtnContainer');
    if (galleryUploadContainer && currentUser) {
        galleryUploadContainer.style.display = (uid === currentUser.id) ? 'block' : 'none';
    }

    document.querySelectorAll('.p-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('infoBtn').classList.add('active');

    if(uid !== currentUser.id) {
        await supabase.from('profile_views').insert([{
            viewed_id: uid,
            visitor_id: currentUser.id,
            name: myName,
            photo: myPhoto,
            ts: Date.now()
        }]);
    }
 
    supabase
        .channel(`profile_view_${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, payload => {
            renderProfileDetails(payload.new, uid, currentUser);
        })
        .subscribe();

    const { data: userDetails } = await supabase.from('users').select('*').eq('id', uid).single();
    if (userDetails) renderProfileDetails(userDetails, uid, currentUser);
}

async function renderProfileDetails(user, uid, currentUser) {
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
    const profNameEl = document.getElementById('profName');
    profNameEl.innerText = user.name;

    const locRow = document.getElementById('profLocationRow');
    const locText = document.getElementById('profLocationText');

    if (user.city && user.city.trim() !== "") {
        locText.innerText = user.city;
        locRow.style.display = 'flex';
    } else {
        locRow.style.display = 'none';
    }

    // გამომწერების წამოღება
    const { count: followersCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('user_id', uid);
    const { count: followingCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', uid);

    document.getElementById('statFollowersCount').innerText = followersCount || 0;
    document.getElementById('statFollowingCount').innerText = followingCount || 0;
    document.getElementById('followersStatBtn').onclick = () => openSocialList(uid, 'followers');
    document.getElementById('followingStatBtn').onclick = () => openSocialList(uid, 'following');
    
    const controls = document.getElementById('profControls');
    controls.innerHTML = "";
    document.querySelector('.profile-nav').style.display = 'flex';
    document.getElementById('feetStats').style.display = (uid === currentUser.id) ? 'block' : 'none';
    document.getElementById('profTabs').style.display = 'flex';
    document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);

    const euroBtn = document.getElementById('euroBalanceBtn');
    if (euroBtn) {
        euroBtn.style.display = (uid === currentUser.id) ? 'inline-flex' : 'none';
    }

    const editNameBtn = document.getElementById('editNameBtn');
    if (editNameBtn) {
        editNameBtn.style.display = (uid === currentUser.id) ? 'flex' : 'none';
    }
   
    if(uid === currentUser.id) {
        controls.innerHTML = `<button class="profile-btn btn-gold" onclick="document.getElementById('avaInp').click()" data-key="edit">Edit</button>`;
        const galleryUploadContainer = document.getElementById('galleryUploadBtnContainer');
        if (galleryUploadContainer) {
            galleryUploadContainer.style.marginTop = "0";
            controls.appendChild(galleryUploadContainer);
        }
        controls.innerHTML += `
            <button class="profile-btn btn-outline" onclick="showGiftsCollection('${uid}')" style="margin-left:5px;">
                <i class="fas fa-gift"></i> Gifts
            </button>`;
        
        loadUserVideos(uid);
        applyLanguage();
    } else {
        const { data: followingRecord } = await supabase.from('followers').select('*').eq('user_id', uid).eq('follower_id', currentUser.id).single();
        const { data: followedRecord } = await supabase.from('followers').select('*').eq('user_id', currentUser.id).eq('follower_id', uid).single();
        
        const isFollowing = !!followingRecord;
        const isFriend = followingRecord && followedRecord;

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

            const { count: giftCount } = await supabase.from('received_gifts').select('*', { count: 'exact', head: true }).eq('receiver_id', uid);
            const giftsBtn = document.getElementById(`gifts-btn-${uid}`);
            if (giftsBtn) {
                giftsBtn.innerHTML = `<i class="fas fa-gift"></i> Gifts (${giftCount || 0})`;
            }
        } else {
            document.getElementById('profGrid').innerHTML = `<div class="private-lock-screen"><p data-key="private_profile">Private Profile</p></div>`;
            document.getElementById('profTabs').style.display = 'none';
            controls.innerHTML = `<button class="profile-btn btn-gold" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>`;
        }
        applyLanguage();
    }
}

async function showProfileVisitors() {
    document.getElementById('visitorAvaNav').style.display = 'none';
    document.getElementById('feetStats').style.display = 'block';
    localStorage.setItem('last_seen_visitor_ts', Date.now());
    document.getElementById('visitorsUI').style.display = 'flex';
    const list = document.getElementById('visitorsList');
    list.innerHTML = "Loading...";

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: visitors } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewed_id', user.id)
        .order('ts', { ascending: false });

    if(!visitors || visitors.length === 0) { list.innerHTML = "No views"; return; }

    const { data: myFollowingData } = await supabase.from('followers').select('user_id').eq('follower_id', user.id);
    const myFollowing = {};
    if (myFollowingData) {
        myFollowingData.forEach(f => myFollowing[f.user_id] = true);
    }

    list.innerHTML = "";
    visitors.forEach(v => {
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

async function openEditor() {
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

async function saveProfileChanges() {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = {
        name: document.getElementById('editName').value,
        city: document.getElementById('editCity').value,
        age: document.getElementById('editAge').value,
        relation: document.getElementById('editRelation').value,
        phone: document.getElementById('editPhone').value
    };
    await supabase.from('users').update(updates).eq('id', user.id);
    alert("Saved!");
    document.getElementById('editProfileUI').style.display = 'none';
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

function followFromVisitors(uid, name, photo) {
    followUser(uid, name, photo);
    setTimeout(() => showProfileVisitors(), 500); 
}

async function followUser(targetUid, name, photo) {
    if (!canAfford(1)) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('followers').insert([{
        user_id: targetUid,
        follower_id: user.id,
        friend_name: name,
        friend_photo: photo
    }]);

    await supabase.from('notifications').insert([{
        uid: targetUid,
        text: `${myName} followed you`,
        ts: Date.now(),
        fromPhoto: myPhoto
    }]);

    spendAkho(1, 'Follow');
}

async function unfollowUser(targetUid) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('followers').delete().eq('user_id', targetUid).eq('follower_id', user.id);
}

// ==========================================
// 12. შეტყობინებების მართვა
// ==========================================
async function listenToRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    
    supabase
        .channel(`notif_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `uid=eq.${user.id}` }, () => {
            updateNotificationBadge(user.id);
        })
        .subscribe();

    updateNotificationBadge(user.id);
}

async function updateNotificationBadge(userId) {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('uid', userId);
    const badge = document.getElementById('reqCount');
    if(count && count > 0) { 
        badge.innerText = count; 
        badge.style.display = 'block'; 
    } else { 
        badge.style.display = 'none'; 
    }
}

async function openRequestsUI() {
    stopMainFeedVideos();
    document.getElementById('requestsUI').style.display = 'flex';
    const list = document.getElementById('reqList');

    const { data: { user } } = await supabase.auth.getUser();
    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('uid', user.id)
        .order('ts', { ascending: false });

    list.innerHTML = "";
    if(notifications && notifications.length > 0) {
        notifications.forEach(notify => {
            list.innerHTML += `<div class="req-card"><div style="display:flex; align-items:center; gap:10px;"><img src="${notify.fromPhoto}" style="width:40px; height:40px; border-radius:50%;"><b style="font-size:14px; color:white;">${notify.text}</b></div><div><button class="profile-btn btn-outline" onclick="deleteNotification('${notify.id}')">X</button></div></div>`;
        });
    } else { 
        list.innerHTML = "<p style='text-align:center;'>No notifications</p>"; 
    }
}

async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id);
    openRequestsUI();
}

// ==========================================
// 13. პოსტები, ვიდეოები და ფიდი
// ==========================================
async function loadUserVideos(uid) {
    const grid = document.getElementById('profGrid');
    
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('authorId', uid)
        .order('timestamp', { ascending: false });

    grid.innerHTML = ""; 
    if(!posts || posts.length === 0) {
        document.getElementById('statVidsCount').innerText = 0;
        return;
    }

    let vCount = 0;
    let videoList = [];

    posts.forEach(post => {
        if(post.media) {
            const video = post.media.find(m => m.type === 'video');
            if(video) {
                videoList.push({ id: post.id, post, video });
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
        // ნახვების გაზრდა
        const { data: viewData } = await supabase.from('posts').select('views').eq('id', postId).single();
        await supabase.from('posts').update({ views: (viewData?.views || 0) + 1 }).eq('id', postId);

        const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
        if (!post) return;

        window.currentFullVideoAuthorId = post.authorId;
        const ava = document.getElementById('fullVideoAva');
        if (ava) {
            ava.src = post.authorPhoto || 'https://ui-avatars.com/api/?name=' + post.authorName;
            ava.parentElement.onclick = () => {
                closeFullVideo();
                openProfile(post.authorId);
            };
        }

        const vText = document.getElementById('fullVideoViewsText');
        if (vText) {
            const views = post.views || 0;
            vText.innerText = views >= 1000 ? (views / 1000).toFixed(1) + 'K' : views;
        }

        const lElem = document.getElementById('fullLikeCount');
        const lIcon = document.getElementById('fullLikeIcon');
        const { data: { user } } = await supabase.auth.getUser();
        const myUid = user.id;
        const likesKeys = post.likedBy ? Object.keys(post.likedBy) : [];
        
        if (lElem) lElem.innerText = likesKeys.length;
        if (lIcon) lIcon.style.color = likesKeys.includes(myUid) ? '#ff4d4d' : 'white';

        const sIcon = document.getElementById('fullSaveIcon');
        if (sIcon) sIcon.style.color = (post.savedBy && post.savedBy[myUid]) ? 'var(--gold)' : 'white';

        const giftBtn = document.querySelector('#fullVideoOverlay .side-action-item[onclick*="openGiftPanel"]');
        if (giftBtn) {
            giftBtn.onclick = () => openGiftPanel(window.currentFullVideoId, window.currentFullVideoAuthorId);
        }
      
        const moreBtn = document.querySelector('#fullVideoOverlay .more-btn'); 
        if (moreBtn) {
            if (post.authorId === myUid) {
                moreBtn.style.display = 'flex'; 
                moreBtn.onclick = () => toggleMoreMenu(window.currentFullVideoId);
            } else {
                moreBtn.style.display = 'none'; 
            }
        }

        const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postId);
        const cElem = document.getElementById('fullCommCount');
        if (cElem) cElem.innerText = commentCount || 0;
    }
}

function searchUsers(q) {
    const cards = document.querySelectorAll('.user-card');
    cards.forEach(c => {
        const name = c.querySelector('.discover-name').innerText.toLowerCase();
        c.style.display = name.includes(q.toLowerCase()) ? "block" : "none";
    });
}

async function openSocialList(uid, type) {
    const ui = document.getElementById('socialListsUI');
    const title = document.getElementById('socialListTitle');
    const content = document.getElementById('socialContentArea');
    ui.style.display = 'flex';
    title.innerText = type === 'followers' ? 'გამომწერები' : 'გამოწერილია';
    content.innerHTML = "იტვირთება...";

    if (type === 'followers') {
        const { data: list } = await supabase.from('followers').select('*').eq('user_id', uid);
        renderSocialList(list);
    } else {
        const { data: list } = await supabase.from('followers').select('*').eq('follower_id', uid);
        renderSocialList(list);
    }
}

function renderSocialList(list) {
    const content = document.getElementById('socialContentArea');
    content.innerHTML = "";
    if (!list) return;

    list.forEach(u => {
        content.innerHTML += `
        <div class="social-item" data-name="${u.friend_name.toLowerCase()}">
        <div class="social-user-info" onclick="document.getElementById('socialListsUI').style.display='none'; openProfile('${u.follower_id}')">
        <img src="${u.friend_photo || 'https://ui-avatars.com/api/?name='+u.friend_name}" class="social-ava">
        <div>
        <div class="social-name">${u.friend_name}</div>
        <div class="social-status">Emigrant</div>
        </div>
        </div>
        <div class="social-actions-btns">
        <div class="social-msg-btn" onclick="startChat('${u.follower_id}', '${u.friend_name}', '${u.friend_photo}')">
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
    const { data: { user } } = await supabase.auth.getUser();
    
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.success) {
            await supabase.from('users').update({ photo: data.data.url }).eq('id', user.id);
            alert("Done!");
        }
    } catch(e) { alert("Error!"); }
}

function logoutUser() {
    if(confirm("Logout?")) { 
        supabase.auth.signOut().then(() => { location.reload(); }); 
    }
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

// ==========================================
// 14. რეგისტრაცია და ავტორიზაცია
// ==========================================
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

        const { data, error } = await supabase.auth.signUp({ email, password: pass });

        if (error) {
            let msg = "რეგისტრაცია ვერ მოხერხდა";
            if (error.message.includes('already registered')) msg = "ეს ელფოსტა უკვე დაკავებულია";
            showAuthError(msg);
        } else if (data && data.user) {
            await supabase.from('users').insert([{
                id: data.user.id,
                name: name, 
                akho: 50.00, 
                photo: "", 
                hasSeenRules: false, 
                role: 'user', 
                privacy: 'public', 
                presence: Date.now() 
            }]);
            
            if(typeof addToLog === "function") addToLog('Welcome Bonus', 50.00);
            showCustomAlert("მოგესალმებით", "რეგისტრაცია წარმატებულია!");
        }

    } else {
        const email = document.getElementById('uEmail').value.trim();
        const pass = document.getElementById('uPass').value.trim();

        if (!email || !pass) return showAuthError("შეიყვანეთ მეილი და პაროლი");

        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showAuthError("ელფოსტა ან პაროლი არასწორია");
        } else {
            showCustomAlert("მოგესალმებით", "წარმატებით შეხვედით სისტემაში!");
        }
    }
}

// ==========================================
// 15. ვიდეოს ატვირთვა Storage-ში
// ==========================================
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
    }

    const btn = document.getElementById('upBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "მიმდინარეობს ატვირთვა...";
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const videoName = `${Date.now()}_${file.name}`;
        
        // ფაილის ატვირთვა Supabase Storage "videos" ბაკეტში
        const { data: storageData, error: uploadError } = await supabase.storage
            .from('videos')
            .upload(videoName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // ატვირთული ფაილის საჯარო ლინკის წამოღება
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(videoName);

        // პოსტის მონაცემების შენახვა ცხრილში
        await supabase.from('posts').insert([{
            authorId: user.id,
            authorName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
            authorPhoto: typeof myPhoto !== 'undefined' ? myPhoto : "",
            text: document.getElementById('videoDesc').value || "",
            media: [{ url: publicUrl, type: 'video' }],
            timestamp: Date.now()
        }]);

        spendAkho(5, 'Video Upload');

        if (progressModal) {
            if (percentText) percentText.innerText = "100%";
            statusTitle.innerText = "Thank You!";
            statusText.innerText = "Payment received.";
            progressBtn.innerText = "Check Balance";
            progressBtn.disabled = false;
            progressBtn.onclick = () => {
                progressModal.style.display = 'none';
                location.reload();
            };
        }
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

// ==========================================
// 16. მთავარი ფიდის (Feed) რენდერი
// ==========================================
async function renderTokenFeed() {
    if (document.getElementById('liveUI').style.display === 'flex') return;
    if (isFeedLoading) return;
    
    isFeedLoading = true;
    const feed = document.getElementById('main-feed');

    let query = supabase.from('posts').select('*').order('timestamp', { ascending: false });
    if (lastVisibleTimestamp) {
        query = query.lt('timestamp', lastVisibleTimestamp);
    }

    const { data: posts } = await query.limit(FEED_LIMIT);
    isFeedLoading = false;
    if (!posts || posts.length === 0) return;

    lastVisibleTimestamp = posts[posts.length - 1].timestamp;

    posts.forEach(post => {
        if (!post || !post.media || !post.media.some(m => m.type === 'video') || document.getElementById(`card-${post.id}`)) return;

        const videoUrl = post.media.find(m => m.type === 'video').url;
        const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
        const shareCount = post.shares || 0;
        const saveCount = post.saves || 0;
        
        const card = document.createElement('div');
        card.className = 'video-card';
        card.id = `card-${post.id}`;
        
        const { data: { user } } = supabase.auth.getUser();
        const isLikedByMe = post.likedBy && post.likedBy[user?.id];
        const isSavedByMe = post.savedBy && post.savedBy[user?.id];      
        
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
<div class="live-activity-overlay" id="live-activity-${post.id}" style="position: absolute; bottom: 110px; left: 15px; width: 220px; height: 250px; pointer-events: none;"></div>

<div class="side-actions">
    <div id="ava-wrapper-${post.id}" style="position:relative; width:48px; height:48px; border-radius:50%;">
        <img id="ava-${post.id}" src="token-avatar.png" class="author-mini-ava" onclick="openProfile('${post.authorId}')" style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:2px solid #000; display:block;">
        <div id="mini-status-${post.id}" style="position:absolute; bottom:0; right:0; width:12px; height:12px; background:var(--green); border-radius:50%; border:2px solid #000; display:none; z-index:10;"></div>
    </div>

    <div id="like-btn-${post.id}" class="action-item ${isLikedByMe ? 'liked' : ''}" onclick="react('${post.id}', '${post.authorId}')">
        <i class="fas fa-heart"></i>
        <span id="like-count-${post.id}">${likeCount}</span>
    </div>
    
    <div class="action-item" onclick="openComments('${post.id}')">
        <i class="fas fa-comment-dots"></i>
        <span id="comm-count-${post.id}">0</span>
    </div>
    <div id="save-btn-${post.id}" class="action-item ${isSavedByMe ? 'saved' : ''}" onclick="toggleSavePost('${post.id}')">
        <i class="fas fa-bookmark"></i>
        <span id="save-count-${post.id}">${saveCount}</span>
    </div>
    <div class="action-item" onclick="openShare('${post.id}', '${videoUrl}')">
        <i class="fas fa-share"></i>
        <span id="share-count-${post.id}">${shareCount}</span>
    </div>
    <div class="action-item gift-btn" onclick="window.openGiftPanel('${post.id}', '${post.authorId}')">
        <i class="fas fa-gift" style="color: #ff4d4d;"></i>
        <span>Gift</span>
    </div>
    ${post.authorId === user?.id ? `
    <div class="action-item" onclick="deleteMyVideo('${post.id}')" style="margin-top: 5px;">
        <i class="fas fa-trash-alt" style="color: #ff4d4d; font-size: 20px;"></i>
        <span style="color: #ff4d4d; font-size: 10px;">DEL</span>
    </div>` : ''}
</div>
<div style="position:absolute; left:15px; bottom:90px; text-shadow:2px 2px 4px #000; pointer-events:none; max-width: 75%;">
    <div style="display: flex; align-items: center; gap: 6px;">
        <b id="name-${post.id}" style="color:var(--gold); cursor:pointer; pointer-events:auto;" onclick="openProfile('${post.authorId}')">@${post.authorName}</b>
        <span style="color: rgba(255,255,255,0.6); font-size: 12px; font-weight: normal;"> • ${post.timestamp ? new Date(post.timestamp).toLocaleDateString('en-US', {month:'2-digit', day:'2-digit'}).replace('/', '-') : ''}</span>
    </div>
    <p style="font-size:14px; margin-top:6px; pointer-events:auto; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; line-height: 1.3; color: #fff;">
        ${post.text || ''}
    </p>
</div>`;
        
        feed.appendChild(card);
        cleanupOldVideos();

        // ლაივ აქტივობები
        function startLikeCycle() {
            if (post.authorId !== user?.id) return;
            const activityContainer = document.getElementById(`live-activity-${post.id}`);
            if (!activityContainer) return;
            const currentPostLikes = post.likedBy ? Object.values(post.likedBy) : [];
            if (currentPostLikes.length === 0 || document.visibilityState !== 'visible') {
                setTimeout(startLikeCycle, 5000);
                return;
            }
            let index = 0;
            function spawnNext() {
                const container = document.getElementById(`live-activity-${post.id}`);
                if (!container) return;
                if (index < currentPostLikes.length) {
                    const person = currentPostLikes[index];
                    const avaBox = document.createElement('div');
                    avaBox.className = 'floating-avatar-box';
                    avaBox.style.position = 'absolute'; avaBox.style.bottom = '0px'; avaBox.style.left = '0px';
                    avaBox.innerHTML = `
                        <div style="position:relative; width:48px; height:48px;">
                            <img src="${person.photo || 'token-avatar.png'}" style="width:48px; height:48px; border-radius:50%; border:2px solid var(--gold); object-fit:cover;">
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

        // კომენტარების რაოდენობის წამოღება
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id).then(({ count }) => {
            const el = document.getElementById(`comm-count-${post.id}`);
            if(el) el.innerText = count || 0;
        });

        // ავტორის სტატუსის განახლება
        supabase.from('users').select('photo, name, presence').eq('id', post.authorId).single().then(({ data: u }) => {
            if(!u) return;
            const ava = document.getElementById(`ava-${post.id}`);
            const name = document.getElementById(`name-${post.id}`);
            const status = document.getElementById(`mini-status-${post.id}`);
            if(u.photo && ava) ava.src = u.photo;
            if(u.name && name) name.innerText = "@" + u.name;
            if(u.presence === 'online' && status) status.style.display = 'block';
            else if(status) status.style.display = 'none';
        });
    });
    setupAutoPlay();
}

window.addEventListener('scroll', function() {
    const feed = document.getElementById('main-feed');
    if (!feed || isFeedLoading) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || window.pageYOffset;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 800) {
        renderTokenFeed();
    }
}, { passive: true });

// ==========================================
// 17. პოსტის წაშლა
// ==========================================
async function deleteMyVideo(postId) {
    if (!confirm("ნამდვილად გსურთ ვიდეოს სამუდამოდ წაშლა?")) return;

    try {
        const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
        if (!post) {
            console.error("პოსტი ვერ მოიძებნა!");
            return;
        }

        const videoMedia = post.media ? post.media.find(m => m.type === 'video') : null;
        if (videoMedia && videoMedia.url) {
            try {
                // ფაილის წაშლა Storage-დან
                const path = videoMedia.url.split('/storage/v1/object/public/videos/')[1];
                if (path) {
                    await supabase.storage.from('videos').remove([path]);
                    console.log("ფაილი წაიშალა Storage-დან ✅");
                }
            } catch (storageErr) {
                console.warn("ფაილი Storage-ში არ არსებობს ან ვერ წაიშალა:", storageErr);
            }
        }

        await supabase.from('posts').delete().eq('id', postId);
        await supabase.from('comments').delete().eq('post_id', postId);

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
    } catch (error) {
        alert("შეცდომა წაშლისას: " + error.message);
    }
}

function setupAutoPlay() {
    if (document.getElementById('messengerUI').style.display === 'flex') return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            const postId = entry.target.id.replace('card-', '');

            if (entry.isIntersecting) {
                video.style.opacity = "1";
                video.play().catch(e => {}); 
                video.muted = false;

                if (postId && postId !== "") {
                    const { data } = await supabase.from('posts').select('views').eq('id', postId).single();
                    await supabase.from('posts').update({ views: (data?.views || 0) + 1 }).eq('id', postId);
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

// ==========================================
// 18. საჩუქრების სისტემა (Gifts)
// ==========================================
window.openGiftPanel = function(postId, authorId) {
    if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
    const panel = document.createElement('div');
    panel.id = "dynamicGiftPanel";
    panel.style = "position:fixed; bottom:0; left:0; width:100%; background:rgba(10,10,10,0.98); border-top:2px solid #d4af37; border-radius:20px 20px 0 0; padding:25px 20px; z-index:200005; backdrop-filter:blur(15px); color:white; font-family:sans-serif;";
    
    // GIFs და საჩუქრების ლინკები (აქ ინახება შენი გიტჰაბის ლინკები)
    const gifts = [
        { cost: 5, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Begemot.gif" },
        { cost: 10, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava.gif" },
        { cost: 15, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yava1.gif" },
        { cost: 20, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Yvavili.gif" },
        { cost: 25, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Egvipte.gif" },
        { cost: 50, url: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/Guli.gif" }
        // აქ შეგიძლია ჩაამატო ყველა დანარჩენი საჩუქარი...
    ];

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <b style="color:#d4af37;">აირჩიე საჩუქარი</b>
            <i class="fas fa-times" onclick="document.getElementById('dynamicGiftPanel').remove()" style="cursor:pointer; font-size:20px; color:gray;"></i>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; max-height:400px; overflow-y:auto;">
            ${gifts.map(g => `
                <div onclick="window.processGift('${authorId}', ${g.cost}, '${g.url}')" style="background:rgba(255,255,255,0.05); padding:10px 5px; border-radius:15px; text-align:center; cursor:pointer; border:1px solid #333;">
                    <img src="${g.url}" style="width:60px; height:60px; object-fit:contain;">
                    <div style="color:#d4af37; font-weight:bold; font-size:12px;">${g.cost} AKHO</div>
                </div>
            `).join('')}
        </div>`;
    document.body.appendChild(panel);
};

window.processGift = async function(targetUid, cost, giftUrl) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (user.id === targetUid) return alert("საკუთარ თავს ვერ აჩუქებთ!");
    
    const { data: myData } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!myData) return alert("მონაცემები ვერ მოიძებნა!");

    const myBalance = myData.akho || 0;
    if (myBalance < cost) return alert("არ გაქვთ საკმარისი AKHO! ❌");

    // ბალანსის განახლება
    await supabase.from('users').update({ akho: myBalance - cost }).eq('id', user.id);
    
    const { data: targetUser } = await supabase.from('users').select('gift_balance').eq('id', targetUid).single();
    await supabase.from('users').update({ gift_balance: (targetUser?.gift_balance || 0) + cost }).eq('id', targetUid);

    // საჩუქრის ჩაწერა ბაზაში
    await supabase.from('received_gifts').insert([{
        receiver_id: targetUid,
        giftUrl: giftUrl,
        price: cost,
        fromName: myData.name || "მეგობარი", 
        fromPhoto: myData.photo || "",      
        timestamp: Date.now()
    }]);

    if (document.getElementById('dynamicGiftPanel')) document.getElementById('dynamicGiftPanel').remove();
    
    // საჩუქრის ანიმაცია
    showLocalGiftAnimation(giftUrl, cost);
};

function showLocalGiftAnimation(giftUrl, cost) {
    const animWrapper = document.createElement('div');
    animWrapper.id = "activeGiftAnimation";
    animWrapper.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2000010; pointer-events:none; text-align:center; min-width:300px; font-family: sans-serif;";
    animWrapper.innerHTML = `
        <div id="giftStep1" style="animation: giftStep1Anim 3s forwards;">
            <img src="${giftUrl}" style="width:140px; height:140px; object-fit:contain; filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));">
        </div>
        <div id="giftStep2" style="display:none; animation: giftStep2Anim 30s forwards; position:relative;">
            <div class="gift-image-container">
                <div class="golden-glow-overlay"></div>
            </div>
            <div class="gift-text-container" style="margin-top: -20px; position:relative; z-index:3;">
                <h1 style="color:#fff3c3; text-shadow: 0 0 5px #fff, 0 0 10px #fbd14b, 0 0 15px #fbd14b, 0 0 20px #e0ac00; font-size:28px; font-weight:bold; margin:0 0 2px 0; text-transform: uppercase;">საჩუქარი!</h1>
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
}

window.transferToMainBalance = async function(amount) {
    if (!amount || amount <= 0) return alert("გადასატანი არაფერია!");
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('users').update({ gift_balance: 0 }).eq('id', user.id);
    
    const { data } = await supabase.from('users').select('akho').eq('id', user.id).single();
    await supabase.from('users').update({ akho: (data?.akho || 0) + amount }).eq('id', user.id);
    
    await supabase.from('received_gifts').delete().eq('receiver_id', user.id);

    alert("AKHO გადაიტანილა და კოლექცია გასუფთავდა! ✅");
    location.reload();
};

window.buyEuroWithGift = async function(amount) {
    if (!amount || amount < 100) return alert("მინიმუმ 100 AKHO საჭიროა! 💶");

    const euroValue = (amount / 100).toFixed(2);
    const confirmExchange = confirm(`თქვენი ${amount} AKHO გადაიცვლება ${euroValue} ევროდ.\n\nგსურთ გაგრძელება?`);
    
    if (confirmExchange) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('users').update({ gift_balance: 0 }).eq('id', user.id);
        
        const { data } = await supabase.from('users').select('euro_balance').eq('id', user.id).single();
        await supabase.from('users').update({ euro_balance: (data?.euro_balance || 0) + parseFloat(euroValue) }).eq('id', user.id);
        
        await supabase.from('euro_history').insert([{
            uid: user.id,
            type: "გადაცვლა",
            amount: euroValue,
            akhoAmount: amount,
            timestamp: Date.now()
        }]);

        await supabase.from('received_gifts').delete().eq('receiver_id', user.id);
        alert(`წარმატებით გადაიცვალა! ✅`);
        location.reload();
    }
};

// ==========================================
// 19. ფინანსური პანელი
// ==========================================
async function showGiftsCollection(uid) {
    const { data: { user } } = await supabase.auth.getUser();
    const isMyProfile = (user && user.id === uid);

    const modal = document.createElement('div');
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:2000020; display:flex; flex-direction:column; padding:20px; backdrop-filter:blur(10px); color:white;";
    
    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="color:#d4af37; margin:0;">საჩუქრების კოლექცია 🎁</h3>
            <i class="fas fa-times" onclick="this.parentElement.parentElement.remove()" style="cursor:pointer; font-size:24px;"></i>
        </div>

        <div id="giftWalletSection" style="display:none; margin-bottom:25px; background:linear-gradient(145deg, #1a1a1a, #111); padding:20px; border-radius:20px; text-align:center;">
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
        </div>`;
    document.body.appendChild(modal);

    const container = document.getElementById('giftsContainer');
    if (isMyProfile) {
        document.getElementById('giftWalletSection').style.display = "block";
        
        const { data: uData } = await supabase.from('users').select('gift_balance').eq('id', uid).single();
        const bal = uData?.gift_balance || 0;
        document.getElementById('giftBalanceDisplay').innerText = `${bal} AKHO`;
        document.getElementById('transferBtn').onclick = () => window.transferToMainBalance(bal);
        document.getElementById('buyEuroBtn').onclick = () => window.buyEuroWithGift(bal);
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
                <img src="${gift.giftUrl}" style="width:80px; height:80px; object-fit:contain; margin-bottom:10px;">
                <div style="color:#d4af37; font-weight:bold; font-size:14px;">${gift.price} AKHO</div>
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid #222;">
                    <img src="${gift.fromPhoto || 'https://ui-avatars.com/api/?name='+gift.fromName}" style="width:20px; height:20px; border-radius:50%; border:1px solid #d4af37;">
                    <span style="font-size:11px; color:#aaa;">${gift.fromName}</span>
                </div>
            </div>`;
    });
}

// ==========================================
// 20. ტრანზაქციების ისტორია და ევრო საფულე
// ==========================================
window.showFinancialWallet = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ავტორიზაცია საჭიროა!");

    const modal = document.createElement('div');
    modal.id = "financialWalletModal";
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:2000030; display:flex; flex-direction:column; color:white;";
    
    const { data: u } = await supabase.from('users').select('euro_balance').eq('id', user.id).single();
    const euroBal = u?.euro_balance || 0;
    const canCashOut = euroBal >= 50;

    modal.innerHTML = `
        <div style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #222;">
            <i class="fas fa-chevron-left" onclick="document.getElementById('financialWalletModal').remove()" style="font-size:20px; cursor:pointer; width:30px;"></i>
            <div style="flex:1; text-align:center; font-weight:bold; font-size:17px;">ბალანსი</div>
            <div style="width:30px;"></div>
        </div>
        <div style="flex:1; overflow-y:auto; padding:20px;">
            <div style="text-align:center; margin:30px 0;">
                <div style="font-size:14px; color:#8a8a8a; margin-bottom:10px;">მოსალოდნელი თანხა EUR</div>
                <div style="font-size:48px; font-weight:bold; margin-bottom:20px;">${euroBal.toFixed(2)} <span>€</span></div>
            </div>
            <div style="background:#1f1f1f; border-radius:12px; padding:20px; border: 1px solid ${canCashOut ? '#2ecc71' : '#333'};">
                <h4 style="margin:0 0 10px 0; color:${canCashOut ? '#2ecc71' : '#d4af37'};">Cash Out</h4>
                <input type="text" id="payoutIbanField" placeholder="IBAN / PayPal" ${!canCashOut ? 'disabled' : ''} style="width:100%; padding:12px; border-radius:8px; border:1px solid #333; background:#121212; color:white; outline:none; margin-bottom:15px;">
                <button onclick="${canCashOut ? `window.processWithdrawRequest(${euroBal})` : ''}" style="width:100%; padding:12px; border:none; border-radius:8px; color:${!canCashOut ? '#666' : 'black'}; background:${!canCashOut ? '#333' : '#2ecc71'}; font-weight:bold; cursor:${!canCashOut ? 'not-allowed' : 'pointer'};">
                    გატანის მოთხოვნა
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

// ==========================================
// 21. პოსტების მონიშვნა (Wall tags) და კედელი
// ==========================================
window.toggleWallTag = async function(postId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    const myUid = user.id;

    const { data: post } = await supabase.from('community_posts').select('taggedBy').eq('id', postId).single();
    const taggedBy = post?.taggedBy || {};

    const btnElement = event.currentTarget.querySelector('i');
    const textElement = event.currentTarget.querySelector('span');

    if (taggedBy[myUid]) {
        delete taggedBy[myUid];
        await supabase.from('community_posts').update({ taggedBy: taggedBy }).eq('id', postId);
        if (btnElement) {
            btnElement.className = "far fa-user-tag";
            btnElement.style.color = "#888";
        }
        if (textElement) textElement.innerText = "მონიშვნა";
    } else {
        taggedBy[myUid] = true;
        await supabase.from('community_posts').update({ taggedBy: taggedBy }).eq('id', postId);
        if (btnElement) {
            btnElement.className = "fas fa-user-tag";
            btnElement.style.color = "var(--gold)";
        }
        if (textElement) textElement.innerText = "მონიშნულია";
    }
};

window.loadMyTaggedWallPosts = async function(targetUid) {
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

    const { data: communityPosts } = await supabase.from('community_posts').select('*').order('timestamp', { ascending: false });

    box.innerHTML = ""; 
    if (!communityPosts) {
        box.innerHTML = "<p style='color:gray; text-align:center; padding:20px;'>ბაზაში პოსტები არ არის</p>";
        return;
    }

    let count = 0;
    communityPosts.forEach(post => {
        if (post.taggedBy && post.taggedBy[uidToLoad]) {
            count++;
            const isLiked = (post.likes && post.likes[user.id]);
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
};

// ==========================================
// 22. კავშირი და მორგება (Initialization)
// ==========================================
supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) monitorMessageRequests();
});
