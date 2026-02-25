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
async function viewFullPhoto(url, postId, likes, comms, views) {
    currentOpenedPostId = postId;
    
    const modal = document.getElementById('photoPreviewModal');
    const likeIcon = document.getElementById('photoLikeIcon');
    
    document.getElementById('fullPhoto').src = url;
    
    // ციფრების დასმა
    document.getElementById('photoLikeCount').innerText = likes || 0;
    document.getElementById('photoCommCount').innerText = comms || 0;
    document.getElementById('photoViewCount').innerText = views || 0;

    // --- ახალი ნაწილი: ლაიქის სტატუსის შემოწმება ---
    if (auth.currentUser && postId) {
        const myUid = auth.currentUser.uid;
        // ვამოწმებთ, გვიდევს თუ არა ლაიქი ამ პოსტზე
        db.ref(`post_likes/${postId}/${myUid}`).once('value', snap => {
            if (snap.exists()) {
                likeIcon.style.color = '#ff4d4d'; // თუ დალაიქებულია - წითელი
            } else {
                likeIcon.style.color = 'white';   // თუ არა - თეთრი
            }
        });
    } else {
        likeIcon.style.color = 'white';
    }

    modal.style.display = 'flex';

    // ნახვების მომატება
    if(postId) {
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
    
    // გზა ბაზაში, სადაც ვინახავთ ვინ რა დაალაიქა
    const likeRef = db.ref(`post_likes/${currentOpenedPostId}/${myUid}`);
    const postRef = db.ref(`community_posts/${currentOpenedPostId}`);

    const snap = await likeRef.once('value');

    if (snap.exists()) {
        // თუ უკვე დალაიქებულია -> ლაიქის მოხსნა (Unlike)
        await likeRef.remove();
        postRef.child('likesCount').transaction(c => (c || 1) - 1);
        
        likeIcon.style.color = 'white';
        likeCountSpan.innerText = Math.max(0, parseInt(likeCountSpan.innerText) - 1);
    } else {
        // თუ არ არის დალაიქებული -> დალაიქება
        await likeRef.set(true);
        postRef.child('likesCount').transaction(c => (c || 0) + 1);
        
        likeIcon.style.color = '#ff4d4d';
        likeCountSpan.innerText = parseInt(likeCountSpan.innerText) + 1;
        
        // პატარა ვიზუალური ანიმაცია
        likeIcon.style.transform = 'scale(1.4)';
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
