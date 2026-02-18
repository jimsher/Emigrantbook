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

function openShopSection() {
    document.getElementById('shopSectionContainer').style.display = 'flex';
    if (auth.currentUser && auth.currentUser.uid === "შენი_UID_აქ") {
        document.getElementById('adminStorePanel').style.display = 'block';
    }
    renderStore('all');
}
