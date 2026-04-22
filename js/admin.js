let currentUser = null;

// =============================
// INIT
// =============================
async function initAdmin(){
  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "auth.html";
    return;
  }

  currentUser = data.user;

  // vérifier admin
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single();

  if(!profile || !profile.is_admin){
    alert("Accès refusé");
    window.location.href = "app.html";
    return;
  }

  loadUsers();
  loadReports();
  loadStats();
}

initAdmin();

// =============================
// USERS
// =============================
async function loadUsers(){
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*");

  if(error){
    console.error(error);
    return;
  }

  const container = document.getElementById("usersList");
  container.innerHTML = "";

  data.forEach(u => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <strong>${u.prenom || "Sans nom"}</strong><br>
      ${u.premium ? "💎 Premium" : "Standard"}<br>
      ${u.banned ? "🚫 Banni" : ""}
      ${u.is_suspect ? "⚠️ Suspect" : ""}
      Score: ${u.fake_score || 0}
      <br>
      <button onclick="toggleBan('${u.id}', ${u.banned})">
        ${u.banned ? "Débannir" : "Bannir"}
      </button>

      <button onclick="makePremium('${u.id}')">
        Donner Premium
      </button>
    `;

    container.appendChild(div);
  });
}

// =============================
// BAN USER
// =============================
async function blockUser(userId){
  const current = await getUser();

  // 🔒 vérifier admin
  const { data: me } = await supabaseClient
    .from("profiles")
    .select("is_admin")
    .eq("id", current.id)
    .single();

  if(!me?.is_admin){
    alert("Accès refusé");
    return;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .update({ is_blocked: true })
    .eq("id", userId);

  if(error){
    alert("Erreur blocage");
    return;
  }

  alert("🚫 Utilisateur bloqué");
}

// =============================
// PREMIUM
// =============================
async function makePremium(userId){

  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 30);

  await supabaseClient
    .from("profiles")
    .update({
      premium: true,
      premium_until: expireDate.toISOString()
    })
    .eq("id", userId);

  loadUsers();
}

// =============================
// REPORTS
// =============================
async function loadReports(){
  const { data } = await supabaseClient
    .from("reports")
    .select("*");

  const container = document.getElementById("reportsList");
  container.innerHTML = "";

  data.forEach(r => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      🚨 User: ${r.reported_user}<br>
      Motif: ${r.reason}

      <br>
      <button onclick="deleteReport(${r.id})">
        Supprimer
      </button>
    `;

    container.appendChild(div);
  });
}

async function deleteReport(id){
  await supabaseClient
    .from("reports")
    .delete()
    .eq("id", id);

  loadReports();
}

// =============================
// STATS
// =============================
async function loadStats(){
  const { data: users } = await supabaseClient
    .from("profiles")
    .select("*");

  const { data: matches } = await supabaseClient
    .from("matches")
    .select("*");

  document.getElementById("stats").innerHTML = `
    👥 Utilisateurs: ${users.length}<br>
    💘 Matchs: ${matches.length}
  `;
}