// --- 1. მონაცემები და ცვლადები ---
let shoppingCart = [];
const akhoStore = [
    { id: 101, name: "Premium Headset", price: 250, category: "physical", image: "https://cdn-icons-png.flaticon.com/512/27/27130.png", desc: "პროფესიონალური ჟღერადობა და კომფორტი." },
    { id: 102, name: "Smart Watch v2", price: 450, category: "physical", image: "https://cdn-icons-png.flaticon.com/512/610/610116.png", desc: "ჯანმრთელობისა და აქტივობის კონტროლი." },
    { id: 103, name: "Cloud Storage (1TB)", price: 120, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/2906/2906206.png", desc: "უსაფრთხო ადგილი თქვენი ფაილებისთვის." },
    { id: 104, name: "VIP სტატუსი", price: 300, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/2554/2554936.png", desc: "პრიორიტეტული მომსახურება და ბონუსები." },
    { id: 105, name: "Akho Hoodie Black", price: 850, category: "physical", image: "https://cdn-icons-png.flaticon.com/512/2354/2354396.png", desc: "ლიმიტირებული გამოცემის ჰუდი Akho-ს ლოგოთი." },
    { id: 106, name: "Mystery Box", price: 500, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/10450/10450146.png", desc: "გახსენი და მოიგე შემთხვევითი პრიზები!" },
    { id: 107, name: "Profile Frame Gold", price: 150, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/4814/4814833.png", desc: "ოქროსფერი ჩარჩო შენი პროფილის სურათისთვის." },
    { id: 108, name: "VIP Elite (Lifetime)", price: 5000, category: "vip", image: "https://cdn-icons-png.flaticon.com/512/2554/2554930.png", desc: "სამუდამო VIP სტატუსი ყველა პრივილეგიით." }
];


// --- 2. მაღაზიის გახსნა და რენდერი ---
function openShopSection() {
    const sections = ['gamesList', 'wheelGameContainer', 'lottoGameContainer', 'kingOfAkhoContainer'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const shop = document.getElementById('shopSectionContainer');
    if (shop) {
        shop.style.display = 'flex';
        renderStore('all');
    }
}

function renderStore(category) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = category === 'all' ? akhoStore : akhoStore.filter(p => p.category === category);

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card" onclick="showProductDetails(${p.id})" style="padding:15px; border-radius:15px; cursor:pointer; display:flex; flex-direction:column; align-items:center;">
                <span style="position:absolute; top:8px; right:8px; font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px;">${p.category}</span>
                
                <div style="height:100px; width:100%; background:url('${p.image}') center/contain no-repeat; margin-bottom:12px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));"></div>
                
                <div style="color:#eee; font-size:14px; font-weight:600; text-align:center; height:34px; line-height:1.2; overflow:hidden;">${p.name}</div>
                
                <div style="margin-top:10px; display:flex; align-items:center; gap:5px;">
                    <span style="color:var(--gold); font-weight:900; font-size:16px;">${p.price}</span>
                    <span style="color:var(--gold); font-size:10px;">AKHO</span>
                </div>
                
                <div style="width:100%; height:2px; background:linear-gradient(90deg, transparent, var(--gold), transparent); margin-top:12px; opacity:0.3;"></div>
            </div>
        `;
    });
}

// --- 3. პროდუქტის დეტალები და მოდალი ---
function showProductDetails(productId) {
    const p = akhoStore.find(item => item.id === productId);
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');

    content.innerHTML = `
        <div style="width:100%; height:250px; background:white url('${p.image}') center/contain no-repeat; border-radius:20px; box-shadow:0 0 30px rgba(212,175,55,0.2);"></div>
        <div style="width:100%; text-align:left; padding:10px;">
            <h1 style="color:white; margin-bottom:10px;">${p.name}</h1>
            <p style="color:#aaa; line-height:1.6; font-size:14px;">${p.desc}</p>
            <div style="margin:20px 0; font-size:24px; color:var(--gold); font-weight:bold;">${p.price} AKHO</div>
        </div>
        <div style="width:100%; display:flex; gap:10px; position:sticky; bottom:0; background:rgba(0,0,0,0.8); padding:10px 0;">
            <button onclick="addToCart(${p.id})" style="flex:1; background:#222; color:white; border:1px solid #444; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer;">კალათაში დამატება</button>
            <button onclick="instantBuy(${p.id})" style="flex:1; background:var(--gold); color:black; border:none; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer;">ყიდვა ეხლავე</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function closeProductDetails() {
    document.getElementById('productDetailsModal').style.display = 'none';
}

// --- 4. კალათის ლოგიკა ---
function addToCart(productId) {
    const p = akhoStore.find(item => item.id === productId);
    shoppingCart.push(p);
    updateCartCounter();
    showPurchaseSuccess(`✅ ${p.name} დაემატა კალათაში!`);
}

function updateCartCounter() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        badge.innerText = shoppingCart.length;
        badge.style.display = shoppingCart.length > 0 ? 'block' : 'none';
    }
}

function removeFromCart(index) {
    shoppingCart.splice(index, 1);
    updateCartCounter();
    if (shoppingCart.length > 0) openCartView();
    else closeProductDetails();
}

// --- 5. ყიდვა და ტრანზაქციები ---
async function instantBuy(productId) {
    const p = akhoStore.find(item => item.id === productId);
    const balanceText = document.getElementById('gameBalance').innerText;
    const userBalance = parseFloat(balanceText.replace(/[^\d.]/g, '')) || 0;
    
    // ... შიგნით instantBuy-ში, წარმატებული spendAkho-ს შემდეგ:
    if (p.category === "vip" || p.name.includes("VIP")) {
    await activateUserVIP();
    }
    if (userBalance < p.price) {
        alert("❌ ბალანსი არ გაქვს საკმარისი!");
        return;
    }

    if (confirm(`გსურთ გადაიხადოთ ${p.price} AKHO ნივთისთვის: ${p.name}?`)) {
        try {
            await spendAkho(p.price, `SHOP_ORDER: ${p.name}`);
            showPurchaseSuccess(`💳 შეძენილია: ${p.name}`);
            closeProductDetails();
            updateAllGameBalances();
        } catch (error) {
            alert("შეცდომა გადახდისას: " + error.message);
        }
    }
}

function openCartView() {
    if (shoppingCart.length === 0) {
        showPurchaseSuccess("❌ კალათა ცარიელია!"); // ლამაზი ნოტიფიკაცია alert-ის ნაცვლად
        return;
    }

    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    let total = shoppingCart.reduce((sum, item) => sum + item.price, 0);

    content.innerHTML = `
        <div style="width: 100%; text-align: left; padding: 10px;">
            <h2 style="color: var(--gold); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-shopping-cart"></i> შენი კალათა
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
                ${shoppingCart.map((item, index) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid #333;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain;">
                            <div>
                                <div style="color: white; font-weight: bold; font-size: 14px;">${item.name}</div>
                                <div style="color: var(--gold); font-size: 12px;">${item.price} AKHO</div>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${index})" style="background: rgba(255,77,77,0.1); color: #ff4d4d; border: none; width: 35px; height: 35px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 25px; background: #111; padding: 20px; border-radius: 15px; border: 1px dashed #444;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="color: #888;">ნივთების რაოდენობა:</span>
                    <span style="color: white; font-weight: bold;">${shoppingCart.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 22px; font-weight: 900;">
                    <span style="color: white;">ჯამი:</span>
                    <span style="color: var(--gold); text-shadow: 0 0 10px rgba(212,175,55,0.3);">${total} AKHO</span>
                </div>
                
                <button onclick="checkoutFullCart(${total})" style="width: 100%; background: linear-gradient(180deg, #d4af37, #b8860b); color: black; border: none; padding: 18px; border-radius: 12px; margin-top: 20px; font-weight: 900; font-size: 18px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.4);">
                    <i class="fas fa-check-circle"></i> გადახდის დადასტურება
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

async function checkoutFullCart(totalAmount) {
    const balanceText = document.getElementById('gameBalance').innerText;
    const userBalance = parseFloat(balanceText.replace(/[^\d.]/g, '')) || 0;

    if (userBalance < totalAmount) {
        alert("ბალანსი არ გყოფნის!");
        return;
    }

    if (confirm(`გადაიხადოთ ${totalAmount} AKHO ყველა ნივთისთვის?`)) {
        try {
            await spendAkho(totalAmount, `BULK_SHOP_PURCHASE: ${shoppingCart.length} items`);
            showPurchaseSuccess("✅ ყველა ნივთი შეძენილია!");
            shoppingCart = [];
            updateCartCounter();
            closeProductDetails();
            updateAllGameBalances();
        } catch (error) {
            alert("შეცდომა: " + error.message);
        }
    }
}

function showPurchaseSuccess(msg) {
    const div = document.createElement('div');
    div.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#27ae60; color:white; padding:15px 30px; border-radius:50px; z-index:1000000; font-weight:bold; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:2px solid white;";
    div.innerHTML = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}



async function activateUserBenefit(productName) {
    if (!auth.currentUser) return;
    const userRef = db.collection('users').doc(auth.currentUser.uid);

    if (productName.includes("VIP")) {
        await userRef.update({
            isVIP: true,
            vipSince: firebase.firestore.FieldValue.serverTimestamp(),
            role: "Premium Member"
        });
        showPurchaseSuccess("🌟 გილოცავთ! თქვენ ახლა VIP წევრი ხართ!");
        // აქ შეგიძლია ჩაამატო ფუნქცია, რომელიც პროფილის UI-ს გადახატავს
        if(typeof updateProfileUI === 'function') updateProfileUI();
    }
}


function openMysteryBox() {
    const prizes = [
        { name: "50 AKHO", value: 50 },
        { name: "200 AKHO", value: 200 },
        { name: "VIP 1 დღით", value: 0 },
        { name: "ჯეკპოტი: 1000 AKHO", value: 1000 }
    ];

    const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
    
    // აქ შეგიძლია გამოიყენო ლამაზი Modal
    alert(`🎁 Mystery Box-იდან ამოვიდა: ${wonPrize.name}!`);
    
    if (wonPrize.value > 0) {
        // აქ დაამატე ბალანსზე თანხის დარიცხვის ფუნქცია
    }
}


async function showOrderHistory() {
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    
    content.innerHTML = `<h2 style="color:var(--gold);">დაელოდე... იტვირთება...</h2>`;
    modal.style.display = 'flex';

    const snapshot = await db.collection('users').doc(auth.currentUser.uid)
        .collection('history')
        .where('reason', '>=', 'SHOP_ORDER')
        .orderBy('reason')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

    let historyHTML = `<h2 style="color:var(--gold); margin-bottom:15px;">ბოლო შესყიდვები</h2>`;
    
    if (snapshot.empty) {
        historyHTML += `<p style="color:gray;">ჯერ არაფერი გიყიდია.</p>`;
    } else {
        snapshot.forEach(doc => {
            const data = doc.data();
            historyHTML += `
                <div style="background:#1a1a1a; padding:10px; border-radius:10px; margin-bottom:8px; border-left:3px solid var(--gold);">
                    <div style="color:white; font-size:14px;">${data.reason.replace('SHOP_ORDER: ', '')}</div>
                    <div style="color:gray; font-size:11px;">${data.timestamp?.toDate().toLocaleString() || 'ახლახანს'}</div>
                </div>
            `;
        });
    }
    content.innerHTML = historyHTML;
}

async function activateUserVIP() {
    if (!auth.currentUser) return;
    const userRef = db.collection('users').doc(auth.currentUser.uid);

    try {
        await userRef.update({
            isVIP: true,
            vipSince: firebase.firestore.FieldValue.serverTimestamp(),
            role: "VIP MEMBER"
        });
        
        // ეგრევე განვაახლოთ UI, რომ მომხმარებელმა შედეგი დაინახოს
        updateProfileUIWithVIP();
        showPurchaseSuccess("👑 გილოცავთ! VIP სტატუსი გააქტიურებულია!");
    } catch (error) {
        console.error("VIP გააქტიურება ჩაიშალა:", error);
    }
}




function updateProfileUIWithVIP() {
    db.collection('users').doc(auth.currentUser.uid).get().then(doc => {
        if (doc.exists && doc.data().isVIP) {
            // 1. ვპოულობთ სახელის ელემენტებს (მაგალითად: profileName, headerName)
            const nameElements = document.querySelectorAll('.user-name-display');
            
            nameElements.forEach(el => {
                el.innerHTML = `
                    ${doc.data().username} 
                    <span class="vip-badge" title="VIP Member">
                        <i class="fas fa-crown"></i>
                    </span>
                `;
                el.style.color = "var(--gold)";
                el.style.textShadow = "0 0 10px rgba(212, 175, 55, 0.5)";
            });
        }
    });
}
