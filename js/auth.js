// =============================
// AUTH.JS CLEAN FIX
// =============================

// REGISTER
async function register(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  

  if(!email || !password){
    alert("Remplis tous les champs");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if(error){
    alert("❌ " + error.message);
    return;
  }
  alert("✅ Compte créé !");
  window.location.href = "login.html";
}

// LOGIN
async function login(){
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");


  if(!emailInput || !passwordInput ){
    console.error("Champs introuvables");
    return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;


  if(!email || !password ){
    alert("Remplis tous les champs");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert(error.message);
    return;
  }

  window.location.href = "profile.html";
}
// LOGOUT
async function logout(){
  await supabaseClient.auth.signOut();
  // redirection vers la page d'accueil ou de connexion
  window.location.href = "registre.html";

}
// =============================
// MATCHES PAGE
// =============================  
function goToAuth(){
  window.location.href = "login.html";
}

// =============================
// UI UPDATE
// =============================
let loading = false;

async function updateAuthUI(){
  if(loading) return;
  loading = true;

  const { data } = await supabaseClient.auth.getUser();
  const user = data.user;

  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if(!authBtn || !logoutBtn){
    loading = false;
    return;
  }

  if(user){
    authBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    authBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  // 👇 affichage FINAL (anti-clignotement)
  document.body.style.visibility = "visible";

  loading = false;
}

// ✅ EN DEHORS
supabaseClient.auth.onAuthStateChange(() => {
  updateAuthUI();
});

document.addEventListener("DOMContentLoaded", updateAuthUI);

