      // --- 1. ძირითადი კონფიგურაცია და ცვლადები ---
let shoppingCart = [];
const akhoStore = [
    { id: 101, name: "Premium Headset", price: 250, category: "physical", image: "https://cdn-icons-png.flaticon.com/512/27/27130.png", desc: "პროფესიონალური ჟღერადობა და კომფორტი." },
    { id: 102, name: "Smart Watch v2", price: 450, category: "physical", image: "https://cdn-icons-png.flaticon.com/512/610/610116.png", desc: "ჯანმრთელობისა და აქტივობის კონტროლი." },
    { id: 103, name: "Cloud Storage (1TB)", price: 120, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/2906/2906206.png", desc: "უსაფრთხო ადგილი თქვენი ფაილებისთვის." },
    { id: 104, name: "VIP სტატუსი", price: 300, category: "digital", image: "https://cdn-icons-png.flaticon.com/512/2554/2554936.png", desc: "პრიორიტეტული მომსახურება და ბონუსები." }
];

// --- 2. საფულის და ბალანსის მართვა (Critical Core) ---
// შენი არსებული ფუნქციები, რომლებიც Firebase-თან მუშაობს

async function spendAkho(amount, reason) {
    if (!auth.currentUser) return;
    const userRef = db.collection('users').doc(auth.currentUser.uid);
    
    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        const newBalance = doc.data().balance - amount;
        if (newBalance < 0) throw new Error("არასაკმარისი ბალანსი");
        
        transaction.update(userRef, { balance: newBalance });
        // ტრანზაქციების ისტორიაში ჩაწერა
        transaction.set(userRef.collection('history').doc(), {
            amount: -amount,
            reason: reason,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

function updateAllGameBalances() {
    if (!auth.currentUser) return;
    db.collection('users').doc(auth.currentUser.uid).onSnapshot(doc => {
        const bal = doc.data().balance.toFixed(2);
        // ყველა ბალანსის ველის განახლება საიტზე
        const balElements = ['gameBalance', 'shopBalance', 'mainBalance'];
        balElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = bal + " AKHO";
        });
    });
}

// --- 3. მაღაზიის მართვის ლოგიკა ---

function openShopSection() {
    // ვმალავთ სხვა სექციებს
    const sections = ['gamesList', 'wheelGameContainer', 'lottoGameContainer', 'kingOfAkhoContainer'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.getElementById('shopSectionContainer').style.display = 'flex';
    renderStore('all');
}

function backToGamesListFromShop() {
    document.getElementById('shopSectionContainer').style.display = 'none';
    document.getElementById('gamesList').style.display = 'grid';
}

// 1. განახლებული რენდერი - დავამატეთ onclick ბარათზე
function renderStore(category, btn = null) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = category === 'all' ? akhoStore : akhoStore.filter(p => p.category === category);

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card" onclick="showProductDetails(${p.id})" style="background:#111; border:1px solid #333; border-radius:15px; padding:15px; cursor:pointer; transition:0.3s;">
                <div style="height:90px; width:100%; background:url('${p.image}') center/contain no-repeat; margin-bottom:10px;"></div>
                <div style="color:white; font-size:14px; font-weight:bold; margin-bottom:5px;">${p.name}</div>
                <div style="color:var(--gold); font-weight:bold; font-size:16px;">${p.price} AKHO</div>
            </div>
        `;
    });
}

// 2. დეტალების ჩვენება
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

// --- 4. კალათა და გადახდა (E-commerce Core) ---

function addToCart(productId) {
    const product = akhoStore.find(p => p.id === productId);
    shoppingCart.push(product);
    alert(`"${product.name}" დაემატა კალათაში. ჯამში: ${shoppingCart.length} ნივთი.`);
}



async function instantBuy(productId) {
    const product = akhoStore.find(p => p.id === productId);
    
    // ბალანსის შემოწმება
    const balanceText = document.getElementById('gameBalance').innerText;
    const userBalance = parseFloat(balanceText.replace(/[^\d.]/g, '')) || 0;

    if (userBalance < product.price) {
        alert("ბალანსი არ არის საკმარისი ამ ტრანზაქციისთვის.");
        return;
    }

    // ინვოისის დადასტურება
    const confirmMsg = `
        გადახდის დადასტურება
        --------------------
        პროდუქტი: ${product.name}
        ჯამი: ${product.price} AKHO
        
        გსურთ თანხის გადარიცხვა?
    `;

    if (confirm(confirmMsg)) {
        try {
            // რეალური ტრანზაქცია საფულედან
            await spendAkho(product.price, `SHOP_ORDER: ${product.name}`);
            
            // წარმატების შეტყობინება
            alert("გადახდა წარმატებულია! თქვენი შეკვეთა მიღებულია.");
            updateAllGameBalances();
        } catch (error) {
            alert("შეცდომა გადახდისას: " + error.message);
        }
    }
}      









// --- კალათის სისტემა ---
function addToCart(productId) {
    const p = akhoStore.find(item => item.id === productId);
    
    // ვამატებთ კალათაში
    shoppingCart.push(p);
    
    // ციფრის განახლება ღილაკზე
    updateCartCounter();
    
    alert(`✅ ${p.name} დაემატა კალათაში!`);
}

function updateCartCounter() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        badge.innerText = shoppingCart.length;
        badge.style.display = shoppingCart.length > 0 ? 'block' : 'none';
    }
}
// --- რეალური გადახდის ფუნქცია (საფულესთან მიბმული) ---
async function instantBuy(productId) {
    const p = akhoStore.find(item => item.id === productId);
    
    // 1. ბალანსის აღება ელემენტიდან
    const balanceText = document.getElementById('gameBalance').innerText;
    const userBalance = parseFloat(balanceText.replace(/[^\d.]/g, '')) || 0;

    // 2. შემოწმება
    if (userBalance < p.price) {
        alert("❌ ბალანსი არ გაქვს საკმარისი ამ ნივთის საყიდლად!");
        return;
    }

    // 3. ინვოისის დადასტურება
    const confirmPurchase = confirm(`
        გადახდის ინვოისი:
        ------------------
        პროდუქტი: ${p.name}
        თანხა: ${p.price} AKHO
        
        გსურთ გადახდის დადასტურება?
    `);

    if (confirmPurchase) {
        try {
            // 4. რეალური ტრანზაქცია Firebase-ში
            await spendAkho(p.price, `SHOP_ORDER: ${p.name}`);
            
            // 5. წარმატება
            showPurchaseSuccess(p.name);
            closeProductDetails(); // ვხურავთ დეტალების ფანჯარას
            updateAllGameBalances(); // ვანახლებთ ბალანსს ყველგან
            
        } catch (error) {
            console.error("გადახდა ჩაიშალა:", error);
            alert("შეცდომა გადახდისას: " + error.message);
        }
    }
}

// წარმატების ნოტიფიკაცია
function showPurchaseSuccess(productName) {
    const div = document.createElement('div');
    div.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#27ae60; color:white; padding:15px 30px; border-radius:50px; z-index:1000000; font-weight:bold; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:2px solid white;";
    div.innerHTML = `💳 გადახდა წარმატებულია: ${productName}`;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 4000);
}











function openCartView() {
    if (shoppingCart.length === 0) {
        alert("კალათა ცარიელია!");
        return;
    }

    let cartTotal = shoppingCart.reduce((sum, p) => sum + p.price, 0);
    
    let cartHTML = `
        <div style="padding:20px; color:white;">
            <h2 style="color:var(--gold);">შენი კალათა</h2>
            <hr border="1" color="#333">
            ${shoppingCart.map(p => `
                <div style="display:flex; justify-content:space-between; margin:10px 0; border-bottom:1px solid #222; padding-bottom:10px;">
                    <span>${p.name}</span>
                    <span style="color:var(--gold);">${p.price} AKHO</span>
                </div>
            `).join('')}
            <div style="margin-top:20px; font-size:20px; font-weight:bold; display:flex; justify-content:space-between;">
                <span>ჯამი:</span>
                <span style="color:var(--gold);">${cartTotal} AKHO</span>
            </div>
            <button onclick="checkoutCart(${cartTotal})" style="width:100%; padding:15px; background:var(--gold); border:none; border-radius:10px; margin-top:20px; font-weight:bold; cursor:pointer;">ყველას ყიდვა</button>
        </div>
    `;

    // აქ შეგიძლია გამოიყენო იგივე Modal, რაც დეტალებისთვის გვაქვს
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    content.innerHTML = cartHTML;
    modal.style.display = 'flex';
}












function openCartView() {
    if (shoppingCart.length === 0) {
        alert("შენი კალათა ცარიელია!");
        return;
    }

    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    
    let total = shoppingCart.reduce((sum, item) => sum + item.price, 0);

    content.innerHTML = `
        <div style="width: 100%; text-align: left; padding: 10px;">
            <h2 style="color: var(--gold); margin-bottom: 20px;">🛒 შენი კალათა</h2>
            
            <div style="display: flex; flex-direction: column; gap: 15px; max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                ${shoppingCart.map((item, index) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; padding: 12px; border-radius: 10px; border: 1px solid #333;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.image}" style="width: 40px; height: 40px; object-fit: contain;">
                            <span>${item.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="color: var(--gold); font-weight: bold;">${item.price} ₳</span>
                            <span onclick="removeFromCart(${index})" style="color: #ff4d4d; cursor: pointer; font-size: 18px;">✕</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="border-top: 2px solid #333; padding-top: 15px; display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
                <span>ჯამი:</span>
                <span style="color: var(--gold);">${total} AKHO</span>
            </div>

            <button onclick="checkoutFullCart(${total})" style="width: 100%; background: var(--gold); color: black; border: none; padding: 18px; border-radius: 15px; margin-top: 25px; font-weight: bold; font-size: 18px; cursor: pointer; box-shadow: 0 5px 20px rgba(212,175,55,0.3);">გადახდა ეხლავე</button>
        </div>
    `;

    modal.style.display = 'flex';
}

// ნივთის ამოღება კალათიდან
function removeFromCart(index) {
    shoppingCart.splice(index, 1);
    updateCartCounter();
    if (shoppingCart.length > 0) {
        openCartView(); // განვაახლოთ ხედვა
    } else {
        closeProductDetails();
    }
}

// ყველა ნივთის ერთიანად ყიდვა
async function checkoutFullCart(totalAmount) {
    const balanceText = document.getElementById('gameBalance').innerText;
    const userBalance = parseFloat(balanceText.replace(/[^\d.]/g, '')) || 0;

    if (userBalance < totalAmount) {
        alert("ბალანსი არ გყოფნის კალათის სრულად საყიდლად!");
        return;
    }

    if (confirm(`გსურთ გადაიხადოთ ${totalAmount} AKHO ყველა ნივთისთვის?`)) {
        try {
            await spendAkho(totalAmount, `BULK_SHOP_PURCHASE: ${shoppingCart.length} items`);
            alert("✅ გადახდა წარმატებულია! ყველა ნივთი შეძენილია.");
            shoppingCart = []; // ვასუფთავებთ კალათას
            updateCartCounter();
            closeProductDetails();
            updateAllGameBalances();
        } catch (error) {
            alert("შეცდომა გადახდისას: " + error.message);
        }
    }
}
