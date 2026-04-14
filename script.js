
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

let currentChatUser = null;
let soundStarted = false;
let introStep = 0;
let selectedUser = null;

function openProfile(user){

 selectedUser = user;

 document.getElementById("profileView").style.display = "block";

 document.getElementById("viewPhoto").src = user.photo_url;
 document.getElementById("viewName").innerText = user.prenom;
 document.getElementById("viewBio").innerText = user.bio;

}

const supabaseUrl = "https://ngxrsfntupkrpuzaffov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neHJzZm50dXBrcnB1emFmZm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzk0MTEsImV4cCI6MjA5MTMxNTQxMX0.rferAxInyPefZ6e_gqlemLOlAkRowu_gmSazEQDH96w";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

function handleStart(){
 console.log("CLICK OK");
 nextIntro();
}

function nextIntro(){
 introStep++;
 updateIntro();
}

function startApp(){

 document.getElementById("introScreen").style.display = "none";
 document.getElementById("app").style.display = "block";
 document.getElementById("introText").innerText = "🧠 IA qui trouve les meilleurs profils";
 
}

// NAV
function showPage(id){
 document.querySelectorAll('.page').forEach(p=>p.style.display="none");
 document.getElementById(id).style.display="block";
}

async function initApp(){

 const { data: { session } } = await supabaseClient.auth.getSession();

 if(session){
  currentUser = session.user;
  toggleNav(true);
  loadHome();
 } else {
  toggleNav(false);
  showPage("homePage");
 }
}

initApp();

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

function computeScore(a, b){

 let score = 0;

 // âge proche
 if(Math.abs(a.age - b.age) < 5) score += 30;

 // même ville
 if(a.ville === b.ville) score += 30;

 // intérêts communs
 if(a.interests && b.interests){
  const common = a.interests.filter(i => b.interests.includes(i));
  score += common.length * 10;
 }

 if(score > 100) score = 100;

 return score;
}
async function init(){

 if(currentUser){
  await loadProfiles();
 }

}

init();


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
  card.onclick = () => openProfile(user);
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
async function likeUser(){

 const me = (await supabaseClient.auth.getUser()).data.user;

 await supabaseClient.from('likes').insert({
  from_user: me.id,
  to_user: selectedUser.id
 });

 checkMatch(me.id, selectedUser.id);

//match

async function checkMatch(me, other){

 const { data } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('from_user', other)
  .eq('to_user', me);

 if(data.length > 0){

  alert("💘 MATCH !");

  // créer match en DB
  await supabaseClient.from('matches').insert({
   user1: me,
   user2: other
  });

  openChatIfPremium(other);
 }
}

// CHAT
async function openChatIfPremium(otherUserId){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const { data } = await supabaseClient
  .from('profiles')
  .select('premium')
  .eq('id', user.id)
  .single();

 if(!data?.premium){
  alert("💎 Abonnement requis pour discuter");
  showPage("premiumPage");
  return;
 }

 openChat(otherUserId);
}


async function openChatIfPremium(id){

 const isPremium = await checkPremium();

 if(!isPremium){
  alert("💎 Abonnement requis");
  showPage("premiumPage");
  return;
 }

 openChat(id);
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

 const text = document.getElementById("msgInput").value;

 const user = (await supabaseClient.auth.getUser()).data.user;

 await supabaseClient.from('messages').insert({
  from_user: user.id,
  to_user: currentChatUser,
  text
 });

 document.getElementById("msgInput").value = "";
}
supabaseClient
 .channel('chat')
 .on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'messages'
 }, payload => {

  displayMessage(payload.new);

 })
 .subscribe();
 async function sendTyping(){

 await supabaseClient.from('typing').upsert({
  user_id: currentUser.id,
  to_user: currentChatUser,
  typing: true
 });
}
supabaseClient
 .channel('typing')
 .on('postgres_changes', {
  event:'UPDATE',
  table:'typing'
 }, payload => {

  document.getElementById("typingIndicator").innerText =
   "✍️ En train d’écrire...";
 })
 .subscribe();
setInterval(async () => {

 await supabaseClient.from('online').upsert({
  user_id: currentUser.id,
  last_seen: new Date()
 });

}, 5000);

function lastSeenText(date){

 const diff = Math.floor((Date.now() - new Date(date)) / 1000);

 if(diff < 60) return "🟢 en ligne";
 if(diff < 300) return "👀 vu il y a 2 min";
 if(diff < 3600) return "👀 vu il y a " + Math.floor(diff/60) + " min";

 return "👀 vu il y a " + Math.floor(diff/3600) + " h";
}
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

// STRIPE ou Autre
async function goPremium(){
 const res = await fetch("/create-checkout-session",{method:"POST"});
 const data = await res.json();
 location.href = data.url;
}

async function uploadPhoto(file){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const fileName = user.id + "_" + Date.now();

 const { error } = await supabaseClient.storage
  .from('photos')
  .upload(fileName, file);

 if(error){
  alert("Erreur upload");
  return null;
 }

 const { data } = supabaseClient.storage
  .from('photos')
  .getPublicUrl(fileName);

 return data.publicUrl;
}

//Save profil 

async function saveProfile(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const prenom = document.getElementById("prenom").value;
 const age = document.getElementById("age").value;
 const ville = document.getElementById("ville").value;
 const bio = document.getElementById("bio").value;

 const file = document.getElementById("photoInput").files[0];

 let photo_url = null;

 if(file){
  photo_url = await uploadPhoto(file);
 }

 const { error } = await supabaseClient
  .from('profiles')
  .upsert({
   id: user.id,
   email: user.email,
   prenom,
   age,
   ville,
   bio,
   photo_url
  });

 if(error){
  alert(error.message);
 } else {
  alert("✅ Profil enregistré !");
 }
}

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

 alert("✅ Compte créé !");

 // 🔥 créer profil auto
 await createProfile(data.user);

}
async function createProfile(user){

 await supabaseClient.from('profiles').insert({
  id: user.id,
  email: user.email,
  prenom: "",
  age: null,
  ville: "",
  bio: "",
  photo_url: "",
  premium: false,
  admin: false
 });

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

 currentUser = data.user;

 showApp();
}
function showApp(){

 document.getElementById("loginPage").style.display = "none";
 document.getElementById("app").style.display = "block";
 
}
function displayMessage(m){

 const div = document.createElement("div");

 const me = currentUser.id === m.from_user;

 div.className = "msg " + (me ? "me" : "other");

 div.innerText = m.text;

 document.getElementById("chatBox").appendChild(div);
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

 const user = (await supabaseClient.auth.getUser()).data.user;

 const { data } = await supabaseClient
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

 if(data){

  document.getElementById("prenom").value = data.prenom || "";
  document.getElementById("age").value = data.age || "";
  document.getElementById("ville").value = data.ville || "";
  document.getElementById("bio").value = data.bio || "";

  if(data.photo_url){
   document.getElementById("preview").src = data.photo_url;
  }
 }
}

async function loadProfiles(){

 const { data } = await supabaseClient
  .from('profiles')
  .select('*');

 console.log(data);
}

function showPage(id){

 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById(id).classList.add('active');

 if(id === "profilePage"){
  loadMyProfile();
 }
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

 container.innerHTML = `
  <div class="box">
   👤 Utilisateurs: ${users.length}<br>
   🚨 Signalements: ${reports.length}<br>
   💬 Messages: ${messages.length}
  </div>
 `;
}

async function loadData(){
 const { data } = await supabaseClient.from('profiles').select('*');
 const { data: reports } = await supabaseClient.from('reports').select('*');
const { data: messages } = await supabaseClient.from('messages').select('*');
}
async function checkPremium(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const { data } = await supabaseClient
  .from('profiles')
  .select('premium')
  .eq('id', user.id)
  .single();

 return data?.premium;
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
const score = computeScore(currentUserProfile, user);

const badge = document.createElement("div");
badge.innerText = score + "% 💘";
card.onclick = () => openProfile(user);
card.appendChild(badge);

if(u.premium){
 const badge = document.createElement("div");
 badge.innerText = "💎";
 badge.style.position = "absolute";
 badge.style.top = "10px";
 badge.style.right = "10px";
 card.appendChild(badge);
}
if(isMatch){
 const badge = document.createElement("div");
 badge.innerText = "💘 MATCH";
 card.appendChild(badge);
}

async function checkUser(){

 const { data } = await supabaseClient.auth.getSession();

 if(data.session){
  currentUser = data.session.user;
  showApp();
 } else {
  showAuth();
 }
}

checkUser();

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
function showApp(){
 document.getElementById("authPage").style.display = "none";
 document.getElementById("app").style.display = "block";
}

function showAuth(){
 document.getElementById("authPage").style.display = "block";
 document.getElementById("app").style.display = "none";
}
async function logout(){

 await supabaseClient.auth.signOut();

 showAuth();
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
function isOnline(last_seen){

 return (Date.now() - new Date(last_seen)) < 10000;
}
supabaseClient
 .channel('matches')
 .on('postgres_changes', {
  event:'INSERT',
  table:'matches'
 }, payload => {

  if(payload.new.user2 === currentUser.id){
   alert("💘 Nouveau match !");
  }

 })
 .subscribe();
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
async function loadLikes(){

 showPage("likesPage");

 const { data } = await supabaseClient
  .from('likes')
  .select('*')
  .eq('to_user', currentUser.id);

 const list = document.getElementById("likesList");
 list.innerHTML = "";

 for(const l of data){

  const { data: user } = await supabaseClient
   .from('profiles')
   .select('*')
   .eq('id', l.from_user)
   .single();

  const div = document.createElement("div");
  div.innerText = user.prenom;

  list.appendChild(div);
 }
}
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

await supabaseClient.auth.signInWithPassword({
 email,
 password
});
app.use((req,res,next)=>{

 const allowed = ["http://localhost:5500"];

 if(req.headers.origin && !allowed.includes(req.headers.origin)){
  return res.status(403).send("Blocked");
 }

 next();
});



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

document.addEventListener("DOMContentLoaded", () => {

 const input = document.getElementById("photoInput");
 const preview = document.getElementById("preview");

 if(!input || !preview) return;

 input.addEventListener("change", e => {

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
   preview.src = reader.result;
  };
  reader.readAsDataURL(file);
  }

