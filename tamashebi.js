// --- თამაშების ლოგიკა ---
function openGamesPage() {
 document.getElementById('gamesPage').style.display = 'flex';
 // განვაახლოთ ბალანსი
 db.ref(`users/${auth.currentUser.uid}/akho`).on('value', snap => {
 document.getElementById('gameBalance').innerText = (snap.val() || 0).toFixed(2) + " AKHO";
 });
}

function closeGamesPage() {
 document.getElementById('gamesPage').style.display = 'none';
}

function playGame(gameType) {
 // აქ დაიწერება თამაშის ლოგიკა, მაგალითად:
 if (confirm("ნამდვილად გსურთ თამაშის დაწყება? (1.00 AKHO)")) {
 // ბალანსის შემოწმება და თამაშის გაშვება
 if(canAfford(1.00)) {
 spendAkho(1.00, 'Game: ' + gameType);
 // აქ გამოიძახებ კონკრეტულ თამაშს
 }
 }
}





// ბალანსის განახლების ფუნქცია (რომ სულ ნული არ ეწეროს)
function updateGameBalance() {
 const user = auth.currentUser;
 if (user) {
 db.ref(`users/${user.uid}/akho`).on('value', snap => {
 const bal = snap.val() || 0;
 const balElem = document.getElementById('gameBalance');
 if(balElem) balElem.innerText = bal.toFixed(2) + " AKHO";
 });
 }
}

// გამოიძახე ეს ფუნქცია, როცა გვერდი იხსნება
document.querySelector('.game-btn-container').addEventListener('click', updateGameBalance);









const prizes = [0.5, 2, 0, 5, 1, 0.5, 10, 0]; 
const colors = ["#1a1a1a", "#d4af37", "#1a1a1a", "#d4af37", "#1a1a1a", "#d4af37", "#ff4d4d", "#1a1a1a"];
let currentRotation = 0;
let isSpinning = false;

function closeGamesPage() {
 document.getElementById('gamesPage').style.display = 'none';
}

function backToGamesList() {
 document.getElementById('wheelGameContainer').style.display = 'none';
 document.getElementById('gamesList').style.display = 'grid';
}

function playGame(type) {
 if(type === 'spin') {
 document.getElementById('gamesList').style.display = 'none';
 document.getElementById('wheelGameContainer').style.display = 'flex';
 // აუცილებელია პატარა პაუზა, რომ Canvas-მა დახატვა მოასწროს
 setTimeout(drawWheel, 100);
 }
}

function drawWheel() {
 const canvas = document.getElementById('wheelCanvas');
 if(!canvas) return;
 const ctx = canvas.getContext('2d');
 const center = 140;
 const sliceAngle = (2 * Math.PI) / prizes.length;

 ctx.clearRect(0, 0, 280, 280);

 prizes.forEach((prize, i) => {
 ctx.beginPath();
 ctx.fillStyle = colors[i];
 ctx.moveTo(center, center);
 ctx.arc(center, center, center, i * sliceAngle, (i + 1) * sliceAngle);
 ctx.fill();
 
 ctx.save();
 ctx.translate(center, center);
 ctx.rotate(i * sliceAngle + sliceAngle / 2);
 ctx.fillStyle = "white";
 ctx.font = "bold 14px Arial";
 ctx.textAlign = "right";
 ctx.fillText(prize + " ₳", center - 20, 5);
 ctx.restore();
 });
}

function spinWheel() {
 if(isSpinning) return;
 
 // აქ შენი ბალანსის შემოწმება (მაგალითად 1 AKHO)
 // if(userBalance < 1) { alert("ბალანსი არ გყოფნის!"); return; }

 isSpinning = true;
 const canvas = document.getElementById('wheelCanvas');
 const extraDegrees = Math.floor(Math.random() * 360) + 1800; 
 currentRotation += extraDegrees;
 
 canvas.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
 canvas.style.transform = `rotate(${currentRotation}deg)`;

 setTimeout(() => {
 isSpinning = false;
 const actualDeg = currentRotation % 360;
 const sliceSize = 360 / prizes.length;
 const prizeIndex = Math.floor((360 - actualDeg) / sliceSize) % prizes.length;
 const win = prizes[prizeIndex];
 
 alert(win > 0 ? "მოიგე " + win + " AKHO!" : "ამჯერად ვერ მოიგე!");
 }, 4000);
}



function spinWheel() {
 if(isSpinning) return;

 // 1. ვამოწმებთ, აქვს თუ არა მომხმარებელს 1.00 AKHO
 // ვიყენებთ შენს canAfford ფუნქციას
 if(!canAfford(1.00)) {
 alert("ბალანსი არ გყოფნის! (საჭიროა 1.00 AKHO)");
 return;
 }

 // 2. ვაკლებთ 1.00 AKHO-ს ბაზიდან თამაშის დაწყებისას
 spendAkho(1.00, "Lucky Spin Bet");

 isSpinning = true;
 const canvas = document.getElementById('wheelCanvas');
 const btn = document.getElementById('spinBtn');
 
 btn.disabled = true;
 btn.style.opacity = "0.5";
 btn.innerText = "ტრიალებს...";

 // რანდომული ტრიალი
 const extraDegrees = Math.floor(Math.random() * 360) + 2160; 
 currentRotation += extraDegrees;
 
 canvas.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.2, 1)";
 canvas.style.transform = `rotate(${currentRotation}deg)`;

 // 3. შედეგის დაფიქსირება
 setTimeout(() => {
 isSpinning = false;
 btn.disabled = false;
 btn.style.opacity = "1";
 btn.innerText = "დატრიალება (1.00 AKHO)";
 
 const actualDeg = currentRotation % 360;
 const sliceSize = 360 / prizes.length;
 // ისარი ზემოთაა (270 გრადუსი), ამიტომ ასე ვითვლით ინდექსს
 const prizeIndex = Math.floor(((360 - actualDeg + 270) % 360) / sliceSize) % prizes.length;
 const win = prizes[prizeIndex];
 
 if(win > 0) {
 // 4. მოგების დარიცხვა ბაზაში
 earnAkho(auth.currentUser.uid, win, "Lucky Spin Win");
 
 // ვიზუალური ეფექტი ბალანსის განახლებისთვის (თუ ავტომატურად არ ახლდება)
 updateGameBalance(); 
 
 alert("🎉 გილოცავ! შენ მოიგე " + win + " AKHO!");
 } else {
 alert("😢 ამჯერად ვერ მოიგე, სცადე კიდევ ერთხელ!");
 }
 }, 5000);
}
 
 
 
 let selectedNumbers = [];

// 1. ლოტოს გვერდის გახსნა და ბადის შევსება
function openLotto() {
 document.getElementById('gamesList').style.display = 'none';
 document.getElementById('lottoGameContainer').style.display = 'flex';
 
 const grid = document.getElementById('lottoGrid');
 grid.innerHTML = "";
 selectedNumbers = [];
 
 for(let i=1; i<=25; i++) {
 const btn = document.createElement('button');
 btn.className = 'num-btn';
 btn.innerText = i;
 btn.onclick = () => toggleNumber(i, btn);
 grid.appendChild(btn);
 }
}

// 2. ციფრების არჩევა (მაქსიმუმ 5)
function toggleNumber(num, btn) {
 if(selectedNumbers.includes(num)) {
 selectedNumbers = selectedNumbers.filter(n => n !== num);
 btn.classList.remove('selected');
 } else {
 if(selectedNumbers.length < 5) {
 selectedNumbers.push(num);
 btn.classList.add('selected');
 }
 }
}

// 3. გათამაშების დაწყება
async function startLottoDraw() {
 if(selectedNumbers.length < 5) { alert("გთხოვთ აირჩიოთ 5 ციფრი!"); return; }
 if(!canAfford(5.00)) { alert("ბალანსი არ გყოფნის (5.00 AKHO)"); return; }

 spendAkho(5.00, "Lotto Bet");
 const btn = document.getElementById('playLottoBtn');
 btn.disabled = true;
 btn.style.opacity = "0.5";

 const container = document.getElementById('lottoBalls');
 container.innerHTML = ""; // ვასუფთავებთ ძველ ბურთებს

 let winningNumbers = [];
 while(winningNumbers.length < 5) {
 let n = Math.floor(Math.random() * 25) + 1;
 if(!winningNumbers.includes(n)) winningNumbers.push(n);
 }

 // ბურთების ამოყრის ანიმაცია (რიგრიგობით)
 for(let i=0; i<5; i++) {
 await new Promise(r => setTimeout(r, 1000)); // 1 წამიანი პაუზა თითო ბურთზე
 const ball = document.createElement('div');
 ball.className = 'lotto-ball';
 ball.innerText = winningNumbers[i];
 container.appendChild(ball);
 // აქ შეგიძლია დაამატო ხმის ეფექტი: tickSound.play();
 }

 // მოგების შემოწმება
 setTimeout(() => {
 const matches = selectedNumbers.filter(n => winningNumbers.includes(n)).length;
 let prize = 0;
 if(matches === 2) prize = 2;
 if(matches === 3) prize = 10;
 if(matches === 4) prize = 50;
 if(matches === 5) prize = 250;

 if(prize > 0) {
 earnAkho(auth.currentUser.uid, prize, `Lotto Win (${matches} matches)`);
 alert(`🎉 გილოცავ! შენ დასვი ${matches} ციფრი და მოიგე ${prize} AKHO!`);
 } else {
 alert(`ამჯერად მხოლოდ ${matches} ციფრი დაემთხვა. სცადე კიდევ ერთხელ!`);
 }
 btn.disabled = false;
 btn.style.opacity = "1";
 }, 1000);
}















// --- GAME AUDIO SYSTEM ---

// ხმების მომზადება შენი GitHub-იდან
const bgMusic = new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/u_edtmwfwu7c-over-the-horizon-329304.mp3');
const ballPopSnd = new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/u_edtmwfwu7c-pop-331070.mp3');
const winSnd = new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/breakzstudios-upbeat-p-170110.mp3');

// აუცილებელი პარამეტრები
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.crossOrigin = "anonymous";
ballPopSnd.crossOrigin = "anonymous";
winSnd.crossOrigin = "anonymous";

// ფუნქცია, რომელიც რთავს მუსიკას თამაშში შესვლისას
function openGamesPage() {
    document.getElementById('gamesPage').style.display = 'flex';
    
    // ბრაუზერის ბლოკის მოსახსნელად
    bgMusic.play().catch(() => {
        window.addEventListener('click', () => { bgMusic.play(); }, { once: true });
    });
}
// -------------------------




// თამაშების გვერდის გახსნა
function openGamesPage() {
    document.getElementById('gamesPage').style.display = 'flex';
    
    // მუსიკის ჩართვა (ბრაუზერმა შეიძლება მოითხოვოს ერთი კლიკი ეკრანზე)
    bgMusic.play().catch(e => console.log("Music play pending user interaction"));
    
    // ბალანსის განახლება
    updateGameBalance();
}

// თამაშების გვერდის დახურვა
function closeGamesPage() {
    document.getElementById('gamesPage').style.display = 'none';
    
    // მუსიკის სრული გაჩერება
    bgMusic.pause();
    bgMusic.currentTime = 0;
}








async function startLottoDraw() {
    if(selectedNumbers.length < 5) { alert("გთხოვთ აირჩიოთ 5 ციფრი!"); return; }
    if(!canAfford(5.00)) { alert("ბალანსი არ გყოფნის (5.00 AKHO)"); return; }

    spendAkho(5.00, "Lotto Bet");
    const btn = document.getElementById('playLottoBtn');
    btn.disabled = true;

    const container = document.getElementById('lottoBalls');
    container.innerHTML = ""; 

    let winningNumbers = [];
    while(winningNumbers.length < 5) {
        let n = Math.floor(Math.random() * 25) + 1;
        if(!winningNumbers.includes(n)) winningNumbers.push(n);
    }

    // ბურთების ამოყრა და ხმები
    for(let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 800)); 
        
        // ბურთის ამოვარდნის ხმა
        ballPopSnd.currentTime = 0;
        ballPopSnd.play();

        const ball = document.createElement('div');
        ball.className = 'lotto-ball';
        ball.innerText = winningNumbers[i];
        container.appendChild(ball);
    }

    // შედეგის ხმები
    setTimeout(() => {
        const matches = selectedNumbers.filter(n => winningNumbers.includes(n)).length;
        if(matches >= 2) {
            winSnd.play(); // მოგების ხმა
            alert(`🎉 მოიგე! ${matches} ციფრი დაემთხვა!`);
        } else {
            loseSnd.play(); // წაგების ხმა
            alert(`ამჯერად ვერ მოიგე. სცადე კიდევ ერთხელ!`);
        }
        btn.disabled = false;
    }, 500);
}






   





    

    
      // ==========================================
// 1. კონფიგურაცია და ცვლადები
// ==========================================
var burningIcons = ['7️⃣', '🍉', '🍇', '🔔', '🍒', '🍋', '⭐'];
var slot5Icons = ['7️⃣', '🍉', '🍇', '🔔', '🍒', '🍋', '🍊', '⭐', '💲'];


// მკაცრი შემოწმება, რომ საიტი არ გაითიშოს
if (typeof window.spinCount5 === 'undefined') {
    window.spinCount5 = 0;
}

var burningStake = 0.15;  
var burningStake5 = 0.20; 
var isSpinningNow = false;
var isSpinning5 = false;

// ==========================================
// 2. ფსონის შეცვლის ფუნქციები
// ==========================================
function updateBet(amount, btn) {
    if (isSpinningNow) return;
    burningStake = parseFloat(amount);
    document.querySelectorAll('.bet-opt').forEach(b => {
        b.style.background = '#222'; b.style.color = 'gold';
    });
    btn.style.background = 'gold'; btn.style.color = 'black';
}

function updateBet5(amount, btn) {
    if (isSpinning5) return;
    burningStake5 = parseFloat(amount);
    document.querySelectorAll('.bet5-opt').forEach(b => {
        b.style.background = '#222'; b.style.color = 'gold';
    });
    btn.style.background = 'gold'; btn.style.color = 'black';
}

// ==========================================
// 3. UI განახლება
// ==========================================
function updateAllGameBalances() {
    const val = (typeof myAkho !== 'undefined') ? myAkho : 0;
    const akhoStr = val.toFixed(2);
    const euroStr = "(" + (val / 10).toFixed(2) + " €)";

    const bTargets = ['slot5BalanceVal', 'slot5BalanceVal_inner', 'slotBalanceVal', 'gameBalance'];
    bTargets.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = (id === 'gameBalance') ? akhoStr + " ₳" : akhoStr;
    });

    if(document.getElementById('slot5RealBalance')) 
        document.getElementById('slot5RealBalance').innerText = euroStr;
}

function updateWinUI(winAmt) {
    const akhoStr = winAmt.toFixed(2);
    const euroStr = "(" + (winAmt / 10).toFixed(2) + " €)";
    const wTargets = ['slot5WinVal', 'slot5WinVal_inner', 'slotWinVal'];
    wTargets.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = akhoStr;
    });
    if(document.getElementById('slot5RealWin')) 
        document.getElementById('slot5RealWin').innerText = euroStr;
}

// ==========================================
// 4. BURNING SLOTS (3-RILL) LOGIC
// ==========================================
function triggerBurningSpin() {
    if (isSpinningNow || !canAfford(burningStake)) return;
    isSpinningNow = true;

    spendAkho(burningStake, '3-Reel Bet');
    updateAllGameBalances();
    updateWinUI(0);

    const wrapper = document.getElementById('reelsWrapper');
    const oldLine = document.getElementById('winLine');
    if(oldLine) oldLine.remove();

    new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/u_edtmwfwu7c-pop-331070.mp3').play().catch(()=>{});

    let result = [], winAmt = 0;
    const rand = Math.random();

    if (rand < 0.02) { result = ['7️⃣','7️⃣','7️⃣']; winAmt = burningStake * 100; }
    else if (rand < 0.10) { let i = burningIcons[1]; result = [i,i,i]; winAmt = burningStake * 15; }
    else { 
        while(true) {
            result = [burningIcons[Math.floor(Math.random()*7)], burningIcons[Math.floor(Math.random()*7)], burningIcons[Math.floor(Math.random()*7)]];
            if (!(result[0] === result[1] && result[1] === result[2])) break;
        }
        winAmt = 0; 
    }

    for (let i = 1; i <= 3; i++) {
        const r = document.getElementById('reel_' + i);
        if(!r) continue;
        r.innerHTML = '';
        for(let j=0; j<40; j++) {
            const s = document.createElement('div');
            s.style="height:70px; display:flex; align-items:center; justify-content:center; font-size:45px;";
            s.innerText = burningIcons[Math.floor(Math.random()*7)];
            r.appendChild(s);
        }
        r.style.transition = 'none'; r.style.transform = 'translateY(0)';
        const stopIdx = 30;
        r.children[stopIdx].innerText = result[i-1];
        setTimeout(() => {
            r.style.transition = `transform ${1.5 + (i*0.3)}s cubic-bezier(0.2, 0, 0.1, 1)`;
            r.style.transform = `translateY(-${stopIdx * 70}px)`;
        }, 50);
    }

    setTimeout(() => {
        isSpinningNow = false;
        if (winAmt > 0) {
            new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/breakzstudios-upbeat-p-170110.mp3').play().catch(()=>{});
            earnAkho(auth.currentUser.uid, winAmt, '3-Reel Win');
            updateWinUI(winAmt);
            setTimeout(updateAllGameBalances, 500);
        }
    }, 3200);
}

// ==========================================
// 5. BURNING SLOTS (5-RILL) LOGIC
// ==========================================
function triggerBurning5Spin() {
    if (isSpinning5 || !canAfford(burningStake5)) {
        if (!canAfford(burningStake5)) alert("ბალანსი არ გყოფნის!");
        return;
    }
    isSpinning5 = true;
    spendAkho(burningStake5, '5-Reel Bet');
    updateAllGameBalances();
    updateWinUI(0);

    new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/u_edtmwfwu7c-pop-331070.mp3').play().catch(()=>{});

    let result = [], winAmt = 0;
    const rand = Math.random();

    if (rand < 0.03) { result = ['7️⃣','7️⃣','7️⃣','7️⃣','7️⃣']; winAmt = burningStake5 * 150; }
    else { 
        while(true) {
            result = [];
            for(let k=0; k<5; k++) result.push(slot5Icons[Math.floor(Math.random()*9)]);
            if(!result.every(v => v === result[0])) break;
        }
        winAmt = 0;
    }

    for (let i = 1; i <= 5; i++) {
        const r = document.getElementById('reel5_' + i);
        if(!r) continue;
        r.innerHTML = '';
        for(let j=0; j<60; j++) {
            const s = document.createElement('div');
            s.style="height:70px; display:flex; align-items:center; justify-content:center; font-size:40px;";
            s.innerText = slot5Icons[Math.floor(Math.random()*9)];
            r.appendChild(s);
        }
        r.style.transition = 'none'; r.style.transform = 'translateY(0)';
        const stopIdx = 45;
        r.children[stopIdx].innerText = result[i-1];
        setTimeout(() => {
            r.style.transition = `transform ${1.8 + (i*0.3)}s cubic-bezier(0.1, 0, 0.1, 1)`;
            r.style.transform = `translateY(-${stopIdx * 70}px)`;
        }, 50);
    }

    setTimeout(() => {
        isSpinning5 = false;
        if (winAmt > 0) {
            new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/breakzstudios-upbeat-p-170110.mp3').play().catch(()=>{});
            earnAkho(auth.currentUser.uid, winAmt, '5-Reel Win');
            updateWinUI(winAmt);
            setTimeout(updateAllGameBalances, 500);
        }
    }, 4000);
}

// ==========================================
// 6. ნავიგაცია
// ==========================================
function backFromSlots() {
    document.getElementById('burningSlotsContainer').style.display = 'none';
    document.getElementById('gamesList').style.display = 'grid';
}
function backFromSlots5() {
    document.getElementById('burningSlots5Container').style.display = 'none';
    document.getElementById('gamesList').style.display = 'grid';
}
function openBurningSlots() {
    document.getElementById('gamesList').style.display = 'none';
    document.getElementById('burningSlotsContainer').style.display = 'flex';
    updateAllGameBalances();
}
function openBurningSlots5() {
    document.getElementById('gamesList').style.display = 'none';
    document.getElementById('burningSlots5Container').style.display = 'flex';
    updateAllGameBalances();
}     

    















function triggerBurningSpin() {
    if (isSpinningNow) return;
    if (!canAfford(burningStake)) return;

    isSpinningNow = true;
    spendAkho(burningStake, 'Burning Slots Bet');
    
    document.getElementById('slotBalanceVal').innerText = (myAkho - burningStake).toFixed(2);
    document.getElementById('slotWinVal').innerText = "0.00";

    const wrapper = document.getElementById('reelsWrapper');
    const oldLine = document.getElementById('winLine');
    if(oldLine) oldLine.remove();

    new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/u_edtmwfwu7c-pop-331070.mp3').play().catch(()=>{});

    // 1. მოგების დაგეგმვა
    const rand = Math.random();
    let result = [];
    let winAmt = 0;

    if (rand < 0.01) { 
        result = ['7️⃣', '7️⃣', '7️⃣']; 
        winAmt = burningStake * 100;
    } else if (rand < 0.03) {
        let icon = Math.random() < 0.5 ? '🍉' : '🍇';
        result = [icon, icon, icon];
        winAmt = burningStake * 20;
    } else if (rand < 0.06) {
        result = ['🔔', '🔔', '🔔'];
        winAmt = burningStake * 8;
    } else if (rand < 0.12) {
        let fruitIcons = ['🍒', '🍋', '🍇']; 
        let icon = fruitIcons[Math.floor(Math.random() * fruitIcons.length)];
        result = [icon, icon, icon];
        winAmt = burningStake * 4;
    } else if (rand < 0.20) {
        result = ['⭐', burningIcons[Math.floor(Math.random() * burningIcons.length)], '⭐'];
        winAmt = burningStake * 3;
    } else {
        // --- აი აქ გამოსწორდა! ---
        // ვაკეთებთ "უსასრულო" ციკლს, სანამ სამივე განსხვავებულს არ ამოაგდებს
        while(true) {
            result = [
                burningIcons[Math.floor(Math.random() * burningIcons.length)],
                burningIcons[Math.floor(Math.random() * burningIcons.length)],
                burningIcons[Math.floor(Math.random() * burningIcons.length)]
            ];
            // თუ შემთხვევით სამივე დაემთხვა, თავიდან არევს (რომ წაგებისას მოგება არ დაჯდეს)
            if (!(result[0] === result[1] && result[1] === result[2])) break;
        }
        winAmt = 0;
    }

    // 2. რილების ტრიალი (RESET + ფიზიკური შევსება)
    for (let i = 1; i <= 3; i++) {
        const r = document.getElementById('reel_' + i);
        
        // ყოველ ტრიალზე რილს თავიდან ვავსებთ რანდომული ხილით, რომ ტრიალისას სხვადასხვა რამე ჩანდეს
        r.innerHTML = ''; 
        for (let j = 0; j < 50; j++) {
            const s = document.createElement('div');
            s.style = "height:70px; display:flex; align-items:center; justify-content:center; font-size:45px;";
            s.innerText = burningIcons[Math.floor(Math.random() * burningIcons.length)];
            r.appendChild(s);
        }

        r.style.transition = 'none';
        r.style.transform = 'translateY(0)';
        
        const stopIdx = 35;
        r.children[stopIdx].innerText = result[i-1];

        setTimeout(() => {
            const move = stopIdx * 70;
            r.style.transition = `transform ${1.8 + (i * 0.4)}s cubic-bezier(0.2, 0, 0.1, 1)`;
            r.style.transform = `translateY(-${move}px)`;
        }, 50);
    }
    
    
    // 3. გაჩერება და მოგება (მუშა ორიგინალი)
    setTimeout(() => {
        isSpinningNow = false;
        if (winAmt > 0) {
            new Audio('https://raw.githubusercontent.com/jimsher/Emigrantbook/main/breakzstudios-upbeat-p-170110.mp3').play().catch(()=>{});
            
            // ფულის დარიცხვა
            earnAkho(auth.currentUser.uid, winAmt, '3-Reel Win');
            
            // პირდაპირი განახლება 3-იანის ველის
            document.getElementById('slotWinVal').innerText = winAmt.toFixed(2);
            
            // პირდაპირი განახლება ზედა პანელის (იმისთვის რომ იქაც აისახოს)
            if(document.getElementById('slot5WinVal')) {
                document.getElementById('slot5WinVal').innerText = winAmt.toFixed(2);
            }

            // ბალანსის განახლება
            updateAllGameBalances();
        }
    }, 3200);
}

// 3-რილიანი სლოტიდან გამოსვლა
function backFromSlots() {
    const slotContainer = document.getElementById('burningSlotsContainer');
    const gamesList = document.getElementById('gamesList');
    
    if (slotContainer && gamesList) {
        slotContainer.style.display = 'none'; // მალავს 3-იან სლოტს
        gamesList.style.display = 'grid';     // აჩენს მთავარ სიას
    }
}








function triggerBurning5Spin() {
    if (isSpinning5 || !canAfford(burningStake5)) return;

    isSpinning5 = true;
    spendAkho(burningStake5, 'Burning 5 Bet');
    updateAllGameBalances();
    updateWinUI(0);

    const PX = 48; // შენი მოთხოვნილი პატარა ზომა
    let screenSymbols = []; // აქ შევინახავთ 15-ვე სიმბოლოს რაც გამოჩნდება

    for (let i = 1; i <= 5; i++) {
        const r = document.getElementById('reel5_' + i);
        if(!r) continue;

        r.innerHTML = '';
        const stopIdx = 60;
        
        // 1. ვავსებთ რილს რანდომ სიმბოლოებით
        for(let j=0; j < 70; j++) {
            const s = document.createElement('div');
            s.style = `height:${PX}px; min-height:${PX}px; display:flex; align-items:center; justify-content:center; font-size:28px; flex-shrink:0;`;
            s.innerText = slot5Icons[Math.floor(Math.random() * slot5Icons.length)];
            r.appendChild(s);
        }

        // 2. ვიღებთ იმ 3 სიმბოლოს, რომელიც ამ რილზე გამოჩნდება (34-ე, 35-ე, 36-ე)
        // ამას ვაკეთებთ იმისთვის, რომ მერე გადავთვალოთ მოგება
        screenSymbols.push(r.children[stopIdx-1].innerText); // ზედა
        screenSymbols.push(r.children[stopIdx].innerText);   // შუა
        screenSymbols.push(r.children[stopIdx+1].innerText); // ქვედა

        r.style.transition = 'none';
        r.style.transform = 'translateY(0)';

        setTimeout(() => {
            const stopTime = 1.0 + (i * 0.6); // კლასიკური თანმიმდევრული გაჩერება
            r.style.transition = `transform ${stopTime}s cubic-bezier(0.3, 0, 0.2, 1)`;
            r.style.transform = `translateY(-${(stopIdx - 1) * PX}px)`;
        }, 50);
    }

    // 3. მოგების დათვლის ლოგიკა (ეკრანზე გაჩერების შემდეგ)
    setTimeout(() => {
        isSpinning5 = false;
        let winAmt = calculateScatterWin(screenSymbols); // სპეციალური ფუნქცია სათვლელად

        if (winAmt > 0) {
            earnAkho(auth.currentUser.uid, winAmt, 'Scatter Win');
            updateWinUI(winAmt);
            if (winAmt >= 50) startJackpotAnimation(winAmt, "BIG WIN!");
            setTimeout(updateAllGameBalances, 500);
        }
    }, 4500);
}

// 4. მოგებების გადათვლის ფუნქცია (შენი ცხრილის მიხედვით)
function calculateScatterWin(symbols) {
    let counts = {};
    symbols.forEach(s => counts[s] = (counts[s] || 0) + 1);

    let totalWin = 0;

    // ყურძენი 🍇
    if (counts['🍇'] >= 15) totalWin += 50;
    else if (counts['🍇'] >= 7) totalWin += 15;
    else if (counts['🍇'] >= 6) totalWin += 10;

    // ზარი 🔔
    if (counts['🔔'] >= 7) totalWin += 60;
    else if (counts['🔔'] >= 5) totalWin += 10;
    else if (counts['🔔'] >= 3) totalWin += 5;

    // ფორთოხალი 🍊
    if (counts['🍊'] >= 15) totalWin += 500;
    else if (counts['🍊'] >= 7) totalWin += 15;
    else if (counts['🍊'] >= 6) totalWin += 10;

    // საზამთრო 🍉
    if (counts['🍉'] >= 15) totalWin += 700;
    else if (counts['🍉'] >= 9) totalWin += 30;
    else if (counts['🍉'] >= 7) totalWin += 18;
    else if (counts['🍉'] >= 6) totalWin += 15;

    // ბალი 🍒
    if (counts['🍒'] >= 15) totalWin += 50;
    else if (counts['🍒'] >= 9) totalWin += 13;
    else if (counts['🍒'] >= 7) totalWin += 10;
    else if (counts['🍒'] >= 5) totalWin += 5;

    // შვიდიანი 7️⃣
    if (counts['7️⃣'] >= 15) totalWin += 1000; // ჯეკპოტი
    else if (counts['7️⃣'] >= 9) totalWin += 80;
    else if (counts['7️⃣'] >= 7) totalWin += 40;
    else if (counts['7️⃣'] >= 5) totalWin += 10;

    return totalWin;
}

            

    
    






// იძულებითი რეანიმაცია თამაშებისთვის
window.onload = function() {
    if (typeof burningStake === 'undefined') {
        window.burningStake = 0.20; // ძალისძალად გაწერა
    }
    console.log("თამაშების ლოგიკა გადამოწმებულია. Stake: " + window.burningStake);
};

// თუ SPIN-ს აჭერ და მაინც undefined-ს გიწერს, ეს ფუნქცია ჩაანაცვლე
function checkAndFixVariables() {
    if (!window.burningStake) window.burningStake = 0.20;
    if (typeof userBalance === 'undefined') window.userBalance = 0;
}
            
























// ახალი თამაშის გამხსნელი
// თამაშის გახსნა
function openKingOfAkho() {
    document.getElementById('gamesList').style.display = 'none';
    document.getElementById('kingOfAkhoContainer').style.display = 'flex';
    initializeKingGrid(); // საწყისი შევსება
}

// უკან დაბრუნება
function backToGamesListFromKing() {
    document.getElementById('kingOfAkhoContainer').style.display = 'none';
    document.getElementById('gamesList').style.display = 'grid';
}

// ბადის საწყისი შევსება
function initializeKingGrid() {
    const grid = document.getElementById('kingGrid');
    grid.innerHTML = '';
    const icons = ['💎', '👑', '🦁', '💰', '⚡', '🍇'];
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.style = "display:flex; align-items:center; justify-content:center; background:#1a1a1a; border-radius:5px; font-size:25px;";
        cell.innerText = icons[Math.floor(Math.random() * icons.length)];
        grid.appendChild(cell);
    }
}





// --- კონფიგურაცია ---
let kingIcons = ['👑', '🦁', '💎', '💰', '🍇', '🍉', '🔔', '7️⃣'];
let kingStake = 10;
let currentMultiplier = 1;
let isKingSpinning = false;

// ფანჯრის გახსნა
function openKingOfAkho() {
    document.getElementById('gamesList').style.display = 'none';
    document.getElementById('kingOfAkhoContainer').style.display = 'flex';
    initializeKingGrid();
}

// უკან დაბრუნება
function backToGamesListFromKing() {
    if (isKingSpinning) return; // ტრიალის დროს რომ არ დაიხუროს
    document.getElementById('kingOfAkhoContainer').style.display = 'none';
    document.getElementById('gamesList').style.display = 'grid';
}

// ბადის პირველადი შევსება
function initializeKingGrid() {
    const grid = document.getElementById('kingGrid');
    grid.innerHTML = '';
    currentMultiplier = 1;
    updateKingUI();
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'king-cell';
        cell.style = "display:flex; align-items:center; justify-content:center; background:#1a1a1a; border-radius:8px; font-size:32px; border: 1px solid #333;";
        cell.innerText = kingIcons[Math.floor(Math.random() * kingIcons.length)];
        grid.appendChild(cell);
    }
}

function updateKingUI() {
    const multDisplay = document.getElementById('kingMultiplier');
    multDisplay.innerText = `Multiplier: x${currentMultiplier}`;
    if (currentMultiplier > 1) {
        multDisplay.style.transform = "scale(1.2)";
        multDisplay.style.color = "#fff";
        multDisplay.style.background = "#b8860b";
    } else {
        multDisplay.style.transform = "scale(1)";
        multDisplay.style.color = "gold";
        multDisplay.style.background = "rgba(255,215,0,0.1)";
    }
}

// --- თამაშის მთავარი ლოგიკა ---
async function startKingSpin() {
    if (isKingSpinning || !canAfford(kingStake)) return;
    
    isKingSpinning = true;
    currentMultiplier = 1;
    updateKingUI();
    
    spendAkho(kingStake, 'King Of Akho Bet');
    updateAllGameBalances();

    // ჩამოყრის ეფექტი
    await dropNewSymbols();
    // პირველი შემოწმება მოგებაზე
    processRound();
}

async function dropNewSymbols() {
    const cells = document.querySelectorAll('.king-cell');
    for (let i = 0; i < cells.length; i++) {
        cells[i].style.opacity = "0";
        cells[i].style.transform = "translateY(-50px)";
        cells[i].innerText = kingIcons[Math.floor(Math.random() * kingIcons.length)];
        
        setTimeout(() => {
            cells[i].style.transition = "all 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)";
            cells[i].style.opacity = "1";
            cells[i].style.transform = "translateY(0)";
        }, i * 15);
    }
    await new Promise(r => setTimeout(r, 600));
}

function processRound() {
    const cells = document.querySelectorAll('.king-cell');
    let symbolsOnScreen = Array.from(cells).map(c => c.innerText);
    
    let counts = {};
    symbolsOnScreen.forEach(s => counts[s] = (counts[s] || 0) + 1);

    let winningSymbol = null;
    let winCount = 0;

    // ვეძებთ სიმბოლოს, რომელიც 8-ჯერ ან მეტჯერაა
    for (let sym in counts) {
        if (counts[sym] >= 8) {
            winningSymbol = sym;
            winCount = counts[sym];
            break; 
        }
    }

    if (winningSymbol) {
        handleWin(winningSymbol, winCount);
    } else {
        isKingSpinning = false; // მოგებები მორჩა
    }
}

async function handleWin(symbol, count) {
    const cells = document.querySelectorAll('.king-cell');
    // მოგების ფორმულა: (სიმბოლოების რაოდენობა * 0.5) * მამრავლი
    let winAmount = (count * 0.5) * currentMultiplier;

    // 1. აფეთქების ანიმაცია
    cells.forEach(cell => {
        if (cell.innerText === symbol) {
            cell.style.background = "radial-gradient(circle, gold, #b8860b)";
            cell.style.boxShadow = "0 0 20px gold";
            cell.style.transform = "scale(0.5)";
            cell.style.opacity = "0";
        }
    });

    // 2. დარიცხვა
    earnAkho(auth.currentUser.uid, winAmount, 'King Win');
    currentMultiplier++; // მამრავლი იზრდება
    updateKingUI();
    updateAllGameBalances();
    updateWinUI(winAmount);

    // 3. ახალი სიმბოლოების ჩამოყრა აფეთქებულების ნაცვლად
    setTimeout(() => {
        cells.forEach(cell => {
            if (cell.style.opacity === "0") {
                cell.innerText = kingIcons[Math.floor(Math.random() * kingIcons.length)];
                cell.style.opacity = "1";
                cell.style.transform = "scale(1)";
                cell.style.background = "#1a1a1a";
                cell.style.boxShadow = "none";
            }
        });
        // ხელახალი შემოწმება ახალ სიმბოლოებზე (Cascading)
        setTimeout(processRound, 500);
    }, 600);
}
