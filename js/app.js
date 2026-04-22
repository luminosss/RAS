let cachedUser = null;
let timeout;
const PAGE_SIZE = 20;
let page = 0;
let selectedUser = null;

// =============================
// AUTH
// =============================  

function searchUsers(value){
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    loadProfile(value);
  }, 300);
}

async function getUser(){
  if(cachedUser) return cachedUser;

  const { data } = await supabaseClient.auth.getUser();
  cachedUser = data.user;
  return cachedUser;
}

// =============================
// PROFILES
// =============================  

async function loadProfiles() {
  currentUser = await getUser();

  const { data: profiles, error } = await supabaseClient
    .from("profiles")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const grid = document.getElementById("profilesGrid");
  if(!grid) return;

  grid.innerHTML = "";

  profiles.forEach(profile => {
    const card = document.createElement("div");
    card.className = "profile-card";

card.innerHTML = `
  <img src="${profile.photo_url || "https://picsum.photos/200"}" alt="photo">

  <h3>${profile.prenom || "Sans nom"}</h3>

  <p>
    ${profile.age || "?"} ans 
    ${profile.ville ? "• " + profile.ville : ""}
  </p>
  <button onclick="viewProfile('${profile.id}')">Voir</button>
  <button onclick="likeUser('${profile.id}')">❤️ Like</button>
`;
    grid.appendChild(card);
  });
}

// =============================
// PROFILE VIEW
// =============================  

async function viewProfile(userId) {
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return;

  document.getElementById("profileView").style.display = "block";

  document.getElementById("viewName").innerText =
    `${profile.prenom} ${profile.nom}`;

  document.getElementById("viewAgeVille").innerText =
    `${profile.age} ans - ${profile.ville}`;

  document.getElementById("viewBio").innerText = profile.bio || "";
  document.getElementById("viewLooking").innerText = profile.lookingfor || "";

  document.getElementById("viewPhoto").src =
    `${profile.photo_url || "https://picsum.photos/200"}`;
}

// =============================
// LIKE SYSTEM
// =============================  

async function likeUser(targetUserId){
  try {
    const user = await getUser();

    if(!user){
      alert("Connecte-toi");
      return;
    }

    // 🔥 éviter double like
    const { data: already } = await supabaseClient
      .from("likes")
      .select("*")
      .eq("from_user", user.id)
      .eq("to_user", targetUserId)
      .maybeSingle();

    if(already){
      alert("Tu as déjà liké 😅");
      return;
    }

    // ❤️ enregistrer like
    const { error } = await supabaseClient
      .from("likes")
      .insert({
        from_user: user.id,
        to_user: targetUserId
      });

    if(error){
      console.error(error);
      alert("Erreur like");
      return;
    }

    // 🔍 vérifier si match
    const { data: matchLike } = await supabaseClient
      .from("likes")
      .select("*")
      .eq("from_user", targetUserId)
      .eq("to_user", user.id)
      .maybeSingle();

    if(matchLike){
      await createMatch(user.id, targetUserId);
      alert("💖 MATCH !");
    } else {
      alert("❤️ Like envoyé");
    }
    if(matchLike){
  await createMatch(user.id, targetUserId);

  alert("💖 MATCH !");

  // 🔥 ouverture auto du chat
  openChat(targetUserId);
}

  } catch(err){
    console.error(err);
  }
}
// =============================
//  CHAT BLOQUÉ SI PAS PREMIUM
// =============================

async function messageUser(userId){
  if(!isUserPremium){
    alert("💎 Premium requis pour envoyer un message");
    return;
  }

  openChat(userId);
}
// =============================
// tchat
// ============================= 
function openChat(userId){
  window.location.href = `app.html?user=${userId}`;
}
// =============================
//  voir qui ta like
// =============================
async function loadLikesMe(){
  const container = document.getElementById("likesMeGrid");
  if(!container) return;

  container.innerHTML = "Chargement...";

  const user = await getUser();
  if(!user){
    container.innerHTML = "Connecte-toi";
    return;
  }

  // 🔍 récupérer les likes reçus
  const { data: likes, error } = await supabaseClient
    .from("likes")
    .select("from_user")
    .eq("to_user", user.id);

  if(error){
    console.error(error);
    container.innerHTML = "Erreur";
    return;
  }

  if(!likes || likes.length === 0){
    container.innerHTML = "Personne ne t’a liké 😢";
    return;
  }

  const userIds = likes.map(l => l.from_user);

  // 👤 récupérer profils
  const { data: users } = await supabaseClient
    .from("profiles")
    .select("id, prenom, age, ville, photo_url")
    .in("id", userIds);

  container.innerHTML = "";

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
    <img src="${profile.photo_url || "https://picsum.photos/200"}">
      <h3>${user.prenom}</h3>
      <p>${user.age || "?"} ans • ${user.ville || ""}</p>

      <button onclick="likeUser('${user.id}')">❤️ Like retour</button>
    `;

    container.appendChild(card);
  });
}

// =============================
// MATCHES
// ============================= 
async function createMatch(user1, user2){

  // éviter doublon match
  const { data: existing } = await supabaseClient
    .from("matches")
    .select("*")
    .or(`and(user1.eq.${user1},user2.eq.${user2}),and(user1.eq.${user2},user2.eq.${user1})`)
    .maybeSingle();

  if(existing) return;

  await supabaseClient.from("matches").insert({
    user1,
    user2
  });
}

 

async function loadMatches(){
  currentUser = await getUser();

  const grid = document.getElementById("matchesGrid");
  if(!grid) return;

  grid.innerHTML = "Chargement...";

  const { data: matches, error } = await supabaseClient
    .from("matches")
    .select("*")
    .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`);

  if(error || !matches){
    grid.innerHTML = "Erreur";
    return;
  }

  if(matches.length === 0){
    grid.innerHTML = "Aucun match 😢";
    return;
  }

  const userIds = [...new Set(matches.map(m =>
    m.user1 === currentUser.id ? m.user2 : m.user1
  ))];

  const { data: users } = await supabaseClient
    .from("profiles")
    .select("id, prenom, age, ville, photo_url")
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

window.addEventListener("load", () => {
  loadProfiles();
});