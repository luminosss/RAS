let currentUser = null;
let currentChatUser = null;

// INIT
async function init(){

 const { data } = await supabaseClient.auth.getUser();

 if(!data.user){
  window.location.href = "auth.html";
  return;
 }

 currentUser = data.user;

 loadProfiles();
}

init();

// LOAD PROFILES
async function loadProfiles(){

 const container = document.getElementById("profiles");
 container.innerHTML = "";

 const { data } = await supabaseClient
  .from('profiles')
  .select('*')
  .neq('id', currentUser.id);

 data.forEach(u => {

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
   <img src="${u.photo_url || 'https://picsum.photos/300'}">
   <h3>${u.prenom || "Utilisateur"}</h3>
   <p>${u.ville || ""}</p>

   <button onclick="likeUser('${u.id}')">❤️ Like</button>
   <button onclick="openChat('${u.id}')">💬 Chat</button>
  `;

  container.appendChild(card);
  enableSwipe(card, u.id);
 });
}
function loadProfiles(users){

 const stack = document.getElementById("cardStack");
 stack.innerHTML = "";

 users.forEach(u => {
  const card = createSwipeCard(u);
  stack.appendChild(card);
 });
}

// LIKE
async function likeUser(targetId){

 // 1. envoyer like
 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: targetId
 });

 // 2. vérifier si match
 const { data } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('from_user', targetId)
  .eq('to_user', currentUser.id);

 if(data.length > 0){

  // MATCH 🎉
  await supabaseClient.from('matches').insert({
   user1: currentUser.id,
   user2: targetId
  });

  alert("💘 MATCH !");
 }
}
async function likeUser(id){

 if(!isUserPremium){
  alert("💎 Premium requis pour liker sans limite");
 }

 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: id
 });
}

  //JS SWIPE

function enableSwipe(card, userId){

 let startX = 0;

 card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
 });

 card.addEventListener("touchmove", e => {
  let moveX = e.touches[0].clientX - startX;
  card.style.transform = `translateX(${moveX}px) rotate(${moveX/10}deg)`;
 });

 card.addEventListener("touchend", async e => {

  let endX = e.changedTouches[0].clientX;
  let diff = endX - startX;

  if(diff > 100){
   // LIKE
   await likeUser(userId);
   card.remove();
  }
  else if(diff < -100){
   // PASS
   card.remove();
  }
  else{
   card.style.transform = "";
  }
 });
}
if(diff > 50){
 card.style.background = "#d4edda"; // vert
}
if(diff < -50){
 card.style.background = "#f8d7da"; // rouge
}

function createSwipeCard(user){

 const card = document.createElement("div");
 card.className = "card swipe-card";

 card.innerHTML = `
  <img src="${user.photo_url || 'https://picsum.photos/400'}">
  <h2>${user.prenom}</h2>
 `;

 let startX = 0;
 let currentX = 0;
 let velocity = 0;

 card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
 });

 card.addEventListener("touchmove", e => {

  currentX = e.touches[0].clientX - startX;
  velocity = currentX;

  card.style.transform =
   `translateX(${currentX}px) rotate(${currentX/12}deg)`;

  // feedback visuel
  if(currentX > 80){
   card.classList.add("like");
   card.classList.remove("nope");
  }
  else if(currentX < -80){
   card.classList.add("nope");
   card.classList.remove("like");
  }

 });

 card.addEventListener("touchend", async () => {

  // inertie réaliste
  if(currentX > 120){
   card.style.transform = "translateX(1000px) rotate(30deg)";
   await likeUser(user.id);
   card.remove();
  }
  else if(currentX < -120){
   card.style.transform = "translateX(-1000px) rotate(-30deg)";
   card.remove();
  }
  else{
   // retour smooth
   card.style.transition = "transform 0.3s ease";
   card.style.transform = "";
  }

 });

 return card;
}
// 🔔 MATCH LIVE
supabaseClient
 .channel('matches-live')
 .on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'matches'
 }, payload => {

  if(payload.new.user2 === currentUser.id){
   showToast("💘 Nouveau match !");
  }

 })
 .subscribe();


// 💬 MESSAGE LIVE
supabaseClient
 .channel('messages-live')
 .on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'messages'
 }, payload => {

  if(payload.new.to_user === currentUser.id){
   showToast("💬 Nouveau message !");
   loadMessages(); // refresh auto
  }

 })
 .subscribe();

// notification toast
 function showToast(text){

 const toast = document.createElement("div");

 toast.innerText = text;
 toast.style = `
 position:fixed;
 bottom:20px;
 left:50%;
 transform:translateX(-50%);
 background:rgba(0,0,0,0.7);
 color:white;
 padding:12px 20px;
 border-radius:20px;
 backdrop-filter: blur(10px);
 `;

 document.body.appendChild(toast);

 setTimeout(()=> toast.remove(), 3000);
}

// CHAT
function openChat(id){

 if(!isUserPremium){
  alert("💎 Passe Premium pour discuter");
  return;
 }

 currentChatUser = id;
 loadMessages();
}
function subscribeMessages(){

 supabaseClient
  .channel('chat-' + currentChatUser)
  .on('postgres_changes', {
   event: 'INSERT',
   schema: 'public',
   table: 'messages'
  }, payload => {

   const m = payload.new;

   if(
    (m.from_user === currentUser.id && m.to_user === currentChatUser) ||
    (m.to_user === currentUser.id && m.from_user === currentChatUser)
   ){
    displayMessage(m);
   }

  })
  .subscribe();
}

function displayMessage(m){

 const div = document.createElement("div");

 const me = m.from_user === currentUser.id;

 div.className = "msg " + (me ? "me" : "other");

 div.innerText = m.text;

 document.getElementById("chatBox").appendChild(div);
}

async function sendMessage(){

 const text = document.getElementById("msgInput").value;

 await supabaseClient.from('messages').insert({
  from_user: currentUser.id,
  to_user: currentChatUser,
  text
 });

 document.getElementById("msgInput").value = "";

 loadMessages();
}

// LOGOUT
async function logout(){
 await supabaseClient.auth.signOut();
 window.location.href = "auth.html";
}
// SYSTÈME PREMIUM

//limiter à 10 likes par jour pour les non-premium
async function canLike(){

 const { data } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('from_user', currentUser.id);

 return data.length < 10;
}
if(!(await canLike())){
 alert("💎 Passe Premium !");
 return;
}

if(!isUserPremium){
 alert("💎 Premium requis pour discuter");
 return;
}

async function buyPremium(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const res = await fetch("http://localhost:3000/create-checkout-session",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({
   userId: user.id,
   email: user.email
  })
 });

 const data = await res.json();

 window.location.href = data.url;
}

// UPLOAD PHOTOS
async function uploadPhotos(){

 const files = document.getElementById("photos").files;
 const user = (await supabaseClient.auth.getUser()).data.user;

 let urls = [];

 for(const file of files){

  const name = user.id + "_" + Date.now() + "_" + file.name;

  await supabaseClient.storage
   .from('photos')
   .upload(name, file);

  const { data } = supabaseClient.storage
   .from('photos')
   .getPublicUrl(name);

  urls.push(data.publicUrl);
 }

 // sauvegarde en DB
 await supabaseClient
  .from('profiles')
  .update({ photos: urls })
  .eq('id', user.id);

 alert("📸 Photos upload !");
}
// AUTRES FONCTIONS
function computeMatchScore(me, user){

 let score = 0;

 // 🎯 distance (ville)
 if(me.ville === user.ville) score += 25;

 // 🎯 âge
 if(me.age && user.age){
  const diff = Math.abs(me.age - user.age);
  score += Math.max(0, 25 - diff * 2);
 }

 // 🎯 intérêts
 if(me.interests && user.interests){
  const common = me.interests.filter(i =>
   user.interests.includes(i)
  );
  score += common.length * 10;
 }

 // 🎯 bio similaire (texte)
 if(me.bio && user.bio){
  const wordsA = me.bio.toLowerCase().split(" ");
  const wordsB = user.bio.toLowerCase().split(" ");

  const overlap = wordsA.filter(w => wordsB.includes(w));
  score += overlap.length * 2;
 }

 // 🎯 bonus premium
 if(user.premium) score += 5;

 return Math.min(100, Math.round(score));
}
const percent = computeMatchScore(currentUserProfile, u);

card.innerHTML += `<p>💘 ${percent}% match</p>`;

// INDICATEUR DE TYPING
document.getElementById("msgInput")
 .addEventListener("input", async () => {

 await supabaseClient
  .from('typing')
  .upsert({
   user_id: currentUser.id,
   to_user: currentChatUser,
   typing: true
  });
});

// reset typing status every 5s
supabaseClient
 .channel('typing-live')
 .on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'typing'
 }, payload => {

  if(payload.new.to_user === currentUser.id){
   document.getElementById("typingIndicator").innerText =
    "✍️ En train d’écrire...";
  }

 })
 .subscribe();

 // reset typing status after 2s of inactivity
 setTimeout(async () => {

 await supabaseClient
  .from('typing')
  .update({ typing:false })
  .eq('user_id', currentUser.id);

}, 2000);

// CHECK PREMIUM STATUS
let isUserPremium = false;

async function checkPremium(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const { data } = await supabaseClient
  .from('profiles')
  .select('premium, premium_until')
  .eq('id', user.id)
  .single();

 if(!data) return;

 const now = new Date();

 if(data.premium && (!data.premium_until || new Date(data.premium_until) > now)){
  isUserPremium = true;
 } else {
  isUserPremium = false;
 }
}
fetch("http://localhost:3000/verify-paypal",{
 method:"POST",
 headers:{ "Content-Type":"application/json" },
 body: JSON.stringify({
  subscriptionID: data.subscriptionID,
  userId: currentUser.id
 })
});
// ADMIN - REVENUE DASHBOARD
async function loadRevenue(){

 const { data } = await supabaseClient
  .from('payments')
  .select('*');

 let total = 0;
 let today = 0;

 const todayDate = new Date().toDateString();

 data.forEach(p => {
  total += p.amount;

  if(new Date(p.created_at).toDateString() === todayDate){
   today += p.amount;
  }
 });

 document.getElementById("totalRevenue").innerText =
  "💰 Total: " + total + "€";

 document.getElementById("todayRevenue").innerText =
  "🔥 Aujourd’hui: " + today + "€";
}
// PAYPAL WEBHOOK
onApprove: function(data) {

 fetch("http://localhost:3000/verify-paypal",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({
   subscriptionID: data.subscriptionID,
   userId: currentUser.id
  })
 });

 alert("💎 Premium activé !");
}
// CHECK PREMIUM STATUS ON LOAD
checkPremium();
if(isUserPremium){
 document.body.insertAdjacentHTML("afterbegin",
  "<div style='position:fixed;top:10px;right:10px'>💎 Premium</div>"
 );
}
// SIGNALER UN PROFIL
async function reportUser(userId){

 const reason = prompt("Pourquoi signaler ce profil ?");

 if(!reason) return;

 await supabaseClient.from('reports').insert({
  from_user: currentUser.id,
  reported_user: userId,
  reason
 });

 alert("🚨 Signalement envoyé");
}
// ADMIN - ALERTES DE SIGNALEMENTS
supabaseClient
 .channel('reports-live')
 .on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'reports'
 }, payload => {

  showAdminAlert("🚨 Nouveau signalement !");
  loadReports(); // refresh auto
autoBanCheck();
 })
 .subscribe();