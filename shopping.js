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
        
        if (isOpening) 
        renderAdminProductList();
        renderAdminOrders(); // შეკვეთების სია
        loadAdminDashboardStats(); // 👈 აი ეს დაამატე აქ!
    }
}

// 2. პროდუქტის ატვირთვა - სრულად გასწორებული
async function saveProductToFirebase() {
    const fileInput = document.getElementById('newProdFile');
    const nameInput = document.getElementById('newProdName');
    const priceInput = document.getElementById('newProdPrice');
    const oldPriceInput = document.getElementById('newProdOldPrice');
    const isNewInput = document.getElementById('newProdIsNew');
    const isHotInput = document.getElementById('newProdIsHot');
    
    // --- აი ეს ორი ახალი ინფუთი ---
    const locationInput = document.getElementById('newProdLocation');
    const etaInput = document.getElementById('newProdETA');

    const descInput = document.getElementById('newProdDesc');
    const catInput = document.getElementById('newProdCat');
    const btn = document.getElementById('uploadBtn');

    const file = fileInput ? fileInput.files[0] : null;
    const name = nameInput ? nameInput.value.trim() : "";
    const price = priceInput ? priceInput.value.trim() : "";
    const oldPrice = oldPriceInput ? oldPriceInput.value.trim() : "";
    const desc = descInput ? descInput.value.trim() : "";
    const cat = catInput ? catInput.value : "all";
    
    // ახალი მნიშვნელობების წაკითხვა
    const locationVal = locationInput ? locationInput.value.trim() : "";
    const etaVal = etaInput ? etaInput.value.trim() : "";
    const isNew = isNewInput ? isNewInput.checked : false;
    const isHot = isHotInput ? isHotInput.checked : false;

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
            const productData = {
                name: name,
                price: parseFloat(price),
                desc: desc,
                category: cat,
                image: json.data.url,
                timestamp: Date.now(),
                isNew: isNew,
                isHot: isHot,
                location: locationVal, // ბაზაში იწერება ქვეყანა
                eta: etaVal           // ბაზაში იწერება დრო
            };

            if (oldPrice) {
                productData.oldPrice = parseFloat(oldPrice);
            }

            await db.ref('akhoStore').push(productData);

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


// ეს ფუნქცია აკლია შენს კოდს, რომ ღილაკმა "კალათაში 🛒" იმოქმედოს
function addToCart(productId) {
    if (!auth.currentUser) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");

    // ვიღებთ ნივთის მონაცემებს ბაზიდან
    db.ref(`akhoStore/${productId}`).once('value', snap => {
        const item = snap.val();
        if (item) {
            // ვამატებთ მომხმარებლის კალათაში Firebase-ში
            db.ref(`userCarts/${auth.currentUser.uid}`).push({
                name: item.name,
                price: item.price,
                image: item.image,
                addedAt: Date.now()
            }).then(() => {
                alert("დაემატა კალათაში! 🛒");
            });
        }
    });
}


// 5. რენდერი
function renderStore(category = 'all', btn = null) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (btn) {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    }

    db.ref('akhoStore').on('value', snap => {
        grid.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        allProductsStore = Object.entries(data).reverse();

        allProductsStore.forEach(([id, item]) => {
            if (category !== 'all' && item.category !== category) return;
            drawProductCard(id, item, grid);
        });
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
    // ბარათი - სრულად გასწორებული, რომ გული აუცილებლად გამოჩნდეს
function drawProductCard(id, item, grid) {
    const card = document.createElement('div');
    card.className = "product-card";
    card.onclick = () => showProductDetails(id); 
    card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative; overflow:visible;";
    
    const eurPrice = (item.price * AKHO_EXCHANGE_RATE).toFixed(2);

    let badge = "";
    let priceDisplay = `
        <span style="color:var(--gold); font-weight:bold; display:block;">${item.price} AKHO</span>
        <small style="color:gray; font-size:10px;">≈ ${eurPrice} EUR</small>
    `;

    if (item.oldPrice && item.oldPrice > item.price) {
        badge = `<div style="position:absolute; top:8px; left:8px; background:#ff4d4d; color:white; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:bold; z-index:15; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">SALE</div>`;
        const oldEurPrice = (item.oldPrice * AKHO_EXCHANGE_RATE).toFixed(2);
        priceDisplay = `
            <div style="display:flex; flex-direction:column;">
                <span style="color:#666; text-decoration:line-through; font-size:11px;">${item.oldPrice} AKHO</span>
                <span style="color:var(--gold); font-weight:bold; display:block; font-size:15px;">${item.price} AKHO</span>
            </div>
        `;
    } else if (item.isNew) {
        badge = `<div style="position:absolute; top:8px; left:8px; background:#007bff; color:white; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:bold; z-index:15;">NEW</div>`;
    } else if (item.isHot) {
        badge = `<div style="position:absolute; top:8px; left:8px; background:#ff9800; color:white; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:bold; z-index:15;">🔥 HOT</div>`;
    }

    // --- ❤️ Wishlist ლოგიკა (გასწორებული ხილვადობა) ---
    const wishlistBtn = `
        <div onclick="event.stopPropagation(); toggleWishlist('${id}', this.querySelector('i'))" 
             style="position:absolute; top:10px; right:10px; z-index:1001; background:rgba(0,0,0,0.7); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.2); backdrop-filter:blur(5px);">
            <i class="fas fa-heart" 
               id="wish_${id}"
               style="color:rgba(255,255,255,0.4); font-size:16px; transition:0.3s; cursor:pointer;">
            </i>
        </div>
    `;

    card.innerHTML = `
        ${badge}
        ${wishlistBtn}
        <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px; position:relative; z-index:1;"></div>
        <div style="padding:10px 0; position:relative; z-index:2;">
            <b style="color:white; font-size:14px; display:block; height:18px; overflow:hidden;">${item.name}</b>
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
                <div>${priceDisplay}</div>
                <button style="background:var(--gold); border:none; padding:6px 14px; border-radius:8px; font-weight:bold; font-size:11px; color:black; cursor:pointer;">ნახვა</button>
            </div>
        </div>
        ${auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2' ? `
            <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; bottom:10px; right:10px; color:white; background:rgba(255,0,0,0.8); padding:8px; border-radius:50%; font-size:12px; z-index:20;"></i>
        ` : ''}
    `;

    if (auth.currentUser) {
        db.ref(`userWishlists/${auth.currentUser.uid}/${id}`).once('value', snap => {
            if (snap.exists()) {
                setTimeout(() => {
                    const heartIcon = document.getElementById(`wish_${id}`);
                    if (heartIcon) heartIcon.style.color = "#ff4d4d";
                }, 200);
            }
        });
    }

    grid.appendChild(card);
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
        let html = `<h2 style="color:var(--gold); margin-bottom:15px; width:100%;">კალათა</h2>`;
        
        cart.forEach((item, index) => {
            const itemEurPrice = (item.price * AKHO_EXCHANGE_RATE).toFixed(2);
            html += `
                <div style="width:100%; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:10px;">
                    <input type="checkbox" class="cart-item-checkbox" data-index="${index}" onchange="calculateSelectedTotal()" checked 
                           style="width: 18px; height: 18px; accent-color: var(--gold); cursor: pointer;">
                    
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
        
        html += `<div style="width:100%; border-top:1px solid #333; padding-top:15px; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; color:white; font-weight:bold; margin-bottom:15px;">
                        <span>ჯამი:</span>
                        <div style="text-align:right;">
                            <span id="cartSelectedTotal" style="color:#00ff00; display:block; font-size:18px;">0 AKHO</span>
                            <small id="cartSelectedTotalEur" style="color:gray; font-weight:normal; font-size:12px;">≈ 0.00 EUR</small>
                        </div>
                    </div>
                    <button id="cartOrderBtn" onclick="checkoutSelectedItems()" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">შეკვეთა 🚀</button>
                 </div>`;
        
        content.innerHTML = html;
        // გამოძახება, რომ საწყისი ჯამი დაითვალოს
        calculateSelectedTotal();
    }
    modal.style.display = 'flex';
}

// 🧮 ახალი დამხმარე ფუნქცია მონიშნულების დასათვლელად
function calculateSelectedTotal() {
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    let total = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const index = cb.getAttribute('data-index');
            total += parseFloat(cart[index].price);
        }
    });

    const totalEurPrice = (total * AKHO_EXCHANGE_RATE).toFixed(2);
    
    const totalDisplay = document.getElementById('cartSelectedTotal');
    const eurDisplay = document.getElementById('cartSelectedTotalEur');
    
    if (totalDisplay) totalDisplay.innerText = `${total} AKHO`;
    if (eurDisplay) eurDisplay.innerText = `≈ ${totalEurPrice} EUR`;
    
    return total;
}

// 🛒 მონიშნული ნივთების მომზადება საყიდლად
function checkoutSelectedItems() {
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    let selectedItems = [];
    let total = 0;

    checkboxes.forEach(cb => {
        if (cb.checked) {
            const index = cb.getAttribute('data-index');
            selectedItems.push(cart[index]);
            total += parseFloat(cart[index].price);
        }
    });

    if (selectedItems.length === 0) return alert("გთხოვთ მონიშნოთ მინიმუმ ერთი ნივთი!");

    // შენი ორიგინალი ფუნქციის ლოგიკა, ოღონდ მონიშნულებზე
    openOrderFormFromCart(total, selectedItems.length);
}

// 💳 შენი ორიგინალი ფუნქცია (ოდნავ განახლებული მონიშნულებისთვის)
function openOrderFormFromCart(total, count) {
    currentProduct = { 
        name: `კალათა (${count} ნივთი)`, 
        price: total, 
        isCart: true 
    };
    openOrderForm();
}

// 8. გადახდა AKHO ბალანსით - გასწორებული (არაფერი მოკლებული)
async function processOrderAndPay() {
    const user = auth.currentUser;
    const btn = document.querySelector("#orderFormModal button");
    if (!user) return alert("ავტორიზაცია აუცილებელია!");

    // ყველა ველის წაკითხვა შენი HTML-დან (ქვეყანა, ქალაქი, იმეილი)
    const fName = document.getElementById('ordFirstName').value;
    const lName = document.getElementById('ordLastName').value;
    const country = document.getElementById('ordCountry').value;
    const city = document.getElementById('ordCity').value;
    const addr = document.getElementById('ordAddress').value;
    const phone = document.getElementById('ordPhone').value;
    const email = document.getElementById('ordEmail').value;

    if (!fName || !lName || !addr || !phone) return alert("შეავსე აუცილებელი ველები!");

    // თუ ფასდაკლება გვაქვს, ვიყენებთ ფინალურ ფასს, თუ არა - ჩვეულებრივს
    const totalPrice = currentProduct.finalPrice || parseFloat(currentProduct.price);
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

        // 2. შეკვეთის შენახვა ისტორიაში
        await db.ref('orders').push({
            buyerUid: user.uid,
            buyerName: fName + " " + lName,
            country: country,
            city: city,
            address: addr,
            phone: phone,
            email: email,
            productName: currentProduct.name,
            paidAmount: totalPrice,
            price: totalPrice,
            status: "paid_with_akho",
            timestamp: Date.now()
        });

        if (currentProduct.isCart) {
            await db.ref(`userCarts/${user.uid}`).remove();
        }

        // --- 📱 WhatsApp შეტყობინების გაგზავნა (ახალი ნაწილი) ---
        const myAdminNumber = "+393791861909"; // 👈 აქ ჩაწერე შენი ნომერი (მაგ: 995599123456)
        const waMessage = `🚀 ახალი შეკვეთა Emigrantbook-დან!
📦 ნივთი: ${currentProduct.name}
💰 გადახდილია: ${totalPrice} AKHO
👤 მყიდველი: ${fName} ${lName}
📞 ტელ: ${phone}
📍 მისამართი: ${country}, ${city}, ${addr}`;
        
        
// ... (ბმულის მომზადება)
const whatsappUrl = `https://wa.me/${myAdminNumber}?text=${encodeURIComponent(waMessage)}`;

// გადავაწოდოთ ლინკი ანიმაციას
showSuccessAnimation(whatsappUrl);

        
        // ანიმაციის პარალელურად გავხსნათ WhatsApp (მცირე დაგვიანებით)



        

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

        // --- ნივთის მდებარეობის და მიწოდების ინფორმაცია (Shopping Mode) ---
        let trackingHTML = "";
        if (item.location || item.eta) {
            trackingHTML = `
                <div style="margin: 20px 0; background: rgba(255,255,255,0.03); border: 1px solid #222; padding: 15px; border-radius: 15px; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(212,175,55,0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--gold); font-size: 20px;">
                        <i class="fas fa-globe-europe"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">მარაგის მდებარეობა</span>
                            <span style="background: var(--gold); color: black; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">AVAILABLE</span>
                        </div>
                        <div style="color: white; font-size: 14px; font-weight: bold; margin-top: 2px;">
                            ${item.location || 'მითითებული არ არის'}
                        </div>
                        <div style="color: #4ade80; font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-shipping-fast" style="font-size: 10px;"></i> 
                            მიწოდების დრო: <b>15 დღე</b>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- ⏳ ახალი ფუნქცია: ფასდაკლების ტაიმერი (მხოლოდ SALE ნივთებისთვის) ---
        let timerHTML = "";
        if (item.oldPrice && item.oldPrice > item.price) {
            timerHTML = `
                <div class="offer-timer">
                    <div style="color: #ff4d4d; font-size: 18px;"><i class="fas fa-clock"></i></div>
                    <div style="text-align: left;">
                        <div style="color: #eee; font-size: 11px; font-weight: bold;">აქცია მთავრდება:</div>
                        <div id="countdownDisplay" style="display: flex; gap: 8px; margin-top: 4px;">
                            <div class="timer-unit"><span class="timer-num" id="t-hours">00</span><span class="timer-label">სთ</span></div>
                            <div style="color:var(--gold); font-weight:bold;">:</div>
                            <div class="timer-unit"><span class="timer-num" id="t-mins">00</span><span class="timer-label">წთ</span></div>
                            <div style="color:var(--gold); font-weight:bold;">:</div>
                            <div class="timer-unit"><span class="timer-num" id="t-secs">00</span><span class="timer-label">წმ</span></div>
                        </div>
                    </div>
                </div>
            `;
            // ვუშვებთ ტაიმერს მცირე დაგვიანებით, რომ HTML-მა ჩახატვა მოასწროს
            setTimeout(startCountdown, 100);
        }

        content.innerHTML = `
            <div style="width:100%; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px; border:1px solid #333;"></div>
            <div style="width:100%; text-align:left; padding: 15px 0;">
                <h1 style="color:white; font-size:22px;">${item.name}</h1>
                <div style="margin-bottom:15px;">
                    <div style="color:var(--gold); font-size:20px; font-weight:bold;">${item.price} AKHO</div>
                    <div style="color:gray; font-size:14px;">≈ ${eurPrice} EUR</div>
                </div>

                ${trackingHTML}
                ${timerHTML}

                <div style="color:#ccc; font-size:14px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #222; white-space: pre-wrap;">
                    ${item.desc || "აღწერა არ არის."}
                </div>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="addToCart('${id}')" style="flex:1; background:rgba(212,175,55,0.1); color:var(--gold); padding:15px; border:1px solid var(--gold); border-radius:12px; font-weight:bold;">კალათაში 🛒</button>
                <button onclick="openOrderForm()" style="flex:2; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold;">ყიდვა 💳</button>
            </div>

           <div class="reviews-container">
                <h3 style="color:white; font-size:16px; margin-bottom:15px;">გამოხმაურებები ⭐</h3>
                
                <div class="review-input-area">
                    <div style="display:flex; gap:10px; margin-bottom:15px;" id="starSelector">
                        <i class="fas fa-star star-select active" onclick="setRating(1)"></i>
                        <i class="fas fa-star star-select active" onclick="setRating(2)"></i>
                        <i class="fas fa-star star-select active" onclick="setRating(3)"></i>
                        <i class="fas fa-star star-select active" onclick="setRating(4)"></i>
                        <i class="fas fa-star star-select active" onclick="setRating(5)"></i>
                    </div>
                    <textarea id="reviewText" class="auth-input" placeholder="დაწერეთ თქვენი აზრი..." style="height:60px; margin-bottom:10px; padding:10px;"></textarea>
                    <button onclick="submitReview('${id}')" style="width:100%; background:var(--gold); color:black; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">გაგზავნა 📝</button>
                </div>

                <div id="reviewsList" style="width:100%;">იტვირთება გამოხმაურებები...</div>
            </div>

        `;
        modal.style.display = 'flex';
        // მნიშვნელოვანი: ამას ვიძახებთ მას შემდეგ, რაც HTML ჩაიხატა
        loadProductReviews(id);
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
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>
                         <div id="ordersLoading" style="color:gray;">იტვირთება...</div>`;

    // 🛠️ ვთიშავთ ძველ კავშირს და ვამყარებთ ახალს რეალურ დროში
    db.ref('orders').off(); 
    db.ref('orders').on('value', snap => {
        const data = snap.val();
        
        // საწყისი სათაური
        let ordersHtml = `<h2 style="color:var(--gold); margin-bottom:20px; width:100%;">ჩემი შეკვეთები 📦</h2>`;
        let hasOrders = false;

        if (!data) {
            content.innerHTML = ordersHtml + `<p style="color:gray; text-align:center; padding:20px;">შეკვეთების ისტორია ცარიელია.</p>`;
            return;
        }

        // --- ⭐ VIP სტატუსის და პირადი კოდის გამოჩენა ---
// ვეძებთ კუპონს, რომელიც ამ მომხმარებლის სახელზეა (მაგ: "გიორგი ბერიძე")
db.ref('promoCodes').once('value', pSnap => {
    const allCodes = pSnap.val();
    const userName = auth.currentUser.displayName; // მომხმარებლის სახელი
    
    let userSpecialCode = "LOYALVIP10"; // სტანდარტული კოდი
    let userDiscount = 10;

    if (allCodes) {
        Object.values(allCodes).forEach(c => {
            if (c.forUser === userName) {
                // თუ ვიპოვეთ კოდი, რომელიც სპეციალურად ამ მომხმარებლისთვისაა
                userSpecialCode = Object.keys(allCodes).find(key => allCodes[key] === c);
                userDiscount = c.discount;
            }
        });
    }

    // აი აქ უკვე გამოჩნდება VIP ბარათი იმ კოდით, რომელიც შენ შექმენი
    ordersHtml += `
        <div class="vip-status-card">
            <div class="vip-badge">👑 VIP სტატუსი</div>
            <div style="color:white; font-size:14px;">თქვენი პირადი კუპონია:</div>
            <div class="vip-promo-box">
                <b style="color:var(--gold); font-size:18px;">${userSpecialCode}</b>
                <span style="color:#00ff00;">-${userDiscount}%</span>
            </div>
        </div>
    `;
});

        // მონაცემების გადარჩევა (შენი ორიგინალი ციკლი)
        Object.values(data).reverse().forEach(order => {
            if (order.buyerUid === user.uid || order.uid === user.uid) {
                hasOrders = true;
                const date = new Date(order.timestamp).toLocaleDateString();
                const finalAmount = order.paidAmount || order.price || 0;

                // --- სტატუსის და პროგრესის ლოგიკა ---
                let progress = "20%"; 
                let statusLabel = "მუშავდება";
                
                // დინამიური ტექსტები მდებარეობის და ETA-სთვის
                let displayLocation = order.location || 'მუშავდება';
                let displayETA = order.eta || 'მოწმდება';
                
                if (order.status === 'shipped') { 
                    progress = "60%"; 
                    statusLabel = "გზაშია"; 
                } else if (order.status === 'arrived' || order.status === 'completed' || order.status === 'delivered') { 
                    progress = "100%"; 
                    statusLabel = "ჩამოვიდა"; 
                    
                    // თუ ჩამოვიდა და ადმინს არაფერი ჩაუწერია, ვაჩვენოთ "ადგილზეა"
                    if (!order.location) displayLocation = "ადგილზეა ✅";
                    if (!order.eta) displayETA = "მზად არის ჩასაბარებლად";
                }

                ordersHtml += `
                    <div style="width:100%; background:rgba(255,255,255,0.05); border:1px solid #222; border-radius:12px; padding:15px; margin-bottom:12px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <b style="color:white; font-size:14px;">${order.productName || 'ნივთი'}</b>
                            <span style="color:gray; font-size:12px;">${date}</span>
                        </div>

                        <div style="margin: 15px 0 10px 0;">
                            <div style="height:4px; width:100%; background:#222; border-radius:10px; position:relative;">
                                <div style="height:100%; width:${progress}; background:var(--gold); border-radius:10px; transition:1s ease-in-out;"></div>
                                <div style="position:absolute; top:-4px; left:0; width:12px; height:12px; background:var(--gold); border-radius:50%;"></div>
                                <div style="position:absolute; top:-4px; left:50%; width:12px; height:12px; background:${(order.status === 'shipped' || order.status === 'arrived' || order.status === 'delivered') ? 'var(--gold)' : '#333'}; border-radius:50%;"></div>
                                <div style="position:absolute; top:-4px; right:0; width:12px; height:12px; background:${(order.status === 'arrived' || order.status === 'delivered') ? 'var(--gold)' : '#333'}; border-radius:50%;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; color:#555; font-size:9px; margin-top:8px; font-weight:bold; text-transform:uppercase;">
                                <span>მიღებულია</span>
                                <span>გზაშია</span>
                                <span>ჩაბარდა</span>
                            </div>
                        </div>

                        <div style="background:rgba(255,215,0,0.03); border:1px solid #333; border-radius:8px; padding:8px; margin:10px 0; display:flex; flex-direction:column; gap:4px;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:#777; font-size:11px;">📍 მდებარეობა:</span>
                                <b style="color:white; font-size:11px;">${displayLocation}</b>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:#777; font-size:11px;">⏳ ETA:</span>
                                <b style="color:var(--gold); font-size:11px;">${displayETA}</b>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
                            <div>
                                <span style="color:var(--gold); font-weight:bold; display:block;">${finalAmount} AKHO</span>
                                <small style="color:gray; font-size:10px;">≈ ${(finalAmount * 0.1).toFixed(2)} EUR</small>
                            </div>
                            <div style="text-align:right;">
                                <span style="background:rgba(212,175,55,0.1); color:var(--gold); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold; border:1px solid var(--gold)">
                                    ${statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>`;
            }
        });

        // საბოლოო ჩახატვა
        if (!hasOrders) {
            content.innerHTML = ordersHtml + `<p style="color:gray; text-align:center; padding:20px;">თქვენი შეკვეთები ვერ მოიძებნა.</p>`;
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
                    
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="text" id="loc_${id}" placeholder="მდებარეობა" value="${order.location || ''}" style="flex:1; background:#222; border:1px solid #444; color:white; font-size:11px; padding:5px; border-radius:5px;">
                        <input type="text" id="eta_${id}" placeholder="ETA დრო" value="${order.eta || ''}" style="flex:1; background:#222; border:1px solid #444; color:white; font-size:11px; padding:5px; border-radius:5px;">
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:10px;">
                        <b style="color:#00ff00; font-size:15px;">${finalAmount} AKHO</b>
                        
                        <div style="display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end;">
                            <button onclick="updateOrderStatus('${id}', 'shipped')" style="background:#222; border:1px solid var(--gold); padding:5px 8px; border-radius:6px; font-size:10px; color:var(--gold); cursor:pointer;">🚚 გზაშია</button>
                            
                            <button onclick="updateOrderStatus('${id}', 'arrived')" style="background:var(--gold); border:none; padding:5px 8px; border-radius:6px; font-size:10px; font-weight:bold; color:black; cursor:pointer;">✅ ჩამოვიდა</button>
                            
                            <i class="fas fa-trash-alt" onclick="if(confirm('წაიშალოს?')) db.ref('orders/${id}').remove()" style="color:#ff4d4d; cursor:pointer; padding:5px; margin-left:5px;"></i>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}


function updateOrderStatus(orderId, newStatus) {
    // ვიღებთ მნიშვნელობებს კონკრეტული შეკვეთის ინფუთებიდან
    const locationVal = document.getElementById(`loc_${orderId}`).value;
    const etaVal = document.getElementById(`eta_${orderId}`).value;

    db.ref(`orders/${orderId}`).update({ 
        status: newStatus,
        location: locationVal,
        eta: etaVal
    })
    .then(() => alert("სტატუსი და გზავნილის ინფორმაცია განახლდა! ✅"))
    .catch(err => alert("შეცდომა: " + err.message));
}
















// --- ყიდვის დროს ანიმაციის ფუნქცია ---
function showSuccessAnimation(whatsappUrl) {
    const successDiv = document.createElement('div');
    successDiv.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 20000;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        animation: fadeIn 0.5s ease;
    `;

    successDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="width: 80px; height: 80px; background: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px var(--gold);">
                <i class="fas fa-check" style="font-size: 40px; color: black;"></i>
            </div>
            <h2 style="color: white; font-size: 24px; margin-bottom: 10px;">შეკვეთა მიღებულია!</h2>
            <p style="color: gray; font-size: 14px; margin-bottom: 25px;">თქვენი ნივთი უკვე მუშავდება 🚀</p>
            
            <a href="${whatsappUrl}" target="_blank" 
               style="display: inline-flex; align-items: center; gap: 10px; background: #25D366; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
                <i class="fab fa-whatsapp" style="font-size: 18px;"></i>
                დაადასტურეთ WhatsApp-ით
            </a>
            <p style="color: #555; font-size: 10px; margin-top: 15px;">დააჭირეთ ღილაკს შეტყობინების გასაგზავნად</p>
        </div>
    `;

    document.body.appendChild(successDiv);

    // დროს ცოტა მოვუმატე (5 წამამდე), რომ მომხმარებელმა ღილაკზე დაჭერა მოასწროს
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transition = '1s';
        setTimeout(() => {
            successDiv.remove();
            location.reload();
        }, 1000);
    }, 5000); 
}












function toggleWishlist(productId, element) {
    if (!auth.currentUser) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");

    const userWishlistRef = db.ref(`userWishlists/${auth.currentUser.uid}/${productId}`);

    userWishlistRef.once('value', snap => {
        if (snap.exists()) {
            userWishlistRef.remove();
            if (element) element.style.color = "rgba(255,255,255,0.3)"; // გაუფერულება
        } else {
            db.ref(`akhoStore/${productId}`).once('value', pSnap => {
                const p = pSnap.val();
                if (p) {
                    userWishlistRef.set({
                        name: p.name,
                        price: p.price,
                        image: p.image,
                        addedAt: Date.now()
                    });
                    if (element) element.style.color = "#ff4d4d"; // გაწითლება
                }
            });
        }
    });
}




function openWishlistView() {
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('detailsContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px;">ჩემი ფავორიტები ❤️</h2><div id="wishLoading">იტვირთება...</div>`;

    db.ref(`userWishlists/${auth.currentUser.uid}`).on('value', snap => {
        const data = snap.val();
        if (!data) {
            content.innerHTML = `<h2 style="color:var(--gold); margin-bottom:20px;">ჩემი ფავორიტები ❤️</h2><p style="color:gray; text-align:center;">ფავორიტების სია ცარიელია.</p>`;
            return;
        }

        let html = `<h2 style="color:var(--gold); margin-bottom:20px;">ჩემი ფავორიტები ❤️</h2>`;
        Object.entries(data).forEach(([id, item]) => {
            html += `
                <div style="width:100%; display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; margin-bottom:10px; border:1px solid #222;">
                    <img src="${item.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                    <div style="flex:1;">
                        <b style="color:white; font-size:14px; display:block;">${item.name}</b>
                        <span style="color:var(--gold); font-size:13px;">${item.price} AKHO</span>
                    </div>
                    <button onclick="showProductDetails('${id}')" style="background:var(--gold); border:none; padding:5px 10px; border-radius:6px; font-weight:bold; font-size:11px; color:black;">ნახვა</button>
                    <i class="fas fa-trash" onclick="toggleWishlist('${id}')" style="color:#ff4d4d; cursor:pointer; padding:5px;"></i>
                </div>
            `;
        });
        content.innerHTML = html;
    });
}











// მაღაზიის შეტყობინების ლოგიკა
function initRealTimeSalesPopup() {
    const popup = document.createElement('div');
    popup.className = "sales-popup";
    document.body.appendChild(popup);

    let isFirstLoad = true;
    
    db.ref('orders').limitToLast(1).on('child_added', snap => {
        // პირველ ჩატვირთვაზე ძველებს არ ვაჩვენებთ
        if (isFirstLoad) {
            isFirstLoad = false;
            return;
        }

        const newOrder = snap.val();
        if (!newOrder) return;

        // ✅ მთავარი შემოწმება: თუ მე ვყიდულობ, ჩემთან არ ამოხტეს (რომ რეფრეშმა არ გააქროს)
        if (auth.currentUser && newOrder.buyerUid === auth.currentUser.uid) {
            return; 
        }

        const firstName = newOrder.buyerName ? newOrder.buyerName.split(' ')[0] : "მომხმარებელმა";

        popup.innerHTML = `
            <div style="background:#25D366; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; flex-shrink:0; box-shadow: 0 0 15px rgba(37,211,102,0.4);">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="info">
                <b style="color:#25D366;">ახალი გაყიდვა! ✅</b>
                <span style="color:#fff; font-size:12px;">${firstName}-მ შეიძინა</span>
                <div style="color:var(--gold); font-size:11px; font-weight:bold;">${newOrder.productName}</div>
            </div>
        `;

        popup.classList.add('show');

        // 10 წამი გავაჩეროთ ეკრანზე, რომ ნახვა მოასწრონ
        setTimeout(() => {
            popup.classList.remove('show');
        }, 10000);
    });
}











// ფასდაკლევის კუპონის ლოგიკა
function createPromoCode() {
    const code = document.getElementById('promoCodeName').value.trim().toUpperCase();
    const percent = document.getElementById('promoPercent').value;
    const targetUser = document.getElementById('promoTargetUser').value.trim();

    if (!code || !percent) return alert("შეავსეთ კოდი და პროცენტი!");

    db.ref(`promoCodes/${code}`).set({
        discount: parseInt(percent),
        active: true,
        forUser: targetUser || "ყველასთვის", // თუ ცარიელია, იქნება ყველასთვის
        createdAt: Date.now()
    }).then(() => {
        alert(`კუპონი ${code} (${percent}%) შეიქმნა ${targetUser || 'ყველასთვის'}! ✅`);
        // ველების გასუფთავება
        document.getElementById('promoCodeName').value = "";
        document.getElementById('promoPercent').value = "";
        document.getElementById('promoTargetUser').value = "";
    }).catch(err => alert("შეცდომა: " + err.message));
}











// პრომო კოდის ლოგიკა
let currentDiscount = 0; // გლობალური ცვლადი ფასდაკლებისთვის

async function applyPromoCode() {
    const codeInput = document.getElementById('appliedPromoCode');
    const statusDiv = document.getElementById('promoStatus');
    const priceDisplay = document.getElementById('finalPriceDisplay');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) return;

    try {
        const snap = await db.ref(`promoCodes/${code}`).once('value');
        const promo = snap.val();

        if (promo && promo.active) {
            currentDiscount = promo.discount; // მაგ: 15
            statusDiv.innerText = `კოდი გააქტიურდა! -${currentDiscount}% ✅`;
            statusDiv.style.color = "#00ff00";
            
            // ფასის ხელახლა დათვლა ფასდაკლებით
            updatePriceWithDiscount();
        } else {
            currentDiscount = 0;
            statusDiv.innerText = "არასწორი ან ვადაგასული კოდი! ❌";
            statusDiv.style.color = "#ff4d4d";
            updatePriceWithDiscount();
        }
    } catch (e) {
        console.error(e);
    }
}

function updatePriceWithDiscount() {
    const priceDisplay = document.getElementById('finalPriceDisplay');
    if (!currentProduct || !priceDisplay) return;

    let originalPrice = parseFloat(currentProduct.price);
    let discountAmount = (originalPrice * currentDiscount) / 100;
    let finalPrice = originalPrice - discountAmount;

    // ვანახლებთ ვიზუალს
    const eurPrice = (finalPrice * AKHO_EXCHANGE_RATE).toFixed(2);
    priceDisplay.innerHTML = `
        <span style="text-decoration: ${currentDiscount > 0 ? 'line-through' : 'none'}; color: ${currentDiscount > 0 ? 'gray' : '#00ff00'}; font-size: ${currentDiscount > 0 ? '14px' : '20px'};">
            ${originalPrice} AKHO
        </span>
        ${currentDiscount > 0 ? `<br><span style="color:#00ff00; font-size:22px;">${finalPrice} AKHO</span>` : ''}
        <br><small style="font-size:12px; color:gray;">≈ ${eurPrice} EUR</small>
    `;
    
    // მნიშვნელოვანი: ვაახლებთ currentProduct.price-ს, რომ გადახდისას დაკლებული თანხა ჩამოიჭრას
    currentProduct.finalPrice = finalPrice; 
}
















// ფასდაკლების ტაიმერის ლოგიკა
function startCountdown() {
    // ყოველდღე რომ ახლიდან დაიწყოს "თითქოს" ცოტა დრო დარჩა
    // დავაყენოთ რომ აქცია მთავრდება დღის ბოლოს
    const now = new Date();
    const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    function update() {
        const currentTime = new Date();
        const diff = tonight - currentTime;

        if (diff <= 0) {
            document.getElementById('t-hours').innerText = "00";
            document.getElementById('t-mins').innerText = "00";
            document.getElementById('t-secs').innerText = "00";
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        // ელემენტების განახლება (თუ ისინი არსებობენ ეკრანზე)
        const hEl = document.getElementById('t-hours');
        const mEl = document.getElementById('t-mins');
        const sEl = document.getElementById('t-secs');

        if (hEl) hEl.innerText = h < 10 ? "0" + h : h;
        if (mEl) mEl.innerText = m < 10 ? "0" + m : m;
        if (sEl) sEl.innerText = s < 10 ? "0" + s : s;
    }

    // ვუშვებთ ყოველ წამს
    const timerInterval = setInterval(() => {
        if (!document.getElementById('countdownDisplay')) {
            clearInterval(timerInterval); // თუ მოდალი დაიკეტა, ტაიმერიც გაჩერდეს
            return;
        }
        update();
    }, 1000);
    
    update(); // პირველივე გაშვება
}











// Default რეიტინგი
let selectedRating = 5; // Default რეიტინგი

function setRating(n) {
    selectedRating = n;
    const stars = document.querySelectorAll('.star-select');
    stars.forEach((s, index) => {
        s.classList.toggle('active', index < n);
    });
}

function submitReview(productId) {
    if (!auth.currentUser) return alert("გამოხმაურებისთვის გაიარეთ ავტორიზაცია!");
    const text = document.getElementById('reviewText').value.trim();
    if (!text) return alert("დაწერეთ რამე...");

    const reviewData = {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || "მომხმარებელი",
        text: text,
        rating: selectedRating,
        timestamp: Date.now()
    };

    db.ref(`productReviews/${productId}`).push(reviewData).then(() => {
        document.getElementById('reviewText').value = "";
        alert("მადლობა გამოხმაურებისთვის! ⭐");
    });
}

function loadProductReviews(productId) {
    const list = document.getElementById('reviewsList');
    db.ref(`productReviews/${productId}`).on('value', snap => {
        const data = snap.val();
        if (!data) {
            list.innerHTML = `<p style="color:gray; font-size:12px; text-align:center;">ჯერჯერობით გამოხმაურებები არ არის.</p>`;
            return;
        }

        let html = "";
        Object.values(data).reverse().forEach(r => {
            let starsHtml = "";
            for (let i = 0; i < 5; i++) {
                starsHtml += `<i class="fas fa-star" style="color:${i < r.rating ? 'var(--gold)' : '#333'}"></i>`;
            }

            html += `
                <div class="review-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <b style="color:white; font-size:13px;">${r.name}</b>
                        <span style="color:gray; font-size:10px;">${new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="star-rating">${starsHtml}</div>
                    <p style="color:#ccc; font-size:12px; margin:5px 0 0 0;">${r.text}</p>
                </div>
            `;
        });
        list.innerHTML = html;
    });
}













function loadAdminDashboardStats() {
    db.ref('orders').on('value', snap => {
        const orders = snap.val();
        if (!orders) return;

        let totalAkho = 0;
        let count = 0;
        let lastProduct = "";

        Object.values(orders).forEach(order => {
            // ვითვლით მხოლოდ წარმატებულ გადახდებს
            const amount = parseFloat(order.paidAmount || order.price || 0);
            totalAkho += amount;
            count++;
            lastProduct = order.productName; // ბოლო გაყიდული ნივთი
        });

        // ვიზუალის განახლება
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalIncomeEurEl = document.getElementById('totalIncomeEur');
        const totalOrdersCountEl = document.getElementById('totalOrdersCount');
        const topProductNameEl = document.getElementById('topProductName');

        if (totalIncomeEl) totalIncomeEl.innerText = `${totalAkho.toLocaleString()} AKHO`;
        if (totalIncomeEurEl) totalIncomeEurEl.innerText = `≈ ${(totalAkho * AKHO_EXCHANGE_RATE).toFixed(2)} EUR`;
        if (totalOrdersCountEl) totalOrdersCountEl.innerText = count;
        if (topProductNameEl) topProductNameEl.innerText = lastProduct || "ჯერ არ არის";
    });
}

















