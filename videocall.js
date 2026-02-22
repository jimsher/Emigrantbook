const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
 // --- LANGUAGE LOGIC ---
 const translations = {


  let localTracks = { videoTrack: null, audioTrack: null };
async function startVideoCall(existingChannel = null) {
 const appId = "7290502fac7f4feb82b021ccde79988a"; 
 const token = "007eJxTYHjuUsbf/kPswi7dW9OuT2ywvjBtv5XPYkdtPofrzS5ztX4oMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgkMk/ryWwIZGRotNBnYmSAQBCfmyEnsyw1vrikKDUxl4EBAEnPIfQ=";
 const channel = "live_stream"; 
 const ui = document.getElementById('videoCallUI');
 ui.style.display = 'flex'; ui.style.zIndex = "200000";
 try {
 const uid = Math.floor(Math.random() * 10000);
 await client.join(appId, channel, token, uid);
 localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
 localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
 localTracks.videoTrack.play("local-video");
 await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
 if (!existingChannel) {
 db.ref(`video_calls/${currentChatId}`).set({ callerName: myName, callerPhoto: myPhoto, callerUid: auth.currentUser.uid, channel: channel, status: 'calling', ts: Date.now() });
 }
 } catch (err) { endVideoCall(); }
}
async function endVideoCall() {
 if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
 if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
 localTracks = { videoTrack: null, audioTrack: null };
 await client.leave();
 document.getElementById('videoCallUI').style.display = 'none';
 if(currentChatId) db.ref(`video_calls/${currentChatId}`).remove();
 db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}
function minimizeVideoCall() {
 const ui = document.getElementById('videoCallUI');
 if(ui.style.width === '100%') {
 ui.style.width = '140px'; ui.style.height = '200px'; ui.style.top = '70px'; ui.style.left = '10px'; ui.style.borderRadius = '15px'; ui.style.border = '2px solid var(--gold)';
 } else {
 ui.style.width = '100%'; ui.style.height = '100%'; ui.style.top = '0'; ui.style.left = '0'; ui.style.borderRadius = '0'; ui.style.border = 'none';
 }
}
