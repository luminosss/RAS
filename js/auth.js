// =============================
// SUPABASE CLIENT SAFE ACCESS
// =============================
const client = () => window.supabaseClient;

// =============================
// LOGIN
// =============================
async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  const errorBox = document.getElementById("errorMsg");

  if (!email || !password) {
    if (errorBox) errorBox.textContent = "Email ou mot de passe manquant";
    return;
  }

  const { error } = await client().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (errorBox) errorBox.textContent = error.message;
    return;
  }

  window.location.href = "index.html";
}

// =============================
// SIGNUP
// =============================
async function signup() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Email ou mot de passe manquant");
    return;
  }

  const { error } = await client().auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Compte créé ✔ Vérifie ton email 📩");
  window.location.href = "login.html";
}

// =============================
// LOGOUT
// =============================
async function logout() {
  await client().auth.signOut();
  window.location.href = "login.html";
}

// =============================
// RESET PASSWORD
// =============================
async function resetPassword() {
  const email = document.getElementById("resetEmail")?.value?.trim();

  if (!email) {
    alert("Email requis");
    return;
  }

  const { error } = await client().auth.resetPasswordForEmail(email);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Email envoyé 📩");
}

// =============================
// AUTH UI (NAVBAR AUTO)
// =============================
async function initAuthUI() {
  const { data } = await client().auth.getUser();

  const btn = document.getElementById("authBtn");
  const userInfo = document.getElementById("userInfo");

  if (!btn) return;

  if (data?.user) {
    btn.textContent = "Déconnexion";
    btn.onclick = logout;

    if (userInfo) {
      userInfo.textContent = data.user.email;
    }

  } else {
    btn.textContent = "Connexion";
    btn.onclick = () => window.location.href = "login.html";

    if (userInfo) {
      userInfo.textContent = "";
    }
  }
}

// =============================
// INIT AUTO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  initAuthUI();
});

// =============================
// GLOBAL EXPORT (IMPORTANT pour onclick HTML)
// =============================
window.login = login;
window.signup = signup;
window.logout = logout;
window.resetPassword = resetPassword;
window.initAuthUI = initAuthUI;