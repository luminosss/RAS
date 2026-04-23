const client = () => window.supabaseClient;

export async function resetPassword(email) {
  const { error } = await client()
    .auth
    .resetPasswordForEmail(email);

  if (error) return alert(error.message);

  alert("Email envoyé 📩");
}