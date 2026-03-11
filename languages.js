// --- LANGUAGE LOGIC ---
const translations = {
 ka: {
    welcome: "მოგესალმებით", ob_desc1: "შენ მოხვდი სივრცეში, სადაც ყოველი იდეა შედეგად გარდაიქმნება...", next: "შემდეგი",
    ob_desc2: "ეს არ არის უბრალოდ ციფრული აქტივი...", got_it: "გავიგე წესები", agreement: "📜 ჩვენი შეთანხმება",
    rule1: "იყავი გამჭვირვალე და რეალური", rule2: "პლატფორმაზე ქმედება ფასდება", rule3: "ყოველი IMPACT აისახება ბალანსზე",
    ready: "მზად ვარ შედეგისთვის!", login: "შესვლა", create_account: "ანგარიშის შექმნა", register: "რეგისტრაცია",
    have_account: "უკვე გაქვთ ანგარიში?", wallet_desc: "შეავსეთ ბალანსი Stripe გადახდით", how_it_works: "როგორ მუშაობს AKHO?",
    cash_out: "თანხის გატანა", min_withdraw: "მინიმალური გატანა: 50.00 € (500 AKHO)", withdraw_req: "გატანის მოთხოვნა",
    close: "დახურვა", thanks: "მადლობა!", payment_msg: "გადახდა მიღებულია. AKHO აისახება 5-10 წუთში", check_balance: "ბალანსის გადამოწმება",
    rules_title: "წესები და განმარტება", what_is_akho: "რა არის AKHO?", akho_desc: "AKHO არის პლატფორმის შიდა აქტივი...",
    make_money: "როგორ ვიშოვოთ ფული?", make_money_desc: "ატვირთეთ TOKEN (ვიდეო)...", top_up: "ბალანსის შევსება",
    fees: "ტარიფები და წესები", fees_list: "• ლაიქი: -0.1 AKHO...", comments: "კომენტარები", notifications: "შეტყობინებები",
    discover: "აღმოაჩინე", profile_views: "პროფილის ნახვები", edit: "რედაქტირება", full_name: "სრული სახელი",
    location: "საცხოვრებელი ადგილი", age: "ასაკი", relation: "ურთიერთობა", single: "დაუოჯახებელი", married: "დაოჯახებული",
    in_rel: "ურთიერთობაში", phone: "ტელეფონი", save: "შენახვა", info: "ინფორმაცია", profile_manage: "პროფილის მართვა",
    public: "საჯარო", friends: "გეგობრებისთვის", private: "პრივატული", finish: "დასრულება", videos: "ვიდეო",
    followers: "გამომწერი", following: "გამოწერა", photos: "ფოტოები", live: "ლაივი", real_balance: "რეალური ბალანსი",
    editor: "რედაქტორი", balance: "Wallet", logout: "გასვლა", chats: "ჩატები", upload_token: "ატვირთვა", upload: "ატვირთვა",
    cancel: "გაუქმება", home: "მთავარი", people: "ხალხი", chat: "ჩატი", profile: "პროფილი", search_p: "მოძებნე ემიგრანტი...",
    private_profile: "ეს პროფილი პრივატულია", follow: "გამოწერა", following_btn: "გამოწერილია", write: "მიწერა", // <-- აქ დავამატე მძიმე
    impact_store: "IMPACT STORE",
    all: "ყველა",
    my_orders: "ჩემი შეკვეთები",
    clothing: "ტანსაცმელი",
    watches: "საათები",
    digital: "ციფრული",
    physical: "ნივთები",
    vip: "VIP",
    close_btn: "← დახურვა",
  checkout_title: "შეკვეთის გაფორმება",
f_name: "სახელი",
l_name: "გვარი",
address: "სრული მისამართი",
city: "ქალაქი",
post_code: "საფოსტო ინდექსი",
phone_label: "ტელეფონის ნომერი",
confirm_order: "შეკვეთის დადასტურება"
 },
 en: {
    welcome: "WELCOME", ob_desc1: "Welcome to a space where every idea turns into a result.", next: "Next",
    ob_desc2: "This is not just a digital asset.", got_it: "I understand", agreement: "📜 Our Agreement",
    rule1: "Be transparent and real", rule2: "Every action is valued", rule3: "Every IMPACT is reflected on the balance",
    ready: "Ready for Impact!", login: "Login", create_account: "Create Account", register: "Register",
    have_account: "Already have an account?", wallet_desc: "Top up your balance with Stripe", how_it_works: "How AKHO works?",
    cash_out: "Cash Out", min_withdraw: "Minimum withdrawal: 50.00 €", withdraw_req: "Withdrawal Request",
    close: "Close", thanks: "Thank You!", payment_msg: "Payment received.", check_balance: "Check Balance",
    rules_title: "Rules & Info", what_is_akho: "What is AKHO?", akho_desc: "AKHO is the platform's internal asset...",
    make_money: "How to earn money?", make_money_desc: "Upload TOKEN (video).", top_up: "Top Up",
    fees: "Rates & Rules", fees_list: "• Like: -0.1 AKHO...", comments: "Comments", notifications: "Notifications",
    discover: "Discover", profile_views: "Profile Views", edit: "Edit Profile", full_name: "Full Name",
    location: "Location", age: "Age", relation: "Relationship", single: "Single", married: "Married",
    in_rel: "In Relationship", phone: "Phone", save: "Save Changes", info: "Information", profile_manage: "Manage Profile",
    public: "Public", friends: "For Friends", private: "Private", finish: "Finish", videos: "Videos",
    followers: "Followers", following: "Following", photos: "Photos", live: "Live", real_balance: "Real Balance",
    editor: "Editor", balance: "Wallet", logout: "Logout", chats: "Chats", upload_token: "Upload Token", upload: "Upload",
    cancel: "Cancel", home: "Home", people: "People", chat: "Chat", profile: "Profile", search_p: "Search emigrant...",
    private_profile: "This profile is private", follow: "Follow", following_btn: "Following", write: "Message", // <-- აქაც მძიმე
    impact_store: "IMPACT STORE",
    all: "All",
    my_orders: "My Orders",
    clothing: "Clothing",
    watches: "Watches",
    digital: "Digital",
    physical: "Items",
    vip: "VIP",
    close_btn: "← Close",
  checkout_title: "Checkout",
f_name: "First Name",
l_name: "Last Name",
address: "Full Address",
city: "City",
post_code: "Post Code",
phone_label: "Phone Number",
confirm_order: "Confirm Order"
 },
 it: {
    welcome: "BENVENUTO", ob_desc1: "Benvenuti...", next: "Avanti",
    ob_desc2: "Questo non è solo...", got_it: "Ho capito", agreement: "📜 Il nostro accordo",
    rule1: "Sii trasparente", rule2: "Valutata", rule3: "IMPACT",
    ready: "Pronto!", login: "Accedi", create_account: "Crea", register: "Registrati",
    have_account: "Account?", wallet_desc: "Stripe", how_it_works: "AKHO?",
    cash_out: "Preleva", min_withdraw: "50.00 €", withdraw_req: "Richiesta",
    close: "Chiudi", thanks: "Grazie!", payment_msg: "Ricevuto", check_balance: "Saldo",
    rules_title: "Regole", what_is_akho: "Cos'è AKHO?", akho_desc: "Asset...",
    make_money: "Guadagnare?", make_money_desc: "Video...", top_up: "Ricarica",
    fees: "Tariffe", fees_list: "Like...", comments: "Commenti", notifications: "Notifiche",
    discover: "Scopri", profile_views: "Visite", edit: "Modifica", full_name: "Nome",
    location: "Posizione", age: "Età", relation: "Relazione", single: "Single", married: "Sposato/a",
    in_rel: "Relazione", phone: "Telefono", save: "Salva", info: "Info", profile_manage: "Gestisci",
    public: "Pubblico", friends: "Amici", private: "Privato", finish: "Fine", videos: "Video",
    followers: "Follower", following: "Seguiti", photos: "Foto", live: "Live", real_balance: "Saldo",
    editor: "Editor", balance: "Wallet", logout: "Esci", chats: "Chat", upload_token: "Carica", upload: "Carica",
    cancel: "Annulla", home: "Home", people: "Persone", chat: "Chat", profile: "Profilo", search_p: "Cerca...",
    private_profile: "Privato", follow: "Segui", following_btn: "Seguito", write: "Messaggio", // <-- აქაც მძიმე
    impact_store: "IMPACT STORE",
    all: "Tutti",
    my_orders: "I miei ordini",
    clothing: "Abbigliamento",
    watches: "Orologi",
    digital: "Digitale",
    physical: "Oggetti",
    vip: "VIP",
    close_btn: "← Chiudi",
  checkout_title: "Completare l'ordine",
f_name: "Nome",
l_name: "Cognome",
address: "Indirizzo completo",
city: "Città",
post_code: "Codice postale",
phone_label: "Numero di telefono",
confirm_order: "Conferma ordine"
 },
 ru: {
    welcome: "ДОБРО ПОЖАЛОВАТЬ", ob_desc1: "Добро пожаловать...", next: "Далее",
    ob_desc2: "Это не просто...", got_it: "Я понял", agreement: "📜 Соглашение",
    rule1: "Честность", rule2: "Действия", rule3: "Баланс",
    ready: "Готов!", login: "Войти", create_account: "Создать", register: "Регистрация",
    have_account: "Есть аккаунт?", wallet_desc: "Stripe", how_it_works: "AKHO?",
    cash_out: "Вывод", min_withdraw: "50.00 €", withdraw_req: "Запрос",
    close: "Закрыть", thanks: "Спасибо!", payment_msg: "Получен", check_balance: "Баланс",
    rules_title: "Правила", what_is_akho: "Что такое AKHO?", akho_desc: "Актив...",
    make_money: "Заработать?", make_money_desc: "Видео...", top_up: "Пополнение",
    fees: "Тарифы", fees_list: "Лайк...", comments: "Комментарии", notifications: "Уведомления",
    discover: "Обзор", profile_views: "Просмотры", edit: "Изменить", full_name: "Имя",
    location: "Место", age: "Возраст", relation: "Отношения", single: "Холост", married: "В браке",
    in_rel: "В отношениях", phone: "Телефон", save: "Сохранить", info: "Инфо", profile_manage: "Управление",
    public: "Публичный", friends: "Друзья", private: "Приватный", finish: "Конец", videos: "Видео",
    followers: "Подписчики", following: "Подписки", photos: "Фото", live: "Лайв", real_balance: "Баланс",
    editor: "Редактор", balance: "Кошелек", logout: "Выход", chats: "Чаты", upload_token: "Загрузить", upload: "Загрузить",
    cancel: "Отмена", home: "Главная", people: "Люди", chat: "Чат", profile: "Профиль", search_p: "Поиск...",
    private_profile: "Приватный", follow: "Подписаться", following_btn: "Подписки", write: "Написать", // <-- აქაც მძიმე
    impact_store: "IMPACT STORE",
    all: "Все",
    my_orders: "Мои заказы",
    clothing: "Одежда",
    watches: "Часы",
    digital: "Цифровые",
    physical: "Товары",
    vip: "VIP",
    close_btn: "← Закрыть",
  checkout_title: "Оформление заказа",
f_name: "Имя",
l_name: "Фамилия",
address: "Полный адрес",
city: "Город",
post_code: "Почтовый индекс",
phone_label: "Номер телефона",
confirm_order: "Подтвердить заказ"
 }
};

let currentLang = localStorage.getItem('appLang') || (navigator.language.startsWith('ka') ? 'ka' : 'en');

function applyLanguage() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });

    const searchInp = document.getElementById('searchPlaceholder');
    if(searchInp) searchInp.placeholder = translations[currentLang].search_p;

    const commInp = document.getElementById('commInp');
    if(commInp) commInp.placeholder = (translations[currentLang].comments || "Comments") + "...";

    const msgInp = document.getElementById('messageInp');
    if(msgInp) msgInp.placeholder = (translations[currentLang].chat || "Chat") + "...";
}

function toggleLanguage() {
    const langOrder = ['ka', 'en', 'it', 'ru'];
    let currentIndex = langOrder.indexOf(currentLang);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = (currentIndex + 1) % langOrder.length;
    currentLang = langOrder[nextIndex];
    localStorage.setItem('appLang', currentLang);

    applyLanguage();

    const langBtn = document.getElementById('langSwitchBtn');
    if (langBtn) {
        const labels = {
            'ka': 'ენა: ქართული (KA)',
            'en': 'Language: English (EN)',
            'it': 'Lingua: Italiano (IT)',
            'ru': 'Язык: Русский (RU)'
        };
        langBtn.innerText = labels[currentLang];
    }
    toggleSideMenu(false);
}

applyLanguage();
