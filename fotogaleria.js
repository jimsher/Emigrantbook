function openPhotosSection() {
    // 1. ვიღებთ ID-ს - viewingUid შენს კოდში გლობალურია, ასე რომ დავტოვოთ
    let targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = '<div style="color:var(--gold); text-align:center; padding:20px; grid-column:1/4;">იტვირთება...</div>';
        photoGrid.style.display = 'grid';
    }

    if (!targetId) {
        console.error("ID ვერ დადგინდა!");
        return;
    }

    // 2. წამოვიღოთ ყველა პოსტი და ხელით გავფილტროთ (რომ ბაზის შეზღუდვებმა არ დაგვბლოკოს)
    db.ref('community_posts').once('value', snap => {
        photoGrid.innerHTML = ''; 
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            // ვამოწმებთ: 1. არის თუ არა ამ იუზერის? 2. აქვს თუ არა ფოტო?
            if (post.authorId === targetId && (post.imageUrl || post.image)) {
                count++;
                const img = post.imageUrl || post.image;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                imgDiv.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="previewImage('${img}')">`;
                photoGrid.appendChild(imgDiv);
            }
        });

        // 3. თუ არაფერია, გამოვაჩინოთ მესიჯი
        if (count === 0) {
            photoGrid.style.display = 'none';
            if (noMsg) noMsg.style.display = 'block';
        } else {
            if (noMsg) noMsg.style.display = 'none';
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
