let currentUser = null;

async function initProfile(){
  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "auth.html";
    return;
  }

  currentUser = data.user;

  await loadMyProfile();
  cancelEdit();
}

initProfile();

function loadProfile(){
  loadMyProfile();
}

// LOAD PROFILE
async function loadMyProfile(){
  const { data: { user } } = await supabaseClient.auth.getUser();
 console.log("OK fonction appelée");
  if(!user){
    window.location.href = "auth.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

 const createBox = document.getElementById("profileCreate");
const viewBox = document.getElementById("profileView");

if(!createBox || !viewBox){
  console.warn("Elements profileCreate/profileView introuvables");
  return;
}
  if(profile){
    createBox.style.display = "none";
    viewBox.style.display = "block";
    document.getElementById("viewName").innerText = profile.prenom + " " + profile.nom;
    document.getElementById("viewAgeVille").innerText = profile.age + " ans - " + profile.ville;
    document.getElementById("viewBio").innerText = profile.bio;
    document.getElementById("viewLooking").innerText = profile.lookingfor;
    document.getElementById("viewPhoto").src = profile.photo_url || "https://picsum.photos/200";  

  } else {
    createBox.style.display = "block";
    viewBox.style.display = "none";
  }
  
  // VIEW
  document.getElementById("viewName").innerText = data.prenom || "Sans nom";
  document.getElementById("viewAgeVille").innerText =
    `${data.age || ""} ans • ${data.ville || ""}`;
  document.getElementById("viewBio").innerText = data.bio || "";
  document.getElementById("viewPhoto").src =
    data.photo_url || "https://picsum.photos/200";


  // EDIT
  document.getElementById("edit_prenom").value = data.prenom || "";
  document.getElementById("edit_nom").value = data.nom || "";
  document.getElementById("edit_age").value = data.age || "";
  document.getElementById("edit_ville").value = data.ville || "";
  document.getElementById("edit_bio").value = data.bio || "";
  document.getElementById("edit_lookingFor").value = data.looking_for || "";
}


// ✅ SAVE PROFILE (SORTIE DE LA FONCTION)
async function saveProfile(){
  const { data: { user } } = await supabaseClient.auth.getUser();

  await supabaseClient.from("profiles").insert({
    id: user.id,
    prenom: prenom.value,
    nom: nom.value,
    age: age.value,
    ville: ville.value,
    bio: bio.value,
    lookingfor: lookingFor.value
  });

  alert("Profil créé !");
  loadMyProfile();
}

async function updateProfile(){
  const prenom = document.getElementById("edit_prenom").value;
  const nom = document.getElementById("edit_nom").value;
  const age = document.getElementById("edit_age").value;
  const ville = document.getElementById("edit_ville").value;
  const bio = document.getElementById("edit_bio").value;
  const lookingFor = document.getElementById("edit_lookingFor").value;
  if(!userData.user){
    alert("Erreur utilisateur");
    return;
  }

  const profile = {
    id: userData.user.id,
    prenom,
    nom,
    age,
    ville,
    bio,
    looking_for: lookingFor,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if(error){
    alert(error.message);
    return;
  }

  await loadMyProfile();
  cancelEdit();

  alert("✅ Profil mis à jour !");


// UI
  function enableEdit(){
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
}

function cancelEdit(){
  document.getElementById("profileEdit").style.display = "none";
  document.getElementById("profileView").style.display = "block";
}

// LIKE COUNT
async function loadLikeCount(){
  const { data: userData } = await supabaseClient.auth.getUser();
  if(!userData.user) return;

  const { count, error } = await supabaseClient
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("to_user", userData.user.id);

  if(error) return;

  const el = document.getElementById("likeCount");
  if(el){
    el.innerText = `❤️ ${count || 0} likes`;
  }
}

// DELETE ACCOUNT
async function deleteAccount(){
  if(!confirm("Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.")){
    return;
  } 
  const { data: userData } = await supabaseClient.auth.getUser();
  if(!userData.user){
    alert("Erreur utilisateur");
    return;
  } 
  await supabaseClient.from("profiles").delete().eq("id", userData.user.id);
  await supabaseClient.auth.signOut();
  alert("Compte supprimé");
  window.location.href = "auth.html";
}

// =============================
// ADMIN PANEL
// =============================
async function goToAdmin(){
  const { data } = await supabaseClient.auth.getUser(); 
  if(!data.user){
    alert("Erreur utilisateur");
    return;
  } 
  async function load(){
  const { data } = await supabaseClient.auth.getUser();
}
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();
  if(!profile || !profile.is_admin){
    alert("Accès refusé");
    return;
  }   
    }   
  window.location.href = "admin.html";  

  // LOAD PROFILE (SORTIE DE LA FONCTION) 
  const { data: { user } } = await supabaseClient.auth.getUser();

  await supabaseClient
    .from("profiles")
    .update({
      prenom: edit_prenom.value,
      nom: edit_nom.value,
      age: edit_age.value,
      ville: edit_ville.value,
      bio: edit_bio.value,
      lookingfor: edit_lookingFor.value
    })
    .eq("id", user.id);

  alert("Profil mis à jour !");
  loadMyProfile();
  cancelEdit();
    }   


cancelEdit  

deleteProfile = async () => {
  if(!confirm("Es-tu sûr de vouloir supprimer ton profil ? Cette action est irréversible.")){
    return;
  } 
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user){
    alert("Erreur utilisateur");
    return;
  }
  await supabaseClient.from("profiles").delete().eq("id", user.id);
  alert("Profil supprimé");
  window.location.href = "profile.html";
      } 

adminPanel = async () => {
  const { data } = await supabaseClient.auth.getUser(); 
  if(!data.user){
    alert("Erreur utilisateur");
    return;
  }
  const { data: profile } = await supabaseClient
    .from("profiles")   
    .select("is_admin")
    .eq("id", data.user.id)
    .single();
  if(!profile || !profile.is_admin){
    alert("Accès refusé");
    return;
  } window.location.href = "adminPage.html"; 
}
reportIssue = () => {
  window.location.href = "report.html";
} 

enableEdit = () => {
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
}
