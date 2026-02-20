function openPhotosSection(userId) {
    // 1. ვიზუალური გადართვა
    const grid = document.getElementById('profGrid');
    const photoGrid = document.getElementById('userPhotosGrid');
    
    if(grid) grid.style.display = 'none';
    if(photoGrid) {
        photoGrid.style.display = 'grid';
        photoGrid.innerHTML = '<div style="color:var(--gold); grid-column:1/4; text-align:center; padding:20px;">იძებნება ფოტოები...</div>';
    }

    // 2. ვეძებთ პოსტებს
    // ჯერ ვცადოთ authorId-ით, თუ არა და გადავამოწმოთ ყველა პოსტი
    db.ref('posts').once('value', snap => {
        photoGrid.innerHTML = '';
        let count = 0;

        snap.forEach(child => {
            const post = child.val();
            
            // ვამოწმებთ: 1. არის თუ არა ეს ამ იუზერის პოსტი? 2. აქვს თუ არა ფოტო?
            // აქ ვამატებ რამდენიმე შესაძლო ID-ს სახელს (authorId ან uid)
            const isOwner = post.authorId === userId || post.uid === userId;
            
            if (isOwner && post.imageUrl) {
                count++;
                const imgDiv = document.createElement('div');
                imgDiv.style.cssText = "aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:#111; border:1px solid #222; position:relative;";
                imgDiv.innerHTML = `
                    <img src="${post.imageUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" 
                         onclick="window.open('${post.imageUrl}', '_blank')">
                `;
                photoGrid.appendChild(imgDiv);
            }
        });

        if (count === 0) {
            document.getElementById('noPhotosMsg').style.display = 'block';
            photoGrid.style.display = 'none';
        } else {
            document.getElementById('noPhotosMsg').style.display = 'none';
        }
    });
}
