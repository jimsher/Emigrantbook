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
// ცვლადი, რომელიც დაიმახსოვრებს რომელ ფოტოს ვუყურებთ ახლა
let currentOpenedPostId = null;

// ფოტოს გახსნის განახლებული ფუნქცია
function viewFullPhoto(url, postId, likes, comms, views) {
    currentOpenedPostId = postId; // ვინახავთ პოსტის ID-ს
    
    const modal = document.getElementById('photoPreviewModal');
    document.getElementById('fullPhoto').src = url;
    
    // ციფრების ასახვა
    document.getElementById('photoLikeCount').innerText = likes || 0;
    document.getElementById('photoCommCount').innerText = comms || 0;
    document.getElementById('photoViewCount').innerText = views || 0;

    modal.style.display = 'flex';

    // ნახვების მომატება ბაზაში
    if(postId) {
        db.ref('community_posts/' + postId + '/views').transaction(c => (c || 0) + 1);
    }
}

// ლაიქის დაჭერის ფუნქცია
function handlePhotoLike(event) {
    event.stopPropagation(); // რომ მოდალი არ დაიხუროს დაჭერისას
    if (!currentOpenedPostId) return;

    const likeIcon = document.getElementById('photoLikeIcon');
    const likeCountSpan = document.getElementById('photoLikeCount');
    const postRef = db.ref('community_posts/' + currentOpenedPostId);

    // მარტივი ლაიქის ლოგიკა Firebase-ში
    postRef.child('likesCount').transaction(current => {
        let newValue = (current || 0) + 1;
        likeCountSpan.innerText = newValue; // მომენტალური ასახვა ეკრანზე
        return newValue;
    });

    // ვიზუალური ეფექტი
    likeIcon.style.color = '#ff4d4d';
    likeIcon.style.transform = 'scale(1.3)';
    setTimeout(() => likeIcon.style.transform = 'scale(1)', 200);
}

// კომენტარების გახსნის ფუნქცია
function openPhotoComments(event) {
    event.stopPropagation();
    if (!currentOpenedPostId) return;

    // აქ ვიყენებთ შენს უკვე არსებულ კომენტარების UI-ს
    // გადავცემთ პოსტის ID-ს შენს მთავარ კომენტარების ფუნქციას
    if (typeof openComments === "function") {
        openComments(currentOpenedPostId); 
    } else {
        // თუ ფუნქციას სხვა სახელი ჰქვია, მაგალითად:
        document.getElementById('commentsUI').style.display = 'flex';
        loadComments(currentOpenedPostId); // ეს ფუნქცია შენს script.js-ში უნდა იყოს
    }
}
