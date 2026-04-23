const client = () => window.supabaseClient;

export async function signup() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) return alert("Remplis tout");

  const { error } = await client().auth.signUp({
    email,
    password
  });

  if (error) return alert(error.message);

  alert("Compte créé !");
  window.location.href = "login.html";
}