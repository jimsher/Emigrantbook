function openLeaderboard() {
    document.getElementById('leaderboardUI').style.display = 'flex';
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center;">იტვირთება...</p>';

    db.ref('users').once('value', snap => {
        listDiv.innerHTML = '';
        let players = [];

        snap.forEach(child => {
            const v = child.val();
            
            // ვამოწმებთ სად არის შენახული ფოტო
            // სცადე ყველა ვარიანტი, რაც შენს სკრიპტში შეიძლება იყოს
            let finalPhoto = v.profAva || v.avatar || v.photoURL || v.profilePic || "";
            
            // თუ finalPhoto ლინკი არ არის და ტექსტია, ან ცარიელია, შევქმნათ ავატარი
            if (!finalPhoto || !finalPhoto.includes('http')) {
                finalPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || 'U')}&background=d4af37&color=000&bold=true`;
            }

            const finalBalance = v.akhoBalance || v.akho || v.balance || 0;

            if (v.name && v.name !== "undefined") {
                players.push({
                    name: v.name,
                    avatar: finalPhoto,
                    balance: parseFloat(finalBalance)
                });
            }
        });

        players.sort((a, b) => b.balance - a.balance);
        const top10 = players.slice(0, 10);

        top10.forEach((p, index) => {
            const isTop = index < 3;
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32'];
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? colors[index] : '#222'}; margin-bottom:8px;">
                    <b style="width:30px; color:${isTop ? colors[index] : 'white'};">${index + 1}</b>
                    
                    <div style="width:45px; height:45px; margin:0 15px;">
                        <img src="${p.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2px solid ${isTop ? colors[index] : '#444'};" 
                             onerror="this.src='https://ui-avatars.com/api/?name=U&background=444&color=fff'">
                    </div>

                    <div style="flex:1;">
                        <b style="color:white; font-size:15px; display:block;">${p.name}</b>
                        <small style="color:gray; font-size:10px;">IMPACT RANK</small>
                    </div>

                    <div style="text-align:right;">
                        <b style="color:var(--gold); font-size:16px;">${p.balance.toFixed(2)}</b>
                        <small style="color:var(--gold); display:block; font-size:9px;">AKHO</small>
                    </div>
                </div>
            `;
        });
    });
}
