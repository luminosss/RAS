
async function register(){
 const email = document.getElementById("email").value;
 const password = document.getElementById("password").value;

 const { data, error } = await supabaseClient.auth.signUp({
  email,
  password
 });

 if(error){
  alert(error.message);
  return;
 }

 alert("Compte créé !");
 window.location.href = "profile.html";
}

async function login(){
 const email = document.getElementById("email").value;
 const password = document.getElementById("password").value;

 const { data, error } = await supabaseClient.auth.signInWithPassword({
  email,
  password
 });

 if(error){
  alert(error.message);
  return;
 }

 window.location.href = "profile.html";
}