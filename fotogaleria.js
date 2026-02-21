function openPhotosSection() {
    // 1. ვპოულობთ ID-ს ყველაზე პირდაპირი გზით:
    // თუ viewingUid მკვდარია, ავიღოთ ავატარის ლინკიდან (Firebase Storage-ის ლინკში ID ყოველთვის არის)
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : null;

    // თუ მაინც ვერ იპოვა, ვცადოთ "დავინახოთ" ვისი პროფილია გახსნილი
    if (!targetId || targetId === auth.currentUser.uid) {
        const avaImg = document.getElementById('profAva');
        if (avaImg && avaImg.src.includes('users%2F')) {
             // ეს კოდი ამოჭრის ID-ს ფოტოს ლინკიდან
             targetId = avaImg.src.split('users%2F')[1].split('?')[0].split('%2F')[0];
        }
    }

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); padding:20px; text-align:center; grid-column:1/4;">იძებნება...</div>';
        photoGrid.style.display = 'grid';
    }

    // 2. ძებნა ბაზაში
    // ვამოწმებთ 'community_posts'-საც და 'posts'-საც ერთდროულად
    const postsRef = db.ref('community_posts');
    postsRef.orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const post = child.val();
                const img = post.imageUrl || post.image;
                if (img) {
                    count++;
                    const imgDiv = document.createElement('div');
                    imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                    imgDiv.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${img}')">`;
                    photoGrid.appendChild(imgDiv);
                }
            });
        }

        if (count === 0) {
            // თუ მანდ არ იყო, ვცადოთ მეორე ტოტი
            db.ref('posts').orderByChild('authorId').equalTo(targetId).once('value', snap2 => {
                if (snap2.exists()) {
                    snap2.forEach(c => {
                        const p = c.val();
                        const i = p.imageUrl || p.image;
                        if (i) {
                            count++;
                            photoGrid.innerHTML += `<div style="aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111;"><img src="${i}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${i}')"></div>`;
                        }
                    });
                }
                
                if (count === 0) {
                    photoGrid.style.display = 'none';
                    noMsg.style.display = 'block';
                } else {
                    noMsg.style.display = 'none';
                    photoGrid.style.display = 'grid';
                }
            });
        } else {
            noMsg.style.display = 'none';
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
