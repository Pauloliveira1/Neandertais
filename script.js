let db = firebase.firestore();
let auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Tenta fazer login
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          console.log("Login successful! Redirecting to feed.html");
          window.location.href = "feed.html";
        })
        .catch(signInError => {
          console.error("Sign-in error:", signInError.message);
          // Se o login falhar (por exemplo, usuário não encontrado), tenta criar a conta
          // ATENÇÃO: Essa lógica de criar conta automaticamente após falha no login pode não ser o ideal para UX.
          // Considere dar uma mensagem de erro clara e ter um botão de "Cadastre-se" separado.
          auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
              console.log("Account created and logged in! Redirecting to feed.html");
              window.location.href = "feed.html";
            })
            .catch(createError => {
              console.error("Create user error:", createError.message);
              document.getElementById("loginStatus").innerText = createError.message;
            });
        });
    });
  }

  // --- Lógica de redirecionamento e carregamento de conteúdo ajustada aqui ---
  auth.onAuthStateChanged(user => {
    console.log("auth.onAuthStateChanged fired. User:", user ? user.uid : "No user");
    console.log("Current Pathname:", location.pathname);

    // Lista de caminhos considerados "públicos" (onde o usuário não precisa estar logado)
    const publicPaths = ["/", "/index.html"];
    const isCurrentPagePublic = publicPaths.includes(location.pathname);

    if (!user) { // Usuário NÃO LOGADO
      if (!isCurrentPagePublic) {
        // Se não há usuário e a página atual NÃO é pública, redireciona para a página de login
        console.log("No user, private page. Redirecting to index.html");
        window.location.href = "index.html";
      } else {
        // Se não há usuário e a página é pública (index.html), não faz nada (espera o login)
        console.log("No user, public page. Staying on index.html");
      }
    } else { // Usuário LOGADO
      if (isCurrentPagePublic && location.pathname !== "/feed.html") {
        // Se o usuário está logado E está em uma página pública (tipo index.html),
        // E NÃO é a página do feed (para evitar loop), redireciona para o feed
        console.log("User logged in, currently on public page. Redirecting to feed.html");
        window.location.href = "feed.html";
      } else {
        // Usuário logado e na página correta (feed.html ou perfil.html)
        console.log("User logged in, handling page content.");
        if (location.pathname.includes("feed.html")) {
          loadFeed();
          console.log("Loading Feed...");
        }
        if (location.pathname.includes("perfil.html")) {
          loadMyPosts();
          console.log("Loading My Posts for Profile...");
        }
      }
    }
  });
});

function logout() {
  auth.signOut().then(() => {
    console.log("User logged out. Redirecting to index.html");
    window.location.href = "index.html";
  }).catch(error => {
    console.error("Logout error:", error);
    // Opcional: exibir mensagem de erro de logout
  });
}

function goToProfile() {
  console.log("Navigating to perfil.html");
  window.location.href = "perfil.html";
}

function goToFeed() {
  console.log("Navigating to feed.html");
  window.location.href = "feed.html";
}

function createPost() {
  const text = document.getElementById("postText").value.trim();
  const image = document.getElementById("imageLink").value.trim();
  const user = auth.currentUser;

  if (!user) {
    console.warn("No user logged in to create post.");
    // Opcional: mostrar mensagem para o usuário
    return;
  }
  if (!text) {
    console.warn("Post text is empty.");
    // Opcional: alertar o usuário para digitar algo
    return;
  }

  db.collection("posts").add({
    text,
    image: image || "",
    userId: user.uid,
    email: user.email,
    timestamp: Date.now(),
    likes: 0,
    likedBy: []
  }).then(() => {
    console.log("Post created successfully!");
    document.getElementById("postText").value = "";
    document.getElementById("imageLink").value = "";
  }).catch(error => {
    console.error("Error creating post:", error);
    // Opcional: exibir mensagem de erro
  });
}

function loadFeed() {
  // Garante que o Firebase esteja inicializado e o usuário esteja logado antes de tentar carregar o feed
  if (!auth.currentUser) {
    console.log("No user to load feed. Waiting for auth state.");
    return;
  }
  db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const feed = document.getElementById("feed");
    if (!feed) { // Verifica se o elemento 'feed' existe na página atual
      console.log("Element 'feed' not found on this page.");
      return;
    }
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
  }, error => {
    console.error("Error loading feed:", error);
  });
}

function loadMyPosts() {
  if (!auth.currentUser) {
    console.log("No user to load my posts. Waiting for auth state.");
    return;
  }
  db.collection("posts").where("userId", "==", auth.currentUser.uid).orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const section = document.getElementById("myPosts");
    if (!section) { // Verifica se o elemento 'myPosts' existe na página atual
      console.log("Element 'myPosts' not found on this page.");
      return;
    }
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
  }, error => {
    console.error("Error loading my posts:", error);
  });
}

function likePost(id) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Cannot like post: No user logged in.");
    return;
  }
  const ref = db.collection("posts").doc(id);
  ref.get().then(doc => {
    if (!doc.exists) {
      console.warn("Post does not exist:", id);
      return;
    }
    const data = doc.data();
    if (data.likedBy && !data.likedBy.includes(user.uid)) { // Verifica se 'likedBy' existe antes de usar 'includes'
      ref.update({
        likes: data.likes + 1,
        likedBy: [...data.likedBy, user.uid]
      }).then(() => console.log("Post liked:", id))
        .catch(error => console.error("Error liking post:", error));
    } else {
        console.log("Post already liked by this user or likedBy array is missing.");
    }
  }).catch(error => {
    console.error("Error getting post for like:", error);
  });
}

function deletePost(id) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("Cannot delete post: No user logged in.");
    return;
  }

  // Opcional: Verificação de autorização antes de apagar
  db.collection("posts").doc(id).get().then(doc => {
    if (!doc.exists) {
      console.warn("Post to delete does not exist:", id);
      return;
    }
    if (doc.data().userId !== user.uid) {
      console.warn("Unauthorized attempt to delete post:", id);
      alert("Você não tem permissão para apagar este post.");
      return;
    }

    if (confirm("Tem certeza que deseja apagar este post?")) {
      db.collection("posts").doc(id).delete()
        .then(() => console.log("Post deleted:", id))
        .catch(error => console.error("Error deleting post:", error));
    }
  }).catch(error => {
    console.error("Error checking post ownership before delete:", error);
  });
}
