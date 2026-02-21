function openPhotosSection() {
    // 1. ვპოულობთ იმ იუზერის ID-ს, ვის პროფილსაც ახლა ვუყურებთ
    // თუ viewingUid არ მუშაობს, ეს კოდი მას მაინც იპოვის
    const targetId = (typeof viewingUid !== 'undefined') ? viewingUid : null;

    if (!targetId) {
        alert("მომხმარებლის ID ვერ მოიძებნა!");
        return;
    }

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    // 2. ეგრევე ვასუფთავებთ ფოტოების ბადეს და ვმალავთ ვიდეოებს
    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = ''; // ეს შლის ყველაფერს, რაც მანამდე ეხატა
        photoGrid.style.display = 'grid';
    }

    // 3. ვეძებთ პოსტებს მხოლოდ ამ კონკრეტული targetId-სთვის
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = ''; // კიდევ ერთი დაზღვევა
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

        if (count === 0) {
            if (noMsg) noMsg.style.display = 'block';
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
