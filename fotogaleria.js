function openPhotosSection() {
    // 1. ვპოულობთ ID-ს. თუ viewingUid მკვდარია, ავიღოთ იქიდან, სადაც პროფილი ინახავს მონაცემებს
    let targetId = (typeof viewingUid !== 'undefined' && viewingUid) ? viewingUid : null;
    
    // თუ მაინც null-ია, ესე იგი საიტი საერთოდ არ აახლებს ID-ს. 
    // ვცადოთ ამოვიღოთ იქიდან, სადაც შენი openProfile ფუნქცია სვამს მონაცემებს
    if (!targetId) {
        const avaImg = document.getElementById('profAva');
        if (avaImg && avaImg.getAttribute('onclick')) {
            // ხშირად onclick-ში წერია openPhoto('ID') - იქიდან ამოვგლიჯოთ
            const onclickText = avaImg.getAttribute('onclick');
            targetId = onclickText.match(/'([^']+)'/)[1];
        }
    }

    const photoGrid = document.getElementById('userPhotosGrid');
    const profGrid = document.getElementById('profGrid');
    const noMsg = document.getElementById('noPhotosMsg');

    if (profGrid) profGrid.style.display = 'none';
    if (photoGrid) {
        photoGrid.innerHTML = ''; // ვასუფთავებთ, რომ სხვისი არ ჩაერიოს
        photoGrid.style.display = 'grid';
    }

    // 2. თუ targetId მაინც ვერ ვიპოვეთ, არაფერი არ ქნას, რომ ყველას ფოტოები არ აირიოს
    if (!targetId) {
        console.error("ID ვერ დადგინდა!");
        return;
    }

    // 3. ძებნა ბაზაში მკაცრი ფილტრით
    db.ref('community_posts').orderByChild('authorId').equalTo(targetId).once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            const img = post.imageUrl || post.image;
            
            // კიდევ ერთი მკაცრი შემოწმება კოდის დონეზე
            if (img && post.authorId === targetId) {
                count++;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222;";
                imgDiv.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover;" onclick="previewImage('${img}')">`;
                photoGrid.appendChild(imgDiv);
            }
        });

        if (count === 0) {
            photoGrid.style.display = 'none';
            if (noMsg) noMsg.style.display = 'block';
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
