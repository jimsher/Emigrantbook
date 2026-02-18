// 📦 IMPACT STORE CORE ENGINE
let cart = [];

// 1. ნივთის დამატება (Cloudinary + Firebase)
async function saveProductToFirebase() {
    const file = document.getElementById('newProdFile').files[0];
    const name = document.getElementById('newProdName').value;
    const price = document.getElementById('newProdPrice').value;
    const cat = document.getElementById('newProdCat').value;

    if (!file || !name || !price) return alert("შეავსე ყველა ველი!");

    const btn = document.querySelector('#adminStorePanel button');
    btn.innerText = "იტვირთება..."; btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "Emigrantbook.video");

        const res = await fetch(`https://api.cloudinary.com/v1_1/djbgqzf6l/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.secure_url) {
            const newRef = db.ref('akhoStore').push();
            await newRef.set({
                id: newRef.key,
                name: name,
                price: parseFloat(price),
                image: data.secure_url,
                category: cat,
                ts: Date.now()
            });
            alert("✅ ნივთი დაემატა!");
            document.getElementById('newProdName').value = "";
            document.getElementById('newProdPrice').value = "";
        }
    } catch (e) { alert("შეცდომა!"); }
    btn.innerText = "დამატება 🚀"; btn.disabled = false;
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

        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');

        content.innerHTML = `
            <div style="width:100%; max-width:400px; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px; border:1px solid #333;"></div>
            
            <div style="width:100%; text-align:left;">
                <h1 style="color:white; font-size:22px; margin-bottom:10px;">${item.name}</h1>
                <div style="color:#00ff00; font-size:20px; font-weight:bold; margin-bottom:15px;">${item.price} ₾</div>
                <p style="color:#aaa; font-size:14px; background:#111; padding:15px; border-radius:12px; border:1px solid #222;">
                    ეს პროდუქტი ხელმისაწვდომია IMPACT STORE-ში. შეძენის შემდეგ ის გააქტიურდება თქვენს პროფილზე.
                </p>
            </div>

            <button onclick="confirmPurchase('${id}', ${item.price})" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; font-size:16px; margin-top:10px; cursor:pointer;">
                ყიდვა 💳
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

function renderStore(category = 'all', btn = null) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    db.ref('akhoStore').on('value', snap => {
        grid.innerHTML = "";
        const data = snap.val();
        if (!data) return;
        Object.entries(data).reverse().forEach(([id, item]) => {
            if (category !== 'all' && item.category !== category) return;
            const card = document.createElement('div');
            card.className = "product-card";
            card.onclick = () => showProductDetails(id);
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer;";
            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px; display:block;">${item.name}</b>
                    <span style="color:#00ff00; font-weight:bold;">${item.price} ₾</span>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// 2. დეტალების გახსნა და ფორმაზე გადასვლა
function showProductDetails(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        currentProduct = item;
        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');
        content.innerHTML = `
            <div style="width:100%; max-width:400px; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px;"></div>
            <h2 style="color:white;">${item.name}</h2>
            <b style="color:#00ff00; font-size:20px;">${item.price} ₾</b>
            <button onclick="openOrderForm()" style="width:100%; background:#d4af37; color:black; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer;">ყიდვა 💳</button>
        `;
        modal.style.display = 'flex';
    });
}

function openOrderForm() {
    document.getElementById('productDetailsModal').style.display = 'none';
    document.getElementById('orderFormModal').style.display = 'flex';
    document.getElementById('finalPriceDisplay').innerText = currentProduct.price + " ₾";
}



async function processOrderAndPay() {
    const btn = document.querySelector("#orderFormModal button");
    
    // 1. მონაცემების შეგროვება
    const customerInfo = {
        firstName: document.getElementById('ordFirstName').value,
        lastName: document.getElementById('ordLastName').value,
        address: document.getElementById('ordAddress').value,
        phone: document.getElementById('ordPhone').value,
        email: document.getElementById('ordEmail').value,
        productName: currentProduct ? currentProduct.name : "Unknown",
        price: currentProduct ? currentProduct.price : 0,
        uid: auth.currentUser ? auth.currentUser.uid : "guest",
        timestamp: Date.now()
    };

    if (!customerInfo.firstName || !customerInfo.address || !customerInfo.phone) {
        alert("შეავსეთ აუცილებელი ველები!");
        return;
    }

    btn.innerText = "გადამისამართება...";
    btn.disabled = true;

    try {
        // 2. მონაცემების შენახვა Firebase-ში
        await db.ref('orders').push(customerInfo);
        console.log("✅ მონაცემები ბაზაში შეინახა!");

        // 3. გადახდის ლინკის შემოწმება
        // ყურადღება: აქ ვამოწმებთ, საერთოდ არსებობს თუ არა ლინკი
        if (currentProduct && currentProduct.stripeLink) {
            console.log("🚀 გადავდივართ ლინკზე: ", currentProduct.stripeLink);
            
            // ვამატებთ UID-ს, როგორც AKHO-ს დროს
            const finalUrl = currentProduct.stripeLink + "?client_reference_id=" + customerInfo.uid;
            
            // სცადე ეს ორივე მეთოდი, თუ ერთი არ იმუშავებს:
            window.location.assign(finalUrl); 
            // window.open(finalUrl, "_blank"); 

        } else {
            console.error("❌ შეცდომა: currentProduct.stripeLink ცარიელია!");
            console.log("Product Data:", currentProduct);
            alert("შეცდომა: ამ ნივთს გადახდის ლინკი არ აქვს მიბმული!");
            btn.disabled = false;
            btn.innerText = "გადახდაზე გადასვლა 🚀";
        }

    } catch (e) {
        console.error("❌ ბაზაში შენახვის შეცდომა:", e);
        alert("შეცდომაა!");
        btn.disabled = false;
    }
}
