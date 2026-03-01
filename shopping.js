// 🚀 ინიციალიზაცია
let currentProduct = null;
let cart = [];

// 1. მაღაზიის მართვის პანელის ჩართვა/გამორთვა
function toggleStoreManager() {
    const section = document.getElementById('storeManagerSection');
    if (section) {
        section.style.display = (section.style.display === 'none' || section.style.display === '') ? 'block' : 'none';
    }
}

// 2. პროდუქტის ატვირთვა (ფასი ავტომატურად ჩაითვლება AKHO-ში)
async function saveProductToFirebase() {
    const fileInput = document.getElementById('newProdFile');
    const file = fileInput.files[0];
    const name = document.getElementById('newProdName').value;
    const price = document.getElementById('newProdPrice').value; // აქ იგულისხმება AKHO რაოდენობა
    const desc = document.getElementById('newProdDesc').value;
    const cat = document.getElementById('newProdCat').value;
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) return alert("შეავსე სახელი, ფასი და ფოტო!");

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

// 3. რენდერი (ფასი გამოჩნდება AKHO სიმბოლოთი)
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
            card.style = "background:#111; border:1px solid #222; border-radius:15px; padding:10px; cursor:pointer; position:relative;";
            
            card.innerHTML = `
                <div style="width:100%; height:130px; background:url('${item.image}') center/cover no-repeat; border-radius:12px;"></div>
                <div style="padding:10px 0;">
                    <b style="color:white; font-size:14px;">${item.name}</b>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:var(--gold); font-weight:bold;">${item.price} AKHO</span>
                        <button style="background:var(--gold); border:none; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:11px; color:black;">ყიდვა</button>
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

// 4. გადახდის ლოგიკა AKHO-თ (მთავარი ცვლილება)
async function processOrderAndPay() {
    const user = auth.currentUser;
    if (!user) return alert("გთხოვთ გაიაროთ ავტორიზაცია!");

    const productPrice = parseFloat(currentProduct.price);
    const userRef = db.ref(`users/${user.uid}`);

    try {
        const userSnap = await userRef.once('value');
        const userData = userSnap.val();
        const currentBalance = parseFloat(userData.akhoBalance || 0);

        if (currentBalance < productPrice) {
            alert(`არ გაქვთ საკმარისი AKHO! გაკლიათ ${productPrice - currentBalance} AKHO.`);
            return;
        }

        // 🟢 1. ბალანსის ჩამოჭრა
        const newBalance = currentBalance - productPrice;
        await userRef.update({ akhoBalance: newBalance });

        // 🟢 2. შეკვეთის გაფორმება
        const orderInfo = {
            buyerUid: user.uid,
            buyerName: document.getElementById('ordFirstName').value + " " + document.getElementById('ordLastName').value,
            address: document.getElementById('ordAddress').value,
            phone: document.getElementById('ordPhone').value,
            productName: currentProduct.name,
            paidAmount: productPrice,
            status: "paid_with_akho",
            timestamp: Date.now()
        };

        await db.ref('orders').push(orderInfo);

        // 🟢 3. აქტივობის ისტორიაში ჩაწერა
        await db.ref(`activities/${user.uid}`).push({
            type: "purchase",
            text: `იყიდე ${currentProduct.name} - ${productPrice} AKHO`,
            timestamp: Date.now()
        });

        alert("შენაძენი წარმატებულია! ✅ AKHO ჩამოგეჭრათ ბალანსიდან.");
        location.reload();

    } catch (e) {
        alert("შეცდომა გადახდისას: " + e.message);
    }
}
