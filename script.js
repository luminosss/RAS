let currentUser = null;
let currentChatUser = null;

// INIT
initAuth();
subscribeConversations();
subscribeNotifications();

// NAV
function showPage(id){
 document.querySelectorAll('.page').forEach(p=>p.style.display="none");
 document.getElementById(id).style.display="block";
}

// AUTH
async function initAuth(){
 const { data: { session } } = await supabaseClient.auth.getSession();
 if(session){
  currentUser = session.user;
  loadSwipe();
 }
}

// SWIPE TINDER
async function loadSwipe(){

 showPage("profiles");

 const container = document.getElementById("swipeContainer");
 container.innerHTML = "";

 const { data } = await supabaseClient
  .from('profiles')
  .select('*')
  .neq('id', currentUser.id);

  const res = await fetch("/predict-match", {
 method:"POST",
 headers:{ "Content-Type":"application/json" },
 body: JSON.stringify({ me, user: u })
});

const data = await res.json();
const percent = Math.round(data.probability * 100);

 data.reverse().forEach(u => {

card.innerHTML = `
 <img src="${u.photos?.[0] || 'https://picsum.photos/400'}">
 <div style="position:absolute;bottom:20px;left:20px;color:white;">
  <h2>${u.prenom}, ${u.age}</h2>
  <p>📍 ${u.ville}</p>
  <p>${u.bio || ""}</p>
  <p>💘 ${percent}% match</p>
 </div>
`;
 });
 
}

// LIKE
async function like(id){
 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: id
 });
}

// CHAT
function openChat(id){
 currentChatUser = id;
 showPage("chatPage");
 loadMessages(id);
}

async function loadMessages(id){
 const box = document.getElementById("chatBox");
 box.innerHTML = "";

 const { data } = await supabaseClient
  .from('messages')
  .select('*')
  .or(`from_user.eq.${currentUser.id},to_user.eq.${id}`)
  .order('created_at');

 data.forEach(m=>{
  const div = document.createElement("div");
  div.innerText = m.text || "🎤 vocal";
  box.appendChild(div);
 });
}

// SEND MESSAGE (premium)
async function sendMessage(){

 const { data } = await supabaseClient
  .from('profiles')
  .select('premium')
  .eq('id', currentUser.id)
  .single();

 if(!data.premium) return alert("💎 Premium requis");

 await supabaseClient.from('messages').insert({
  from_user: currentUser.id,
  to_user: currentChatUser,
  text: msg.value
 });

 msg.value = "";
}

// CONVERSATIONS
async function loadConversations(){

 showPage("conv");

 const list = document.getElementById("convList");
 list.innerHTML = "";

 const { data } = await supabaseClient
  .from('messages')
  .select('*');

 const map = {};

 data.forEach(m=>{
  const other = m.from_user === currentUser.id ? m.to_user : m.from_user;
  if(!map[other]) map[other] = m;
 });

 for(const id in map){

  const div = document.createElement("div");
  div.innerText = map[id].text || "🎤 vocal";

  div.onclick = () => openChat(id);

  list.appendChild(div);
 }
}

// IA BIO
async function generateBio(){
 const res = await fetch("/generate-bio",{method:"POST"});
 const data = await res.json();
 bio.value = data.bio;
}

// STRIPE
async function goPremium(){
 const res = await fetch("/create-checkout-session",{method:"POST"});
 const data = await res.json();
 location.href = data.url;
}

//Save profil 

async function saveProfile(){

 let photos = [];

 if(photoInput.files.length){

  for(const file of photoInput.files){

   const name = currentUser.id + "-" + Date.now();

   await supabaseClient.storage
    .from('avatars')
    .upload(name, file);

   const url = supabaseClient.storage
    .from('avatars')
    .getPublicUrl(name).data.publicUrl;

   photos.push(url);
  }
 }

 await supabaseClient.from('profiles').upsert({
  id: currentUser.id,
  prenom: prenom.value,
  age: age.value,
  ville: ville.value,
  bio: bio.value,
  interests: interests.value.split(","),
  looking_for: lookingFor.value,
  photos: photos
 });

 alert("Profil enregistré 🔥");
}

async function improveProfile(){

 const payload = {
  prenom: prenom.value,
  age: age.value,
  ville: ville.value,
  bio: bio.value,
  interests: interests.value,
  looking_for: lookingFor.value
 };

 const res = await fetch("/improve-profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
 });

 const data = await res.json();

 // Remplir automatiquement
 bio.value = data.bio;
 interests.value = data.interests.join(", ");

 alert("🔥 Profil amélioré !");
}

function suggestProfileTips(user){

 let tips = [];

 if(!user.bio) tips.push("Ajoute une bio 🔥");
 if(!user.photos?.length) tips.push("Ajoute des photos 📸");
 if(!user.interests?.length) tips.push("Ajoute des intérêts ❤️");

 return tips;
}

async function getAIMatches(){

 const { data: me } = await supabaseClient
  .from('profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

 const { data: users } = await supabaseClient
  .from('profiles')
  .select('*')
  .neq('id', currentUser.id);

 const res = await fetch("/ai-match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ me, users })
 });

 const result = await res.json();

 return result.matches; // ids triés
}
async function analyzePhoto(file){

 const formData = new FormData();
 formData.append("file", file);

 const res = await fetch("/analyze-photo", {
  method:"POST",
  body: formData
 });

 const data = await res.json();

 alert(data.feedback);
}

async function autoBoostProfile(){

 const { data: me } = await supabaseClient
  .from('profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

 let score = 0;

 if(me.bio) score++;
 if(me.photos?.length) score++;
 if(me.interests?.length) score++;

 if(score < 2){

  const res = await fetch("/boost-profile", {
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body: JSON.stringify(me)
  });

  const data = await res.json();

  bio.value = data.bio;
 }
}