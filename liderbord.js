function openLeaderboard() {
    document.getElementById('leaderboardUI').style.display = 'flex';
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center;">იტვირთება რეიტინგი...</p>';

    db.ref('users').once('value', snap => {
        listDiv.innerHTML = '';
        let players = [];

        snap.forEach(child => {
            const v = child.val();
            
            // 1. ბალანსის შემოწმება (როგორც წინა ჯერზე გავასწორეთ)
            const finalBalance = v.akhoBalance || v.akho || v.balance || 0;

            // 2. ფოტოს შემოწმება (ამოწმებს ყველა შესაძლო სახელს)
            // თუ არცერთი არ არის, მაშინ ქმნის ავატარს მომხმარებლის სახელის პირველი ასოთი
            const userPhoto = v.avatar || v.photoURL || v.profilePic || v.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || 'U')}&background=random&color=fff`;

            if (v.name && v.name !== "undefined") {
                players.push({
                    name: v.name,
                    avatar: userPhoto,
                    balance: parseFloat(finalBalance)
                });
            }
        });

        // დალაგება რეიტინგის მიხედვით
        players.sort((a, b) => b.balance - a.balance);

        const top10 = players.slice(0, 10);

        top10.forEach((p, index) => {
            const isTop = index < 3;
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32'];
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? colors[index] : '#222'}; margin-bottom:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    <b style="width:30px; color:${isTop ? colors[index] : 'white'}; font-size:18px;">${index + 1}</b>
                    
                    <div style="position:relative; margin:0 15px;">
                        <img src="${p.avatar}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid ${isTop ? colors[index] : '#444'};">
                        ${isTop ? `<i class="fas fa-crown" style="position:absolute; top:-10px; right:-5px; color:${colors[index]}; font-size:12px; transform:rotate(15deg);"></i>` : ''}
                    </div>

                    <div style="flex:1;">
                        <b style="color:white; font-size:15px; display:block;">${p.name}</b>
                        <small style="color:gray; font-size:10px;">IMPACT RANK</small>
                    </div>

                    <div style="text-align:right;">
                        <b style="color:var(--gold); font-size:16px;">${p.balance.toFixed(2)}</b>
                        <small style="color:var(--gold); display:block; font-size:9px; font-weight:bold;">AKHO</small>
                    </div>
                </div>
            `;
        });
    });
}
