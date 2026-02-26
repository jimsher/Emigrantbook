





// 2. კომენტარის გაგზავნის ერთიანი ფუნქცია (ჩაანაცვლე შენი handleSendComment ან postComment ამით)
function handleSendComment() {
    const inp = document.getElementById('photoCommInp');
    if (!inp) return;

    const txt = inp.value.trim();
    if (!txt || !currentOpenedPostId || !auth.currentUser) return;

    const commData = {
        text: txt,
        authorId: auth.currentUser.uid,
        authorName: document.getElementById('profName').innerText || "User",
        timestamp: Date.now()
    };

    // 1. მხოლოდ ვაგზავნით კომენტარს
    db.ref('post_comments/' + currentOpenedPostId).push(commData).then(() => {
        inp.value = ""; // ველს ვასუფთავებთ

        // 2. მხოლოდ ბაზაში ვუმატებთ რაოდენობას
        // არანაირი innerText = ... აქ არ უნდა ეწეროს!
        db.ref('community_posts/' + currentOpenedPostId + '/commentsCount').transaction(c => (c || 0) + 1);

        // 3. მხოლოდ სიას ვანახლებთ (ტექსტებს)
        if (typeof loadComments === "function") {
            loadComments(currentOpenedPostId);
        }
    });
}









function loadComments(postId) {
    if (!postId) return;

    // ვუკავშირდებით ბაზას, სადაც კომენტარები ინახება
    db.ref(`post_comments/${postId}`).on('value', snap => {
        const commContainer = document.getElementById('commentsList'); // აქ უნდა გამოჩნდეს ტექსტები
        if (!commContainer) return;

        commContainer.innerHTML = "";
        const comments = snap.val();
        
        // 1. ვითვლით რეალურად რამდენი კომენტარია ბაზაში
        const realCount = snap.numChildren(); 

        // 2. ვასწორებთ ციფრს ეკრანზე
        const commCountSpan = document.getElementById('photoCommCount');
        if (commCountSpan) commCountSpan.innerText = realCount;

        // 3. ვასწორებთ ციფრს ბაზაშიც, რომ სინქრონში იყოს
        db.ref(`community_posts/${postId}/commentsCount`).set(realCount);

        // 4. გამოგვაქვს კომენტარები ეკრანზე
        if (comments) {
            Object.values(comments).reverse().forEach(c => {
                const div = document.createElement('div');
                div.style.padding = "8px";
                div.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                div.innerHTML = `
                    <div style="color:#d4af37; font-weight:bold; font-size:13px;">${c.authorName}</div>
                    <div style="color:white; font-size:14px;">${c.text}</div>
                `;
                commContainer.appendChild(div);
            });
        }
    });
}
