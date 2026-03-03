// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = []; 
let allProductsStore = []; 

// 💶 კურსის კონსტანტა: 10 AKHO = 1 EUR
const AKHO_EXCHANGE_RATE = 0.1; 

// 1. მაღაზიის მართვის პანელის ჩართვა/გამორთვა
function toggleStoreManager() {
    const section = document.getElementById('storeManagerSection');
    if (section) {
        const isOpening = (section.style.display === 'none' || section.style.display === '');
        section.style.display = isOpening ? 'block' : 'none';
        
        if (isOpening) renderAdminProductList();
    }
}

// 2. პროდუქტის ატვირთვა - სრულად გასწორებული
async function saveProductToFirebase() {
    const fileInput = document.getElementById('newProdFile');
    const nameInput = document.getElementById('newProdName');
    const priceInput = document.getElementById('newProdPrice');
    const descInput = document.getElementById('newProdDesc');
    const catInput = document.getElementById('newProdCat');
    const btn = document.getElementById('uploadBtn');

    const file = fileInput ? fileInput.files[0] : null;
    const name = nameInput ? nameInput.value.trim() : "";
    const price = priceInput ? priceInput.value.trim() : "";
    const desc = descInput ? descInput.value.trim() : "";
    const cat = catInput ? catInput.value : "all";

    if (!file || !name || !price) {
        return alert("შეავსე სახელი, ფასი და აირჩიე ფოტო!");
    }

    btn.disabled = true;
    btn.innerText = "იტვირთება...";

    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch("https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67", {
            method: "POST",
            body: formData
        });
        const json = await res.json();

        if (json.success) {
            await db.ref('akhoStore').push({
                name: name,
                price: parseFloat(price),
                desc: desc,
                category: cat,
                image: json.data.url,
                timestamp: Date.now()
            });

            alert("ნივთი დაემატა მაღაზიაში! ✅");
            location.reload();
        }
    } catch (e) {
        alert("შეცდომაა: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "გამოქვეყნება 🚀";
    }
}

// 3. მაღაზიის გახსნა
function openShopSection() {
    const shopContainer = document.getElementById('shopSectionContainer');
    if (shopContainer) shopContainer.style.display = 'flex';

    if (auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2') {
        const adminStore = document.getElementById('adminStorePanel');
        if (adminStore) adminStore.style.display = 'block';
    }
    
    loadUserCart(); 
    renderStore('all');
}

// --- ადმინ პანელში ნივთების სიის გამოჩენა ---
function renderAdminProductList() {
    const listContainer = document.getElementById('adminProductList');
    if (!listContainer) return;

    db.ref('akhoStore').on('value', snap => {
        listContainer.innerHTML = `<h4 style="color:var(--gold); margin-top:20px;">არსებული ნივთები:</h4>`;
        const data = snap.val();
        if (!data) {
            listContainer.innerHTML += `<p style="color:gray; font-size:12px;">მაღაზია ცარიელია</p>`;
            return;
        }

        Object.entries(data).reverse().forEach(([id, item]) => {
            const itemRow = document.createElement('div');
            itemRow.style = "display:flex; align-items:center; justify-content:space-between; background:#222; padding:10px; border-radius:10px; margin-bottom:8px; border:1px solid #333;";
            itemRow.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.image}" style="width:35px; height:35px; border-radius:5px; object-fit:cover;">
                    <div>
                        <b style="color:white; font-size:13px; display:block;">${item.name}</b>
                        <small style="color:var(--gold); font-size:11px;">${item.price} AKHO</small>
                    </div>
                </div>
                <button onclick="deleteProduct('${id}')" style="background:#ff4d4d; border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:11px;">
                    <i class="fas fa-trash"></i> წაშლა
                </button>
            `;
            listContainer.appendChild(itemRow);
        });
    });
}

// 4. კალათის ჩატვირთვა
function loadUserCart() {
    if (!auth.currentUser) return;
    db.ref(`userCarts/${auth.currentUser.uid}`).on('value', snap => {
        const data = snap.val();
        cart = data ? Object.entries(data).map(([key, val]) => ({ cartKey: key, ...val })) : [];
        updateCartBadge();
    });
}

// 5. რენდერი
function renderStore(category = 'all', btnElement = null) {
    // 1. აქტიური ღილაკის ვიზუალი (დიზაინის შენარჩუნება)
    if (btnElement) {
        document.querySelectorAll('.shop-tab').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const container = document.getElementById('storeContainer'); // დარწმუნდი რომ ეს ID გაქვს
    if (!container) return;
    
    container.innerHTML = '<div class="loader">...</div>'; // ჩატვირთვის ეფექტი

    // 2. მონაცემების წამოღება Firebase-დან
    db.collection('store').get().then((querySnapshot) => {
        container.innerHTML = ''; // ვასუფთავებთ კონტეინერს
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const itemId = doc.id;

            // ფილტრაციის ლოგიკა
            if (category === 'all' || item.category === category) {
                const itemEl = document.createElement('div');
                itemEl.className = 'product-card'; // შენი პროდუქტის ბარათის კლასი
                itemEl.innerHTML = `
                    <div style="background: #222; border-radius: 15px; padding: 10px; margin-bottom: 15px; border: 1px solid #333;">
                        <img src="${item.image}" style="width: 100%; border-radius: 10px; height: 150px; object-fit: cover;">
                        <h3 style="color: white; font-size: 16px; margin: 10px 0;">${item.name}</h3>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--gold); font-weight: bold;">${item.price} TOKEN</span>
                            <button onclick="buyItem('${itemId}', ${item.price})" style="background: var(--gold); border: none; padding: 5px 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">ყიდვა</button>
                        </div>
                    </div>
                `;
                container.appendChild(itemEl);
            }
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<p style="color: #555; text-align: center; margin-top: 20px;">ამ კატეგორიაში ნივთები ჯერ არ არის.</p>';
        }
    });
}

// ძებნა
function searchProduct(query) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = "";
    const lowerQuery = query.toLowerCase();
    allProductsStore.forEach(([id, item]) => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
            drawProductCard(id, item, grid);
        }
    });
}

// ბარათი
function drawProductCard(id, item, grid) {
    const card = document.createElement('div');
    card.className = "product-card";
    card.onclick = () => showProductDetails(id); 
    card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative;";
    
    const eurPrice = (item.price * AKHO_EXCHANGE_RATE).toFixed(2);

    card.innerHTML = `
        <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px;"></div>
        <div style="padding:10px 0;">
            <b style="color:white; font-size:14px;">${item.name}</b>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:10px;">
                <div>
                    <span style="color:var(--gold); font-weight:bold; display:block;">${item.price} AKHO</span>
                    <small style="color:gray; font-size:10px;">≈ ${eurPrice} EUR</small>
                </div>
                <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px; color:black;">ნახვა</button>
            </div>
        </div>
        ${auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2' ? `
            <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; top:8px; right:8px; color:white; background:rgba(255,0,0,0.6); padding:8px; border-radius:50%; font-size:12px;"></i>
        ` : ''}
    `;
    grid.appendChild(card);
}

// 6. კალათაში დამატება
function addToCart(id) {
    if (!auth.currentUser) return alert("გაიარეთ ავტორიზაცია!");
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if (item) {
            db.ref(`userCarts/${auth.currentUser.uid}`).push({
                productId: id,
                name: item.name,
                price: item.price,
                image: item.image
            });
            alert(`${item.name} დაემატა კალათაში! 🛒`);
        }
    });
}

function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        badge.innerText = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function removeFromCart(cartKey) {
    if (!auth.currentUser) return;
    db.ref(`userCarts/${auth.currentUser.uid}/${cartKey}`).remove();
    openCartView(); 
}

// 7. კალათის ნახვა
function openCartView() {
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    if (!modal || !content) return;

    if (cart.length === 0) {
        content.innerHTML = `<div style="text-align:center; padding:40px;"><p style="color:gray;">კალათა ცარიელია 🛒</p></div>`;
    } else {
        let total = 0;
        let html = `<h2 style="color:var(--gold); margin-bottom:15px; width:100%;">კალათა</h2>`;
        cart.forEach((item) => {
            total += parseFloat(item.price);
            const itemEurPrice = (item.price * AKHO_EXCHANGE_RATE).toFixed(2);
            html += `
                <div style="width:100%; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:10px;">
                    <img src="${item.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
                    <div style="flex:1; color:white; font-size:13px;">${item.name}</div>
                    <div style="text-align:right;">
                        <div style="color:var(--gold); font-weight:bold; font-size:13px;">${item.price}</div>
                        <small style="color:gray; font-size:9px;">${itemEurPrice} EUR</small>
                    </div>
                    <i class="fas fa-times" onclick="removeFromCart('${item.cartKey}')" style="color:#ff4d4d; cursor:pointer; padding:5px;"></i>
                </div>
            `;
        });
        
        const totalEurPrice = (total * AKHO_EXCHANGE_RATE).toFixed(2);
        html += `<div style="width:100%; border-top:1px solid #333; padding-top:15px; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; color:white; font-weight:bold; margin-bottom:15px;">
                        <span>ჯამი:</span>
                        <div style="text-align:right;">
                            <span style="color:#00ff00; display:block;">${total} AKHO</span>
                            <small style="color:gray; font-weight:normal; font-size:12px;">≈ ${totalEurPrice} EUR</small>
                        </div>
                    </div>
                    <button onclick="openOrderFormFromCart(${total})" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold;">შეკვეთა 🚀</button>
                 </div>`;
        content.innerHTML = html;
    }
    modal.style.display = 'flex';
}

function openOrderFormFromCart(total) {
    currentProduct = { name: `კალათა (${cart.length} ნივთი)`, price: total, isCart: true };
    openOrderForm();
}

// 8. გადახდა AKHO ბალანსით - გასწორებული (არაფერი მოკლებული)
async function processOrderAndPay() {
    const user = auth.currentUser;
    const btn = document.querySelector("#orderFormModal button");
    if (!user) return alert("ავტორიზაცია აუცილებელია!");

    // ყველა ველის წაკითხვა შენი HTML-დან (დავამატე ქვეყანა, ქალაქი, იმეილი)
    const fName = document.getElementById('ordFirstName').value;
    const lName = document.getElementById('ordLastName').value;
    const country = document.getElementById('ordCountry').value;
    const city = document.getElementById('ordCity').value;
    const addr = document.getElementById('ordAddress').value;
    const phone = document.getElementById('ordPhone').value;
    const email = document.getElementById('ordEmail').value;

    if (!fName || !lName || !addr || !phone) return alert("შეავსე აუცილებელი ველები!");

    const totalPrice = parseFloat(currentProduct.price);
    const userRef = db.ref(`users/${user.uid}`);

    try {
        const userSnap = await userRef.once('value');
        const userData = userSnap.val();
        
        // 🛠️ ვიყენებთ 'akho' ველს ბალანსისთვის
        const currentBalance = parseFloat(userData.akho || 0);

        if (currentBalance < totalPrice) return alert(`არ გაქვს საკმარისი AKHO!`);

        if (btn) { btn.disabled = true; btn.innerText = "მუშავდება..."; }

        // 1. ბალანსის ჩამოჭრა (akho ველში)
        await userRef.update({ akho: currentBalance - totalPrice });

        // 2. შეკვეთის შენახვა ისტორიაში (აუცილებლად 'buyerUid' ველით საძიებლად)
        await db.ref('orders').push({
            buyerUid: user.uid,
            buyerName: fName + " " + lName, // აქ სწორად აერთიანებს სახელს და გვარს
            country: country,
            city: city,
            address: addr,
            phone: phone,
            email: email,
            productName: currentProduct.name,
            paidAmount: totalPrice,
            price: totalPrice, // დავამატე მხოლოდ ეს, რომ ადმინ პანელში undefined აღარ ეწეროს
            status: "paid_with_akho",
            timestamp: Date.now()
        });

        if (currentProduct.isCart) {
            await db.ref(`userCarts/${user.uid}`).remove();
        }

        alert("შენაძენი წარმატებულია! ✅ AKHO ჩამოგეჭრა ბალანსიდან.");
        location.reload();

    } catch (e) {
        alert("შეცდომაა: " + e.message);
        if (btn) { btn.disabled = false; btn.innerText = "გადახდა 🚀"; }
    }
}

        

// დეტალები
function showProductDetails(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if (!item) return;
        currentProduct = item; 

        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');
        if (!modal || !content) return;

        const eurPrice = (item.price * AKHO_EXCHANGE_RATE).toFixed(2);

        content.innerHTML = `
            <div style="width:100%; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px; border:1px solid #333;"></div>
            <div style="width:100%; text-align:left; padding: 15px 0;">
                <h1 style="color:white; font-size:22px;">${item.name}</h1>
                <div style="margin-bottom:15px;">
                    <div style="color:var(--gold); font-size:20px; font-weight:bold;">${item.price} AKHO</div>
                    <div style="color:gray; font-size:14px;">≈ ${eurPrice} EUR</div>
                </div>
                <div style="color:#ccc; font-size:14px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #222; white-space: pre-wrap;">
                    ${item.desc || "აღწერა არ არის."}
                </div>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="addToCart('${id}')" style="flex:1; background:rgba(212,175,55,0.1); color:var(--gold); padding:15px; border:1px solid var(--gold); border-radius:12px; font-weight:bold;">კალათაში 🛒</button>
                <button onclick="openOrderForm()" style="flex:2; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold;">ყიდვა 💳</button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

function openOrderForm() {
    const detailsModal = document.getElementById('productDetailsModal');
    const orderModal = document.getElementById('orderFormModal');
    const priceDisplay = document.getElementById('finalPriceDisplay');
    if (detailsModal) detailsModal.style.display = 'none';
    if (orderModal) orderModal.style.display = 'flex';
    if (priceDisplay && currentProduct) {
        const eurPrice = (currentProduct.price * AKHO_EXCHANGE_RATE).toFixed(2);
        priceDisplay.innerHTML = `${currentProduct.price} AKHO <br><small style="font-size:12px; color:gray;">≈ ${eurPrice} EUR</small>`;
    }
}

function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) db.ref(`akhoStore/${id}`).remove();
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) modal.style.display = 'none';
}



// --- 1. მომხმარებლის შეკვეთების ისტორია ---

function renderUserOrderHistory() {
    const user = auth.currentUser;
    // ვიყენებთ შენს ორიგინალ ID-ებს: productDetailsModal და detailsContent
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (!modal || !content) return;

    // ვასუფთავებთ კონტენტს და ვშლით ძველ მონაცემებს
    content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>
                         <div id="ordersLoading" style="color:gray;">იტვირთება...</div>`;
    modal.style.display = 'flex';

    // ვიყენებთ პირდაპირ .once('value')-ს, რომ JS-მა გადაარჩიოს მონაცემები (ინდექსაციის გარეშეც რომ იმუშაოს)
    db.ref('orders').once('value', snap => {
        const data = snap.val();
        const loadingEl = document.getElementById('ordersLoading');
        if (loadingEl) loadingEl.remove();

        if (!data) {
            content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>
                                 <p style="color:gray; text-align:center; padding:20px;">შეკვეთების ისტორია ცარიელია.</p>`;
            return;
        }

        let ordersHtml = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>`;
        let hasOrders = false;

        // ვამოწმებთ ყველა შეკვეთას
        Object.values(data).reverse().forEach(order => {
            // აქ არის მთავარი: ვამოწმებთ ორივე ვარიანტს, buyerUid-საც და uid-საც
            if (order.buyerUid === user.uid || order.uid === user.uid) {
                hasOrders = true;
                const date = new Date(order.timestamp).toLocaleDateString();
                
                // 🛠️ დამატებული ლოგიკა undefined-ის ასაცილებლად:
                // თუ paidAmount არ არსებობს, აიღებს price-ს, თუ არც ის - მაშინ 0-ს.
                const finalAmount = order.paidAmount || order.price || 0;
                
                // ვიყენებთ შენს სტილს და ცვლადებს (finalAmount, productName)
                ordersHtml += `
                    <div style="width:100%; background:rgba(255,255,255,0.05); border:1px solid #222; border-radius:12px; padding:15px; margin-bottom:12px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <b style="color:white; font-size:14px;">${order.productName || 'ნივთი'}</b>
                            <span style="color:gray; font-size:12px;">${date}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="color:var(--gold); font-weight:bold; display:block;">${finalAmount} AKHO</span>
                                <small style="color:gray; font-size:10px;">≈ ${(finalAmount * 0.1).toFixed(2)} EUR</small>
                            </div>
                            <span style="background:rgba(212,175,55,0.1); color:var(--gold); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold; border:1px solid var(--gold)">
                                ${order.status === 'paid_with_akho' ? 'მუშავდება' : 'დასრულებულია'}
                            </span>
                        </div>
                    </div>`;
            }
        });

        if (!hasOrders) {
            content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>
                                 <p style="color:gray; text-align:center; padding:20px;">თქვენი შეკვეთები ვერ მოიძებნა.</p>`;
        } else {
            content.innerHTML = ordersHtml;
        }
    });
}



// --- 2. ადმინისთვის შეკვეთების ნახვა ---
// --- 2. ადმინისთვის შეკვეთების ნახვა (სრული ინფორმაციით) ---
function renderAdminOrders() {
    const listContainer = document.getElementById('ordersList'); 
    if (!listContainer) return;

    db.ref('orders').on('value', snap => {
        const data = snap.val();
        
        if (!data) {
            listContainer.innerHTML = `<p style="color:gray; font-size:12px;">შეკვეთები არ არის...</p>`;
            return;
        }

        listContainer.innerHTML = "";
        
        Object.entries(data).reverse().forEach(([id, order]) => {
            const date = new Date(order.timestamp).toLocaleDateString();
            const finalAmount = order.paidAmount || order.price || 0;
            const fullName = order.buyerName || (order.firstName ? (order.firstName + " " + (order.lastName || "")) : "უცნობი მყიდველი");
            
            // ვაწყობთ სრულ მისამართს: ქვეყანა, ქალაქი, მისამართი
            const fullLocation = `${order.country || ''} ${order.city || ''}, ${order.address || '-'}`;

            listContainer.innerHTML += `
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #333; text-align:left; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <b style="color:var(--gold); font-size:14px;">📦 ${order.productName || 'ნივთი'}</b>
                        <span style="color:gray; font-size:11px;">${date}</span>
                    </div>
                    
                    <div style="color:white; font-size:13px; margin-bottom:5px;">👤 მყიდველი: ${fullName}</div>
                    <div style="color:#ccc; font-size:12px; margin-bottom:3px;">📧 მეილი: ${order.email || '-'}</div>
                    <div style="color:#ccc; font-size:12px; margin-bottom:3px;">📞 ტელ: ${order.phone || '-'}</div>
                    <div style="color:#ccc; font-size:12px; margin-bottom:12px;">📍 მისამართი: ${fullLocation}</div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:10px;">
                        <b style="color:#00ff00; font-size:15px;">${finalAmount} AKHO</b>
                        
                        <div style="display:flex; gap:8px;">
                            ${order.status === 'paid_with_akho' ? 
                                `<button onclick="updateOrderStatus('${id}', 'delivered')" style="background:var(--gold); border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:bold; color:black; cursor:pointer;">ჩაბარება ✅</button>` : 
                                `<span style="color:#4ade80; font-size:11px; font-weight:bold;">ჩაბარებულია</span>`
                            }
                            <i class="fas fa-trash-alt" onclick="if(confirm('წაიშალოს?')) db.ref('orders/${id}').remove()" style="color:#ff4d4d; cursor:pointer; padding:5px;"></i>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}
// სტატუსის განახლება
function updateOrderStatus(orderId, newStatus) {
    db.ref(`orders/${orderId}`).update({ status: newStatus })
      .then(() => alert("სტატუსი განახლდა! ✅"))
      .catch(err => alert("შეცდომა: " + err.message));
}











