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
 public: "საჯარო", friends: "მეგობრებისთვის", private: "პრივატული", finish: "დასრულება", videos: "ვიდეო",
 followers: "გამომწერი", following: "გამოწერა", photos: "ფოტოები", live: "ლაივი", real_balance: "რეალური ბალანსი",
 editor: "რედაქტორი", balance: "Wallet", logout: "გასვლა", chats: "ჩატები", upload_token: "ატვირთვა", upload: "ატვირთვა",
 cancel: "გაუქმება", home: "მთავარი", people: "ხალხი", chat: "ჩატი", profile: "პროფილი", search_p: "მოძებნე ემიგრანტი...",
 private_profile: "ეს პროფილი პრივატულია", follow: "გამოწერა", following_btn: "გამოწერილია", write: "მიწერა"
 },
 en: {
 welcome: "WELCOME", ob_desc1: "Welcome to a space where every idea turns into a result. Our platform is based on real Impact.", next: "Next",
 ob_desc2: "This is not just a digital asset. The token is a measure of your work and influence.", got_it: "I understand", agreement: "📜 Our Agreement",
 rule1: "Be transparent and real", rule2: "Every action is valued", rule3: "Every IMPACT is reflected on the balance",
 ready: "Ready for Impact!", login: "Login", create_account: "Create Account", register: "Register",
 have_account: "Already have an account?", wallet_desc: "Top up your balance with Stripe", how_it_works: "How AKHO works?",
 cash_out: "Cash Out", min_withdraw: "Minimum withdrawal: 50.00 € (500 AKHO)", withdraw_req: "Withdrawal Request",
 close: "Close", thanks: "Thank You!", payment_msg: "Payment received. AKHO will reflect in 5-10 mins.", check_balance: "Check Balance",
 rules_title: "Rules & Info", what_is_akho: "What is AKHO?", akho_desc: "AKHO is the platform's internal asset...",
 make_money: "How to earn money?", make_money_desc: "Upload TOKEN (video). When someone likes it, you get 2.00 AKHO.", top_up: "Top Up",
 fees: "Rates & Rules", fees_list: "• Like: -0.1 AKHO • Comment: -0.5 AKHO...", comments: "Comments", notifications: "Notifications",
 discover: "Discover", profile_views: "Profile Views", edit: "Edit Profile", full_name: "Full Name",
 location: "Location", age: "Age", relation: "Relationship", single: "Single", married: "Married",
 in_rel: "In Relationship", phone: "Phone", save: "Save Changes", info: "Information", profile_manage: "Manage Profile",
 public: "Public", friends: "For Friends", private: "Private", finish: "Finish", videos: "Videos",
 followers: "Followers", following: "Following", photos: "Photos", live: "Live", real_balance: "Real Balance",
 editor: "Editor", balance: "Wallet", logout: "Logout", chats: "Chats", upload_token: "Upload Token", upload: "Upload",
 cancel: "Cancel", home: "Home", people: "People", chat: "Chat", profile: "Profile", search_p: "Search emigrant...",
 private_profile: "This profile is private", follow: "Follow", following_btn: "Following", write: "Message"
 }
 };

 let currentLang = localStorage.getItem('appLang') || (navigator.language.startsWith('ka') ? 'ka' : 'en');

 function applyLanguage() {
 document.querySelectorAll('[data-key]').forEach(el => {
 const key = el.getAttribute('data-key');
 if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
 });
 
 // Specific Placeholders
 const searchInp = document.getElementById('searchPlaceholder');
 if(searchInp) searchInp.placeholder = translations[currentLang].search_p;
 
 const commInp = document.getElementById('commInp');
 if(commInp) commInp.placeholder = translations[currentLang].comments + "...";

 const msgInp = document.getElementById('messageInp');
 if(msgInp) msgInp.placeholder = translations[currentLang].chat + "...";
 }

 function toggleLanguage() {
 currentLang = currentLang === 'ka' ? 'en' : 'ka';
 localStorage.setItem('appLang', currentLang);
 applyLanguage();
 toggleSideMenu(false);
 }
 // --- END LANGUAGE LOGIC ---
