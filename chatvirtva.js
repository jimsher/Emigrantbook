window.addEventListener('load', function() {
    const splash = document.getElementById('splash-screen');
    
    // 1.5 ან 2 წამი დააყოვნე, რომ იუზერმა ლოგო დაინახოს
    setTimeout(() => {
        splash.classList.add('fade-out');
    }, 2000); 
});



