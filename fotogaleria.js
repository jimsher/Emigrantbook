
function openPhotosSection() {
    // 1. ვადგენთ რეალურ ID-ს
    let targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;
    
    // თუ viewingUid მკვდარია, ვცადოთ შენი სისტემის სხვა შესაძლო ცვლადები
    if (!targetId) targetId = window.currentProfileId || window.openedUid;

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); text-align:center; padding:20px; grid-column:1/4;">იტვირთება...</div>';
        photoGrid.style.display = 'grid';
    }

    // 2. ვკითხულობთ მთელ 'community_posts'-ს და ხელით ვფილტრავთ (რომ ინდექსირებამ არ გაჭედოს)
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            // ვამოწმებთ ყველა შესაძლო ველს, სადაც შეიძლება იდოს იუზერის ID
            const isMatch = post.authorId === targetId || post.uid === targetId || post.userId === targetId;
            const img = post.imageUrl || post.image;

            if (isMatch && img) {
                count++;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                imgDiv.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${img}')">`;
                photoGrid.appendChild(imgDiv);
            }
        });

        if (count === 0) {
            photoGrid.style.display = 'none';
            if (noMsg) noMsg.style.display = 'block';
        } else {
            if (noMsg) noMsg.style.display = 'none';
            photoGrid.style.display = 'grid';
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
