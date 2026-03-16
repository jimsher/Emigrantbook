const products = [
            { id: 1, cat: 'ხინკალი', name: 'ხინკალი ქალაქური', price: 1.50, desc: 'ხორცი, მწვანილი, სანელებლები', img: 'https://img.freepik.com/free-photo/khinkali-with-meat-parsley_140725-3343.jpg', extras: [{n:'არაჟანი', p:1}, {n:'წიწაკა', p:0}] },
            { id: 2, cat: 'ხაჭაპური', name: 'აჭარული ხაჭაპური', price: 15.00, desc: 'ყველი, ცომი, კვერცხი, კარაქი', img: 'https://img.freepik.com/free-photo/khachapuri-with-egg-cheese_140725-3341.jpg', extras: [{n:'ორმაგი ყველი', p:3}, {n:'დამატებითი კვერცხი', p:1.5}] },
            { id: 3, cat: 'ხაჭაპური', name: 'იმერული ხაჭაპური', price: 12.00, desc: 'ტრადიციული იმერული ყველით', img: 'https://img.freepik.com/free-photo/khachapuri-imeretian-traditional-georgian-flatbread-with-cheese_2829-14234.jpg', extras: [{n:'კარაქი', p:0.5}] },
            { id: 4, cat: 'მწვადი', name: 'ღორის მწვადი', price: 18.00, desc: 'კახური მწვადი საფერავში', img: 'https://img.freepik.com/free-photo/grilled-meat-skewers-with-onion-greens_140725-3344.jpg', extras: [{n:'ტყემალი', p:1}, {n:'ორმაგი ხახვი', p:0}] },
            { id: 5, cat: 'სასმელი', name: 'ლიმონათი ნატახტარი', price: 2.50, desc: 'მსხალი, ტარხუნა ან საფერავი', img: 'https://img.freepik.com/free-photo/glass-bottles-with-colorful-soda_144627-14231.jpg', extras: [] }
        ];

        let cart = [];
        let currentProduct = null;
        let currentQty = 1;

        // Render Menu
        function initMenu() {
            const grid = document.getElementById('menuGrid');
            grid.innerHTML = products.map(p => `
                <div class="product-card" onclick="openModal(${p.id})">
                    <img src="${p.img}" class="product-img">
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-price">${p.price.toFixed(2)} AKHO</div>
                    </div>
                </div>
            `).join('');
        }

        function filterMenu(cat, btn) {
            document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const grid = document.getElementById('menuGrid');
            const filtered = cat === 'all' ? products : products.filter(p => p.cat === cat);
            grid.innerHTML = filtered.map(p => `
                <div class="product-card" onclick="openModal(${p.id})">
                    <img src="${p.img}" class="product-img">
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-price">${p.price.toFixed(2)} AKHO</div>
                    </div>
                </div>
            `).join('');
        }

        // Modal Logic
        function openModal(id) {
            currentProduct = products.find(p => p.id === id);
            currentQty = 1;
            document.getElementById('qtyVal').innerText = currentQty;
            document.getElementById('modImg').src = currentProduct.img;
            document.getElementById('modTitle').innerText = currentProduct.name;
            document.getElementById('modDesc').innerText = currentProduct.desc;
            
            const ingBox = document.getElementById('ingredientsBox');
            ingBox.innerHTML = currentProduct.extras.map((ex, i) => `
                <div class="ingredient-row">
                    <span>${ex.n} (+${ex.p} AKHO)</span>
                    <input type="checkbox" class="ing-check" data-name="${ex.n}" data-price="${ex.p}">
                </div>
            `).join('');

            document.getElementById('modalOverlay').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('modalOverlay').style.display = 'none';
        }

        function changeQty(v) {
            currentQty = Math.max(1, currentQty + v);
            document.getElementById('qtyVal').innerText = currentQty;
        }

        function addToCart() {
            const selectedExtras = [];
            document.querySelectorAll('.ing-check:checked').forEach(el => {
                selectedExtras.push({ n: el.dataset.name, p: parseFloat(el.dataset.price) });
            });

            const cartItem = {
                ...currentProduct,
                qty: currentQty,
                selectedExtras: selectedExtras,
                totalPrice: (currentProduct.price + selectedExtras.reduce((a, b) => a + b.p, 0)) * currentQty
            };

            cart.push(cartItem);
            updateCartUI();
            closeModal();
        }

        function updateCartUI() {
            document.getElementById('cartCount').innerText = cart.length;
        }

        function toggleCart() {
            if(cart.length === 0) return alert("კალათა ცარიელია!");
            let list = cart.map(i => `${i.name} x${i.qty} - ${i.totalPrice.toFixed(2)} AKHO`).join('\n');
            let total = cart.reduce((a, b) => a + b.totalPrice, 0);
            if(confirm("თქვენი შეკვეთა:\n" + list + "\n\nჯამში: " + total.toFixed(2) + " AKHO\nგსურთ გაგრძელება?")) {
                alert("შეკვეთა მიღებულია! კურიერი მალე დაგიკავშირდებათ.");
                cart = [];
                updateCartUI();
            }
        }

        window.onload = initMenu;
