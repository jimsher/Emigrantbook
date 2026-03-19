document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ფონდის სტატისტიკის დინამიური ათვლა (ანიმაცია) ---
    // Backend-თან მუშაობისას ეს ციფრები API-დან წამოვა.
    const statsData = {
        totalRaised: 125400, // ₾
        donorsCount: 345,
        casesSolved: 12
    };

    // ანიმაციის ფუნქცია
    function animateValue(obj, start, end, duration, format = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let val = Math.floor(progress * (end - start) + start);
            
            // ფორმატირება
            if (format === 'currency') {
                obj.innerHTML = val.toLocaleString('ka-GE') + ' ₾';
            } else {
                obj.innerHTML = val.toLocaleString('ka-GE');
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // ანიმაციის გაშვება ჩატვირთვისას
    animateValue(document.getElementById('total-raised'), 0, statsData.totalRaised, 2000, 'currency');
    animateValue(document.getElementById('donors-count'), 0, statsData.donorsCount, 1500);
    animateValue(document.getElementById('cases-solved'), 0, statsData.casesSolved, 1000);

    // --- 2. მოდალური ფანჯრის ლოგიკა ---
    const modal = document.getElementById('donateModal');
    const modalTitle = document.getElementById('modal-case-name');
    const donateButtons = document.querySelectorAll('.open-donate-modal');
    const closeBtn = document.querySelector('.close-modal');

    // მოდალის გახსნა
    donateButtons.forEach(button => {
        button.addEventListener('click', () => {
            const caseName = button.getAttribute('data-case'); // ვიგებთ რომელი ქეისია
            modalTitle.innerText = caseName;
            modal.style.display = 'block';
        });
    });

    // მოდალის დახურვა (X ღილაკით)
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // მოდალის დახურვა გარე კლიკით
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // --- 3. შემოწირულობის ფორმის დამუშავება ---
    const donateForm = document.getElementById('donateForm');

    donateForm.addEventListener('submit', (e) => {
        e.preventDefault(); // არ გადატვირთოს გვერდი

        const amount = document.getElementById('donate-amount').value;
        const donorName = document.getElementById('donor-name').value || "ანონიმური ემიგრანტი";
        const selectedMethod = document.querySelector('input[name="payment"]:checked').value;
        const caseName = modalTitle.innerText;

        // --- მნიშვნელოვანი: Backend ინტეგრაცია ---
        // აქ უნდა მოხდეს API Request-ის გაგზავნა Backend სერვერზე.
        // მაგალითად:
        
        console.log("მონაცემები Backend-ისთვის:", {
            caseName,
            amount,
            donorName,
            paymentMethod: selectedMethod
        });

        if (selectedMethod === 'card') {
            alert(`მადლობა, ${donorName}! თქვენი შემოწირულობა (${amount} ₾) მუშავდება. გადავდივართ ბანკის უსაფრთხო გვერდზე...`);
            // აქ დაემატება: window.location.href = 'bank_payment_link_from_backend';
        } else {
            alert(`მადლობა! თქვენი მოთხოვნა მიღებულია. საბანკო რეკვიზიტებს გადმოგცემთ ელ-ფოსტაზე.`);
        }

        modal.style.display = 'none'; // მოდალის დახურვა
        donateForm.reset(); // ფორმის გასუფთავება
    });
});
