function openPhotosSection() {
    // 1. ყველაზე საიმედო გზა: ავიღოთ ID პირდაპირ პროფილის ავატარიდან
    // შენი სისტემა ხომ profAva-ში სვამს იმ იუზერის ფოტოს? 
    // იქიდან ამოვიღოთ ID, რომ სხვის პროფილზე შენი ფოტოები არ გამოჩნდეს.
    
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : null;

    // თუ viewingUid მკვდარია, ავიღოთ ID იმ მომენტში, როცა პროფილს ვუყურებთ
    if (!targetId || targetId === auth.currentUser.uid) {
        // ეს ხაზი იმუშავებს მხოლოდ იმ შემთხვევაში, თუ სხვის პროფილზე ხარ
        const avaImg = document.getElementById('profAva');
        if (avaImg && avaImg.src.includes('users%2F')) {
             targetId = avaImg.src.split('users%2F')[1].split('?')[0].split('%2F')[0];
        }
    }

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = ''; // ეს წამიერად ასუფთავებს შენს ფოტოებს!
        photoGrid.style.display = 'grid';
    }

    // 2. ვეძებთ ბაზაში მხოლოდ ამ კონკრეტულ targetId-ს
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = ''; 
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            // მკაცრი შედარება: პოსტის ავტორი უნდა იყოს ის, ვისაც ვუყურებთ
            // და ვიყენებთ post.image-ს (როგორც შენს submitWallPost-შია)
            if (post.authorId === targetId && post.image) {
                count++;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                imgDiv.innerHTML = `<img src="${post.image}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${post.image}')">`;
                photoGrid.appendChild(imgDiv);
            }
        });

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
