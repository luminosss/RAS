let currentUser = null;
let currentChatUser = null;
let introStep = 0;
let soundStarted = false;


// INIT
showLoading();
enableSplashClick();
playStartupSound();
initApp();
initAuth();
subscribeConversations();
subscribeNotifications();
subscribeAdminAlerts();
subscribeRevenue();
fadeOutMusic();

function handleStart(){
 console.log("CLICK OK");
 nextIntro();
}

function nextIntro(){
 introStep++;
 console.log("STEP:", introStep);
}

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
   const res = await fetch("/predict-match", {
 method:"POST",
 headers:{ "Content-Type":"application/json" },
 body: JSON.stringify({ me, user: u })
});

const percent = Math.round(data.probability * 100);
 data.sort((a,b)=>{
 return new Date(b.boost_until || 0) - new Date(a.boost_until || 0);
});
 
}

// LIKE
async function like(id){
 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: id
  
 });
if(!(await canLike())){
 return alert("🚫 Limite atteinte. Passe Premium 💎");
}
}

// CHAT
function openChat(id){

 // ⚠️ vérifie premium AVANT d’ouvrir le chat
if(!currentUser?.premium){
 alert("💎 Passe Premium pour discuter");
 showPage("premiumPage");
 return;
}

 currentChatUser = id;
 showPage("chatPage");
 loadMessages(id);
}

function test(){
 return;
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

if(photoInput.files.length > 0){

 // upload
}

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
import { View, Text, Image, PanResponder } from "react-native";

export default function SwipeCard({ user }) {

 const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: () => true,
  onPanResponderRelease: (e, gesture) => {
   if(gesture.dx > 100){
    // like
   }
   if(gesture.dx < -100){
    // pass
   }
  }
 });

 return (
  <View {...panResponder.panHandlers}>
   <Image source={{uri: user.photo}} style={{height:400}} />
   <Text>{user.name}</Text>
  </View>
 );
}
async function canLike(){

 const today = new Date().toDateString();

 const { data } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('from_user', currentUser.id);

 const todayLikes = data.filter(l =>
  new Date(l.created_at).toDateString() === today
 );

 const { data: me } = await supabaseClient
  .from('profiles')
  .select('premium')
  .eq('id', currentUser.id)
  .single();

 if(me.premium) return true;

 return todayLikes.length < 10; // limite gratuite
}
async function activateBoost(){

 const until = new Date(Date.now() + 24*60*60*1000);

 await supabaseClient
  .from('profiles')
  .update({ boost_until: until })
  .eq('id', currentUser.id);

 alert("🚀 Boost activé !");
}
async function superLike(id){

 const { data: me } = await supabaseClient
  .from('profiles')
  .select('super_likes')
  .eq('id', currentUser.id)
  .single();

 if(me.super_likes <= 0){
  return alert("⭐ Plus de super likes");
 }

 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: id,
  super: true
 });

 await supabaseClient
  .from('profiles')
  .update({ super_likes: me.super_likes - 1 })
  .eq('id', currentUser.id);

 alert("⭐ Super Like !");
}
async function buy(type){

 const res = await fetch("/buy", {
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({ type })
 });

 const data = await res.json();

 window.location.href = data.url;
}
async function loadMyProfile(){

 const { data } = await supabaseClient
  .from('profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

 if(!data) return;

 prenom.value = data.prenom || "";
 age.value = data.age || "";
 ville.value = data.ville || "";
 bio.value = data.bio || "";
 interests.value = data.interests?.join(", ") || "";
 lookingFor.value = data.looking_for || "";
}
function showPage(id){

 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById(id).classList.add('active');

 if(id === "profilePage"){
  loadMyProfile();
 }
}
async function initAuth(){

 const { data: { session } } = await supabaseClient.auth.getSession();

 if(session){
  currentUser = session.user;
 } else {
  showPage("authPage");
 }
}
function startRecording(){
 alert("🎤 Fonction vocal bientôt dispo");
}
// supabase.js
import { createClient } from '@supabase/supabase-js';

function computeTrust(user){

 let score = 0;

 if(user.photos?.length >= 2) score += 30;
 if(user.bio?.length > 20) score += 20;
 if(user.interests?.length) score += 20;
 if(user.verified) score += 30;

 return score;
}

async function verifyPhoto(){

 alert("📸 Prends un selfie pour vérifier ton profil");

 // tu peux ensuite envoyer au backend
 if(computeTrust(user) < 40){
 // cacher profil
 return;

 if(user.verified){
 const badge = document.createElement("div");
 badge.innerText = "✔️ Vérifié";
 card.appendChild(badge);

}

}

}

async function reportUser(id){

 await supabaseClient.from('reports').insert({
  user_id: id,
  from: currentUser.id
 });

 alert("Utilisateur signalé");
}
async function loadReports(){

 const container = document.getElementById("adminContent");
 container.innerHTML = "Chargement...";

 const { data } = await supabaseClient
  .from('reports')
  .select('*');

 container.innerHTML = "";

 for(const r of data){

  const div = document.createElement("div");
  div.className = "box";

  div.innerHTML = `
   🚨 Utilisateur signalé: ${r.user_id}<br>
   👤 Par: ${r.from}<br>
   <button onclick="banUser('${r.user_id}')">🚫 Bannir</button>
   <button onclick="verifyUser('${r.user_id}')">✔️ Vérifier</button>
  `;

  container.appendChild(div);
 }
}
async function loadUsers(){

 const container = document.getElementById("adminContent");

 const { data } = await supabaseClient
  .from('profiles')
  .select('*');

 container.innerHTML = "";

 data.forEach(u => {

  const div = document.createElement("div");
  div.className = "box";

  div.innerHTML = `
   👤 ${u.prenom || "Sans nom"}<br>
   📍 ${u.ville || ""}<br>
   💎 Premium: ${u.premium ? "Oui" : "Non"}<br>

   <button onclick="banUser('${u.id}')">🚫 Bannir</button>
   <button onclick="verifyUser('${u.id}')">✔️ Vérifier</button>
  `;

  container.appendChild(div);
 });
}
async function banUser(id){

 if(!confirm("Confirmer le bannissement ?")) return;

 await supabaseClient
  .from('profiles')
  .update({ banned: true })
  .eq('id', id);

 alert("Utilisateur banni 🚫");
}
async function verifyUser(id){

 await supabaseClient
  .from('profiles')
  .update({ verified: true })
  .eq('id', id);

 alert("Utilisateur vérifié ✔️");
}
async function loadStats(){

 const container = document.getElementById("adminContent");

 const { data: users } = await supabaseClient.from('profiles').select('*');
 const { data: reports } = await supabaseClient.from('reports').select('*');
 const { data: messages } = await supabaseClient.from('messages').select('*');

 container.innerHTML = `
  <div class="box">
   👤 Utilisateurs: ${users.length}<br>
   🚨 Signalements: ${reports.length}<br>
   💬 Messages: ${messages.length}
  </div>
 `;
}
async function checkAdmin(){

 const { data } = await supabaseClient
  .from('profiles')
  .select('is_admin')
  .eq('id', currentUser.id)
  .single();

 if(!data.is_admin){
  alert("Accès refusé");
  showPage("profiles");
 }
}
if(id === "adminPage"){
 checkAdmin();
}
async function loadHome(){

 showPage("homePage");

 const { data: likes } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('to_user', currentUser.id);

 const { data: matches } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('from_user', currentUser.id);

 document.getElementById("activityStats").innerHTML = `
  ❤️ Likes reçus: ${likes.length}<br>
  💘 Likes envoyés: ${matches.length}
 `;
}
function subscribeAdminAlerts(){

 supabaseClient
  .channel('reports-channel')
  .on('postgres_changes', {
   event: 'INSERT',
   schema: 'public',
   table: 'reports'
  }, payload => {

   alert("🚨 Nouveau signalement !");
  })
  .subscribe();
}
async function updateOnline(){

 await supabaseClient
  .from('profiles')
  .update({ last_seen: new Date() })
  .eq('id', currentUser.id);
}

setInterval(updateOnline, 30000);
function getStatus(user){

 const diff = (Date.now() - new Date(user.last_seen)) / 1000;

 if(diff < 60) return "🟢 En ligne";
 if(diff < 300) return "🟡 Actif";
 return "⚫ Hors ligne";
}
function computeMatch(u, me){

 let score = 0;

 if(u.ville === me.ville) score += 30;

 if(u.age && me.age){
  const diff = Math.abs(u.age - me.age);
  if(diff < 5) score += 30;
 }

 if(u.interests && me.interests){
  const common = u.interests.filter(i => me.interests.includes(i));
  score += common.length * 20;
 }

 return Math.min(100, score);
}
const percent = computeMatch(u, me);

card.innerHTML = `
 <img src="${u.photos?.[0] || 'https://picsum.photos/400'}">

 <div style="position:absolute;bottom:20px;left:20px;color:white;">
  <h2>${u.prenom}, ${u.age}</h2>
  <p>📍 ${u.ville}</p>
  <p>${getStatus(u)}</p>
  <p>💘 ${percent}% compatibilité</p>
 </div>
`;

if(u.premium){
 const badge = document.createElement("div");
 badge.innerText = "💎";
 badge.style.position = "absolute";
 badge.style.top = "10px";
 badge.style.right = "10px";
 card.appendChild(badge);
}
async function initApp(){

 const { data: { session } } = await supabaseClient.auth.getSession();

function checkUser(){
 if(!currentUser){
  return;
  toggleNav(true);
  loadHome(); // 👉 dashboard user

 } else {
  toggleNav(false);
  showPage("homePage"); // 👉 accueil public
 }
}

 // cacher splash après chargement
 setTimeout(hideSplash, 1500);

async function login(){

 const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: logEmail.value,
  password: logPass.value
 });

 if(error) return alert(error.message);

 currentUser = data.user;

 toggleNav(true);
 loadHome();
}
async function logout(){

 await supabaseClient.auth.signOut();

 toggleNav(false);
 showPage("homePage");
}

supabaseClient.auth.onAuthStateChange((event, session) => {

 if(session){
  currentUser = session.user;

  toggleNav(true);
  loadHome();

 } else {
  currentUser = null;

  toggleNav(false);
  showPage("authPage");
 }
});
setInterval(async () => {

 const { data } = await supabaseClient.auth.getSession();

 if(!data.session){
  logout();
 }

}, 60000);
function showLoading(){
 document.body.innerHTML = "<h2 style='text-align:center'>Chargement...</h2>";
}

function playStartupSound(){

 const audio = document.getElementById("startupSound");

 // important mobile : interaction requise parfois
 audio.volume = 0.5;
 audio.play().catch(()=>{});
}
msg.addEventListener("input", async () => {

 await supabaseClient
  .from('messages')
  .upsert({
   from_user: currentUser.id,
   to_user: currentChatUser,
   typing: true
  });
});
function listenTyping(){

 supabaseClient
  .channel('typing')
  .on('postgres_changes',{
   event:'UPDATE',
   schema:'public',
   table:'messages'
  }, payload => {

   if(payload.new.typing){
    document.getElementById("typingIndicator").innerText = "✍️ en train d’écrire...";
   }
  })
  .subscribe();
}
function lastSeenText(date){

 const diff = Math.floor((Date.now() - new Date(date)) / 1000);

 if(diff < 60) return "🟢 en ligne";
 if(diff < 300) return "👀 vu il y a 2 min";
 if(diff < 3600) return "👀 vu il y a " + Math.floor(diff/60) + " min";

 return "👀 vu il y a " + Math.floor(diff/3600) + " h";
}
function goToAuth(){
 showPage("authPage");
}
let slides = [
 "💘 Trouve des matchs compatibles",
 "🧠 IA qui améliore ton profil",
 "💬 Discute en temps réel",
 "🚀 Boost ton profil pour plus de likes"
];

let currentSlide = 0;

function startOnboarding(){
 showPage("onboardingPage");
 showSlide();
}

function showSlide(){
 document.getElementById("slideContent").innerHTML = `
  <h2>${slides[currentSlide]}</h2>
 `;
}

function nextSlide(){

 currentSlide++;

 if(currentSlide >= slides.length){
  showPage("authPage");
 } else {
  showSlide();
 }
}
async function loadRevenue(){

 showPage("revenuePage");

 const { data } = await supabaseClient
  .from('payments')
  .select('*')
  .order('created_at', { ascending: false });

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

 const list = document.getElementById("paymentsList");
 list.innerHTML = "";

 data.slice(0,10).forEach(p => {

  const div = document.createElement("div");

  div.innerHTML = `
   💳 ${p.type} - ${p.amount}€<br>
   🕒 ${new Date(p.created_at).toLocaleString()}
  `;

  list.appendChild(div);
 });
}
function subscribeRevenue(){

 supabaseClient
  .channel('payments-live')
  .on('postgres_changes', {
   event: 'INSERT',
   schema: 'public',
   table: 'payments'
  }, payload => {

   console.log("💰 Nouveau paiement", payload);

   loadRevenue(); // refresh auto
  })
  .subscribe();
}
// ouverture app
await supabaseClient.from('events').insert({
 user_id: currentUser.id,
 type: "open_app"
});

// swipe
await supabaseClient.from('events').insert({
 user_id: currentUser.id,
 type: "swipe"
});

// like
await supabaseClient.from('events').insert({
 user_id: currentUser.id,
 type: "like"
});

// paiement
await supabaseClient.from('events').insert({
 user_id: currentUser.id,
 type: "payment"
});
async function loadConversion(){

 const { data } = await supabaseClient
  .from('events')
  .select('*');

 const users = new Set(data.map(e => e.user_id));

 const payers = new Set(
  data.filter(e => e.type === "payment").map(e => e.user_id)
 );

 const conversion = (payers.size / users.size) * 100;

 document.getElementById("conversionRate").innerText =
  "💘 Conversion: " + conversion.toFixed(1) + "%";
}
let opened = data.filter(e=>e.type==="open_app").length;
let swipes = data.filter(e=>e.type==="swipe").length;
let likes = data.filter(e=>e.type==="like").length;
let payments = data.filter(e=>e.type==="payment").length;

document.getElementById("funnel").innerHTML = `
 📱 App ouverts: ${opened}<br>
 🔥 Swipes: ${swipes}<br>
 ❤️ Likes: ${likes}<br>
 💳 Paiements: ${payments}
`;
async function loadMRR(){

 const { data } = await supabaseClient
  .from('payments')
  .select('*');

 const now = new Date();
 const month = now.getMonth();
 const year = now.getFullYear();

 let mrr = 0;

 data.forEach(p => {

  const d = new Date(p.created_at);

  if(d.getMonth() === month && d.getFullYear() === year){
   mrr += p.amount;
  }
 });

 document.getElementById("mrr").innerText =
  "💰 MRR: " + mrr + "€";
}
let monthlyUsers = data.filter(p=>p.type==="premium").length;
let mrr = monthlyUsers * 10.00;
async function loadAnalytics(){

 await loadConversion();
 await loadMRR();
}
supabaseClient
 .channel('analytics')
 .on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'events'
 }, () => {
  loadAnalytics();
 })
 .subscribe();


const steps = [
 {
 title: "💘 Match",
  text: "Trouve ton match parfait"
 },
 {
  title: "🧠 IA",
  text: "On te propose les meilleurs profils"
 },
 {
  title: "💬 Chat",
  text: "Discute en temps réel"
 },
 {
  title: "🚀 Boost",
  text: "Augmente tes matchs"
 }
];

function nextIntro(){

 introStep++;

 updateIntro();
}

function updateIntro(){

 const step = steps[introStep];

 document.getElementById("introTitle").innerText = step.title;
 document.getElementById("introText").innerText = step.text;

 const btn = document.getElementById("introBtn");

 if(introStep === steps.length - 1){
  btn.innerText = "Entrer dans l’app 🔥";
 } else {
  btn.innerText = "Suivant ➡️";
 }

 document.getElementById("progressBar").style.width =
  ((introStep+1) / steps.length * 100) + "%";
}
function hideIntro(){

 const intro = document.getElementById("introScreen");

 intro.style.transition = "opacity 0.5s";
 intro.style.opacity = "0";

 setTimeout(()=>{
  intro.remove();
 }, 300);
}
document.getElementById("introScreen")
 .addEventListener("click", nextIntro);
 let startX = 0;

document.getElementById("introScreen")
 .addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
 });

document.getElementById("introScreen")
 .addEventListener("touchend", e => {

  let endX = e.changedTouches[0].clientX;

  if(endX - startX > 50){
   nextIntro(); // swipe droite
  }
 });
 function startIntroSound(){

 const music = document.getElementById("introMusic");

 music.volume = 0.4;

 music.play().catch(()=>{});
}
let soundStarted = false;


function handleStart(){

 console.log("CLICK OK");

 if(!soundStarted){
  startIntroSound();
  soundStarted = true;
 }

 nextIntro();
}
function nextIntro(){

 if(!soundStarted){
  startIntroSound();
  soundStarted = true;
 }

 playClick();

 introStep++;

 if(introStep >= steps.length){
  hideIntro();
  return;
 }

 updateIntro();
}
function playClick(){

 const click = document.getElementById("clickSound");

 click.currentTime = 0;
 click.volume = 0.6;

 click.play().catch(()=>{});
}
function hideIntro(){

 const intro = document.getElementById("introScreen");
 const music = document.getElementById("introMusic");

 intro.style.transition = "opacity 0.5s";
 intro.style.opacity = "0";

 music.pause();

 setTimeout(()=>{
  intro.remove();
 }, 400);
}
function fadeOutMusic(){

 const music = document.getElementById("introMusic");

 let vol = music.volume;

 const interval = setInterval(() => {

  if(vol <= 0){
   clearInterval(interval);
   music.pause();
  } else {
   vol -= 0.05;
   music.volume = vol;
  }

 }, 100);
}
function handleStart(){
 console.log("CLICK OK"); // test

 if(!soundStarted){
  startIntroSound();
  soundStarted = true;
 }

 nextIntro();
}

