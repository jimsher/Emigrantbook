function openPhotosSection(userId) {
    // 1. ვიზუალური გადართვა
    document.getElementById('profGrid').style.display = 'none'; // ვმალავთ ვიდეოებს
    document.getElementById('userPhotosGrid').style.display = 'grid'; // ვაჩენთ ფოტოებს
    
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    photoGrid.innerHTML = '<p style="color:white; grid-column: 1/4; text-align:center;">იტვირთება...</p>';

    // 2. ფოტოების წამოღება ბაზიდან
    db.ref('posts').orderByChild('authorId').equalTo(userId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            if (post.imageUrl) { // ვიღებთ მხოლოდ იმ პოსტებს, რომლებსაც ფოტო აქვს
                count++;
                photoGrid.innerHTML += `
                    <div style="aspect-ratio:1/1; overflow:hidden; border-radius:4px; background:#111;">
                        <img src="${post.imageUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" 
                             onclick="window.open('${post.imageUrl}', '_blank')">
                    </div>`;
            }
        });

        if (count === 0) {
            noMsg.style.display = 'block';
        } else {
            noMsg.style.display = 'none';
        }
    });
}
