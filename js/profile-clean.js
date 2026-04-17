let currentUser = null;

// =============================
// INIT
// =============================
async function initProfile(){
  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "auth.html";
    return;
  }

  currentUser = data.user;

  await loadMyProfile();
  cancelEdit(); // ✅ ici c’est bon
  setupPhotoPreview();
}

initProfile();

// =============================
// LOAD PROFILE (REMPLIR CHAMPS)
// =============================
async function loadMyProfile(){
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if(!data) return;

  // VIEW MODE
const photo = document.getElementById("viewPhoto");
if(photo) photo.src = data.photo_url || "...";

  document.getElementById("viewName").innerText =
    data.prenom;

  document.getElementById("viewAgeVille").innerText =
    `${data.age || ""} ans • ${data.ville || ""}`;

  document.getElementById("viewBio").innerText =
    data.bio || "";

  document.getElementById("viewLooking").innerText =
    data.looking_for || "";

  // EDIT MODE (pré-remplir)
  document.getElementById("prenom").value = data.prenom || "";
  document.getElementById("nom").value = data.nom || "";
  document.getElementById("age").value = data.age || "";
  document.getElementById("ville").value = data.ville || "";
  document.getElementById("bio").value = data.bio || "";
  document.getElementById("lookingFor").value = data.looking_for || "";
}
// =============================
// SAVE PROFILE (CREATE + UPDATE)
// =============================
async function saveProfile(){

  const prenom = document.getElementById("prenom").value;
  const nom = document.getElementById("nom").value;
  const age = document.getElementById("age").value;
  const ville = document.getElementById("ville").value;
  const bio = document.getElementById("bio").value;
  const lookingFor = document.getElementById("lookingFor").value;

  if(!prenom){
    alert("Le prénom est obligatoire");
    return;
  }

  let photo_url = null;

  const file = document.getElementById("photoInput").files[0];

  if(file){
    const filePath = `${currentUser.id}_${Date.now()}`;

    const { error } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, file);

    if(error){
      alert("Erreur upload");
      return;
    }

    const { data } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(filePath);

    photo_url = data.publicUrl;
  }

  const profile = {
    id: currentUser.id,
    prenom,
    nom,
    age,
    ville,
    bio,
    looking_for: lookingFor
  };

  if(photo_url) profile.photo_url = photo_url;

  const { error  } = await supabaseClient
    .from("profiles")
    .upsert(profile);

  if(error){
    alert(error.message);
    return;
  }

  alert("✅ Profil enregistré !");
}


function enableEdit(){
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
}

function cancelEdit(){
  document.getElementById("profileView").style.display = "block";
  document.getElementById("profileEdit").style.display = "none";
}

function setupPhotoPreview(){
  const fileInput = document.getElementById("photoInput");
  const preview = document.getElementById("preview");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}
