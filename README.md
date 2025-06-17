<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plux - Login</title>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"></script>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 30px; }
    #loading { font-size: 20px; }
    #loginForm { display: none; }
  </style>
</head>
<body>
  <div id="loading">Carregando...</div>

  <form id="loginForm">
    <h1>Plux - Login</h1>
    <input type="email" id="email" placeholder="Email" required><br><br>
    <input type="password" id="password" placeholder="Senha" required><br><br>
    <button type="submit">Entrar / Cadastrar</button>
    <p id="loginStatus" style="color: red;"></p>
  </form>

  <script>
    console.log("🔥 Iniciando Plux...");

    const firebaseConfig = {
      apiKey: "AIzaSyBtL4JTvftbw2aHwYd-zRnfhsxCOrx_6cI",
      authDomain: "plux-998a6.firebaseapp.com",
      databaseURL: "https://plux-998a6-default-rtdb.firebaseio.com",
      projectId: "plux-998a6",
      storageBucket: "plux-998a6.appspot.com",
      messagingSenderId: "639722927532",
      appId: "1:639722927532:web:a15a1a3355faf15ad33609",
      measurementId: "G-W0Y5D7SVF5"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    document.addEventListener("DOMContentLoaded", () => {
      console.log("✅ DOM carregado");
      const loginForm = document.getElementById("loginForm");
      const loading = document.getElementById("loading");
      const loginStatus = document.getElementById("loginStatus");

      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log("🔐 Tentando login com:", email);

        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            console.log("✅ Login bem-sucedido");
            window.location.href = "feed.html";
          })
          .catch(() => {
            console.log("⚠️ Login falhou, tentando criar conta...");
            auth.createUserWithEmailAndPassword(email, password)
              .then(() => {
                console.log("✅ Conta criada com sucesso");
                window.location.href = "feed.html";
              })
              .catch(err => {
                console.error("❌ Erro ao criar conta:", err.message);
                loginStatus.innerText = err.message;
              });
          });
      });

      auth.onAuthStateChanged(user => {
        console.log("📡 Verificando autenticação...");
        if (!user) {
          console.log("👤 Nenhum usuário logado");
          loading.style.display = "none";
          loginForm.style.display = "block";
        } else {
          console.log("✅ Usuário logado:", user.email);
          window.location.href = "feed.html";
        }
      });
    });
  </script>
</body>
</html>
