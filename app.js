window.onerror = function(msg){
 alert("Erreur JS: " + msg);
};
let currentUser = null;
let currentProfile = null;
let currentProfileId = null;
let currentChatUser = null;

// NAVIGATION
function showPage(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById(id).classList.add('active');
}

// AUTH BUTTON
function updateAuthButton(){
 const btn = document.getElementById("authBtn");
 if(!btn) return;
 btn.innerText = currentUser ? "Déconnexion" : "Connexion";
}

function handleAuth(){
 currentUser ? logout() : showPage('login');
}

// AUTH
async function register(){

 const email = document.getElementById("regEmail").value;
 const pass = document.getElementById("regPass").value;

 if(!email || !pass){
  return alert("Remplis les champs");
 }

 const { data, error } = await supabase.auth.signUp({
  email,
  password: pass
 });

 if(error) return alert(error.message);

 alert("Compte créé !");
}

async function login(){

 const email = document.getElementById("logEmail").value;
 const pass = document.getElementById("logPass").value;

 const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password: pass
 });

 if(error) return alert(error.message);

 alert("Connecté !");
}

async function logout(){
 await supabase.auth.signOut();
 currentUser = null;
 updateAuthButton();
 showPage('home');
 alert("👋 Déconnecté");
}

// AUTO LOGIN
supabase.auth.getSession().then(({ data })=>{
 if(data.session){
  currentUser = data.session.user;
  updateAuthButton();
  loadMyProfile();
 }
});

// PROFIL
async function loadMyProfile(){
 const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

 currentProfile = data;

 if(!data.prenom) showPage('profile');
 else showProfiles();
}

await supabase.from('profiles').upsert({
 id: currentUser.id,
 prenom: document.getElementById("prenomInput").value,
 age: document.getElementById("ageInput").value,
 ville: document.getElementById("villeInput").value,
 bio: document.getElementById("bioInput").value
});

 loadMyProfile();


// AFFICHAGE PROFILS
async function showProfiles(){
 showPage('profiles');

 const { data } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', currentUser.id);
  
const list = document.getElementById("list");
list.innerHTML = '';

 data.forEach(u=>{
  list.innerHTML += `
  <div class="card" onclick="openProfile('${u.id}')">
  <b>${u.prenom || 'Sans nom'}</b>
<p>${u.age || ''} ${u.ville || ''}</p>
  </div>`;
 });
}

// VOIR PROFIL
async function openProfile(id){
 const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', id)
  .single();

currentProfileId = id;

 showPage('profileView');

 pvName.innerText = data.prenomInput;
 pvInfo.innerText = data.ageInput + " ans - " + data.villeInput;
 pvDesc.innerText = data.bioInput;

 const match = await isMatch(id);
 pvMatch.innerText = match ? "🔥 MATCH !" : "";
}

// LIKE
async function like(id){
 if(!currentUser) return alert("Connecte-toi");

 await supabase.from('likes').insert({
  from_user: currentUser.id,
  to_user: id
 });

 alert("❤️ Like envoyé");
}

// MATCH
async function isMatch(id){
 const { data } = await supabase
  .from('likes')
  .select('*')
  .or(`and(from_user.eq.${currentUser.id},to_user.eq.${id}),and(from_user.eq.${id},to_user.eq.${currentUser.id})`);

 return data.length >= 2;
}

// CHAT
async function openChat(){
 if(!currentProfileId) return;

 const match = await isMatch(currentProfileId);
 if(!match) return alert("Match requis");

 currentChatUser = { id: currentProfileId };

 showPage('chatPage');
 loadMessages();
}

async function sendMessage(){
 if(!msg.value) return;

 await supabase.from('messages').insert({
  from_user: currentUser.id,
  to_user: currentChatUser.id,
  text: msg.value
 });

 msg.value='';
 loadMessages();
}

async function loadMessages(){
 const { data } = await supabase
  .from('messages')
  .select('*')
  .or(`and(from_user.eq.${currentUser.id},to_user.eq.${currentChatUser.id}),and(from_user.eq.${currentChatUser.id},to_user.eq.${currentUser.id})`)
  .order('created_at');

 chatBox.innerHTML='';

 data.forEach(m=>{
  let me = m.from_user === currentUser.id;
  chatBox.innerHTML += `<div class="message ${me?'me':'other'}">${m.text}</div>`;
 });
}

// PREMIUM
function startPayment(){
 if(!currentUser) return alert("Connecte-toi");
 alert("👑 Premium bientôt connecté");
}