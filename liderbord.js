function openLeaderboard() {
    document.getElementById('leaderboardUI').style.display = 'flex';
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center; padding:20px;">იტვირთება რეიტინგი...</p>';

    db.ref('users').once('value', snap => {
        listDiv.innerHTML = '';
        let players = [];

        snap.forEach(child => {
            const v = child.val();
            let foundPhoto = "";

            // 🔍 ავტომატური ძებნა: გადავუაროთ ყველა ველს და ვიპოვოთ სურათის ლინკი
            for (let key in v) {
                if (typeof v[key] === 'string' && (v[key].startsWith('http') || v[key].startsWith('data:image'))) {
                    foundPhoto = v[key];
                    break; // პირველივე სურათი რაც შეგვხვდება, ავიღოთ
                }
            }

            // თუ ვერაფერი ვიპოვეთ, გამოვიყენოთ დინამიური ავატარი
            if (!foundPhoto) {
                foundPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || 'U')}&background=d4af37&color=000&bold=true`;
            }

            const finalBalance = parseFloat(v.akhoBalance || v.akho || v.balance || 0);

            if (v.name && v.name !== "undefined") {
                players.push({
                    name: v.name,
                    avatar: foundPhoto,
                    balance: finalBalance
                });
            }
        });

        // დალაგება
        players.sort((a, b) => b.balance - a.balance);

        players.slice(0, 10).forEach((p, index) => {
            const isTop = index < 3;
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32'];
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? colors[index] : '#333'}; margin-bottom:10px;">
                    <b style="width:25px; color:${isTop ? colors[index] : 'white'};">${index + 1}</b>
                    <img src="${p.avatar}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; margin:0 15px; border:2px solid ${isTop ? colors[index] : '#444'};" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=444&color=fff'">
                    <div style="flex:1;">
                        <b style="color:white; font-size:14px; display:block;">${p.name}</b>
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
