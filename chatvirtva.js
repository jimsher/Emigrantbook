window.addEventListener('load', function() {
    const splash = document.getElementById('splash-screen');
    
    // 1.5 ან 2 წამი დააყოვნე, რომ იუზერმა ლოგო დაინახოს
    setTimeout(() => {
        splash.classList.add('fade-out');
    }, 2000); 
});







// აი ინტელექტის ლოგიკა
function toggleAIChat() {
    const chat = document.getElementById('ai-chat-window');
    chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
}

async function sendToAI() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;

    // იუზერის მესიჯის დამატება
    appendMessage(text, 'user-msg');
    input.value = '';

    // აქ უნდა დაუკავშირდეს API-ს, მაგრამ საწყისისთვის შეგვიძლია დავწეროთ 
    // "სმარტ" პასუხები საიტის შესახებ:
    let response = "მესმის, მაგაზე ინფორმაციას ვეძებ...";
    
    if(text.toLowerCase().includes('akho')) {
        response = "AKHO არის ჩვენი შიდა ვალუტა. 10 AKHO = 1 ევროს.";
    } else if(text.toLowerCase().includes('ფული')) {
        response = "ფულის შოვნა შეგიძლია TOKEN-ების (ვიდეოების) ატვირთვით!";
    }

    setTimeout(() => appendMessage(response, 'ai-msg'), 1000);
}

function appendMessage(text, className) {
    const box = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = `ai-msg ${className}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
