function openPhotosSection() {
    // ვიღებთ ზუსტად იმ იუზერის ID-ს, ვინც ახლა ეკრანზეა გახსნილი
    // შენს კოდში ეს არის viewingUid
    const targetId = viewingUid; 
    
    if (!targetId) {
        console.error("ვერ ვიპოვე მომხმარებლის ID");
        return;
    }

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');
    
    // ეკრანის გასუფთავება და გადართვა
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = '<div style="color:var(--gold); grid-column:1/4; text-align:center; padding:20px;">იტვირთება...</div>';
    }
    if(noMsg) noMsg.style.display = 'none';

    // ვეძებთ პოსტებს მხოლოდ ამ კონკრეტული targetId-სთვის
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
                
                if (count === 0) noMsg.style.display = 'block';
            });
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
