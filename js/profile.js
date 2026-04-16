async function saveProfile(){

 const { data } = await supabaseClient.auth.getUser();
 const user = data.user;

 if(!user){
  alert("Connecte-toi !");
  return;
 }

 const profile = {
  id: user.id,
  prenom: document.getElementById("prenom").value,
  nom: document.getElementById("nom").value,
  age: document.getElementById("age").value,
  ville: document.getElementById("ville").value,
  bio: document.getElementById("bio").value,
  interests: document.getElementById("interests").value,
  looking_for: document.getElementById("lookingFor").value
 };

 const { error } = await supabaseClient
  .from("profiles")
  .upsert(profile);

 if(error){
  alert(error.message);
 } else {
  alert("✅ Profil enregistré !");
 }
}