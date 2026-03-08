// --- TIKTOK STYLE LIVE LOGIC (ORIGINAL STRUCTURE) ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";
    
    currentLiveChannel = "live_stream"; 
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
        await new Promise(resolve => setTimeout(resolve, 500)); 

        await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);
        
        liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        liveTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        liveTracks.video.play("remote-live-video");
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await liveClient.publish([liveTracks.audio, liveTracks.video]);

        // Firebase-ში ლაივის აქტივაცია
        db.ref(`lives/${auth.currentUser.uid}`).set({ 
            hostId: auth.currentUser.uid, 
            hostName: myName, 
            hostPhoto: myPhoto, 
            channel: currentLiveChannel, 
            status: 'active', 
            ts: Date.now() 
        });

        listenToLiveChat(currentLiveChannel);
        // --- დამამატებელი ფუნქცია მთვლელისთვის ---
        listenToViewers(currentLiveChannel); 
        
        console.log("Live started successfully ✅");
    } catch (e) { 
        console.error("Agora Error:", e);
    }
}

// ჩატი ავატარებით (შენი ლოგიკა + ავატარი)
function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    chatBox.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); 

    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        if(msg.name === "SYSTEM") {
            div.style = "background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:10px; margin-bottom:5px; border:1px solid var(--gold); text-align:center;";
            div.innerHTML = `<span style="color:var(--gold); font-size:13px; font-weight:bold;">${msg.text}</span>`;
        } else {
            // აქ დაემატა მხოლოდ ავატარის ხაზი
            div.style = "display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:15px; margin-bottom:5px; width:fit-content; border-left:3px solid var(--gold);";
            div.innerHTML = `
                <img src="${msg.photo || 'https://ui-avatars.com/api/?name='+msg.name}" style="width:24px; height:24px; border-radius:50%;">
                <b style="color:var(--gold); font-size:11px;">${msg.name}:</b> 
                <span style="color:white; font-size:13px;">${msg.text}</span>`;
        }
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// მაყურებლების მთვლელის ახალი ფუნქცია (არაფერს აფუჭებს)
function listenToViewers(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const count = snap.numChildren();
        const countEl = document.getElementById('vCount');
        if(countEl) countEl.innerText = count;
    });
}

function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp.value.trim() || !currentLiveChannel) return;
    // აქ დავამატე ფოტოს გაგზავნა
    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: myName, 
        photo: myPhoto, 
        text: inp.value, 
        ts: Date.now() 
    });
    inp.value = "";
}

// დანარჩენი შენი ფუნქციები (endLive, joinLive, sendGift...) უცვლელია
