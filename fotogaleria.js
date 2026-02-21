
function openPhotosSection() {
    // 1. ყველაზე საიმედო გზა: ავიღოთ ID იმ მომენტში, როცა პროფილის სურათს აწერია
    // შენი საიტი ხომ სხვის სურათს სვამს profAva-ში? 
    // იქიდან ამოვიღოთ ID, თუ viewingUid არ არსებობს.
    
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : null;
    
    // თუ ზემოთამ არ იმუშავა, ვეცადოთ ავიღოთ გლობალური ცვლადიდან, რომელიც თითქმის ყველა Firebase პროექტს აქვს
    if (!targetId) targetId = window.currentViewingUid || window.profileUserId;

    // თუ მაინც ვერ იპოვა, ე.ი. რაღაც სახელი აკლია. 
    // პირდაპირ ეკრანზე რომ არ დაგიწეროს "ვერ მოიძებნა", შენი ID არ აიღოს შემთხვევით:
    if (!targetId || targetId === auth.currentUser.uid) {
        // თუ სხვის პროფილზე ხარ, მაგრამ მაინც შენსას ხედავს, 
        // ეს ნიშნავს რომ viewingUid არ გაქვს განსაზღვრული.
        // ამიტომ ვეცადოთ ბოლო შანსი - ავიღოთ ელემენტის ატრიბუტიდან
        targetId = document.getElementById('profileUI').getAttribute('data-uid');
    }

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); padding:20px; text-align:center;">იძებნება...</div>';
        photoGrid.style.display = 'grid';
    }

    // ძებნა ბაზაში
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        if(snap.exists()){
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
        }

        if(count === 0) {
            if(noMsg) noMsg.style.display = 'block';
            photoGrid.style.display = 'none';
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
