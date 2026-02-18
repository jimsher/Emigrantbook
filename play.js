async function processOrderAndPay() {
    const btn = document.querySelector("#orderFormModal button");
    
    const customerInfo = {
        firstName: document.getElementById('ordFirstName').value,
        lastName: document.getElementById('ordLastName').value,
        address: document.getElementById('ordAddress').value,
        phone: document.getElementById('ordPhone').value,
        email: document.getElementById('ordEmail').value,
        productName: currentProduct.name,
        price: currentProduct.price,
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
        // 1. მონაცემების შენახვა Firebase-ში
        await db.ref('orders').push(customerInfo);

        // 2. გადაყვანა Stripe-ზე (ზუსტად ისე, როგორც AKHO-ზე გაქვს)
        if (currentProduct && currentProduct.stripeLink) {
            const finalUrl = currentProduct.stripeLink + "?client_reference_id=" + customerInfo.uid;
            window.open(finalUrl, "_blank");
            
            document.getElementById('orderFormModal').style.display = 'none';
        } else {
            alert("შეცდომა: ამ ნივთს Stripe-ის ლინკი არ აქვს!");
        }
    } catch (e) {
        alert("შეცდომაა!");
    } finally {
        btn.innerText = "გადახდაზე გადასვლა 🚀";
        btn.disabled = false;
    }
}
