let targetId = viewingUid;
function openPhotosSection() {
    // 1. ვიღებთ იმ იუზერის ID-ს, ვის პროფილსაც ახლა უყურებ
    // შენს კოდში ეს არის viewingUid
    const targetId = (typeof viewingUid !== 'undefined') ? viewingUid : auth.currentUser.uid;

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    // 2. ეკრანის გასუფთავება (რომ შენი ფოტოები არ დარჩეს სხვის გვერდზე)
    if (grid) grid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); text-align:center; padding:20px; grid-column:1/4;">იტვირთება...</div>';
        photoGrid.style.display = 'grid';
    }
    if (noMsg) noMsg.style.display = 'none';

    // 3. ძებნა ბაზაში (ვეძებთ 'community_posts'-ში, სადაც შენი submitWallPost აგზავნის)
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = ''; // ვასუფთავებთ "იტვირთება" ტექსტს
        let count = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const post = child.val();
                
                // ყურადღება: აქ ვიყენებთ post.image-ს (როგორც შენს სკრიპტშია)
                if (post.authorId === targetId && post.image) {
                    count++;
                    const imgDiv = document.createElement('div');
                    imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid var(--border);";
                    imgDiv.innerHTML = `<img src="${post.image}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${post.image}')">`;
                    photoGrid.appendChild(imgDiv);
                }
            });
        }

        // 4. თუ ფოტოები ვერ ვიპოვეთ
        if (count === 0) {
            if (noMsg) noMsg.style.display = 'block';
            if (photoGrid) photoGrid.style.display = 'none';
        }
    });
}

// ფოტოს დიდზე ნახვის ფუნქცია (თუ არ გაქვს, დაამატე)
function previewImage(url) {
    const overlay = document.getElementById('fullVideoOverlay'); // ვიყენებთ არსებულ ოვერლეის
    const vid = document.getElementById('fullVideoTag');
    vid.style.display = 'none'; // ვმალავთ ვიდეოს ტაგს
    
    let img = document.getElementById('fullImgPreview');
    if(!img) {
        img = document.createElement('img');
        img.id = 'fullImgPreview';
        img.style = "max-width:90%; max-height:80%; border-radius:10px; border:2px solid var(--gold);";
        overlay.appendChild(img);
    }
    img.src = url;
    img.style.display = 'block';
    overlay.style.display = 'flex';
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
