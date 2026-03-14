function openLeaderboard() {
    const lbUI = document.getElementById('leaderboardUI');
    if(lbUI) lbUI.style.display = 'flex';
    
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center; padding:20px;">იტვირთება რეიტინგი...</p>';

    // ვიყენებთ .on-ს რეალურ დროში მოსასმენად
    db.ref('users').on('value', snap => {
        if (!snap.exists()) return;
        
        let players = [];
        const data = snap.val();

        Object.entries(data).forEach(([uid, v]) => {
            // 1. ბალანსის ზუსტი განსაზღვრა (პრიორიტეტი: akho)
            const finalBalance = parseFloat(v.akho || v.akhoBalance || v.balance || 0);

            // 2. ფოტოს ლოგიკა - თუ v.photo გაქვს, პირდაპირ ეგ გამოიყენოს
            let foundPhoto = v.photo || "";
            if (!foundPhoto) {
                for (let key in v) {
                    if (typeof v[key] === 'string' && (v[key].startsWith('http') || v[key].startsWith('data:image'))) {
                        foundPhoto = v[key];
                        break;
                    }
                }
            }
            if (!foundPhoto) {
                foundPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || 'U')}&background=d4af37&color=000&bold=true`;
            }

            if (v.name && v.name !== "undefined") {
                players.push({
                    name: v.name,
                    avatar: foundPhoto,
                    balance: finalBalance,
                    uid: uid
                });
            }
        });

        // 3. დალაგება - ყველაზე დიდი ბალანსი ზემოთ
        players.sort((a, b) => b.balance - a.balance);

        // 4. სიის გასუფთავება და დახატვა
        listDiv.innerHTML = '';
        
        players.slice(0, 10).forEach((p, index) => {
            const isTop = index < 3;
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32'];
            const borderColor = isTop ? colors[index] : '#333';
            const bgColor = isTop ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)';
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${bgColor}; padding:12px; border-radius:12px; border:1px solid ${borderColor}; margin-bottom:10px; transition: 0.3s;">
                    <b style="width:25px; color:${isTop ? colors[index] : '#888'}; font-size:14px;">${index + 1}</b>
                    <img src="${p.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; margin:0 12px; border:2px solid ${borderColor};" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=444&color=fff'">
                    <div style="flex:1;">
                        <b style="color:white; font-size:14px; display:block;">${p.name}</b>
                        <small style="color:#666; font-size:9px; letter-spacing:1px;">IMPACT RANK</small>
                    </div>
                    <div style="text-align:right;">
                        <b style="color:var(--gold); font-size:15px; display:block;">${p.balance.toFixed(2)}</b>
                        <small style="color:#555; font-size:9px; font-weight:bold;">AKHO</small>
                    </div>
                </div>
            `;
        });
    });
}
