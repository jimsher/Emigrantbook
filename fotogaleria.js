// --- გალერეის გლობალური ცვლადები ---
let gallery_currentOpenedPostId = null;
let gallery_currentPhotoListener = null;

// 1. პროფილზე ფოტოების სექციის გახსნა
function openPhotosSection(event) {
    const viewUid = document.getElementById('profName').getAttribute('data-view-uid') || auth.currentUser.uid;
    
    const videoGrid = document.getElementById('profGrid');
    const photosGrid = document.getElementById('userPhotosGrid');
    const noPhotosMsg = document.getElementById('noPhotosMsg');

    if (videoGrid) videoGrid.style.display = 'none';
    if (photosGrid) {
        photosGrid.style.display = 'grid';
        photosGrid.innerHTML = ""; // პირველადი გასუფთავება
    }

    db.ref('community_posts').orderByChild('authorId').equalTo(viewUid).once('value', snap => {
        // --- აი ეს არის დაზღვევა დუბლიკატის წინააღმდეგ ---
        if (photosGrid) photosGrid.innerHTML = ""; 
        // ----------------------------------------------

        const posts = snap.val();
        let hasPhotos = false;

        if (posts) {
            const postsArray = Object.keys(posts).map(key => ({ id: key, ...posts[key] }));

            postsArray.reverse().forEach(post => {
                if (post.image) {
                    hasPhotos = true;
                    const photoDiv = document.createElement('div');
                    photoDiv.className = 'grid-item'; 
                    
                    photoDiv.innerHTML = `
                        <img src="${post.image}" 
                             style="width:100%; height:100%; object-fit:cover; cursor:pointer;" 
                             onclick="gallery_viewFullPhoto('${post.image}', '${post.id}')">
                    `;
                    photosGrid.appendChild(photoDiv);
                }
            });
        }

        if (noPhotosMsg) noPhotosMsg.style.display = hasPhotos ? 'none' : 'block';
        // ამ ხაზს ოდნავ შევეხე: თუ ფოტოები არ არის, ბადე დაიმალოს, მაგრამ თუ არის - დარჩეს grid
        if (!hasPhotos && photosGrid) {
            photosGrid.style.display = 'none';
        } else if (hasPhotos && photosGrid) {
            photosGrid.style.display = 'grid';
        }
    });

    if (event && event.target) {
        document.querySelectorAll('.p-nav-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
}



// 2. ფოტოს გახსნა გალერეაში
async function gallery_viewFullPhoto(url, postId) {
    gallery_currentOpenedPostId = postId;
    
    const modal = document.getElementById('gallery_photoPreviewModal');
    const fullImg = document.getElementById('gallery_fullPhotoImg');
    const likeIcon = document.getElementById('gallery_photoLikeIcon');
    const likeCountSpan = document.getElementById('gallery_photoLikeCount');
    const viewCountSpan = document.getElementById('gallery_photoViewCount');
    const commCountSpan = document.getElementById('gallery_photoCommCount');
    
    fullImg.src = url;
    modal.style.display = 'flex';

    // ძველი ლისტენერის გათიშვა
    if (gallery_currentPhotoListener) {
        db.ref('community_posts/' + postId).off();
    }

    // რეალურ დროში მონაცემების განახლება
    gallery_currentPhotoListener = db.ref('community_posts/' + postId).on('value', snap => {
        const data = snap.val();
        if (data) {
            if (likeCountSpan) likeCountSpan.innerText = data.likesCount || 0;
            if (viewCountSpan) viewCountSpan.innerText = data.views || 0;
            if (commCountSpan) commCountSpan.innerText = data.commentsCount || 0;
        }
    });

    // ლაიქის სტატუსის შემოწმება იუზერისთვის
    if (auth.currentUser) {
        db.ref(`post_likes/${postId}/${auth.currentUser.uid}`).on('value', snap => {
            if (likeIcon) likeIcon.style.color = snap.exists() ? '#ff4d4d' : 'white';
        });
    }

    // ნახვის მომატება
    db.ref('community_posts/' + postId + '/views').transaction(c => (c || 0) + 1);
}

// 3. გალერეის ფოტოს დალაიქება
async function gallery_handleLike(event) {
    event.stopPropagation();
    if (!gallery_currentOpenedPostId || !auth.currentUser) return;

    const myUid = auth.currentUser.uid;
    const likeRef = db.ref(`post_likes/${gallery_currentOpenedPostId}/${myUid}`);
    const postRef = db.ref(`community_posts/${gallery_currentOpenedPostId}`);

    const snap = await likeRef.once('value');

    if (snap.exists()) {
        await likeRef.remove();
        postRef.child('likesCount').transaction(c => (c || 1) - 1);
    } else {
        await likeRef.set(true);
        postRef.child('likesCount').transaction(c => (c || 0) + 1);
        
        const icon = document.getElementById('gallery_photoLikeIcon');
        if (icon) {
            icon.style.transform = 'scale(1.5)';
            setTimeout(() => icon.style.transform = 'scale(1)', 200);
        }
    }
}

// 4. გალერეის ფოტოს კომენტარის გაგზავნა
function gallery_submitComment() {
    const inp = document.getElementById('gallery_photoCommInput');
    if (!inp) return;

    const txt = inp.value.trim();
    if (!txt || !gallery_currentOpenedPostId || !auth.currentUser) return;

    const commData = {
        text: txt,
        authorId: auth.currentUser.uid,
        authorName: document.getElementById('profName').innerText || "User",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('post_comments/' + gallery_currentOpenedPostId).push(commData).then(() => {
        inp.value = ""; 
        // ბაზაში რაოდენობის მომატება
        db.ref('community_posts/' + gallery_currentOpenedPostId + '/commentsCount').transaction(c => (c || 0) + 1);
    });
}

// 5. კომენტარების ჩატვირთვა (გალერეისთვის)
function gallery_openComments(event) {
    event.stopPropagation();
    if (!gallery_currentOpenedPostId) return;

    // აქ ვიყენებთ შენს მთავარ კომენტარების UI-ს
    const commUI = document.getElementById('commentsUI');
    if (!commUI) return;

    commUI.style.zIndex = "500000"; 
    commUI.style.display = 'flex';
    
    // გადავცემთ ID-ს მთავარ ჩატს
    currentPostId = gallery_currentOpenedPostId; 
    
    if (typeof loadComments === "function") {
        loadComments(gallery_currentOpenedPostId);
    }
}












async function gallery_handleFileUpload(input) {
    const file = input.files[0];
    if (!file || !auth.currentUser) return;

    // ვამოწმებთ ბალანსს (თუ 2 AKHO გინდა ღირდეს)
    if (!canAfford(2)) return; 

    // ღილაკის ანიმაცია (დატრიალება)
    const btnIcon = document.querySelector('#galleryUploadBtnContainer i');
    if(btnIcon) btnIcon.className = "fas fa-spinner fa-spin";

    const formData = new FormData();
    formData.append('image', file);

    try {
        // ვიყენებთ შენს ImgBB API Key-ს (რაც ავატარებზე გქონდა)
        const res = await fetch('https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67', { 
            method: 'POST', 
            body: formData 
        });
        const data = await res.json();

        if (data.success) {
            console.log("ImgBB-ზე აიტვირთა:", data.data.url);
            
            const myUid = auth.currentUser.uid;
            const myName = document.getElementById('profName').innerText;

            // ვინახავთ Firebase-ში community_posts-ის ქვეშ
            const newPostRef = db.ref('community_posts').push();
            await newPostRef.set({
                id: newPostRef.key,
                authorId: myUid,
                authorName: myName,
                authorPhoto: myPhoto || "",
                image: data.data.url, // ImgBB-სგან მიღებული პირდაპირი ლინკი
                likesCount: 0,
                commentsCount: 0,
                views: 0,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            spendAkho(2, 'Gallery Upload');
            alert("ფოტო წარმატებით აიტვირთა!");

            // გალერეის განახლება
            if (typeof openPhotosSection === "function") {
                openPhotosSection(); 
            }
        } else {
            alert("ImgBB შეცდომა: " + (data.error ? data.error.message : "უცნობი"));
        }
    } catch (err) {
        console.error("Network Error:", err);
        alert("ინტერნეტის შეცდომა!");
    } finally {
        if(btnIcon) btnIcon.className = "fas fa-camera";
        input.value = ""; // ინპუტის გასუფთავება
    }
}
