function openPhotosSection(userId) {
    // ყველაზე საიმედო გზა: თუ userId არ მოვიდა, ავიღოთ viewingUid-დან
    let targetId = userId;
    
    if (!targetId || targetId === "undefined") {
        targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;
    }

    console.log("ჩატვირთვის მცდელობა ID-სთვის:", targetId);

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = '<div style="color:var(--gold); grid-column:1/4; text-align:center; padding:20px;">იტვირთება...</div>';
    }
    if(noMsg) noMsg.style.display = 'none';

    if (!targetId) {
        photoGrid.innerHTML = '<div style="color:red; grid-column:1/4; text-align:center; padding:20px;">შეცდომა: მომხმარებელი ვერ იდენტიფიცირდა</div>';
        return;
    }

    // ძებნა ბაზაში - ვიყენებთ ზუსტად targetId-ს
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

        // თუ community-ში არაა, ვნახოთ "posts"-ში
        if (count === 0) {
            db.ref('posts').orderByChild('authorId').equalTo(targetId).once('value', snap2 => {
                snap2.forEach(child => {
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
                finishPhotoLoad(count, photoGrid, noMsg);
            });
        } else {
            finishPhotoLoad(count, photoGrid, noMsg);
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
