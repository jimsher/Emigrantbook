function openPhotosSection() {
    // 1. ვპოულობთ ID-ს URL-იდან (ყველაზე საიმედო გზაა)
    const urlParams = new URLSearchParams(window.location.search);
    let targetId = urlParams.get('uid');

    // 2. თუ URL-ში არაა, მაშინ გლობალური ცვლადიდან
    if (!targetId) {
        targetId = typeof viewingUid !== 'undefined' ? viewingUid : auth.currentUser.uid;
    }

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    // ვიზუალური გადართვა
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = ''; 
    }

    // ძებნა ბაზაში
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        let count = 0;
        photoGrid.innerHTML = '';

        snap.forEach(child => {
            const post = child.val();
            const imgUrl = post.imageUrl || post.image;
            if (imgUrl) {
                count++;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                imgDiv.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${imgUrl}')">`;
                photoGrid.appendChild(imgDiv);
            }
        });

        if (count === 0) {
            noMsg.style.display = 'block';
        } else {
            noMsg.style.display = 'none';
        }
    });
}




// ეს ფუნქცია აუცილებლად გქონდეს script.js-ში
function previewImage(url) {
    const modal = document.getElementById('photoPreviewModal');
    const fullImg = document.getElementById('fullPhoto');
    if(modal && fullImg) {
        fullImg.src = url;
        modal.style.display = 'flex';
    }
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
