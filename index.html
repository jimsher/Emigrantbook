<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <title>EmigrantBook Pro</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: sans-serif; background: #fafafa; margin: 0; padding-top: 60px; }
        .nav { position: fixed; top: 0; width: 100%; height: 60px; background: white; border-bottom: 1px solid #ddd; display: flex; justify-content: space-around; align-items: center; z-index: 1000; }
        .container { max-width: 500px; margin: 20px auto; padding: 10px; }
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>

<nav class="nav" id="navbar" style="display:none;">
    <button onclick="renderView('feed')">🏠</button>
    <button onclick="renderView('profile')">👤</button>
    <button onclick="logout()">🚪</button>
</nav>

<div id="content" class="container"></div>

<script>
    // 1. კონფიგურაცია
    const supabase = supabase.createClient(
        "https://mohkxmwphwywkqkoairj.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGt4bXdwaHd5d2txa29haXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM6MDc3MzEsImV4cCI6MjA5OTE4MzczMX0.IVGUFWGJAa4X-R6Ul8m4XMpcw1MdP4pcRfwzG9C70ag"
    );

    // 2. გვერდების მართვა
    async function renderView(view) {
        const content = document.getElementById('content');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            content.innerHTML = `
                <div class="card">
                    <h2>შესვლა/რეგისტრაცია</h2>
                    <input id="email" type="email" placeholder="Email">
                    <input id="pass" type="password" placeholder="Password">
                    <button onclick="auth('login')">შესვლა</button>
                    <p>ან</p>
                    <button onclick="auth('signup')" style="background:#4CAF50">რეგისტრაცია</button>
                </div>`;
            document.getElementById('navbar').style.display = 'none';
            return;
        }

        document.getElementById('navbar').style.display = 'flex';

        if (view === 'feed') {
            const { data: posts } = await supabase.from('posts').select('*');
            content.innerHTML = `<h2>Feed</h2>` + (posts || []).map(p => `
                <div class="card"><strong>${p.user_name}</strong><p>${p.text}</p></div>`).join('');
        } else {
            content.innerHTML = `
                <div class="card">
                    <h2>პროფილი</h2>
                    <p>Email: ${user.email}</p>
                    <button onclick="logout()">გასვლა</button>
                </div>`;
        }
    }

    // 3. ავტორიზაცია
    async function auth(type) {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('pass').value;
        const { error } = type === 'login' 
            ? await supabase.auth.signInWithPassword({ email, password: pass })
            : await supabase.auth.signUp({ email, password: pass });
        
        if (error) alert(error.message);
        else location.reload();
    }

    async function logout() {
        await supabase.auth.signOut();
        location.reload();
    }

    // ინიციალიზაცია
    renderView('feed');
</script>
</body>
</html>
