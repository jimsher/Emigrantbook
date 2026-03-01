// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = []; // კალათის მასივი

// 1. მაღაზიის მართვის პანელის ჩართვა/გამორთვა
function toggleStoreManager() {
    const section = document.getElementById('storeManagerSection');
    if (section) {
        section.style.display = (section.style.display === 'none' || section.style.display === '') ? 'block' : 'none';
    }
}

// 2. პროდუქტის ატვირთვა imgBB-ზე და შენახვა
async function saveProductToFirebase() {
    const fileInput = document.getElementById('newProdFile');
    const file = fileInput.files[0];
    const name = document.getElementById('newProdName').value;
    const price = document.getElementById('newProdPrice').value;
    const desc = document.getElementById('newProdDesc').value;
    const cat = document.getElementById('newProdCat').value;
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) return alert("შეავსე სახელი, ფასი და აირჩიე ფოტო!");

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
    renderStore('all');
}

// 4. რენდერი ფილტრაციის ფუნქციით (მენიუს ღილაკებისთვის)
function renderStore(category = 'all', btn = null) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // მენიუს ღილაკების აქტიური სტილი
    if (btn) {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    }

    db.ref('akhoStore').on('value', snap => {
        grid.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).reverse().forEach(([id, item]) => {
            // ფილტრაცია კატეგორიის მიხედვით
            if (category !== 'all' && item.category !== category) return;

            const card = document.createElement('div');
            card.className = "product-card";
            card.onclick = () => showProductDetails(id); 
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative;";
            
            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px;">${item.name}</b>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:var(--gold); font-weight:bold;">${item.price} AKHO</span>
                        <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px; color:black;">ნახვა</button>
                    </div>
                </div>
                ${auth.currentUser && auth.currentUser.uid === 'TfXz5N0lHjX2R7yV9pW1qM8bK4d2' ? `
                    <i class="fas fa-trash" onclick="event.stopPropagation(); deleteProduct('${id}')" style="position:absolute; top:8px; right:8px; color:white; background:rgba(255,0,0,0.6); padding:8px; border-radius:50%; font-size:12px;"></i>
                ` : ''}
            `;
            grid.appendChild(card);
        });
    });
}

// 5. კალათაში დამატება
function addToCart(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if (item) {
            cart.push({ id, ...item });
            updateCartBadge();
            alert(`${item.name} დაემატა კალათაში! 🛒`);
        }
    });
}

function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.innerText = cart.length;
}

// 6. შეკვეთის ფორმის გახსნა (მონაცემების შესავსებად)
function openOrderForm() {
    const detailsModal = document.getElementById('productDetailsModal');
    const orderModal = document.getElementById('orderFormModal');
    const priceDisplay = document.getElementById('finalPriceDisplay');

    if (detailsModal) detailsModal.style.display = 'none';
    if (orderModal) orderModal.style.display = 'flex';
    
    if (priceDisplay && currentProduct) {
        priceDisplay.innerText = currentProduct.price + " AKHO";
    }
}

// 7. გადახდის პროცესი AKHO ბალანსით
async function processOrderAndPay() {
    const user = auth.currentUser;
    const btn = document.querySelector("#orderFormModal button");
    
    if (!user) return alert("ავტორიზაცია აუცილებელია!");

    const fName = document.getElementById('ordFirstName').value;
    const lName = document.getElementById('ordLastName').value;
    const addr = document.getElementById('ordAddress').value;
    const phone = document.getElementById('ordPhone').value;

    if (!fName || !lName || !addr || !phone) return alert("შეავსე ყველა ველი!");

    const productPrice = parseFloat(currentProduct.price);
    const userRef = db.ref(`users/${user.uid}`);

    try {
        const userSnap = await userRef.once('value');
        const currentBalance = parseFloat(userSnap.val().akhoBalance || 0);

        if (currentBalance < productPrice) {
            return alert(`არ გაქვს საკმარისი AKHO!`);
        }

        if (btn) { btn.disabled = true; btn.innerText = "მუშავდება..."; }

        await userRef.update({ akhoBalance: currentBalance - productPrice });

        await db.ref('orders').push({
            buyerUid: user.uid,
            buyerName: fName + " " + lName,
            address: addr,
            phone: phone,
            productName: currentProduct.name,
            paidAmount: productPrice,
            status: "paid_with_akho",
            timestamp: Date.now()
        });

        alert("შენაძენი წარმატებულია! ✅");
        location.reload();

    } catch (e) {
        alert("შეცდომაა: " + e.message);
    }
}

// 8. დეტალების გამოჩენა (კალათაში დამატების ღილაკით)
function showProductDetails(id) {
    db.ref(`akhoStore/${id}`).once('value', snap => {
        const item = snap.val();
        if (!item) return;
        currentProduct = item; 

        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('detailsContent');
        if (!modal || !content) return;

        content.innerHTML = `
            <div style="width:100%; height:250px; background:url('${item.image}') center/cover no-repeat; border-radius:15px; border:1px solid #333;"></div>
            <div style="width:100%; text-align:left; padding: 15px 0;">
                <h1 style="color:white; font-size:22px;">${item.name}</h1>
                <div style="color:var(--gold); font-size:20px; font-weight:bold; margin-bottom:15px;">${item.price} AKHO</div>
                <div style="color:#ccc; font-size:14px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid #222;">
                    ${item.desc || "აღწერა არ არის."}
                </div>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="addToCart('${id}')" style="flex:1; background:rgba(212,175,55,0.1); color:var(--gold); padding:15px; border:1px solid var(--gold); border-radius:12px; font-weight:bold;">
                    კალათაში 🛒
                </button>
                <button onclick="openOrderForm()" style="flex:2; background:#d4af37; color:black; padding:15px; border:none; border-radius:12px; font-weight:bold;">
                    ახლავე ყიდვა 💳
                </button>
            </div>
        `;
        modal.style.display = 'flex';
    });
}

function deleteProduct(id) {
    if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        db.ref(`akhoStore/${id}`).remove();
    }
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) modal.style.display = 'none';
}
