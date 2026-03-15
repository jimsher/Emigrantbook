const menuData = [
    {
        id: 'kh1',
        name: 'ხინკალი ქალაქური',
        price: 1.50,
        category: 'khinkali',
        img: 'https://img.freepik.com/free-photo/khinkali-with-meat-parsley_140725-3343.jpg',
        ingredients: [
            { name: 'მეტი წიწაკა', price: 0 },
            { name: 'არაჟანი', price: 1.00 }
        ]
    },
    {
        id: 'khp1',
        name: 'აჭარული ხაჭაპური',
        price: 15.00,
        category: 'khachapuri',
        img: 'https://img.freepik.com/free-photo/khachapuri-with-egg-cheese_140725-3341.jpg',
        ingredients: [
            { name: 'ორმაგი ყველი', price: 3.00 },
            { name: 'დამატებითი კვერცხი', price: 1.50 }
        ]
    }
];

let selectedDish = null;
let currentQty = 1;

// მენიუს გამოჩენა
function renderMenu(category = 'all') {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = "";
    
    menuData.forEach(dish => {
        if(category !== 'all' && dish.category !== category) return;
        
        grid.innerHTML += `
            <div class="dish-card" onclick="openCustomize('${dish.id}')">
                <img src="${dish.img}" class="dish-img">
                <div class="dish-info">
                    <div class="dish-name">${dish.name}</div>
                    <div class="dish-price">${dish.price.toFixed(2)} AKHO</div>
                </div>
            </div>
        `;
    });
}

// ინგრედიენტების მართვა
function openCustomize(dishId) {
    selectedDish = menuData.find(d => d.id === dishId);
    currentQty = 1;
    document.getElementById('orderQty').innerText = currentQty;
    
    document.getElementById('customDishName').innerText = selectedDish.name;
    document.getElementById('customDishImg').src = selectedDish.img;
    
    const ingList = document.getElementById('ingredientsList');
    ingList.innerHTML = "";
    selectedDish.ingredients.forEach((ing, index) => {
        ingList.innerHTML += `
            <div class="ingredient-item">
                <label>${ing.name} (+${ing.price} AKHO)</label>
                <input type="checkbox" onchange="updateTotalPrice()" data-price="${ing.price}" id="ing-${index}">
            </div>
        `;
    });
    
    document.getElementById('customizeModal').style.display = 'flex';
}

function changeQty(n) {
    currentQty = Math.max(1, currentQty + n);
    document.getElementById('orderQty').innerText = currentQty;
}

function confirmAddToCart() {
    // აქ დავწერთ კალათაში დამატების ლოგიკას და Firebase-ში შენახვას
    alert("შეკვეთა დაემატა კალათაში!");
    document.getElementById('customizeModal').style.display = 'none';
}
