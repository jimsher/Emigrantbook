function openLeaderboard() {
    const listDiv = document.getElementById('leaderboardList');
    document.getElementById('leaderboardUI').style.display = 'flex';
    
    // ძველი კავშირის გათიშვა
    db.ref('users').off(); 

    db.ref('users').on('value', snap => {
        listDiv.innerHTML = ''; 
        let players = [];

        snap.forEach(child => {
            const v = child.val();
            if (!v) return;

            // 🎯 აი აქ არის მთავარი ცვლილება: 
            // ვიღებთ მაქსიმალურს ამ ორს შორის, რომ ძველმა 3.5-მა არ გადაფაროს 493
            let b1 = parseFloat(v.akho) || 0;
            let b2 = parseFloat(v.akhoBalance) || 0;
            let currentBalance = Math.max(b1, b2); 

            if (v.name && v.name !== "undefined") {
                // ფოტოს მოძებნა (შენი ლოგიკა)
                let photo = "";
                for (let key in v) {
                    if (typeof v[key] === 'string' && (v[key].startsWith('http') || v[key].startsWith('data:image'))) {
                        photo = v[key];
                        break;
                    }
                }
                if (!photo) photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=444&color=fff`;

                players.push({ name: v.name, avatar: photo, balance: currentBalance });
            }
        });

        // დალაგება რეალურ დროში
        players.sort((a, b) => b.balance - a.balance);

        // ხატვა
        let htmlContent = "";
        players.slice(0, 50).forEach((p, index) => {
            const isTop = index < 3;
            htmlContent += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? '#d4af37' : '#333'}; margin-bottom:10px;">
                    <b style="width:25px; color:white;">${index + 1}</b>
                    <img src="${p.avatar}" style="width:45px; height:45px; border-radius:50%; margin:0 15px; border:1px solid #444;">
                    <div style="flex:1;">
                        <b style="color:white; font-size:14px;">${p.name}</b>
                    </div>
                    <div style="text-align:right;">
                        <b style="color:#d4af37; font-size:16px;">${p.balance.toFixed(2)}</b>
                        <small style="color:gray; display:block; font-size:9px;">AKHO</small>
                    </div>
                </div>`;
        });
        listDiv.innerHTML = htmlContent;
    });
}






function showLiveNotification(title, text, icon = '🔔') {
    const el = document.getElementById('liveNotification');
    document.getElementById('notifTitle').innerText = title;
    document.getElementById('notifText').innerText = text;
    document.getElementById('notifIcon').innerText = icon;
    
    el.style.display = 'block';
    
    // 5 წამში ავტომატურად ქრება
    setTimeout(() => { hideNotification(); }, 5000);
}

function hideNotification() {
    document.getElementById('liveNotification').style.display = 'none';
}












// მესიჯის ამოსახტომი ფანჯარის ფუნქცია 
function checkRankImprovement(oldBalance, newBalance) {
    // თუ ბალანსი გაიზარდა, ვამოწმებთ რეიტინგს
    if (newBalance > oldBalance) {
        db.ref('users').orderByChild('akhoBalance').limitToLast(3).once('value', snap => {
            let topPlayers = [];
            snap.forEach(c => topPlayers.push(c.key));
            
            if (topPlayers.includes(auth.currentUser.uid)) {
                showLiveNotification("გავლენა გაიზარდა!", "შენ უკვე საიტის ტოპ-ლიდერებში ხარ! 🏆", "👑");
            }
        });
    }
}


function notifyOwnerOfLike(ownerId, likerName) {
    // ეს ჩაიწერება ბაზაში სპეციალურ "live_events" ტოტში
    const eventRef = db.ref(`live_events/${ownerId}`).push();
    eventRef.set({
        type: 'like',
        from: likerName,
        time: Date.now()
    });
}

// და იუზერის მხარეს ვუსმენთ ამ ივენთებს:
function startNotificationListener() {
    if (!auth.currentUser) return;
    db.ref(`live_events/${auth.currentUser.uid}`).on('child_added', snap => {
        const ev = snap.val();
        if (ev.type === 'like') {
            showLiveNotification("ახალი რეაქცია!", `${ev.from}-ს მოეწონა შენი პოსტი!`, "❤️");
        }
        // წავშალოთ ნანახი ივენთი
        snap.ref.remove();
    });
}





function checkDailyBonus() {
    // 1. უსაფრთხოების შემოწმება
    if (!auth.currentUser) {
        console.log("ბონუსის შემოწმება ვერ მოხდა: იუზერი არაა შესული.");
        return;
    }

    const uid = auth.currentUser.uid;
    const today = new Date().toISOString().split('T')[0];

    db.ref(`users/${uid}`).once('value', snap => {
        const user = snap.val();
        if (!user) return; // თუ იუზერის მონაცემები ბაზაში საერთოდ არ არის

        // თუ ბონუსი დღეს ჯერ არ აუღია
        if (user.lastBonusDate !== today) {
            const bonusAmount = 0.50;
            const currentBal = parseFloat(user.akhoBalance || user.akho || user.balance || 0);
            
            // ბაზის განახლება
            db.ref(`users/${uid}`).update({
                akhoBalance: currentBal + bonusAmount,
                lastBonusDate: today
            }).then(() => {
                // შეტყობინება მხოლოდ წარმატებული განახლების შემდეგ
                showLiveNotification("საჩუქარი!", `დღევანდელი ბონუსი +${bonusAmount} AKHO დაგერიცხათ! 🎁`, "🎁");
            }).catch(err => {
                console.error("ბონუსის დარიცხვის შეცდომა:", err);
            });
        }
    });
}
