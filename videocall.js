// --- EMIGRANTBOOK VIDEO CALL MODULE ---
// დაყენდა ზუსტად ისე, როგორც ლაივშია (mode: "live")
const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

// მასივი ჯგუფში მყოფი აქტიური იუზერების დასათვლელად
let activeUsersInCall = [];

// --- აუდიო ფაილების კონფიგურაცია ზარებისთვის ---
// გამავალი ზარის ხმა შენთვის
const outgoingAudio = new Audio("https://raw.githubusercontent.com/jimsher/Emigrantbook/762870916f88e11678b41c9547a62ae4b15f8d64/Video%20zari%20%20gamavali.mp3");
// შემომავალი ზარის ხმა მისთვის, ვისაც ურეკავ (აქ ჩაწერე შენი მეორე ფაილის ზუსტი სახელი ბოლოში)
const incomingAudio = new Audio("https://raw.githubusercontent.com/jimsher/Emigrantbook/762870916f88e11678b41c9547a62ae4b15f8d64/Video%20zari%20Shemavali.mp3");

// ჩავრთოთ მუსიკის მუდმივი ტრიალი (Loop) და წინასწარ გავხსნათ ხმა
outgoingAudio.loop = true;
incomingAudio.loop = true;
outgoingAudio.volume = 1.0;
incomingAudio.volume = 1.0;

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

    // ჩავრთოთ გამავალი ზარის გუგუნი ჩვენთან
    try {
        incomingAudio.pause(); // ყოველი შემთხვევისთვის, მეორე ხმა რომ გაჩუმდეს
        incomingAudio.currentTime = 0;
        outgoingAudio.play();
    } catch (e) {
        console.log("აუდიოს დაკვრის ხარვეზი:", e);
    }

    startVideoCall(); // ეს რთავს აგორას და კამერას
}

// 2. მთავარი ვიდეო ფუნქცია
async function startVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;

    ui.style.display = 'flex';
    
    try {
        const uid = Math.floor(Math.random() * 10000);
        
        if(!activeUsersInCall.includes("local")) activeUsersInCall.push("local");
        
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

                if(!activeUsersInCall.includes(user.uid)) activeUsersInCall.push(user.uid);

                // თუ სულ 2 ადამიანია, მუშაობს შენი ორიგინალი ეკრანის სისტემა
                if(activeUsersInCall.length <= 2) {
                    user.videoTrack.play("remote-video");
                } 
                // თუ მესამე დაემატა, ირთვება ჯგუფური Grid რეჟიმი
                else {
                    handleGroupVideoJoined(user);
                }
                
                // როგორც კი მეორე მხარე შემოვა (ზარი შედგება), ჩვენთან გამავალი ზარის ხმა უნდა გაჩუმდეს
                outgoingAudio.pause();
                outgoingAudio.currentTime = 0;
            }
            if (mediaType === "audio") user.audioTrack.play();
        });

        // როცა ვინმე ტოვებს ჯგუფურ ზარს
        client.on("user-left", (user) => {
            activeUsersInCall = activeUsersInCall.filter(id => id !== user.uid);
            const div = document.getElementById(`group-user-${user.uid}`);
            if(div) div.remove();
            updateGroupGridStyles();
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

            // ჩავრთოთ შემომავალი ზარის მელოდია მასთან, ვისაც ვურეკავთ
            try {
                outgoingAudio.pause();
                outgoingAudio.currentTime = 0;
                incomingAudio.play();
            } catch (e) {
                console.log("აუდიოს დაკვრის ხარვეზი:", e);
            }

            // ვინახავთ ზარის მონაცემებს პასუშისთვის
            window.activeIncomingCall = call;
        } else if (!call) {
            // თუ დამრეკმა გათიშა, ვმალავთ ფანჯარას
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'none';
            
            // ვაჩუმებთ შემომავალ ზარს, თუ დამრეკმა გადაიფიქრა
            incomingAudio.pause();
            incomingAudio.currentTime = 0;
        }
    });
}

// 4. ზარის დასრულება
// 4. ზარის დასრულება (როცა შენ აჭერ წითელ ღილაკს)
async function endVideoCall() {
    // პირველ რიგში ვაჩუმებთ ყველა ზარის ხმას
    outgoingAudio.pause();
    outgoingAudio.currentTime = 0;
    incomingAudio.pause();
    incomingAudio.currentTime = 0;

    // პირველ რიგში ვხურავთ ადგილობრივ ტრეკებს, რომ კამერა ეგრევე ჩაქრეს
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };

    try {
        await client.leave();
    } catch (e) {
        console.error("Agora leave error:", e);
    }
    
    // იძახებს დასრულების მესინჯერის გვერდს
    showCallEndedScreen();

    const myUid = auth.currentUser.uid;
    const targetUid = window.currentChatId;

    // უსაფრთხო და მყარი გათიშვა სინქრონისთვის:
    // 1. ჯერ მეორე იუზერის ბაზაში ვწერთ სტატუსს 'ended', რომ მისმა ტელეფონმა ეგრევე გათიშოს
    if (targetUid) {
        await db.ref(`video_calls/${targetUid}`).update({ status: 'ended' });
        // 1 წამში ვშლით ჩანაწერს, რომ ბაზა გასუფთავდეს
        setTimeout(() => { db.ref(`video_calls/${targetUid}`).remove(); }, 1000);
    }

    // 2. ჩვენს საკუთარ ჩანაწერსაც ვუკეთებთ 'ended'-ს და ვშლით
    await db.ref(`video_calls/${myUid}`).update({ status: 'ended' });
    setTimeout(() => { db.ref(`video_calls/${myUid}`).remove(); }, 1000);

    // ჯგუფური პარამეტრების სრული განულება
    activeUsersInCall = [];
    document.getElementById("group-video-container").innerHTML = "";
    document.getElementById("group-video-container").style.display = "none";
    document.getElementById("remote-video").style.display = "block";
    document.getElementById("local-video").style.cssText = "width:120px; height:180px; background:#222; position:absolute; bottom:140px; right:20px; border-radius:15px; border:2px solid var(--gold, #d4af37); overflow:hidden; z-index:100; box-shadow: 0 10px 25px rgba(0,0,0,0.6);";
}

// 3. შემოსული ზარის მოსმენა (Realtime-ში უსმენს სტატუსის ცვლილებებს)
function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        
        // ა) თუ ვინმე გვირეკავს
        if (call && call.status === 'calling') {
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'flex';

            document.getElementById('callerNameDisplay').innerText = call.callerName;
            if (call.callerPhoto) {
                document.getElementById('callerAva').src = call.callerPhoto;
            }

            // ჩავრთოთ შემომავალი ზარის მელოდია
            try {
                outgoingAudio.pause();
                outgoingAudio.currentTime = 0;
                incomingAudio.muted = false;
                // გასწორდა აქ: ჩაიწერა რეალური შემომავალი ზარის ხმის გამოძახება!
                incomingAudio.play().catch(err => console.log("Autoplay block:", err));
            } catch (e) {
                console.log("აუდიოს დაკვრის ხარვეზი:", e);
            }

            window.activeIncomingCall = call;
        } 
        // ბ) თუ დამრეკმა დააჭირა გათიშვას (status ხდება 'ended') ან ჩანაწერი წაიშალა (!call)
        else if (!call || (call && call.status === 'ended')) {
            
            // ზარი რომ წყდება, ორივე აუდიოს ვაჩუმებთ მომენტალურად
            outgoingAudio.pause();
            outgoingAudio.currentTime = 0;
            incomingAudio.pause();
            incomingAudio.currentTime = 0;

            // ვამოწმებთ, რეალურად გახსნილია თუ არა ვიდეო ზარის ინტერფეისი ეკრანზე (რეფრეშის დაცვა)
            const videoUI = document.getElementById('videoCallUI');
            const isCallActiveNow = videoUI && videoUI.style.display === 'flex';
            
            // მომენტალურად ვუთიშავთ კამერას და მიკროფონს მეორე მხარესაც
            if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
            if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
            localTracks = { videoTrack: null, audioTrack: null };

            // გამოვდივართ აგორას არხიდან
            client.leave().catch(e => console.log(e));

            // ვმალავთ შემოსული ზარის მოდალს (თუ ჯერ არ უპასუხია)
            const modal = document.getElementById('incomingCallModal');
            if (modal) modal.style.display = 'none';

            // თუ ვიდეო ზარი რეალურად მიმდინარეობდა, მხოლოდ მაშინ ვაჩენთ დასრულების გვერდს
            if (isCallActiveNow) {
                showCallEndedScreen();
            } else {
                if (videoUI) videoUI.style.display = 'none';
            }
            
            console.log("ზარი დასრულდა მეორე მხარის მიერ.");
        }
    });
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
    outgoingAudio.pause();
    outgoingAudio.currentTime = 0;
    incomingAudio.pause();
    incomingAudio.currentTime = 0;

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
    outgoingAudio.pause();
    outgoingAudio.currentTime = 0;
    incomingAudio.pause();
    incomingAudio.currentTime = 0;

    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    document.getElementById('incomingCallModal').style.display = 'none';
}

// --- 2. თითის გაყოლების (Drag) და ადგილების გაცვლის (Swap) ლოგიკა ---

let isCallWindowsSwapped = false;

// 1. ეკრანების ადგილების გაცვლა (Swap)
function swapVideoTracksContainers() {
    if(activeUsersInCall.length > 2) return; // ჯგუფურ რეჟიმში სვოპი აღარ გვინდა

    const localContainer = document.getElementById("local-video");
    const remoteContainer = document.getElementById("remote-video");

    if (!localContainer || !remoteContainer) return;

    // მოძრაობის განულება, რომ გაცვლისას ეკრანიდან არ გაიქცეს
    localContainer.style.transform = "none";
    remoteContainer.style.transform = "none";

    if (!isCallWindowsSwapped) {
        // შენი ვიდეო (local) ხდება დიდი, სხვისი (remote) პატარავდება
        remoteContainer.style.cssText = "position: absolute !important; width: 120px !important; height: 160px !important; bottom: 80px !important; right: 20px !important; top: auto !important; left: auto !important; z-index: 99999 !important; border-radius: 12px !important; border: 2px solid var(--gold, #d4af37) !important; overflow: hidden !important;";
        localContainer.style.cssText = "position: absolute !important; width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; z-index: 1 !important; border-radius: 0 !important; border: none !important; overflow: hidden !important;";
        isCallWindowsSwapped = true;
    } else {
        // ბრუნდება საწყისზე: სხვისი (remote) დიდი, შენი (local) პატარა
        localContainer.style.cssText = "position: absolute !important; width: 120px !important; height: 160px !important; bottom: 80px !important; right: 20px !important; top: auto !important; left: auto !important; z-index: 99999 !important; border-radius: 12px !important; border: 2px solid var(--gold, #d4af37) !important; overflow: hidden !important;";
        remoteContainer.style.cssText = "position: absolute !important; width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; z-index: 1 !important; border-radius: 0 !important; border: none !important; overflow: hidden !important;";
        isCallWindowsSwapped = false;
    }

    // ვიდეოების გადატვირთვა ახალ ზომებზე, რომ არ გაშავდეს
    try {
        if (localTracks && localTracks.videoTrack) {
            localTracks.videoTrack.stop();
            localTracks.videoTrack.play("local-video");
        }
        client.remoteUsers.forEach(user => {
            if (user.videoTrack) {
                user.videoTrack.stop();
                user.videoTrack.play("remote-video");
            }
        });
    } catch (e) {
        console.error("ვიდეოს რეფრეშის ხარვეზი:", e);
    }
}

// 2. თითის გაყოლების (Drag) ლოგიკა, რომელიც უსმენს Window-ს დონეზე
function makeCallElementDraggable(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let isMovingNow = false;
    let clickTimer;
    let currentX = 0, currentY = 0, startX = 0, startY = 0;

    const dragStart = (e) => {
        // ვამოწმებთ, დავაჭირეთ თუ არა კონკრეტულ ელემენტს ან მის შიგნით არსებულ ნებისმიერ ვიდეოს
        if (e.target !== el && !el.contains(e.target)) return;
        if (activeUsersInCall.length > 2) return; // ჯგუფის დროს იბლოკება Drag

        // შემოწმება: თუ კონტეინერი არის დიდი სრული ეკრანი (100% სიგანით), ვბლოკავთ მოძრაობას
        const isFullScreen = el.style.width === "100%" || window.getComputedStyle(el).width === window.innerWidth + "px";

        isMovingNow = false;
        clickTimer = setTimeout(() => { 
            // თუ დიდი ეკრანია, Drag-ის სტატუსს არ ვრთავთ
            if (!isFullScreen) isMovingNow = true; 
        }, 180);

        startX = e.type.includes('touch') ? e.touches[0].clientX - currentX : e.clientX - currentX;
        startY = e.type.includes('touch') ? e.touches[0].clientY - currentY : e.clientY - currentY;

        // თითის გაყოლების ივენთს ვამაგრებთ მხოლოდ მაშინ, თუ ელემენტი არ არის სრულ ეკრანზე
        if (!isFullScreen) {
            document.addEventListener(e.type.includes('touch') ? "touchmove" : "mousemove", dragMove, { passive: false });
        }
        document.addEventListener(e.type.includes('touch') ? "touchend" : "mouseup", dragEnd);
    };

    const dragMove = (e) => {
        if (e.cancelable) e.preventDefault(); // მობილურზე ეკრანის ზედმეტ სქროლვას ბლოკავს

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const xDiff = clientX - (startX + currentX);
        const yDiff = clientY - (startY + currentY);

        if (Math.abs(xDiff) > 3 || Math.abs(yDiff) > 3) {
            isMovingNow = true;
        }

        currentX = clientX - startX;
        currentY = clientY - startY;

        // ვამოძრავებთ თავად კონტეინერს 3D ტრანსფორმაციით
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    };

    const dragEnd = () => {
        clearTimeout(clickTimer);
        document.removeEventListener("mousemove", dragMove);
        document.removeEventListener("touchmove", dragMove);
        document.removeEventListener("mouseup", dragEnd);
        document.removeEventListener("touchend", dragEnd);

        // თუ არ უმოძრავია — უბრალო კლიკია და ვცვლით ადგილებს (მუშაობს დიდ ეკრანზეც)
        if (!isMovingNow) {
            swapVideoTracksContainers();
        }
    };

    // ვუსმენთ დაჭერას როგორც მაუსით, ისე თითით
    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: true });
}

// ჩართვა გლობალურად
document.addEventListener("DOMContentLoaded", () => {
    makeCallElementDraggable("local-video");
    makeCallElementDraggable("remote-video");
});

// უსაფრთხოების ჩართვა იმ შემთხვევისთვის, თუ აგორამ ელემენტები მოგვიანებით ჩატვირთა
setTimeout(() => {
    makeCallElementDraggable("local-video");
    makeCallElementDraggable("remote-video");
}, 1500);

// 1. ზარის დაწყება (როცა შენ რეკავ) - შესწორებული ვერსია ავატარის გამოჩენით
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("ჯერ აირჩიეთ ჩატი!");

    // UI-ს მომზადება (კამერის ჩართვამდე)
    const ui = document.getElementById('videoCallUI');
    if(ui) ui.style.display = 'flex';

    // ბაზიდან სახელისა და ავატარის ამოღება, რომ ზუსტად გამოჩნდეს ვისაც ვურეკავთ
    db.ref('users/' + targetUid).once('value').then(snap => {
        const userData = snap.val();
        
        // ა) სახელის დასმა (შენი ორიგინალი კოდი - მიბმულია HTML-ის ID-ზე: remote-name-display)
        const rNameDisplay = document.getElementById('remote-name-display');
        const rName = document.getElementById('remote-name');
        if(rNameDisplay) {
            rNameDisplay.innerText = (userData && userData.name) ? userData.name : "Emigrant";
        } else if (rName) {
            rName.innerText = (userData && userData.name) ? userData.name : "Emigrant";
        }
        
        // ბ) ახალი ნაწილი: ავატარის დასმა და გამოჩენა (ზუსტად შენი HTML-ის ID-ზე: calling-user-avatar)
        const avatarBox = document.getElementById('calling-user-avatar');
        if (avatarBox) {
            const userPhoto = (userData && userData.photo) ? userData.photo : 'token-avatar.png'; // თუ ფოტო არ აქვს, დაჯდება ნაგულისხმევი
            avatarBox.style.backgroundImage = `url('${userPhoto}')`;
            avatarBox.style.display = 'block'; // ვახდენთ ბლოკის ჩვენებას (რადგან HTML-ში საწყისად display:none ადევს)
        }
    });

    // შენი ორიგინალი Firebase ლოგიკა
    await db.ref('video_calls/' + targetUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: FIXED_CHANNEL,
        status: 'calling',
        ts: Date.now()
    });

    // ჩავრთოთ გამავალი ზარის გუგუნი ჩვენთან
    try {
        incomingAudio.pause();
        incomingAudio.currentTime = 0;
        outgoingAudio.play();
    } catch (e) {
        console.log("აუდიოს დაკვრის ხარვეზი:", e);
    }

    startVideoCall(); // ეს რთავს აგორას და კამერას
}

// --- ახალი დამხმარე ფუნქცია მესინჯერის სტილის შეფასების ეკრანის გამოსაჩენად ---
function showCallEndedScreen() {
    const videoUI = document.getElementById('videoCallUI');
    if (videoUI) videoUI.style.display = 'none';

    const endedUI = document.getElementById('callEndedUI');
    if (!endedUI) return;

    const mainAvatar = document.getElementById('calling-user-avatar');
    const endedAvatar = document.getElementById('endedCallAvatar');
    if (mainAvatar && endedAvatar) {
        endedAvatar.style.backgroundImage = mainAvatar.style.backgroundImage;
    }

    endedUI.style.display = 'flex';

    setTimeout(() => {
        endedUI.style.display = 'none';
    }, 8000);
}


// --- 🚀 ახალი ჩამატებული ფუნქციები ჯგუფური ზარის მართვისთვის (Add Person) ---

// 1. მესამე პირის მოწვევა (Firebase-ით უგზავნის ზარს)
async function inviteToGroupCall() {
    const friendUid = prompt("გთხოვთ შეიყვანოთ დასამატებელი მომხმარებლის UID:");
    if (!friendUid) return;

    await db.ref('video_calls/' + friendUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: FIXED_CHANNEL,
        status: 'calling',
        ts: Date.now()
    });
    alert("მოწვევა წარმატებით გაიგზავნა!");
}

// 2. ახალი ადამიანის ვიდეო ნაკადის ჩასმა და Grid-ის გადართვა
function handleGroupVideoJoined(user) {
    const mainRemoteBox = document.getElementById("remote-video");
    const mainLocalBox = document.getElementById("local-video");
    const container = document.getElementById("group-video-container");

    // ვმალავთ ძველ ორმხრივ ჩარჩოებს, რომ გადავიდეთ Grid-ზე
    if (mainRemoteBox) mainRemoteBox.style.display = "none";
    if (mainLocalBox) mainLocalBox.style.display = "none";
    if (container) container.style.display = "grid";

    // ა) ჩვენი საკუთარი კამერის გადატანა Grid-ში
    let myGridBox = document.getElementById("group-user-local");
    if(!myGridBox && container) {
        myGridBox = document.createElement("div");
        myGridBox.id = "group-user-local";
        container.appendChild(myGridBox);
    }

    // ბ) ახალი პარტნიორის ჩარჩოს შექმნა Grid-ში
    let partnerGridBox = document.getElementById(`group-user-${user.uid}`);
    if(!partnerGridBox && container) {
        partnerGridBox = document.createElement("div");
        partnerGridBox.id = `group-user-${user.uid}`;
        container.appendChild(partnerGridBox);
    }

    // გ) პირველი პარტნიორის ჩარჩოს პოვნაც და ჩასმა, თუ ისიც ზარშია
    client.remoteUsers.forEach(rUser => {
        if(rUser.uid !== user.uid && rUser.videoTrack && container) {
            let firstPartnerBox = document.getElementById(`group-user-${rUser.uid}`);
            if(!firstPartnerBox) {
                firstPartnerBox = document.createElement("div");
                firstPartnerBox.id = `group-user-${rUser.uid}`;
                container.appendChild(firstPartnerBox);
                rUser.videoTrack.play(`group-user-${rUser.uid}`);
            }
        }
    });

    // სტილების განახლება რაოდენობის მიხედვით
    updateGroupGridStyles();

    // ვრთავთ ვიდეოებს ახალ ბლოკებში
    if(localTracks.videoTrack) localTracks.videoTrack.play("group-user-local");
    user.videoTrack.play(`group-user-${user.uid}`);
}

// 3. Grid სტილების ავტომატური მართვა (3 ან 4 კაცისთვის)
function updateGroupGridStyles() {
    const container = document.getElementById("group-video-container");
    if (!container) return;
    
    const boxes = container.children;
    const count = boxes.length;

    // ყველას ერთნაირი ლამაზი მომრგვალებული სტილი
    for(let box of boxes) {
        box.style.cssText = "width:100%; height:100%; background:#222; border-radius:15px; overflow:hidden; border:2px solid rgba(212,175,55,0.3); position:relative;";
    }

    if (count === 3) {
        container.style.gridTemplateColumns = "1fr 1fr";
        container.style.gridTemplateRows = "1fr 1fr";
        // პირველი ბლოკი (შენი) დაჯდეს მთელ სიგანეზე ზემოთ
        if(boxes[0]) boxes[0].style.gridColumn = "span 2";
    } 
    else if (count >= 4) {
        container.style.gridTemplateColumns = "1fr 1fr";
        container.style.gridTemplateRows = "1fr 1fr";
        if(boxes[0]) boxes[0].style.gridColumn = "auto";
    }
}
