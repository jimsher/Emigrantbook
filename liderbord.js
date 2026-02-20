function openLeaderboard() {
    document.getElementById('leaderboardUI').style.display = 'flex';
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center;">იტვირთება რეიტინგი...</p>';

    // ვიღებთ ყველა მომხმარებელს ბაზიდან
    db.ref('users').orderByChild('akhoBalance').limitToLast(10).once('value', snap => {
        listDiv.innerHTML = '';
        let players = [];

        snap.forEach(child => {
            players.push({
                uid: child.key,
                name: child.val().name || "Undefined Player",
                avatar: child.val().avatar || "https://ui-avatars.com/api/?name=U",
                balance: child.val().akhoBalance || 0
            });
        });

        // რადგან limitToLast ზრდადობით იღებს, ჩვენ უნდა ამოვატრიალოთ
        players.reverse();

        players.forEach((p, index) => {
            const isTop = index < 3; // პირველი სამეული
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32']; // ოქრო, ვერცხლი, ბრინჯაო
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? colors[index] : '#222'}; transition:0.3s;">
                    <b style="width:30px; color:${isTop ? colors[index] : 'white'}; font-size:18px;">${index + 1}</b>
                    <img src="${p.avatar}" style="width:40px; height:40px; border-radius:50%; border:2px solid ${isTop ? colors[index] : '#444'}; margin:0 15px;">
                    <div style="flex:1;">
                        <b style="color:white; display:block;">${p.name}</b>
                        <small style="color:gray;">Impact Rank</small>
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
