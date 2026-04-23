const client = () => window.supabaseClient;

export async function logout() {
  await client().auth.signOut();
  window.location.href = "login.html";
}