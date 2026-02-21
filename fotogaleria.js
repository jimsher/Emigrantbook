function openPhotosSection() {
    // 1. ვადგენთ ვის პროფილზე ვართ რეალურად
    // თუ viewingUid არსებობს და ის შენი ID-სგან განსხვავებულია, ვიყენებთ მას
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : auth.currentUser.uid;

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    // 2. ვიზუალური გადართვა
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = ''; // ვასუფთავებთ წინა იუზერის ნარჩენებს
    }

    // 3. ძებნა ბაზაში - მკაცრად targetId-ით
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

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

        // თუ პირველში ვერ იპოვა, ვნახოთ "posts" ტოტში
        if (count === 0) {
            db.ref('posts').orderByChild('authorId').equalTo(targetId).once('value', snap2 => {
                snap2.forEach(c => {
                    const p = c.val();
                    const img = p.imageUrl || p.image;
                    if (img) {
                        count++;
                        photoGrid.innerHTML += `<div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111;"><img src="${img}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${img}')"></div>`;
                    }
                });
                if (count === 0 && noMsg) noMsg.style.display = 'block';
            });
        } else {
            if (noMsg) noMsg.style.display = 'none';
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
