function openPhotosSection(userId) {
    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = '<div style="color:var(--gold); grid-column:1/4; text-align:center; padding:20px;">იტვირთება...</div>';
    }

    db.ref('posts').once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        console.log("ვეძებთ ფოტოებს იუზერისთვის:", userId);

        snap.forEach(child => {
            const post = child.val();
            
            // ეს ხაზი კონსოლში დაგვიწერს პოსტის მონაცემებს, რომ გავიგოთ რა სახელი ჰქვია ID-ს
            console.log("პოსტის მონაცემები:", post);

            // ვამოწმებთ ყველა შესაძლო სახელს, რაც შეიძლება ID-ს ერქვას
            const postOwnerId = post.authorId || post.userId || post.uid || post.ownerId || post.author;
            
            if (postOwnerId === userId && post.imageUrl) {
                count++;
                photoGrid.innerHTML += `
                    <div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;">
                        <img src="${post.imageUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" 
                             onclick="window.open('${post.imageUrl}', '_blank')">
                    </div>`;
            }
        });

        if (count === 0) {
            noMsg.style.display = 'block';
            photoGrid.style.display = 'none';
        } else {
            noMsg.style.display = 'none';
        }
    });
}
