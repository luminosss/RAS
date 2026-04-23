// =============================
// GLOBAL STATE
// =============================
let currentUser = null;

// =============================
// SAFE DOM ACCESS
// =============================
const el = (id) => document.getElementById(id);

// =============================
// GET CURRENT USER (SAFE)
// =============================
async function getUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) {
      console.error(error);
      return null;
    }

    return data.user;
  } catch (e) {
    console.error("getUser error:", e);
    return null;
  }
}

// =============================
// INIT
// =============================
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 profile init");

  currentUser = await getUser();

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  await Promise.all([
    loadProfile(),
    loadLikeCount(),
    loadMyProfileForm()
  ]);
});

// =============================
// LOAD PROFILE (VIEW MODE)
// =============================
async function loadProfile() {
  if (!currentUser) return;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  const createBox = el("profileCreate");
  const viewBox = el("profileView");

  if (!createBox || !viewBox) return;

  // NO PROFILE → CREATE MODE
  if (!profile) {
    createBox.style.display = "block";
    viewBox.style.display = "none";
    return;
  }

  // VIEW MODE
  createBox.style.display = "none";
  viewBox.style.display = "block";

  el("viewName").textContent = `${profile.prenom || ""} ${profile.nom || ""}`;
  el("viewAgeVille").textContent = `${profile.age || ""} ans - ${profile.ville || ""}`;
  el("viewBio").textContent = profile.bio || "";
  el("viewLooking").textContent = profile.lookingfor || "";

  const img = el("viewPhoto");
  if (img) {
    img.src = profile.photo_url || "https://picsum.photos/200";
  }
}

// =============================
// LOAD FORM (EDIT MODE)
// =============================
async function loadMyProfileForm() {
  if (!currentUser) return;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error || !profile) return;

  el("prenom").value = profile.prenom || "";
  el("nom").value = profile.nom || "";
  el("age").value = profile.age || "";
  el("ville").value = profile.ville || "";
  el("bio").value = profile.bio || "";
  el("lookingFor").value = profile.lookingfor || "";

  const img = el("createPhoto");
  if (img && profile.photo_url) {
    img.src = profile.photo_url;
  }
}

// =============================
// SAVE PROFILE
// =============================
async function saveProfile() {
  if (!currentUser) {
    alert("Connecte-toi");
    return;
  }

  const photoUrl = await uploadPhoto();

  const profileData = {
    id: currentUser.id,
    prenom: el("prenom")?.value || "",
    nom: el("nom")?.value || "",
    age: el("age")?.value || "",
    ville: el("ville")?.value || "",
    bio: el("bio")?.value || "",
    lookingfor: el("lookingFor")?.value || "",
    ...(photoUrl && { photo_url: photoUrl })
  };

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(profileData);

  if (error) {
    console.error(error);
    alert("Erreur sauvegarde profil");
    return;
  }

  alert("💖 Profil enregistré !");
  await loadProfile();
}

// =============================
// UPLOAD PHOTO
// =============================
async function uploadPhoto() {
  const file = el("photoInput")?.files?.[0];
  if (!file || !currentUser) return null;

  const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;

  const { error } = await supabaseClient
    .storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("upload error:", error);
    return null;
  }

  const { data } = supabaseClient
    .storage
    .from("avatars")
    .getPublicUrl(fileName);

  return data?.publicUrl || null;
}

// =============================
// LIKE COUNT
// =============================
async function loadLikeCount() {
  if (!currentUser) return;

  const { count, error } = await supabaseClient
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("to_user", currentUser.id);

  if (error) {
    console.error(error);
    return;
  }

  const counter = el("likeCount");
  if (counter) {
    counter.textContent = `❤️ ${count || 0} likes`;
  }
}

// =============================
// DELETE PROFILE
// =============================
async function deleteProfile() {
  if (!confirm("Supprimer ton profil ?")) return;
  if (!currentUser) return;

  const { error } = await supabaseClient
    .from("profiles")
    .delete()
    .eq("id", currentUser.id);

  if (error) {
    console.error(error);
    alert("Erreur suppression profil");
    return;
  }

  alert("Profil supprimé");
  window.location.href = "index.html";
}

// =============================
// UI TOGGLE
// =============================
function enableEdit() {
  el("profileView").style.display = "none";
  el("profileEdit").style.display = "block";
}

function cancelEdit() {
  el("profileEdit").style.display = "none";
  el("profileView").style.display = "block";
}

// =============================
// EXPORT FOR HTML
// =============================
window.saveProfile = saveProfile;
window.uploadPhoto = uploadPhoto;
window.loadProfile = loadProfile;
window.deleteProfile = deleteProfile;
window.enableEdit = enableEdit;
window.cancelEdit = cancelEdit;