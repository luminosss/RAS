// =============================
// GLOBAL STATE
// =============================
let cachedUser = null;
let timeout = null;
let currentUser = null;


// =============================
// AUTH - GET USER (cache)
// =============================
async function getUser() {
  if (cachedUser) return cachedUser;

  const { data } = await supabase.auth.getUser();
  cachedUser = data.user;

  return cachedUser;
}


// =============================
// SEARCH (debounce)
// =============================
function searchUsers(value) {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    loadProfiles();
  }, 300);
}


// =============================
// LOAD PROFILES
// =============================
async function loadProfiles() {
  currentUser = await getUser();

  let query = supabase.from("profiles").select("*");

  // 🎯 filtre âge
  const ageFilter = document.getElementById("searchAge")?.value;

  if (ageFilter) {
    const [min, max] = ageFilter.split("-");
    query = query.gte("age", min).lte("age", max);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  const grid = document.getElementById("profilesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!profiles || profiles.length === 0) {
    grid.innerHTML = "Aucun profil trouvé 😢";
    return;
  }

  profiles.forEach(profile => {
    const card = document.createElement("div");
    card.className = "profile-card";

    card.innerHTML = `
      <img src="${profile.photo_url || "https://picsum.photos/200"}">
      <h3>${profile.prenom || "Sans nom"}</h3>
      <p>${profile.age || "?"} ans ${profile.ville ? "• " + profile.ville : ""}</p>

      <button onclick="viewProfile('${profile.id}')">Voir</button>
      <button onclick="likeUser('${profile.id}')">❤️ Like</button>
      <button onclick="messageUser('${profile.id}')">💌 Message</button>
    `;

    grid.appendChild(card);
  });
}


// =============================
// MESSAGE USER
// =============================
async function messageUser(userId) {
  const user = await getUser();

  if (!user) {
    alert("Connecte-toi");
    return;
  }

  if (user.id === userId) {
    alert("Impossible 😅");
    return;
  }

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .or(
      `and(user1.eq.${user.id},user2.eq.${userId}),and(user1.eq.${userId},user2.eq.${user.id})`
    )
    .maybeSingle();

  if (!match) {
    alert("💡 Vous devez matcher avant de discuter !");
    return;
  }

  openChat(userId);
}


// =============================
// VIEW PROFILE
// =============================
async function viewProfile(userId) {
  const box = document.getElementById("profileView");

  if (box.style.display === "block" && box.dataset.userId === userId) {
    box.style.display = "none";
    box.dataset.userId = "";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return;

  box.style.display = "block";
  box.dataset.userId = userId;

  document.getElementById("viewName").innerText =
    `${profile.prenom || ""} ${profile.nom || ""}`;

  document.getElementById("viewAgeVille").innerText =
    `${profile.age || ""} ans - ${profile.ville || ""}`;

  document.getElementById("viewBio").innerText = profile.bio || "";
  document.getElementById("viewLooking").innerText = profile.lookingfor || "";

  document.getElementById("viewPhoto").src =
    profile.photo_url || "https://picsum.photos/200";
}


// =============================
// CLOSE PROFILE
// =============================
function closeProfile() {
  const box = document.getElementById("profileView");
  box.style.display = "none";
  box.dataset.userId = "";
}


// =============================
// LIKE SYSTEM
// =============================
async function likeUser(targetUserId) {
  const user = await getUser();

  if (!user) {
    alert("Connecte-toi");
    return;
  }

  if (user.id === targetUserId) {
    alert("Tu peux pas te liker 😅");
    return;
  }

  // déjà liké ?
  const { data: already } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user", user.id)
    .eq("to_user", targetUserId)
    .maybeSingle();

  if (already) {
    alert("Déjà liké 😅");
    return;
  }

  // insert like
  const { error } = await supabase
    .from("likes")
    .insert({
      from_user: user.id,
      to_user: targetUserId
    });

  if (error) {
    console.error(error);
    return;
  }

  // check match
  const { data: matchLike } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user", targetUserId)
    .eq("to_user", user.id)
    .maybeSingle();

  if (matchLike) {
    await createMatch(user.id, targetUserId);
    alert("💖 MATCH !");
    openChat(targetUserId);
  } else {
    alert("❤️ Like envoyé");
  }
}


// =============================
// CHAT
// =============================
function openChat(userId) {
  window.location.href = `app.html?user=${userId}`;
}


// =============================
// CREATE MATCH
// =============================
async function createMatch(user1, user2) {
  const { data: existing } = await supabase
    .from("matches")
    .select("*")
    .or(
      `and(user1.eq.${user1},user2.eq.${user2}),and(user1.eq.${user2},user2.eq.${user1})`
    )
    .maybeSingle();

  if (existing) return;

  await supabase.from("matches").insert({
    user1,
    user2
  });
}


// =============================
// LOAD MATCHES
// =============================
async function loadMatches() {
  currentUser = await getUser();

  const grid = document.getElementById("matchesGrid");
  if (!grid) return;

  grid.innerHTML = "Chargement...";

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`);

  if (error || !matches) {
    grid.innerHTML = "Erreur";
    return;
  }

  if (matches.length === 0) {
    grid.innerHTML = "Aucun match 😢";
    return;
  }

  const userIds = [...new Set(
    matches.map(m =>
      m.user1 === currentUser.id ? m.user2 : m.user1
    )
  )];

  const { data: users } = await supabase
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


// =============================
// AUTO INIT
// =============================
window.addEventListener("load", () => {
  loadProfiles();
});
document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById("authBtn");
  if (authBtn) {
    authBtn.onclick = () => {
       window.location.href = "login.html";
    };
  }
});

// =============================
// GLOBAL EXPORTS
// =============================
window.loadProfiles = loadProfiles;
window.likeUser = likeUser;
window.viewProfile = viewProfile;
window.closeProfile = closeProfile;
window.messageUser = messageUser;
window.openChat = openChat;
window.loadMatches = loadMatches;
window.searchUsers = searchUsers;
