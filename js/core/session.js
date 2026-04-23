const client = () => window.supabaseClient;

export async function getUser() {
  const { data } = await client().auth.getUser();
  return data?.user || null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) window.location.href = "login.html";
}