function openLeaderboard() {
    document.getElementById('leaderboardUI').style.display = 'flex';
    const listDiv = document.getElementById('leaderboardList');
    listDiv.innerHTML = '<p style="color:white; text-align:center;">იტვირთება რეიტინგი...</p>';

    // ვკითხულობთ ყველა იუზერს
    db.ref('users').once('value', snap => {
        listDiv.innerHTML = '';
        let players = [];

        snap.forEach(child => {
            const v = child.val();
            // აქ ვამოწმებთ ყველა შესაძლო სახელს, რაც შეიძლება ბალანსს ერქვას შენს ბაზაში
            const finalBalance = v.akhoBalance || v.akho || v.balance || 0;

            if (v.name && v.name !== "undefined") {
                players.push({
                    name: v.name,
                    avatar: v.avatar || "https://ui-avatars.com/api/?name=U",
                    balance: parseFloat(finalBalance)
                });
            }
        });

        // ვალაგებთ დიდიდან პატარისკენ
        players.sort((a, b) => b.balance - a.balance);

        // ვიღებთ მხოლოდ ტოპ 10-ს
        const top10 = players.slice(0, 10);

        top10.forEach((p, index) => {
            const isTop = index < 3;
            const colors = ['#d4af37', '#c0c0c0', '#cd7f32'];
            
            listDiv.innerHTML += `
                <div style="display:flex; align-items:center; background:${isTop ? 'rgba(212,175,55,0.1)' : '#111'}; padding:12px; border-radius:12px; border:1px solid ${isTop ? colors[index] : '#222'}; margin-bottom:5px;">
                    <b style="width:25px; color:${isTop ? colors[index] : 'white'};">${index + 1}</b>
                    <img src="${p.avatar}" style="width:35px; height:35px; border-radius:50%; border:1px solid ${isTop ? colors[index] : '#444'}; margin:0 10px;">
                    <b style="flex:1; color:white; font-size:14px;">${p.name}</b>
                    <div style="text-align:right;">
                        <b style="color:var(--gold);">${p.balance.toFixed(2)}</b>
                        <small style="color:gray; display:block; font-size:9px;">AKHO</small>
                    </div>
                </div>
            `;
        });
    });
}
