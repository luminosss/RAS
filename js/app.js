let cachedUser = null;
let timeout;
const PAGE_SIZE = 20;
let page = 0;
// =============================
// AUTH
// =============================  

function searchUsers(value){
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    loadMyProfile(value);
  }, 300);
}

async function getUser(){
  if(cachedUser) return cachedUser;

  const { data } = await supabaseClient.auth.getUser();
  cachedUser = data.user;

  return cachedUser;
}
async function loadProfiles(){
  const grid = document.getElementById("profilesGrid");
  if(!grid) return;

const fragment = document.createDocumentFragment();

data.forEach(user => {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img loading="lazy" src="${user.photo_url || 'https://picsum.photos/300'}">
    <h3>${user.prenom || "Sans nom"}</h3>
    <p>${user.age || ""} ans • ${user.ville || ""}</p>
  `;

  fragment.appendChild(card);
});

grid.appendChild(fragment);

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*");

  if(error || !data){
    grid.innerHTML = "Erreur chargement";
    return;
  }

  data.forEach(user => {

    if(user.id === currentUser.id) return;

    const card = document.createElement("div");
    card.className = "card";
  card.onclick = () => openProfile(user);
    card.innerHTML = `
      <img src="${user.photo_url || 'https://picsum.photos/300'}">
      <h3>${user.prenom || "Sans nom"}</h3>
      <p>${user.age || ""} ans • ${user.ville || ""}</p>
    `;

    grid.appendChild(card);
    
  });

  
}
function openProfile(user){
  selectedUser = user; // 🔥 IMPORTANT

  const modal = document.getElementById("profileModal");

  document.getElementById("modalPhoto").src =
    user.photo_url || "https://picsum.photos/300";

  document.getElementById("modalName").innerText =
    user.prenom || "Sans nom";

  document.getElementById("modalAgeVille").innerText =
    `${user.age || ""} ans • ${user.ville || ""}`;

  document.getElementById("modalBio").innerText =
    user.bio || "";

  modal.style.display = "flex";
}

function closeModal(){
  document.getElementById("profileModal").style.display = "none";
}

async function likeFromModal(){
  if(!selectedUser) return;

  await likeUser(selectedUser.id);

  alert("❤️ Like envoyé !");
  closeModal();
}

function messageFromModal(){
  if(!selectedUser) return;

  if(!isUserPremium){
    alert("💎 Premium requis");
    return;
  }

  openChat(selectedUser.id);
  closeModal();
}

async function loadLikesMe(){

  const container = document.getElementById("likesMeGrid");
  if(!container) return;

  container.innerHTML = "Chargement...";

  // récupérer les likes reçus
  const { data: likes, error } = await supabaseClient
    .from("likes")
    .select("from_user")
    .eq("to_user", currentUser.id);

  if(error || !likes){
    container.innerHTML = "Erreur";
    return;
  }

  if(likes.length === 0){
    container.innerHTML = "Personne ne t’a liké pour l’instant 😢";
    return;
  }

  const userIds = likes.map(l => l.from_user);

  // récupérer les profils
  const { data: users } = await supabaseClient
    .from("profiles")
    .limit(20)
    .select("id, prenom, age, ville, photo_url")
    .in("id", userIds);

  container.innerHTML = "";

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${user.photo_url || 'https://picsum.photos/300'}">
      <h3>${user.prenom}</h3>
      <p>${user.age || ""} ans • ${user.ville || ""}</p>
    `;

    card.onclick = () => openProfile(user);

    container.appendChild(card);
  });
}


async function loadMatches(){

  const grid = document.getElementById("matchesGrid");
  if(!grid) return;

  grid.innerHTML = "Chargement...";

  // récupérer les matchs
  const { data: matches, error } = await supabaseClient
    .from("matches")
    .select("*")
    .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`);

  if(error || !matches){
    grid.innerHTML = "Erreur";
    return;
  }

  if(matches.length === 0){
    grid.innerHTML = "Aucun match pour l’instant 😢";
    return;
  }
  const userIds = [...new Set(matches.map(m =>
  m.user1 === currentUser.id ? m.user2 : m.user1
))];

  // récupérer les IDs des autres users
  const userIds = matches.map(m =>
    m.user1 === currentUser.id ? m.user2 : m.user1
  );

  const { data: users } = await supabaseClient
     .from("profiles")
  .select("id, prenom, age, ville, photo_url")
  .limit(20)
    .in("id", userIds);

  grid.innerHTML = "";

  users.forEach(user => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${user.photo_url || 'https://picsum.photos/300'}">
      <h3>${user.prenom}</h3>
      <p>${user.age || ""} ans • ${user.ville || ""}</p>
      <button onclick="openChat('${user.id}')">💬 Discuter</button>
    `;

    grid.appendChild(card);
  });
}
if(window.location.pathname.includes("matches.html")){
  document.addEventListener("DOMContentLoaded", () => {
    loadMatches();
  });
}

async function loadMoreProfiles(){
  const { data } = await supabaseClient
    .from("profiles")
    .select("id, prenom, age, ville, photo_url")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  page++;
}

async function login(){
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");  
const passwordconfirmInput = document.getElementById("password_confirm");
const telUserInput = document.getElementById("tel_user"); 
}