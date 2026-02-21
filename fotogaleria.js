function openPhotosSection() {
    // 1. ვპოულობთ ID-ს - ვცდით ყველა ვარიანტს, რაც შენს კოდში შეიძლება იყოს
    let targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;
    if (!targetId) targetId = (typeof currentProfileUid !== 'undefined') ? currentProfileUid : null;
    
    // ეს ხაზი დაგვეხმარება გაგებაში: გახსენი კონსოლი (F12) და ნახე რა ID-ს დაწერს
    console.log("ფოტოებს ვეძებ ამ ID-სთვის:", targetId);

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = ''; 
    }

    if (!targetId) {
        if(noMsg) noMsg.style.display = 'block';
        return;
    }

    // 2. ვეძებთ ბაზაში
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;
        
        snap.forEach(child => {
            const post = child.val();
            const img = post.imageUrl || post.image;
            if(img) {
                count++;
                photoGrid.innerHTML += `
                    <div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111;">
                        <img src="${img}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${img}')">
                    </div>`;
            }
        });

        if(count === 0) {
            if(noMsg) noMsg.style.display = 'block';
        } else {
            if(noMsg) noMsg.style.display = 'none';
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
