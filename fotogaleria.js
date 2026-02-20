function openPhotosSection(userId) {
    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    // სხვა სექციების დამალვა
    if(grid) grid.style.display = 'none';
    const infoSection = document.getElementById('userDetailedInfoUI'); // თუ გაქვს ინფოს სექცია
    if(infoSection) infoSection.style.display = 'none';

    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = '<div style="color:var(--gold); grid-column:1/4; text-align:center; padding:20px;">იტვირთება ფოტოები...</div>';
    }

    db.ref('community_posts').orderByChild('authorId').equalTo(userId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const post = child.val();
                const imgUrl = post.imageUrl || post.image;
                
                if (imgUrl) {
                    count++;
                    const imgDiv = document.createElement('div');
                    imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                    // აქ შევცვალე: window.open ჩანაცვლდა previewImage-ით
                    imgDiv.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${imgUrl}')">`;
                    photoGrid.appendChild(imgDiv);
                }
            });
        }

        if (count === 0) {
            db.ref('posts').orderByChild('authorId').equalTo(userId).once('value', snap2 => {
                if (snap2.exists()) {
                    snap2.forEach(child => {
                        const post = child.val();
                        const imgUrl = post.imageUrl || post.image;
                        if (imgUrl) {
                            count++;
                            const imgDiv = document.createElement('div');
                            imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                            // აქაც იგივე ცვლილება
                            imgDiv.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${imgUrl}')">`;
                            photoGrid.appendChild(imgDiv);
                        }
                    });
                }
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
