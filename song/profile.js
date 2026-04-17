// =============================
// PROFILE.JS — VERSION CLEAN
// =============================

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

  if(profile.is_suspect){
  alert("⚠️ Compte suspect détecté");
}
  currentUser = data.user;

  await checkProfileExists();
  await loadMyProfile();
  setupPhotoPreview();
}

initProfile();

// =============================
// SAVE PROFILE
// =============================
async function saveProfile(){
  if(!currentUser) return;

  const prenom = document.getElementById("prenom").value;
  const nom = document.getElementById("nom").value;
  const age = document.getElementById("age").value;
  const ville = document.getElementById("ville").value;
  const bio = document.getElementById("bio").value;
  const lookingFor = document.getElementById("lookingFor").value;

  if(!prenom){
    alert("Le prénom est obligatoire");
    return;
 await analyzeProfile(profile);
  }

  let photo_url = null;

  const fileInput = document.getElementById("photoInput");
  const file = fileInput?.files[0];

  // upload photo si présente
  if(file){
    const filePath = `${currentUser.id}_${Date.now()}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, file);

    if(uploadError){
      alert("Erreur upload photo");
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
    looking_for: lookingFor,
  };

  if(photo_url) profile.photo_url = photo_url;

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(profile);

  if(error){
    alert("❌ " + error.message);
    return;
  }

  alert("✅ Profil sauvegardé !");
  window.location.href = "pageDesProfils.html";
}

// =============================
// CHECK PROFILE EXISTS
// =============================
async function checkProfileExists(){
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if(data){
    // profil existe → afficher bouton modifier
    const box = document.querySelector(".box");

    if(box){
      box.insertAdjacentHTML("afterbegin", `
        <div style="margin-bottom:10px;color:green">
          ✅ Profil existant
        </div>
      `);
    }
  }
}

// =============================
// LOAD MY PROFILE
// =============================
async function loadMyProfile(){
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if(!data) return;

  document.getElementById("prenom").value = data.prenom || "";
  document.getElementById("nom").value = data.nom || "";
  document.getElementById("age").value = data.age || "";
  document.getElementById("ville").value = data.ville || "";
  document.getElementById("bio").value = data.bio || "";
  document.getElementById("lookingFor").value = data.looking_for || "";

  // afficher photo
  if(data.photo_url){
    const preview = document.getElementById("preview");
    if(preview) preview.src = data.photo_url;
  }
}

// =============================
// PHOTO PREVIEW
// =============================
function setupPhotoPreview(){
  const input = document.getElementById("photoInput");
  const preview = document.getElementById("preview");

  if(!input || !preview) return;

  input.addEventListener("change", e => {
    const file = e.target.files[0];
    if(file){
      preview.src = URL.createObjectURL(file);
    }
  });
}

// =============================
// PROFILE COMPLETION (score)
// =============================
function profileCompletion(u){
  let score = 0;
  if(u.prenom) score += 20;
  if(u.age) score += 20;
  if(u.ville) score += 20;
  if(u.bio) score += 20;
  if(u.photo_url) score += 20;
  return score;
}
