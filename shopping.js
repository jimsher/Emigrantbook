// 📦 IMPACT STORE CORE ENGINE
let cart = [];

// 🚀 ჩაამატე ეს შენი JS-ის დასაწყისში
const stripe = Stripe('pk_test_51SuywEE4GEOA0VbFL1utyI4vcXZUXWCVYYWzNbG32Gxk8oZxgaxMlhJiyJzR3w0VQ8BfDuLCaaPBrHw9eM745nzc00I2i2sNvK');

async function processOrderAndPay() {
    const user = auth.currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია");

    // 1. ვინახავთ შეკვეთას ბაზაში
    const orderData = {
        name: document.getElementById('ordFirstName').value + " " + document.getElementById('ordLastName').value,
        productName: currentProduct.name,
        price: currentProduct.price,
        uid: user.uid,
        status: "waiting_payment",
        timestamp: Date.now()
    };

    try {
        await db.ref('orders').push(orderData);

        // 2. 🚀 გადახდის პროცესი
        // ადმინ პანელში 'stripeLink'-ის ველში ჩაწერე Price ID (მაგ: price_1T2d...)
        const priceId = currentProduct.stripeLink; 

        if (!priceId || !priceId.startsWith('price_')) {
            // თუ Price ID არ გაქვს, გამოიყენე ის ერთი ლინკი რაც მომწერე (როგორც რეზერვი)
            window.open("https://buy.stripe.com/test_eVq8wP0bE5Y08mqf1NcbC05", "_blank");
        } else {
            // პროფესიონალური Checkout
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId, quantity: 1 }],
                mode: 'payment',
                successUrl: window.location.origin + '/success',
                cancelUrl: window.location.origin + '/cancel',
                clientReferenceId: user.uid
            });
            if (error) alert(error.message);
        }

        document.getElementById('orderFormModal').style.display = 'none';

    } catch (e) {
        alert("შეცდომა: " + e.message);
    }
}
            




// 2. მაღაზიის რენდერი (ნივთზე დაჭერის ფუნქციით)
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

        Object.entries(data).reverse().forEach(([id, item]) => {
            if (category !== 'all' && item.category !== category) return;

            const card = document.createElement('div');
            card.className = "product-card";
            // აი აქ დავამატეთ დაჭერის ფუნქცია:
            card.onclick = () => showProductDetails(id); 
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative;";
            
            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px; display:block;">${item.name}</b>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:#00ff00; font-weight:bold;">${item.price} ₾</span>
                        <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px;">დეტალები</button>
                    </div>
                </div>
                ${auth.currentUser && auth.currentUser.uid === "შენი_UID_აქ" ? `
                <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; top:5px; right:5px; color:red; background:rgba(0,0,0,0.5); padding:5px; border-radius:50%; font-size:10px;"></i>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    });
}


// 3. დეტალების გახსნა
function showProductDetails(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if(!item) return;

        // მიმდინარე ნივთის შენახვა გადახდისთვის
        currentProduct = item; 

        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');

        content.innerHTML = `
            <div style="width:100%; max-width:400px; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px; border:1px solid #333;"></div>
            
            <div style="width:100%; text-align:left; padding: 10px 0;">
                <h1 style="color:white; font-size:22px; margin-bottom:5px;">${item.name}</h1>
                <div style="color:#00ff00; font-size:20px; font-weight:bold; margin-bottom:15px;">${item.price} ₾</div>
                
                <div style="color:#ccc; font-size:14px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #222; line-height:1.6; white-space: pre-wrap;">
                    ${item.desc ? item.desc : "აღწერა არ არის მითითებული."}
                </div>
            </div>

            <button onclick="openOrderForm()" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; font-size:16px; margin-top:10px; cursor:pointer;">
                შეკვეთის გაფორმება 💳
            </button>
        `;
        modal.style.display = 'flex';
    });
}

function closeProductDetails() {
    document.getElementById('productDetailsModal').style.display = 'none';
}

function deleteProduct(id) {
    if (confirm("წავშალოთ ნივთი?")) db.ref(`akhoStore/${id}`).remove();
}

let currentProduct = null;

// 1. მაღაზიის გახსნა და რენდერი
function openShopSection() {
    document.getElementById('shopSectionContainer').style.display = 'flex';
    if (auth.currentUser && auth.currentUser.uid === "შენი_UID_აქ") {
        document.getElementById('adminStorePanel').style.display = 'block';
    }
    renderStore('all');
}







// 2. დეტალების გახსნა და ფორმაზე გადასვლა
function openOrderForm() {
    document.getElementById('productDetailsModal').style.display = 'none';
    document.getElementById('orderFormModal').style.display = 'flex';
    document.getElementById('finalPriceDisplay').innerText = currentProduct.price + " ₾";
}




async function processOrderAndPay() {
    const btn = document.querySelector("#orderFormModal button");
    const user = auth.currentUser;
    if (!user) return alert("Please Login");

    // 1. მონაცემების აღება ფორმიდან
    const customerInfo = {
        name: document.getElementById('ordFirstName').value + " " + document.getElementById('ordLastName').value,
        address: document.getElementById('ordAddress').value,
        phone: document.getElementById('ordPhone').value,
        email: document.getElementById('ordEmail').value,
        productName: currentProduct.name,
        price: currentProduct.price,
        uid: user.uid,
        status: "waiting_payment",
        timestamp: Date.now()
    };

    // ვალიდაცია
    if (!customerInfo.address || !customerInfo.phone) {
        alert("გთხოვთ შეავსოთ აუცილებელი ველები!");
        return;
    }

    btn.innerText = "გადამისამართება...";
    btn.disabled = true;

    try {
        // 2. შეკვეთის შენახვა Firebase-ში
        await db.ref('orders').push(customerInfo);

        // 3. 🚀 ზუსტად AKHO-ს ლოგიკა (initStripePayment-ის ანალოგი)
        if (currentProduct && currentProduct.stripeLink) {
            // ვაწყობთ ფინალურ ლინკს ისე, როგორც შენს კოდშია
            const finalUrl = currentProduct.stripeLink + "?client_reference_id=" + user.uid;
            
            // ვხსნით ახალ ფანჯარაში, როგორც შენს initStripePayment-შია
            window.open(finalUrl, "_blank");
            
            // ვხურავთ ფორმას
            document.getElementById('orderFormModal').style.display = 'none';
        } else {
            alert("ამ ნივთს Stripe-ის ლინკი არ აქვს!");
        }

    } catch (e) {
        alert("შეცდომაა: " + e.message);
    } finally {
        btn.innerText = "გადახდაზე გადასვლა 🚀";
        btn.disabled = false;
    }
}









// ადმინ პანელის ლოგიკა
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
            
            // 🚀 აქ ვიყენებთ ზუსტად იმ სახელებს, რასაც შენი processOrderAndPay ინახავს
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <b style="color:var(--gold); font-size:14px;">📦 ${order.productName || 'უცნობი ნივთი'}</b>
                    <span style="color:#00ff00; font-weight:bold;">${order.price || 0} ₾</span>
                </div>
                <div style="color:white; line-height:1.6;">
                    👤 <b>კლიენტი:</b> ${order.name || 'სახელი არაა'}<br>
                    📍 <b>მისამართი:</b> ${order.address || 'მისამართი არაა'}<br>
                    📞 <b>ტელ:</b> <a href="tel:${order.phone}" style="color:var(--gold); text-decoration:none;">${order.phone || '-'}</a><br>
                    ✉️ <b>Email:</b> ${order.email || '-'}<br>
                    <span style="color:gray; font-size:10px;">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleString() : ''}</span>
                </div>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="deleteOrder('${id}')" style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">წაშლა 🗑️</button>
                    <button onclick="window.open('tel:${order.phone}')" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">დარეკვა 📞</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

// შეკვეთის წაშლა (როცა გააგზავნი და მორჩები საქმეს)
function deleteOrder(id) {
    if(confirm("წავშალოთ შეკვეთა?")) {
        db.ref(`orders/${id}`).remove();
    }
}




















// როცა ადმინ პანელს ხსნი, მაშინვე ჩაიტვირთოს შეკვეთებიც
// ამას ჩაამატებ შენს openAdminUI() ფუნქციაში
// 1. სექციის გამოჩენა/დამალვა
function toggleStoreManager() {
    const section = document.getElementById('storeManagerSection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        loadAdminProducts(); // ნივთების სიის ჩატვირთვა
    } else {
        section.style.display = 'none';
    }
}

// 2. ნივთების სიის ჩატვირთვა ადმინისთვის (წასაშლელად)
function loadAdminProducts() {
    const list = document.getElementById('adminProductList');
    db.ref('akhoStore').on('value', snap => {
        list.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).forEach(([id, item]) => {
            const div = document.createElement('div');
            div.style = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; border-radius:8px; border:1px solid #222;";
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.image}" style="width:30px; height:30px; border-radius:4px; object-fit:cover;">
                    <span style="color:white; font-size:12px;">${item.name} (${item.price}₾)</span>
                </div>
                <button onclick="deleteProduct('${id}')" style="background:#ff4d4d; border:none; color:white; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:11px;">წაშლა</button>
            `;
            list.appendChild(div);
        });
    });
}

// 3. ნივთის წაშლა
function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        db.ref(`akhoStore/${id}`).remove()
            .then(() => alert("ნივთი წაიშალა"))
            .catch(e => alert("შეცდომაა"));
    }
}









