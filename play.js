async function processOrderAndPay() {
    const user = auth.currentUser;
    const btn = document.querySelector("#orderFormModal button");
    
    if (!user) return alert("ავტორიზაცია აუცილებელია!");

    const customerInfo = {
        firstName: document.getElementById('ordFirstName').value,
        lastName: document.getElementById('ordLastName').value,
        address: document.getElementById('ordAddress').value,
        phone: document.getElementById('ordPhone').value,
        email: document.getElementById('ordEmail').value,
        productName: currentProduct.name,
        price: parseFloat(currentProduct.price), // ფასი რიცხვად
        uid: user.uid,
        timestamp: Date.now()
    };

    // ვალიდაცია
    if (!customerInfo.firstName || !customerInfo.address || !customerInfo.phone) {
        alert("შეავსეთ აუცილებელი ველები!");
        return;
    }

    btn.innerText = "მუშავდება...";
    btn.disabled = true;

    const userRef = db.ref(`users/${user.uid}`);

    try {
        // 1. ვამოწმებთ მომხმარებლის ბალანსს
        const userSnap = await userRef.once('value');
        const userData = userSnap.val();
        const currentBalance = parseFloat(userData.akho || 0);

        if (currentBalance < customerInfo.price) {
            alert(`არ გაქვს საკმარისი AKHO! ბალანსზე გაქვს: ${currentBalance.toFixed(2)}`);
            btn.innerText = "გადახდა 🚀";
            btn.disabled = false;
            return;
        }

        // 2. ბალანსის ჩამოჭრა (akho ველიდან)
        await userRef.update({ akho: currentBalance - customerInfo.price });

        // 3. შეკვეთის შენახვა 'orders' სექციაში
        customerInfo.status = "paid_with_akho";
        await db.ref('orders').push(customerInfo);

        // 4. თუ კალათა იყო, ვასუფთავებთ
        if (currentProduct.isCart) {
            await db.ref(`userCarts/${user.uid}`).remove();
        }

        alert("შენაძენი წარმატებულია! ✅ AKHO ჩამოგეჭრა ბალანსიდან.");
        location.reload();

    } catch (e) {
        console.error(e);
        alert("შეცდომაა: " + e.message);
    } finally {
        btn.innerText = "გადახდა 🚀";
        btn.disabled = false;
    }
}
