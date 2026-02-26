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
let currentPhotoListener = null; // ძველი "მოსმენების" მოსაშორებლად

async function viewFullPhoto(url, postId, likes, comms, views) {
    currentOpenedPostId = postId;
    const modal = document.getElementById('photoPreviewModal');
    const likeIcon = document.getElementById('photoLikeIcon');
    const likeCountSpan = document.getElementById('photoLikeCount');
    const viewCountSpan = document.getElementById('photoViewCount');
    
    document.getElementById('fullPhoto').src = url;
    modal.style.display = 'flex';

    // თუ წინა ფოტოზე რამე "მოსმენა" გვქონდა ჩართული, ვთიშავთ
    if (currentPhotoListener) {
        db.ref('community_posts/' + currentOpenedPostId).off();
    }

    // --- რეალურ დროში განახლება (Real-time Sync) ---
    currentPhotoListener = db.ref('community_posts/' + postId).on('value', snap => {
        const data = snap.val();
        if (data) {
            likeCountSpan.innerText = data.likesCount || 0;
            viewCountSpan.innerText = data.views || 0;
            // თუ გინდა კომენტარების რაოდენობაც რეალურ დროში განახლდეს:
            document.getElementById('photoCommCount').innerText = data.commentsCount || 0;
        }
    });

    // --- ლაიქის სტატუსის შემოწმება (რომ გული წითელი დაგხვდეს) ---
    if (auth.currentUser && postId) {
        const myUid = auth.currentUser.uid;
        db.ref(`post_likes/${postId}/${myUid}`).on('value', snap => {
            likeIcon.style.color = snap.exists() ? '#ff4d4d' : 'white';
        });
    }

    // ნახვების მომატება (ეს მხოლოდ ერთხელ უნდა მოხდეს გახსნისას)
    if (postId) {
        db.ref('community_posts/' + postId + '/views').transaction(c => (c || 0) + 1);
    }
}




// ლაიქის დაჭერის ფუნქცია
async function handlePhotoLike(event) {
    event.stopPropagation();
    if (!currentOpenedPostId || !auth.currentUser) return;

    const myUid = auth.currentUser.uid;
    const likeIcon = document.getElementById('photoLikeIcon');
    const likeCountSpan = document.getElementById('photoLikeCount');
    
    const likeRef = db.ref(`post_likes/${currentOpenedPostId}/${myUid}`);
    const postRef = db.ref(`community_posts/${currentOpenedPostId}`);

    // 1. ვამოწმებთ არსებულ სტატუსს
    const snap = await likeRef.once('value');

    if (snap.exists()) {
        // თუ უკვე არის -> წაშლა
        await likeRef.remove();
        // ვაკლებთ ბაზაში
        postRef.child('likesCount').transaction(c => (c || 1) - 1);
        
        // ვიზუალი (ფერს ვცვლით, ციფრს .on('value') თავისით შეცვლის)
        likeIcon.style.color = 'white';
    } else {
        // თუ არ არის -> დამატება
        await likeRef.set(true);
        // ვუმატებთ ბაზაში
        postRef.child('likesCount').transaction(c => (c || 0) + 1);
        
        // ვიზუალი
        likeIcon.style.color = '#ff4d4d';

        // ანიმაცია (შევინარჩუნეთ სრულად)
        likeIcon.style.transform = 'scale(1.5)';
        setTimeout(() => likeIcon.style.transform = 'scale(1)', 200);
    }
}





// კომენტარების გახსნის ფუნქცია
function openPhotoComments(event) {
    event.stopPropagation();
    if (!currentOpenedPostId) return;

    const commUI = document.getElementById('commentsUI');
    commUI.style.zIndex = "500000"; // პირდაპირ კოდიდან ვანიჭებთ უმაღლეს ფენას
    commUI.style.display = 'flex';
    
    currentPostId = currentOpenedPostId; 
    
    if (typeof loadComments === "function") {
        loadComments(currentOpenedPostId);
    }
}
