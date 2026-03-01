// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = [];

// Stripe ინიციალიზაცია
const stripe = Stripe('pk_test_51SuywEE4GEOA0VbFL1utyI4vcXZUXWCVYYWzNbG32Gxk8oZxgaxMlhJiyJzR3w0VQ8BfDuLCaaPBrHw9eM745nzc00I2i2sNvK');

// 1. მაღაზიის მართვის პანელის ჩართვა/გამორთვა
function toggleStoreManager() {
    const section = document.getElementById('storeManagerSection');
    if (section) {
        section.style.display = (section.style.display === 'none' || section.style.display === '') ? 'block' : 'none';
    }
}

// 2. პროდუქტის ატვირთვა imgBB-ზე და შენახვა Firebase-ში
async function saveProductToFirebase() {
    const fileInput = document.getElementById('newProdFile');
    const file = fileInput.files[0];
    const name = document.getElementById('newProdName').value;
    const price = document.getElementById('newProdPrice').value;
    const stripeLink = document.getElementById('newProdStripeLink').value;
    const desc = document.getElementById('newProdDesc').value;
    const cat = document.getElementById('newProdCat').value;
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) {
        return alert("შეავსე სახელი, ფასი და აირჩიე ფოტო!");
    }

    btn.disabled = true;
    btn.innerText = "იტვირთება...";

    const formData = new FormData();
    formData.append("image", file);

    try {
        // 🚀 ატვირთვა imgBB-ზე შენი API Key-თ
        const res = await fetch("https://api.imgbb.com/1/upload?key=20b1ff9fe9c8896477a6bf04c86bcc67", {
            method: "POST",
            body: formData
        });
        const json = await res.json();

        if (json.success) {
            const url = json.data.url;

            // 🚀 შენახვა akhoStore-ში
            await db.ref('akhoStore').push({
                name: name,
                price: price,
                stripeLink: stripeLink,
                desc: desc,
                category: cat,
                image: url,
                timestamp: Date.now()
            });

            alert("ნივთი წარმატებით დაემატა! ✅");
            
            // გასუფთავება
            document.getElementById('newProdName').value = "";
            document.getElementById('newProdPrice').value = "";
            document.getElementById('newProdStripeLink').value = "";
            document.getElementById('newProdDesc').value = "";
            fileInput.value = "";
        } else {
            alert("imgBB-ზე ატვირთვა ჩავარდა!");
        }
    } catch (e) {
        alert("შეცდომაა: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "გამოქვეყნება 🚀";
    }
}

// 3. მაღაზიის გახსნა (UID შემოწმებით)
function openShopSection() {
    const shopContainer = document.getElementById('shopSectionContainer');
    if (shopContainer) shopContainer.style.display = 'flex';

    // შენი UID: TfXz5N0lHjX2R7yV9pW1qM8bK4d2
    if (auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2') {
        const adminStore = document.getElementById('adminStorePanel');
        if (adminStore) adminStore.style.display = 'block';
    }
    renderStore('all');
}

// 4. რენდერი (პროდუქტების გამოჩენა)
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
            card.onclick = () => showProductDetails(id); 
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative;";
            
            const imgUrl = item.image || 'https://via.placeholder.com/300x200';

            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${imgUrl}') center/cover no-repeat; border-radius:12px;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px;">${item.name}</b>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:#00ff00; font-weight:bold;">${item.price} ₾</span>
                        <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px; color:black;">დეტალები</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// 5. წაშლის ფუნქციები
function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        db.ref(`akhoStore/${id}`).remove();
    }
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) modal.style.display = 'none';
}
