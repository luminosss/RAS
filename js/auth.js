const supabaseClient = supabase; // IMPORTANT si ton config utilise supabase

// =============================
// AUTH FUNCTIONS
// =============================

// 🔐 SIGNUP
async function signup() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Email ou mot de passe manquant");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert("Erreur inscription : " + error.message);
    return;
  }

  alert("Compte créé !");
  window.location.href = "login.html";
}


// 🔑 LOGIN
async function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Email ou mot de passe manquant");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Erreur connexion : " + error.message);
    return;
  }

  window.location.href = "index.html";
}


// 🚪 LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


// =============================
// HEADER UI
// =============================
async function initAuthUI() {
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user;

  const btn = document.getElementById("authBtn");
  const userInfo = document.getElementById("userInfo");

  if (!btn) return;

  if (user) {
    btn.textContent = "Déconnexion";

    btn.onclick = async (e) => {
      e.preventDefault();
      await logout();
    };

    if (userInfo) {
      userInfo.style.display = "inline";
      userInfo.textContent = user.email;
    }

  } else {
    btn.textContent = "Connexion";
    btn.onclick = () => {
      window.location.href = "login.html";
    };

    if (userInfo) {
      userInfo.style.display = "none";
    }
  }
}


// =============================
// INIT BUTTON EVENTS (SIMPLE)
// =============================
document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.onclick = login;

  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) signupBtn.onclick = signup;

  initAuthUI();
});


// =============================
// EXPORT
// =============================
window.login = login;
window.signup = signup;
window.logout = logout;
window.initAuthUI = initAuthUI;