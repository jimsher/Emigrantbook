// 1. Stripe-ის ინიციალიზაცია (ეს იწერება სულ თავში, რომ ყველგან იმუშაოს)
const stripe = Stripe('pk_test_51SuyvsCXT0cS1aAkG4sUInRXm9VNUMFK3jPzsqlVK2fJEwWaFaE2P8GgLHK4bOSi9dWRqrjFZNHDxVWEveNGu50d00zUbWFVps'); 

// ცვლადი, რომელიც დაიმახსოვრებს რომელ ნივთს ვყიდულობთ
let currentProduct = null;

// 2. ფუნქცია, რომელიც აგროვებს მონაცემებს და გადაჰყავს გადახდაზე
async function processOrderAndPay() {
    const btn = document.querySelector("#orderFormModal button");
    
    // მონაცემების აღება HTML ველებიდან
    const orderData = {
        name: document.getElementById('ordFirstName').value + " " + document.getElementById('ordLastName').value,
        country: document.getElementById('ordCountry').value,
        city: document.getElementById('ordCity').value,
        address: document.getElementById('ordAddress').value,
        phone: document.getElementById('ordPhone').value,
        email: document.getElementById('ordEmail').value,
        productName: currentProduct.name,
        price: currentProduct.price,
        status: "waiting_payment",
        timestamp: Date.now()
    };

    // ვალიდაცია: თუ რამე აკლია, გააჩეროს
    if (!orderData.name || !orderData.address || !orderData.phone || !orderData.email) {
        alert("გთხოვთ შეავსოთ ყველა აუცილებელი ველი!");
        return;
    }

    btn.innerText = "მუშავდება...";
    btn.disabled = true;

    try {
        // ა) ვინახავთ შეკვეთას Firebase-ში
        const orderRef = db.ref('orders').push();
        await orderRef.set(orderData);

        // ბ) გადამისამართება Stripe-ზე
        if (currentProduct && currentProduct.stripeLink) {
            window.location.href = currentProduct.stripeLink;
        } else {
            alert("შეცდომა: ამ ნივთს Stripe-ის ლინკი არ აქვს მიბმული!");
            btn.disabled = false;
            btn.innerText = "გადახდაზე გადასვლა 🚀";
        }

    } catch (e) {
        console.error(e);
        alert("ბაზაში შენახვა ვერ მოხერხდა!");
        btn.disabled = false;
        btn.innerText = "გადახდაზე გადასვლა 🚀";
    }
}

// 3. ფუნქცია, რომელიც ხსნის შეკვეთის ფორმას (ესეც გჭირდება რომ იმუშაოს)
function openOrderForm() {
    if (!currentProduct) return alert("ჯერ აირჩიეთ ნივთი!");
    document.getElementById('productDetailsModal').style.display = 'none';
    document.getElementById('orderFormModal').style.display = 'flex';
    document.getElementById('finalPriceDisplay').innerText = currentProduct.price + " ₾";
}
