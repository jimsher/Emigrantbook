// --- EMIGRANTBOOK VIDEO CALL MODULE ---
// დაყენდა ზუსტად ისე, როგორც ლაივშია (mode: "live")
const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

// კონფიგურაცია - ერთი და იგივე მონაცემები ორივე მხარისთვის
const APPID = "258897e8fb5f4dd089b761eca6568b24";
const TOKEN = null; // მუდმივი კოდი, როგორც ლაივში
const FIXED_CHANNEL = "live_stream"; 

// 1. ზარის დაწყება (როცა შენ რეკავ)
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("ჯერ აირჩიეთ ჩატი!");

    // UI-ს მომზადება (კამერის ჩართვამდე)
    const ui = document.getElementById('videoCallUI');
    if(ui) ui.style.display = 'flex';

    // ბაზიდან სახელის ამოღება, რომ "ლევანი" არ ეწეროს
    db.ref('users/' + targetUid + '/name').once('value').then(snap => {
        const rName = document.getElementById('remote-name');
        if(rName) rName.innerText = snap.val() || "Emigrant";
    });

    // შენი ორიგინალი Firebase ლოგიკა
    await db.ref('video_calls/' + targetUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: FIXED_CHANNEL,
        status: 'calling',
        ts: Date.now()
    });

    startVideoCall(); // ეს რთავს აგორას და კამერას
}

// 2. მთავარი ვიდეო ფუნქცია
async function startVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;

    ui.style.display = 'flex';
    
    try {
        const uid = Math.floor(Math.random() * 10000);
        
        // როცა რეჟიმი არის "live", კლიენტს სჭირდება როლის მინიჭება (host - ვინც აჩვენებს ვიდეოს)
        await client.setClientRole("host");
        
        // უერთდება ზემოთ აღწერილ APPID-ს, FIXED_CHANNEL-ს და მუდმივ TOKEN-ს
        await client.join(APPID, FIXED_CHANNEL, TOKEN, uid);
        
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play("local-video");
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

        // სხვისი ვიდეოს გამოჩენა
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
                const remoteLabel = document.getElementById('remote-label');
                if (remoteLabel) remoteLabel.innerText = "Connected";
                user.videoTrack.play("remote-video");
            }
            if (mediaType === "audio") user.audioTrack.play();
        });

    } catch (err) {
        console.error("Agora Error:", err);
        alert("ვიდეო ზარი ვერ შედგა. შეამოწმეთ კამერა ან ტოკენი.");
        endVideoCall();
    }
}

// 3. შემოსული ზარის მოსმენა
function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            // ვაჩენთ ფანჯარას
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'flex';

            // ვწერთ სახელს და ფოტოს
            document.getElementById('callerNameDisplay').innerText = call.callerName;
            if (call.callerPhoto) {
                document.getElementById('callerAva').src = call.callerPhoto;
            }

            // ვინახავთ ზარის მონაცემებს პასუხისთვის
            window.activeIncomingCall = call;
        } else if (!call) {
            // თუ დამრეკმა გათიშა, ვმალავთ ფანჯარას
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'none';
        }
    });
}

// 4. ზარის დასრულება
async function endVideoCall() {
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };

    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';

    if (window.currentChatId) db.ref(`video_calls/${window.currentChatId}`).remove();
    if (auth.currentUser) db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 5. მართვის ღილაკები
function toggleMic() {
    micMuted = !micMuted;
    if (localTracks.audioTrack) localTracks.audioTrack.setEnabled(!micMuted);
    document.getElementById('micBtn').style.background = micMuted ? '#ff4d4d' : '#333';
}

function toggleCam() {
    camMuted = !camMuted;
    if (localTracks.videoTrack) localTracks.videoTrack.setEnabled(!camMuted);
    document.getElementById('camBtn').style.background = camMuted ? '#ff4d4d' : '#333';
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;
    if (ui.style.width === '100%') {
        ui.style.width = '150px'; ui.style.height = '220px';
        ui.style.top = '80px'; ui.style.left = '20px';
        ui.style.borderRadius = '20px'; ui.style.border = '2px solid #d4af37';
    } else {
        ui.style.width = '100%'; ui.style.height = '100%';
        ui.style.top = '0'; ui.style.left = '0';
        ui.style.borderRadius = '0'; ui.style.border = 'none';
    }
}

// 1. ფუნქცია პასუხისთვის (მწვანე ღილაკი)
async function acceptCall() {
    if (window.activeIncomingCall) {
        await db.ref(`video_calls/${auth.currentUser.uid}`).update({ 
            status: 'accepted' 
        });
    }

    document.getElementById('incomingCallModal').style.display = 'none';
    startVideoCall();
}

// 2. ფუნქცია უარყოფისთვის (წითელი ღილაკი)
function declineCall() {
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    document.getElementById('incomingCallModal').style.display = 'none';
}
















// --- პატარა ჩარჩოს გადაადგილების (Drag) და ადგილების გაცვლის (Swap) ლოგიკა ---

document.addEventListener("DOMContentLoaded", () => {
    const localBox = document.getElementById("local-video");
    const remoteBox = document.getElementById("remote-video");
    
    if (!localBox || !remoteBox) return;

    // თავიდანვე მივცეთ საჭირო სტილები კოდიდან, რომ არ აირიოს
    localBox.style.position = "absolute";
    localBox.style.cursor = "grab";
    localBox.style.touchAction = "none"; // მობილურზე სქროლვა რომ არ აირიოს თითის წაღებისას

    let isDragging = false;
    let hasMoved = false; // ამოწმებს თითი უბრალოდ დააჭირა (კლიკი) თუ წაიღო (Drag)
    let startX, startY, initialLeft, initialTop;

    // --- გადაადგილების დაწყება (მაუსი და თითი) ---
    const dragStart = (e) => {
        isDragging = true;
        hasMoved = false;
        localBox.style.cursor = "grabbing";

        // თავსებადობა მობილურისთვის და კომპიუტერისთვის
        const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
        const pageY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;

        startX = pageX;
        startY = pageY;

        initialLeft = localBox.offsetLeft;
        initialTop = localBox.offsetTop;
    };

    // --- მოძრაობის პროცესი ---
    const dragMove = (e) => {
        if (!isDragging) return;
        
        const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
        const pageY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;

        const deltaX = pageX - startX;
        const deltaY = pageY - startY;

        // თუ მოძრაობა 5 პიქსელზე მეტია, ესე იგი მომხმარებელს გადააქვს და არა უბრალოდ აჭერს
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasMoved = true;
        }

        // ახალი პოზიციის დასმა
        localBox.style.left = `${initialLeft + deltaX}px`;
        localBox.style.top = `${initialTop + deltaY}px`;
        localBox.style.bottom = "auto";
        localBox.style.right = "auto";
    };

    // --- მოძრაობის დასრულება / კლიკი ---
    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        localBox.style.cursor = "grab";

        // თუ თითი არ გაუყოლებია და უბრალოდ დააჭირა (Click / Tap), ვცვლით ადგილებს
        if (!hasMoved) {
            swapVideoViews();
        }
    };

    // ივენთების მიბმა მაუსზე
    localBox.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);

    // ივენთების მიბმა სენსორულ ეკრანზე (მობილურებისთვის)
    localBox.addEventListener("touchstart", dragStart, { passive: true });
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);

    // --- გამოსახულებების გაცვლის ფუნქცია (Swap) ---
    let isSwapped = false;
    function swapVideoViews() {
        if (!isSwapped) {
            // საკუთარი ვიდეო ხდება დიდი (სრული ეკრანი)
            localBox.style.width = "100%";
            localBox.style.height = "100%";
            localBox.style.top = "0";
            localBox.style.left = "0";
            localBox.style.zIndex = "1";

            // სხვისი ვიდეო პატარავდება და ხდება ჩარჩო
            remoteBox.style.width = "120px";
            remoteBox.style.height = "160px";
            remoteBox.style.position = "absolute";
            remoteBox.style.bottom = "80px";
            remoteBox.style.right = "20px";
            remoteBox.style.top = "auto";
            remoteBox.style.left = "auto";
            remoteBox.style.zIndex = "10";
            remoteBox.style.borderRadius = "12px";
            remoteBox.style.border = "2px solid var(--gold, #d4af37)";
            
            isSwapped = true;
        } else {
            // ბრუნდება საწყის მდგომარეობაში (სხვისი დიდი, შენი პატარა)
            remoteBox.style.width = "100%";
            remoteBox.style.height = "100%";
            remoteBox.style.top = "0";
            remoteBox.style.left = "0";
            remoteBox.style.borderRadius = "0";
            remoteBox.style.border = "none";
            remoteBox.style.zIndex = "1";

            localBox.style.width = "120px";
            localBox.style.height = "160px";
            localBox.style.bottom = "80px";
            localBox.style.right = "20px";
            localBox.style.top = "auto";
            localBox.style.left = "auto";
            localBox.style.zIndex = "10";
            localBox.style.borderRadius = "12px";
            localBox.style.border = "2px solid var(--gold, #d4af37)";

            isSwapped = false;
        }
    }
});
