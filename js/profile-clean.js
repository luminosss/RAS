let currentUser = null;

// =============================
// LOAD PROFILE
// =============================
async function loadProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const createBox = document.getElementById("profileCreate");
  const viewBox = document.getElementById("profileView");

  if (!createBox || !viewBox) return;

  if (profile) {
    createBox.style.display = "none";
    viewBox.style.display = "block";

    document.getElementById("viewName").innerText =
      `${profile.prenom || ""} ${profile.nom || ""}`;

    document.getElementById("viewAgeVille").innerText =
      `${profile.age || ""} ans - ${profile.ville || ""}`;

    document.getElementById("viewBio").innerText = profile.bio || "";
    document.getElementById("viewLooking").innerText = profile.lookingfor || "";

    document.getElementById("viewPhoto").src =
      `${profile.photo_url || "https://picsum.photos/200"}`;
  } else {
    createBox.style.display = "block";
    viewBox.style.display = "none";
  }
  
}

// =============================
// SAVE PROFILE
// =============================
async function saveProfile(){
  const user = await getUser();


  const prenom = document.getElementById("prenom").value;
  const nom = document.getElementById("nom").value;
  const age = document.getElementById("age").value;
  const ville = document.getElementById("ville").value;
  const bio = document.getElementById("bio").value;
  let photo_url = null;

  // 📸 upload photo si ajoutée
  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files[0];

  if(file){
    const fileName = `${user.id}_${Date.now()}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(fileName, file);

    if(uploadError){
      console.error(uploadError);
      alert("Erreur upload photo");
      return;
    }

    const { data } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(fileName);

    photo_url = data.publicUrl;
  }

  // 💾 sauvegarde
  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      id: user.id,
      prenom,
      nom,
      age,
      ville,
      bio,
      ...(photo_url && { photo_url }) // garde ancienne si pas modifiée
    });

  if(error){
    alert("Erreur : " + error.message);
    return;
  }
    if(!user){
    alert("Connecte-toi");
    return;
  }

  alert("✅ Profil mis à jour");
}

// =============================
// UPDATE PROFILE
// =============================
async function updateProfile(){
  const user = await getUser();

  const prenom = document.getElementById("edit_prenom").value;
  const nom = document.getElementById("edit_nom").value;
  const age = document.getElementById("edit_age").value;
  const ville = document.getElementById("edit_ville").value;
  const bio = document.getElementById("edit_bio").value;

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      prenom,
      nom,
      age,
      ville,
      bio
    })
    .eq("id", user.id);

  if(error){
    alert("Erreur : " + error.message);
    return;
  }

  alert("✅ Profil modifié !");
}

// =============================
// UPDATE photo
// =============================
async function uploadPhoto(){
  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files[0];

  if(!file){
    alert("Choisis une image");
    return;
  }

  const user = await getUser();

  const fileName = `${user.id}_${Date.now()}`;

  // 📤 upload dans Supabase Storage
  const { error: uploadError } = await supabaseClient.storage
    .from("avatars") // ⚠️ nom du bucket
    .upload(fileName, file);

  if(uploadError){
    console.error(uploadError);
    alert("Erreur upload");
    return;
  }

  // 🔗 récupérer URL publique
  const { data } = supabaseClient.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const photo_url = data.publicUrl;

  // 💾 sauvegarder en base
  await supabaseClient
    .from("profiles")
    .update({ photo_url })
    .eq("id", user.id);

  alert("✅ Photo mise à jour");

  // 🔄 refresh
 document.getElementById("maPhoto").src = photo_url;
}

// =============================
// UI EDIT
// =============================
function enableEdit() {
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
}

function cancelEdit() {
  document.getElementById("profileEdit").style.display = "none";
  document.getElementById("profileView").style.display = "block";
}

// =============================
// LIKE COUNT
// =============================
async function loadLikeCount() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { count } = await supabaseClient
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("to_user", user.id);

  const el = document.getElementById("likeCount");
  if (el) {
    el.innerText = `❤️ ${count || 0} likes`;
  }
}

// =============================
// DELETE PROFILE
// =============================
async function deleteProfile() {
  if (!confirm("Supprimer ton profil ?")) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  await supabaseClient.from("profiles").delete().eq("id", user.id);

  alert("Profil supprimé");
  window.location.href = "index.html";
}

// =============================
// ADMIN
// =============================
async function adminPanel() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabaseClient()
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    alert("Accès refusé");
    return;
  }
 window.location.href = "adminPage.html";
 
}

window.addEventListener("load", () => {
  loadProfile(); 
});

// =============================
// Mon profil
// =============================
async function loadMyProfiles(){
  const user = await getUser();

  if(!user) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if(!profile) return;

  document.getElementById("prenom").value = profile.prenom || "";
   document.getElementById("nom").value = profile.nom || "";
  document.getElementById("age").value = profile.age || "";
  document.getElementById("ville").value = profile.ville || "";
  document.getElementById("bio").value = profile.bio || "";

  // afficher photo
  if(profile.photo_url){
    document.getElementById("previewPhoto").src = profile.photo_url;
  }
}