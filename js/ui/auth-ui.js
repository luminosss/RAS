import { login } from "../auth/login.js";
import { signup } from "../auth/signup.js";
import { logout } from "../auth/logout.js";

window.login = login;
window.signup = signup;
window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if (loginBtn) loginBtn.onclick = login;
  if (signupBtn) signupBtn.onclick = signup;
});