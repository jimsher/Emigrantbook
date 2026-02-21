function openPhotosSection() {
    let targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;
    
    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if(profGrid) profGrid.style.display = 'none';
    if(photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); text-align:center; padding:20px; grid-column:1/4;">ვეძებ ყველა შესაძლო პოსტს...</div>';
        photoGrid.style.display = 'grid';
    }

    // ვამოწმებთ 'community_posts'-ს
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            // ვამოწმებთ ყველა ნაირ ID-ს: authorId, uid, userId
            const postOwner = post.authorId || post.uid || post.userId;
            const img = post.imageUrl || post.image;

            if (postOwner === targetId && img) {
                count++;
                photoGrid.innerHTML += `
                    <div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;">
                        <img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${img}')">
                    </div>`;
            }
        });

        // თუ აქ ვერ იპოვა, იქნებ უბრალოდ 'posts'-შია?
        if (count === 0) {
            db.ref('posts').once('value', snap2 => {
                snap2.forEach(c => {
                    const p = c.val();
                    const pOwner = p.authorId || p.uid || p.userId;
                    const i = p.imageUrl || p.image;
                    if (pOwner === targetId && i) {
                        count++;
                        photoGrid.innerHTML += `<div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111;"><img src="${i}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${i}')"></div>`;
                    }
                });
                
                if (count === 0) {
                    photoGrid.style.display = 'none';
                    if(noMsg) noMsg.style.display = 'block';
                } else {
                    photoGrid.style.display = 'grid';
                    if(noMsg) noMsg.style.display = 'none';
                }
            });
        }
    });
}


















function finishPhotoLoad(count, photoGrid, noMsg) {
    if (count === 0) {
        noMsg.style.display = 'block';
        photoGrid.style.display = 'none';
    } else {
        noMsg.style.display = 'grid';
        noMsg.style.display = 'none';
    }
}
