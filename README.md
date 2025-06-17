<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Plux - Login</title>
  <link rel="stylesheet" href="style.css" />
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
</head>
<body>
  <div id="loading">Carregando...</div>

  <form id="loginForm">
    <h1>Plux</h1>
    <input type="email" id="email" placeholder="Email" required /><br />
    <input type="password" id="password" placeholder="Senha" required /><br />
    <button type="submit">Entrar / Cadastrar</button>
    <p id="loginStatus"></p>
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

    document.addEventListener("DOMContentLoaded", () => {
      const loginForm = document.getElementById("loginForm");
      const loading = document.getElementById("loading");
      const loginStatus = document.getElementById("loginStatus");

      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            window.location.href = "feed.html";
          })
          .catch(() => {
            auth.createUserWithEmailAndPassword(email, password)
              .then(() => {
                window.location.href = "feed.html";
              })
              .catch(err => {
                loginStatus.innerText = err.message;
              });
          });
      });

      auth.onAuthStateChanged(user => {
        if (!user) {
          loading.style.display = "none";
          loginForm.style.display = "flex";
        } else {
          window.location.href = "feed.html";
        }
      });
    });
  </script>
</body>
</html>
