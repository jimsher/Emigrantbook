function openProfile(uid) {
 stopMainFeedVideos();
 document.getElementById('profileUI').style.display = 'flex';
 if(uid !== auth.currentUser.uid) {
 db.ref(`profile_views/${uid}/${auth.currentUser.uid}`).set({
 uid: auth.currentUser.uid, name: myName, photo: myPhoto, ts: Date.now()
 });
 }
 db.ref('users/' + uid).on('value', async snap => {
 const user = snap.val();
 if(!user) return;
 const dot = document.getElementById('profStatusDot');
 const lastSeenSpan = document.getElementById('profLastSeenText');
 if(user.presence === 'online') {
 dot.className = 'status-dot online';
 lastSeenSpan.innerText = '';
 } else {
 const dynamicTime = formatTimeShort(user.presence);
 if(dynamicTime) {
 dot.className = 'status-dot offline';
 lastSeenSpan.innerText = dynamicTime;
 } else {
 dot.className = 'status-dot';
 }
 }
 document.getElementById('profAva').src = user.photo || "https://ui-avatars.com/api/?name=" + user.name;
 document.getElementById('profName').innerText = user.name;
 const followersCount = user.followers ? Object.keys(user.followers).length : 0;
 const followingCount = user.following ? Object.keys(user.following).length : 0;
 document.getElementById('statFollowersCount').innerText = followersCount;
 document.getElementById('statFollowingCount').innerText = followingCount;
 document.getElementById('followersStatBtn').onclick = () => openSocialList(uid, 'followers');
 document.getElementById('followingStatBtn').onclick = () => openSocialList(uid, 'following');
 const controls = document.getElementById('profControls');
 controls.innerHTML = "";
 document.querySelector('.profile-nav').style.display = 'flex';
 document.getElementById('feetStats').style.display = (uid === auth.currentUser.uid) ? 'block' : 'none';
 document.getElementById('profTabs').style.display = 'flex';
 document.getElementById('infoBtn').onclick = () => showDetailedInfo(uid);
 if(uid === auth.currentUser.uid) {
 controls.innerHTML = `<button class="profile-btn btn-gold" onclick="document.getElementById('avaInp').click()" data-key="edit">Edit</button>`;
 loadUserVideos(uid);
 applyLanguage();
 } else {
 const isFollowing = user.followers && user.followers[auth.currentUser.uid];
 const isFriend = user.following && user.following[auth.currentUser.uid] && isFollowing;
 let canView = false;
 if(!user.privacy || user.privacy === 'public') canView = true;
 if(user.privacy === 'friends' && isFriend) canView = true;
 if(canView) {
 loadUserVideos(uid);
 if(isFollowing) {
 controls.innerHTML = `
 <button class="profile-btn btn-outline" onclick="unfollowUser('${uid}')" data-key="following_btn">Following</button>
 <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>
 `;
 } else {
 controls.innerHTML = `
 <button class="profile-btn btn-gold" style="background:var(--gold); color:black;" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>
 <button class="profile-btn btn-outline" onclick="startChat('${uid}', '${user.name}', '${user.photo}')" data-key="write">Write</button>
 `;
 }
 } else {
 document.getElementById('profGrid').innerHTML = `<div class="private-lock-screen"><p data-key="private_profile">Private Profile</p></div>`;
 document.getElementById('profTabs').style.display = 'none';
 controls.innerHTML = `<button class="profile-btn btn-gold" onclick="followUser('${uid}', '${user.name}', '${user.photo}')" data-key="follow">Follow</button>`;
 }
 applyLanguage();
 }
 });
 }
