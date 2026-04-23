let currentUser = null;

// =============================
// INIT ADMIN
// =============================
async function initAdmin() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "auth.html";
    return;
  }

  currentUser = data.user;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !profile?.is_admin) {
    alert("Accès refusé");
    window.location.href = "app.html";
    return;
  }

  await Promise.all([loadUsers(), loadReports(), loadStats()]);
}

initAdmin();

// =============================
// USERS
// =============================
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*");

  if (error) return console.error(error);

  const container = document.getElementById("usersList");
  container.innerHTML = "";

  data.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${user.prenom || "Sans nom"}</strong><br>
      ${user.premium ? "💎 Premium" : "Standard"}<br>
      ${user.banned ? "🚫 Banni" : ""}
      ${user.is_suspect ? "⚠️ Suspect" : ""}<br>
      Score: ${user.fake_score || 0}
      <br><br>

      <button onclick="toggleBan('${user.id}', ${user.banned})">
        ${user.banned ? "Débannir" : "Bannir"}
      </button>

      <button onclick="makePremium('${user.id}')">
        Donner Premium
      </button>
    `;

    container.appendChild(card);
  });
}

// =============================
// BAN / UNBAN
// =============================
async function toggleBan(userId, isBanned) {
  const { error } = await supabaseClient
    .from("profiles")
    .update({ banned: !isBanned })
    .eq("id", userId);

  if (error) {
    alert("Erreur lors du ban/unban");
    return;
  }

  loadUsers();
}

// =============================
// PREMIUM
// =============================
async function makePremium(userId) {
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 30);

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      premium: true,
      premium_until: expireDate.toISOString()
    })
    .eq("id", userId);

  if (error) {
    alert("Erreur premium");
    return;
  }

  loadUsers();
}

// =============================
// REPORTS
// =============================
async function loadReports() {
  const { data, error } = await supabaseClient
    .from("reports")
    .select("*");

  if (error) return console.error(error);

  const container = document.getElementById("reportsList");
  container.innerHTML = "";

  data.forEach(report => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      🚨 Utilisateur: ${report.reported_user}<br>
      Motif: ${report.reason}
      <br><br>

      <button onclick="deleteReport(${report.id})">
        Supprimer
      </button>
    `;

    container.appendChild(card);
  });
}

async function deleteReport(id) {
  const { error } = await supabaseClient
    .from("reports")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression report");
    return;
  }

  loadReports();
}

// =============================
// STATS
// =============================
async function loadStats() {
  const [{ data: users }, { data: matches }] = await Promise.all([
    supabaseClient.from("profiles").select("*"),
    supabaseClient.from("matches").select("*")
  ]);

  document.getElementById("stats").innerHTML = `
    👥 Utilisateurs: ${users?.length || 0}<br>
    💘 Matchs: ${matches?.length || 0}
  `;
}