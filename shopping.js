// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = [];

// Stripe ინიციალიზაცია (შენი Key)
const stripe = Stripe('pk_test_51SuywEE4GEOA0VbFL1utyI4vcXZUXWCVYYWzNbG32Gxk8oZxgaxMlhJiyJzR3w0VQ8BfDuLCaaPBrHw9eM745nzc00I2i2sNvK');

// 1. მაღაზიის სექციის გახსნა
function openShopSection() {
    const shopContainer = document.getElementById('shopSectionContainer');
    if (shopContainer) shopContainer.style.display = 'flex';

    // ადმინ პანელის შემოწმება (ჩაწერე შენი UID 'YOUR_ACTUAL_UID'-ის ნაცვლად)
    if (auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2') {
        const adminStore = document.getElementById('adminStorePanel');
        if (adminStore) adminStore.style.display = 'block';
    }
    renderStore('all');
}

// 2. მთავარი ფუნქცია: ნივთის შენახვა (imgBB + Firebase)
async function saveProductToFirebase() {
    // ზუსტად შენი HTML-ის ID-ები
    const name = document.getElementById('newProdName').value;
    const price = document.getElementById('newProdPrice').value;
    const stripeLink = document.getElementById('newProdStripeLink').value;
    const desc = document.getElementById('newProdDesc').value;
    const cat = document.getElementById('newProdCat').value;
    const fileInput = document.getElementById('newProdFile');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) {
        return alert("შეავსე აუცილებელი ველები: ფოტო, სახელი და ფასი!");
    }

    // ღილაკის დაბლოკვა ატვირთვისას
    btn.disabled = true;
    btn.innerText = "იტვირთება...";

    const formData = new FormData();
    formData.append("image", file);

    try {
        // 🚀 1. ატვირთვა imgBB-ზე (შენი API Key)
        const res = await fetch("https://api.imgbb.com/1/upload?key=6f6634c0e667866380c55048d085957d", {
            method: "POST",
            body: formData
        });
        const json = await res.json();

        if (json.success) {
            const imageUrl = json.data.url; // imgBB-ს მოცემული ლინკი

            // 🚀 2. შენახვა Firebase-ში (akhoStore-ში)
            await db.ref('akhoStore').push({
                name: name,
                price: price,
                stripeLink: stripeLink,
                desc: desc,
                category: cat,
                image: imageUrl,
                timestamp: Date.now()
            });

            alert("ნივთი წარმატებით დაემატა! ✅");
            
            // ფორმის გასუფთავება
            document.getElementById('newProdName').value = "";
            document.getElementById('newProdPrice').value = "";
            document.getElementById('newProdStripeLink').value = "";
            document.getElementById('newProdDesc').value = "";
            fileInput.value = "";
        } else {
            alert("imgBB-ზე ატვირთვა ვერ მოხერხდა!");
        }
    } catch (e) {
        console.error(e);
        alert("შეცდომაა: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "დამატება 🚀";
    }
}

// 3. მაღაზიის რენდერი
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
                ${auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2' ? `
                <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; top:5px; right:5px; color:white; background:rgba(255,0,0,0.6); padding:8px; border-radius:50%; font-size:12px;"></i>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    });
}

// 4. პროდუქტის დეტალები
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
            <button onclick="openOrderForm()" style="width:100%; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; font-size:16px; margin-top:10px; cursor:pointer;">
                შეკვეთის გაფორმება 💳
            </button>
        `;
        modal.style.display = 'flex';
    });
}

// 5. ფორმების დახურვა და წაშლა
function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) modal.style.display = 'none';
}

function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        db.ref(`akhoStore/${id}`).remove();
    }
}
