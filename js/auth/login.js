const client = () => window.supabaseClient;

export async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) return alert("Remplis tout");

  const { error } = await client().auth.signInWithPassword({
    email,
    password
  });

  if (error) return alert(error.message);

  window.location.href = "index.html";
}