// --- 1. მაყურებლების მთვლელის ლოგიკა ---
function updateViewerCount(channel, action) {
    const viewerRef = db.ref(`lives_meta/${channel}/viewers/${auth.currentUser.uid}`);
    if (action === 'join') {
        viewerRef.set({
            name: myName,
            photo: myPhoto,
            lastSeen: Date.now()
        });
    } else {
        viewerRef.remove();
    }
}

// ამას ვუსმენთ, რომ ეკრანზე ციფრი განახლდეს
function listenToViewers(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        const count = Object.keys(viewers).length;
        const countEl = document.getElementById('vCount');
        if(countEl) countEl.innerText = count;
        
        // სურვილისამებრ: ზედა ზოლში პატარა ავატარების გამოჩენა
        const avatarsDiv = document.getElementById('viewerAvatars');
        if(avatarsDiv) {
            avatarsDiv.innerHTML = "";
            Object.values(viewers).slice(-3).forEach(v => {
                const img = `<img src="${v.photo}" style="width:24px; height:24px; border-radius:50%; border:1px solid white; margin-left:-8px; background:#000;">`;
                avatarsDiv.innerHTML += img;
            });
        }
    });
}

// --- 2. ჩატის განახლება ავატარებით ---
function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    if(!chatBox) return;
    chatBox.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); 

    db.ref(`live_chats/${channel}`).limitToLast(20).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        
        if(msg.name === "SYSTEM") {
            div.style = "background:rgba(212,175,55,0.15); padding:6px 15px; border-radius:20px; margin-bottom:4px; align-self:center; font-size:12px; color:var(--gold); border: 0.5px solid rgba(212,175,55,0.3);";
            div.innerHTML = `✨ ${msg.text}`;
        } else {
            // TikTok სტილის კომენტარი ავატარით
            div.style = "display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; animation: slideIn 0.3s ease-out;";
            div.innerHTML = `
                <img src="${msg.photo || 'https://ui-avatars.com/api/?name='+msg.name}" style="width:28px; height:28px; border-radius:50%; border:1px solid rgba(255,255,255,0.2);">
                <div style="background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:15px; backdrop-filter:blur(5px);">
                    <b style="color:rgba(255,255,255,0.6); font-size:11px; display:block;">${msg.name}</b>
                    <span style="color:white; font-size:13px;">${msg.text}</span>
                </div>
            `;
        }
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// კომენტარის გაგზავნისას ფოტოს დამატება
function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp || !inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: myName, 
        photo: myPhoto, // დავამატეთ ფოტო ბაზაში
        text: inp.value, 
        ts: Date.now() 
    });
    inp.value = "";
}

// --- 3. ანიმაცია (CSS-სთვის) ---
const liveStyle = document.createElement("style");
liveStyle.innerText = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .live-action-btn:active { transform: scale(0.8); }
`;
document.head.appendChild(liveStyle);
