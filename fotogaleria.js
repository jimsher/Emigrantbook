
function openPhotosSection() {
    // ვამოწმებთ, რას ხედავს ფუნქცია რეალურად
    console.log("სისტემური viewingUid:", typeof viewingUid !== 'undefined' ? viewingUid : "არ არსებობს");
    console.log("შენი (My) UID:", auth.currentUser.uid);

    // ვაიძულებთ აიღოს viewingUid, თუ ის არსებობს
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : auth.currentUser.uid;

    console.log("საბოლოოდ არჩეული ID ძებნისთვის:", targetId);

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = ''; // ეს აუცილებელია, რომ შენი ფოტოები არ დარჩეს ეკრანზე
    }

    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = ''; // კიდევ ერთხელ გასუფთავება
        if (!snap.exists()) {
            document.getElementById('noPhotosMsg').style.display = 'block';
            return;
        }
        
        snap.forEach(child => {
            const post = child.val();
            if (post.imageUrl || post.image) {
                const img = post.imageUrl || post.image;
                photoGrid.innerHTML += `<div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111;"><img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${img}')"></div>`;
            }
        });
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
