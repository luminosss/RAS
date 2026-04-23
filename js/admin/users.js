const client = () => window.supabaseClient;

export async function loadUsers() {
  const { data } = await client()
    .from("profiles")
    .select("*");

  const box = document.getElementById("usersList");
  if (!box) return;

  box.innerHTML = data.map(u => `
    <div class="user">
      <b>${u.email}</b>
      <p>${u.role}</p>

      <button onclick="banUser('${u.id}')">Ban</button>
      <button onclick="setRole('${u.id}','mod')">Mod</button>
      <button onclick="deleteUser('${u.id}')">Delete</button>
    </div>
  `).join("");
}

export async function banUser(id) {
  await client().from("profiles").update({ banned: true }).eq("id", id);
  loadUsers();
}

export async function deleteUser(id) {
  await client().from("profiles").delete().eq("id", id);
  loadUsers();
}

export async function setRole(id, role) {
  await client().from("profiles").update({ role }).eq("id", id);
  loadUsers();
}