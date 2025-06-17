let db = firebase.firestore();
let auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = "feed.html")
        .catch(() => {
          auth.createUserWithEmailAndPassword(email, password)
            .then(() => window.location.href = "feed.html")
            .catch(err => document.getElementById("loginStatus").innerText = err.message);
        });
    });
  }

  // --- Lógica de redirecionamento ajustada para evitar o loop ---
  auth.onAuthStateChanged(user => {
    // Define os caminhos que devem ser considerados como a página de login
    // Isso é importante porque "index.html" pode ser acessado como "/" ou "/index.html"
    const loginPaths = ["/", "/index.html"];
    const isLoginPage = loginPaths.includes(location.pathname);

    if (!user) { // Usuário NÃO LOGADO
      if (!isLoginPage) {
        // Se o usuário não está logado e não está na página de login, redireciona para o login
        window.location.href = "index.html";
      }
      // Se o usuário não está logado e está na página de login, não faz nada (deixa ele tentar logar)
    } else { // Usuário LOGADO
      if (isLoginPage) {
        // Se o usuário está logado e está na página de login, redireciona para o feed
        window.location.href = "feed.html";
      } else {
        // Se o usuário está logado e não está na página de login (ou seja, feed.html ou perfil.html)
        if (location.pathname.includes("feed.html")) loadFeed();
        if (location.pathname.includes("perfil.html")) loadMyPosts();
      }
    }
  });
});

function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

function goToProfile() {
  window.location.href = "perfil.html";
}

function goToFeed() {
  window.location.href = "feed.html";
}

function createPost() {
  const text = document.getElementById("postText").value.trim();
  const image = document.getElementById("imageLink").value.trim();
  const user = auth.currentUser;
  if (!text) return;
  db.collection("posts").add({
    text,
    image: image || "",
    userId: user.uid,
    email: user.email,
    timestamp: Date.now(),
    likes: 0,
    likedBy: []
  }).then(() => {
    document.getElementById("postText").value = "";
    document.getElementById("imageLink").value = "";
  });
}

function loadFeed() {
  db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const feed = document.getElementById("feed");
    // Certifique-se de que o elemento 'feed' existe na página antes de tentar manipulá-lo
    if (!feed) return; 

    feed.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>${post.email}</strong></p>
        <p>${post.text}</p>
        ${post.image ? <img src="${post.image}" width="200"/> : ""}
        <p>Likes: ${post.likes}</p>
        <button onclick="likePost('${doc.id}')">Curtir</button>
        ${auth.currentUser && auth.currentUser.uid === post.userId ? <button onclick="deletePost('${doc.id}')">Apagar</button> : ""}
        <hr/>
      `;
      feed.appendChild(div);
    });
  });
}

function loadMyPosts() {
  db.collection("posts").where("userId", "==", auth.currentUser.uid).orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const section = document.getElementById("myPosts");
    // Certifique-se de que o elemento 'myPosts' existe na página antes de tentar manipulá-lo
    if (!section) return; 

    section.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${post.text}</p>
        ${post.image ? <img src="${post.image}" width="200"/> : ""}
        <p>Likes: ${post.likes}</p>
        <button onclick="likePost('${doc.id}')">Curtir</button>
        <button onclick="deletePost('${doc.id}')">Apagar</button>
        <hr/>
      `;
      section.appendChild(div);
    });
  });
}

function likePost(id) {
  const user = auth.currentUser;
  if (!user) return; // Não faz nada se não houver usuário logado
  const ref = db.collection("posts").doc(id);
  ref.get().then(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    if (!data.likedBy || !data.likedBy.includes(user.uid)) { // Garante que 'likedBy' exista e o usuário não tenha curtido
      ref.update({
        likes: (data.likes || 0) + 1, // Garante que likes seja um número
        likedBy: [...(data.likedBy || []), user.uid] // Garante que likedBy seja um array
      });
    }
  });
}

function deletePost(id) {
  const user = auth.currentUser;
  if (!user) return; // Não faz nada se não houver usuário logado

  // Verifica se o usuário logado é o autor do post antes de permitir apagar
  db.collection("posts").doc(id).get().then(doc => {
    if (!doc.exists || doc.data().userId !== user.uid) {
      alert("Você não tem permissão para apagar este post.");
      return;
    }
    if (confirm("Tem certeza que deseja apagar este post?")) {
      db.collection("posts").doc(id).delete();
    }
  });
}
