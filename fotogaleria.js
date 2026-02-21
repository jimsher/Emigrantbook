function openPhotosSection() {
    // 1. ყველაზე საიმედო გზა შენი კოდისთვის:
    // ვიღებთ იმ UID-ს, რომელიც შენმა openProfile-მა უკვე დააფიქსირა
    let targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;

    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    // 2. ეგრევე ვმალავთ Reels-ის გრიდს და ვასუფთავებთ ფოტოებს
    if (grid) grid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = ''; // ეს შლის ძველ (შენს) ფოტოებს!
        photoGrid.style.display = 'grid';
    }

    if (!targetId) {
        console.error("UID ვერ მოიძებნა!");
        return;
    }

    // 3. ვეძებთ ბაზაში - ვიყენებთ once('value')-ს, რომ ინდექსებმა არ გაჭედოს
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = ''; // კიდევ ერთხელ ვასუფთავებთ
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            // ვამოწმებთ, რომ პოსტი ეკუთვნოდეს იმას, ვის პროფილზეც ვართ
            if (post.authorId === targetId) {
                const imgUrl = post.imageUrl || post.image;
                if (imgUrl) {
                    count++;
                    const imgDiv = document.createElement('div');
                    imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                    imgDiv.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${imgUrl}')">`;
                    photoGrid.appendChild(imgDiv);
                }
            }
        });

        // 4. თუ ფოტოები საერთოდ არ არის
        if (count === 0) {
            if (noMsg) noMsg.style.display = 'block';
            if (photoGrid) photoGrid.style.display = 'none';
        } else {
            if (noMsg) noMsg.style.display = 'none';
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
