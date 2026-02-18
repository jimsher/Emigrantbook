// 1. Stripe-ის ინიციალიზაცია შენი Public Key-თ
// ჩასვი შენი რეალური pk_test_... ან pk_live_...
const stripe = Stripe('pk_live_51SuyvsCXT0cS1aAkm7S19htCJmNPp8Jt9DVK1zRj13YusEvVEmMEqtm5zoGSJ1VJfEEHUOHokudLyLjmfKFd9F5N00BnJobamI'); 

async function processOrderAndPay() {
    // ვაგროვებთ მონაცემებს ფორმიდან
    const customerInfo = {
        firstName: document.getElementById('ordFirstName').value,
        lastName: document.getElementById('ordLastName').value,
        email: document.getElementById('ordEmail').value,
        address: document.getElementById('ordAddress').value,
        city: document.getElementById('ordCity').value,
        phone: document.getElementById('ordPhone').value
    };

    if (!customerInfo.firstName || !customerInfo.email || !customerInfo.address) {
        alert("გთხოვთ შეავსოთ აუცილებელი ველები!");
        return;
    }

    // 2. ვინახავთ მონაცემებს Firebase-ში, რომ არ დაგვეკარგოს
    const orderRef = db.ref('orders').push();
    await orderRef.set({
        ...customerInfo,
        productName: currentProduct.name,
        amount: currentProduct.price,
        status: "waiting_payment",
        timestamp: Date.now()
    });

    // 3. გადაყვანა Stripe-ზე
    // რადგან შენ უკვე გაქვს გამზადებული პროდუქტები Stripe-ზე, 
    // შეგიძლია პირდაპირ გამოიძახო Checkout.
    
    stripe.redirectToCheckout({
        lineItems: [{
            // თუ Stripe Dashboard-ში გაქვს ფასის ID (price_...), ჩასვი აქ.
            // თუ არა, შეგვიძლია "on-the-fly" შევქმნათ.
            price: ',ჩემი გასაღები ', 
            quantity: 1,
        }],
        mode: 'payment',
        successUrl: window.location.origin + '/success.html',
        cancelUrl: window.location.origin + '/cancel.html',
    }).then(function (result) {
        if (result.error) {
            alert(result.error.message);
        }
    });
}
