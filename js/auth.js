// =============================
// AUTH.JS — VERSION CLEAN
// =============================

// =============================
// REGISTER
// =============================
async function register(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    alert("Remplis tous les champs");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if(error){
    alert("❌ " + error.message);
    return;
  }

  // créer profil de base
  if(data.user){
    await supabaseClient.from("profiles").insert({
      id: data.user.id,
      prenom: "",
      created_at: new Date().toISOString()
    });
  }

  alert("✅ Compte créé !");
  window.location.href = "profile.html";
}

// =============================
// LOGIN
// =============================
async function login(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    alert("Remplis tous les champs");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert("❌ " + error.message);
    return;
  }

  alert("✅ Connecté !");
  window.location.href = "profile.html";
}

// =============================
// LOGOUT
// =============================
async function logout(){
  await supabaseClient.auth.signOut();
  alert("👋 Déconnecté");
  window.location.href = "auth.html";
}

// =============================
// CHECK SESSION (auto redirect)
// =============================
async function checkUser(){
  const { data } = await supabaseClient.auth.getUser();

  // ❌ on bloque plus l'accès à auth.html
  // ✔ on affiche juste info console
  if(data.user){
    console.log("Utilisateur déjà connecté");
  }
}

// =============================
// PASSWORD RESET (bonus)
// =============================
async function resetPassword(){
  const email = document.getElementById("email").value;

  if(!email){
    alert("Entre ton email");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

  if(error){
    alert("❌ " + error.message);
    return;
  }

  alert("📩 Email de réinitialisation envoyé !");
}


function goToAuth(){
  window.location.href = "auth.html";
}
// UI UPDATE (au chargement)
// =============================
updateAuthUI();

// =============================
// LISTENER AUTH (TRÈS IMPORTANT)
// =============================

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log("Auth change:", event);
  updateAuthUI();
});

let isUIReady = false;
let loading = false;

async function updateAuthUI(){
  if(loading) return;
  loading = true;

  const { data } = await supabaseClient.auth.getUser();
  const user = data.user;

  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userBox = document.getElementById("userBox");

  if(!authBtn || !logoutBtn || !userBox){
    loading = false;
    return;
  }

  if(user){
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("prenom, photo_url")
      .eq("id", user.id)
      .single();

    authBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userBox.style.display = "flex";

    document.getElementById("navName").innerText =
      profile?.prenom || "Utilisateur";

    document.getElementById("navAvatar").src =
      profile?.photo_url || "https://via.placeholder.com/40";

  } else {
    authBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userBox.style.display = "none";
  }

  console.log("updateAuthUI called");
console.log("user =", user);

  loading = false;
}
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  
});