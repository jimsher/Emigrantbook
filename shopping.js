// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = [];

// Stripe ინიციალიზაცია (დარწმუნდი, რომ ეს შენი სწორი Key-ა)
const stripe = Stripe('pk_test_51SuywEE4GEOA0VbFL1utyI4vcXZUXWCVYYWzNbG32Gxk8oZxgaxMlhJiyJzR3w0VQ8BfDuLCaaPBrHw9eM745nzc00I2i2sNvK');

// 1. მაღაზიის გახსნა და რენდერი
function openShopSection() {
    const shopContainer = document.getElementById('shopSectionContainer');
    if (shopContainer) shopContainer.style.display = 'flex';

    // ადმინ პანელის გამოჩენა (შეცვალე 'YOUR_ACTUAL_UID' შენი ნამდვილი UID-ით)
    if (auth.currentUser && auth.currentUser.uid === 'YOUR_ACTUAL_UID') {
        const adminStore = document.getElementById('adminStorePanel');
        if (adminStore) adminStore.style.display = 'block';
    }
    renderStore('all');
}

// 2. მაღაზიის რენდერი (გაერთიანებული და გასწორებული)
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
        if (!data) {
            grid.innerHTML = "<p style='color:gray; text-align:center; padding:20px; width:100%;'>მაღაზია ცარიელია...</p>";
            return;
        }

        Object.entries(data).reverse().forEach(([id, item]) => {
            if (category !== 'all' && item.category !== category) return;

            const card = document.createElement('div');
            card.className = "product-card";
            card.onclick = () => showProductDetails(id); 
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative; overflow:hidden;";
            
            // სურათის შემოწმება და Placeholder-ის ჩამატება
            const imgUrl = item.image ? item.image : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${imgUrl}') center/cover no-repeat; border-radius:12px; background-color:#222;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px; display:block; margin-bottom:5px;">${item.name}</b>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:#00ff00; font-weight:bold;">${item.price} ₾</span>
                        <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px; color:black;">დეტალები</button>
                    </div>
                </div>
                ${auth.currentUser && auth.currentUser.uid === 'YOUR_ACTUAL_UID' ? `
                <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; top:5px; right:5px; color:white; background:rgba(255,0,0,0.6); padding:8px; border-radius:50%; font-size:12px;"></i>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    });
}

// 3. პროდუქტის დეტალების გახსნა
function showProductDetails(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if (!item) return;

        currentProduct = item; 

        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');
        if (!modal || !content) return;

        const imgUrl = item.image ? item.image : 'https://via.placeholder.com/400x250?text=No+Image';

        content.innerHTML = `
            <div style="width:100%; max-width:100%; height:250px; background:url('${imgUrl}') center/cover no-repeat; border-radius:15px; border:1px solid #333; background-color:#222;"></div>
            
            <div style="width:100%; text-align:left; padding: 10px 0;">
                <h1 style="color:white; font-size:22px; margin-bottom:5px;">${item.name}</h1>
                <div style="color:#00ff00; font-size:20px; font-weight:bold; margin-bottom:15px;">${item.price} ₾</div>
                
                <div style="color:#ccc; font-size:14px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #222; line-height:1.6; white-space: pre-wrap;">
                    ${item.desc ? item.desc : "აღწერა არ არის მითითებული."}
                </div>
            </div>

            <button onclick="openOrderForm()" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; font-size:16px; margin-top:10px; cursor:pointer; transition: 0.3s;">
                შეკვეთის გაფორმება 💳
            </button>
        `;
        modal.style.display = 'flex';
    });
}

// 4. შეკვეთის ფორმის გახსნა
function openOrderForm() {
    const detailsModal = document.getElementById('productDetailsModal');
    const orderModal = document.getElementById('orderFormModal');
    const priceDisplay = document.getElementById('finalPriceDisplay');

    if (detailsModal) detailsModal.style.display = 'none';
    if (orderModal) orderModal.style.display = 'flex';
    if (priceDisplay && currentProduct) priceDisplay.innerText = currentProduct.price + " ₾";
}

// 5. შეკვეთის და გადახდის პროცესი
async function processOrderAndPay() {
    const btn = document.querySelector("#orderFormModal button");
    const user = auth.currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია");

    // მონაცემების აღება ფორმიდან
    const fName = document.getElementById('ordFirstName').value;
    const lName = document.getElementById('ordLastName').value;
    const addr = document.getElementById('ordAddress').value;
    const phone = document.getElementById('ordPhone').value;
    const email = document.getElementById('ordEmail').value;

    if (!fName || !lName || !addr || !phone) {
        alert("გთხოვთ შეავსოთ აუცილებელი ველები (სახელი, გვარი, მისამართი, ტელეფონი)!");
        return;
    }

    const customerInfo = {
        name: fName + " " + lName,
        address: addr,
        phone: phone,
        email: email,
        productName: currentProduct.name,
        price: currentProduct.price,
        uid: user.uid,
        status: "waiting_payment",
        timestamp: Date.now()
    };

    if (btn) {
        btn.innerText = "გადამისამართება...";
        btn.disabled = true;
    }

    try {
        // 1. შეკვეთის შენახვა Firebase-ში
        await db.ref('orders').push(customerInfo);

        // 2. Stripe გადახდის ლოგიკა
        if (currentProduct && currentProduct.stripeLink) {
            const priceId = currentProduct.stripeLink;

            if (priceId.startsWith('price_')) {
                // პროფესიონალური Checkout
                const { error } = await stripe.redirectToCheckout({
                    lineItems: [{ price: priceId, quantity: 1 }],
                    mode: 'payment',
                    successUrl: window.location.origin + '/success',
                    cancelUrl: window.location.origin + '/cancel',
                    clientReferenceId: user.uid
                });
                if (error) alert(error.message);
            } else {
                // თუ პირდაპირი Payment Link-ია
                const finalUrl = priceId.includes('?') 
                    ? `${priceId}&client_reference_id=${user.uid}` 
                    : `${priceId}?client_reference_id=${user.uid}`;
                window.open(finalUrl, "_blank");
            }
            
            document.getElementById('orderFormModal').style.display = 'none';
        } else {
            alert("ამ ნივთს Stripe-ის ლინკი არ აქვს!");
        }

    } catch (e) {
        alert("შეცდომაა: " + e.message);
    } finally {
        if (btn) {
            btn.innerText = "გადახდაზე გადასვლა 🚀";
            btn.disabled = false;
        }
    }
}

// 6. ადმინ პანელის ფუნქციები
function loadIncomingOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    db.ref('orders').on('value', snap => {
        list.innerHTML = "";
        const data = snap.val();
        if (!data) {
            list.innerHTML = "<p style='color:gray; font-size:12px;'>შეკვეთები არ არის...</p>";
            return;
        }

        Object.entries(data).reverse().forEach(([id, order]) => {
            const card = document.createElement('div');
            card.style = "background:#111; border:1px solid #333; padding:12px; border-radius:10px; font-size:13px; margin-bottom:10px; border-left: 4px solid var(--gold);";
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <b style="color:var(--gold); font-size:14px;">📦 ${order.productName || 'ნივთი'}</b>
                    <span style="color:#00ff00; font-weight:bold;">${order.price || 0} ₾</span>
                </div>
                <div style="color:white; line-height:1.6;">
                    👤 <b>კლიენტი:</b> ${order.name || '-'}<br>
                    📍 <b>მისამართი:</b> ${order.address || '-'}<br>
                    📞 <b>ტელ:</b> <a href="tel:${order.phone}" style="color:var(--gold); text-decoration:none;">${order.phone || '-'}</a><br>
                    ✉️ <b>Email:</b> ${order.email || '-'}<br>
                    <span style="color:gray; font-size:10px;">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleString() : ''}</span>
                </div>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="deleteOrder('${id}')" style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">წაშლა 🗑️</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        db.ref(`akhoStore/${id}`).remove()
            .then(() => console.log("Product deleted"))
            .catch(e => alert("შეცდომა წაშლისას"));
    }
}

function deleteOrder(id) {
    if (confirm("წავშალოთ შეკვეთა?")) {
        db.ref(`orders/${id}`).remove();
    }
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) modal.style.display = 'none';
}
