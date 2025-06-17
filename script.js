
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

  auth.onAuthStateChanged(user => {
    if (!user && location.pathname !== "/index.html") {
      window.location.href = "index.html";
    } else {
      if (location.pathname.includes("feed.html")) loadFeed();
      if (location.pathname.includes("perfil.html")) loadMyPosts();
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
    feed.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>${post.email}</strong></p>
        <p>${post.text}</p>
        ${post.image ? `<img src="${post.image}" width="200"/>` : ""}
        <p>Likes: ${post.likes}</p>
        <button onclick="likePost('${doc.id}')">Curtir</button>
        ${auth.currentUser.uid === post.userId ? `<button onclick="deletePost('${doc.id}')">Apagar</button>` : ""}
        <hr/>
      `;
      feed.appendChild(div);
    });
  });
}

function loadMyPosts() {
  db.collection("posts").where("userId", "==", auth.currentUser.uid).orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const section = document.getElementById("myPosts");
    section.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${post.text}</p>
        ${post.image ? `<img src="${post.image}" width="200"/>` : ""}
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
  const ref = db.collection("posts").doc(id);
  ref.get().then(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    if (!data.likedBy.includes(user.uid)) {
      ref.update({
        likes: data.likes + 1,
        likedBy: [...data.likedBy, user.uid]
      });
    }
  });
}

function deletePost(id) {
  if (confirm("Tem certeza que deseja apagar este post?")) {
    db.collection("posts").doc(id).delete();
  }
}
