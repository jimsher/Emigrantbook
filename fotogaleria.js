function openPhotosSection() {
    // ვიღებთ იმ იუზერის ID-ს, ვის პროფილსაც ვათვალიერებთ
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid') || auth.currentUser.uid;
    
    // UI ელემენტების მომზადება
    const videoGrid = document.getElementById('profGrid');
    const photosGrid = document.getElementById('userPhotosGrid');
    const noPhotosMsg = document.getElementById('noPhotosMsg');

    // ვიდეოებს ვმალავთ, ფოტოებს ვაჩენთ
    videoGrid.style.display = 'none';
    photosGrid.style.display = 'grid';
    photosGrid.innerHTML = ""; // გასუფთავება

    // ბაზიდან ფოტოების წამოღება ფილტრით (მხოლოდ ამ იუზერის)
    db.ref('community_posts').orderByChild('authorId').equalTo(viewUid).once('value', snap => {
        const posts = snap.val();
        let hasPhotos = false;

        if (posts) {
            // გადავაქციოთ ობიექტი მასივად, რომ ID-ებიც შევინახოთ
            const postsArray = Object.keys(posts).map(key => ({ id: key, ...posts[key] }));

            postsArray.reverse().forEach(post => {
                if (post.image) {
                    hasPhotos = true;
                    const photoDiv = document.createElement('div');
                    photoDiv.className = 'grid-item'; 
                    
                    // აქ ჩავამატეთ მონაცემების გადაცემა (ID, ლაიქები, კომენტარები, ნახვები)
                    photoDiv.innerHTML = `
                        <img src="${post.image}" 
                             style="width:100%; height:100%; object-fit:cover;" 
                             onclick="viewFullPhoto('${post.image}', '${post.id}', ${post.likesCount || 0}, ${post.commentsCount || 0}, ${post.views || 0})">
                    `;
                    photosGrid.appendChild(photoDiv);
                }
            });
        }

        // შემოწმება, აქვს თუ არა ფოტოები
        noPhotosMsg.style.display = hasPhotos ? 'none' : 'block';
        if (!hasPhotos) photosGrid.style.display = 'none';
    });

    // ტაბის გააქტიურება (ვიზუალურად)
    if (event && event.target) {
        document.querySelectorAll('.p-nav-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
}

// ფოტოს გადიდების ფუნქცია
function viewFullPhoto(url, postId, likes = 0, comms = 0, views = 0) {
    const modal = document.getElementById('photoPreviewModal');
    document.getElementById('fullPhoto').src = url;
    
    // ციფრების ჩაწერა (თუ ბაზიდან მოგაქვს)
    document.getElementById('photoLikeCount').innerText = likes;
    document.getElementById('photoCommCount').innerText = comms;
    document.getElementById('photoViewCount').innerText = views;

    modal.style.display = 'flex';

    // ნახვების მომატება ბაზაში (Firebase)
    if(postId) {
        db.ref('community_posts/' + postId + '/views').transaction(current => (current || 0) + 1);
    }
}
