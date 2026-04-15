async function loadAdmin(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 // 🔒 sécurité : vérifier admin
 const { data: me } = await supabaseClient
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

 if(!me?.is_admin){
  alert("Accès refusé");
  window.location.href = "index.html";
  return;
 }

 loadStats();
}

loadAdmin();


// 📊 STATS
async function loadStats(){

 // 👤 utilisateurs
 const { data: users } = await supabaseClient
  .from('profiles')
  .select('*');

 document.getElementById("totalUsers").innerText =
  "👤 Utilisateurs: " + users.length;

 const premium = users.filter(u => u.premium);
 document.getElementById("premiumUsers").innerText =
  "💎 Premium: " + premium.length;


 // 💰 revenus
 const { data: payments } = await supabaseClient
  .from('payments')
  .select('*');

 let total = 0;
 let today = 0;

 const todayDate = new Date().toDateString();

 payments.forEach(p => {
  total += p.amount;

  if(new Date(p.created_at).toDateString() === todayDate){
   today += p.amount;
  }
 });

 document.getElementById("totalRevenue").innerText =
  "💰 Total: " + total + "€";

 document.getElementById("todayRevenue").innerText =
  "🔥 Aujourd’hui: " + today + "€";


 // ❤️ likes
 const { data: likes } = await supabaseClient
  .from('likes')
  .select('*');

 document.getElementById("totalLikes").innerText =
  "❤️ Likes: " + likes.length;


 // 💬 messages
 const { data: messages } = await supabaseClient
  .from('messages')
  .select('*');

 document.getElementById("totalMessages").innerText =
  "💬 Messages: " + messages.length;
}
// 🚨 Vérification PayPal
async function checkIfBanned(){

 const user = (await supabaseClient.auth.getUser()).data.user;

 const { data } = await supabaseClient
  .from('profiles')
  .select('banned')
  .eq('id', user.id)
  .single();

 if(data?.banned){
  alert("🚨 Compte banni");
  await supabaseClient.auth.signOut();
  window.location.href = "auth.html";
 }
}
// 🚨 Bannir un utilisateur
async function banUser(userId){

 await supabaseClient
  .from('profiles')
  .update({ banned:true })
  .eq('id', userId);

 alert("🚨 Utilisateur banni");
}
// ADMIN: charger tous les messages
async function loadAllMessages(){

 const { data } = await supabaseClient
  .from('messages')
  .select('*');

 const box = document.getElementById("adminMessages");
 box.innerHTML = "";

 data.forEach(m => {

  const div = document.createElement("div");

  div.innerHTML = `
   <b>${m.from_user}</b> → <b>${m.to_user}</b><br>
   ${m.text}
   <hr>
  `;

  box.appendChild(div);
 });
}
// ADMIN: envoyer un message à un utilisateur
async function loadUserMessages(userId){

 const { data } = await supabaseClient
  .from('messages')
  .select('*')
  .or(`from_user.eq.${userId},to_user.eq.${userId}`);

 console.log(data);
}
// top profils
async function loadTopProfiles(){

 const { data: likes } = await supabaseClient
  .from('likes')
  .select('*');

 const count = {};

 likes.forEach(l => {
  count[l.to_user] = (count[l.to_user] || 0) + 1;
 });

 // tri
 const sorted = Object.entries(count)
  .sort((a,b)=> b[1]-a[1])
  .slice(0,5);

 const box = document.getElementById("topProfiles");
 box.innerHTML = "";

 for(const [userId, nb] of sorted){

  const { data } = await supabaseClient
   .from('profiles')
   .select('prenom, photo_url')
   .eq('id', userId)
   .single();

  const div = document.createElement("div");

  div.innerHTML = `
   <img src="${data.photo_url}" width="50">
   ${data.prenom} - ❤️ ${nb}
  `;

  box.appendChild(div);
 }
}
// ADMIN: signaler un utilisateur
function showAdminAlert(text){

 const div = document.createElement("div");

 div.innerText = text;

 div.style = `
 position:fixed;
 top:20px;
 right:20px;
 background:#ff4b4b;
 color:white;
 padding:15px;
 border-radius:10px;
 z-index:999;
 `;

 document.body.appendChild(div);

 setTimeout(()=> div.remove(), 4000);
}
// ADMIN: traiter un signalement
async function loadReports(){

 const { data } = await supabaseClient
  .from('reports')
  .select('*')
  .order('created_at', { ascending:false });

 const box = document.getElementById("reportsList");
 box.innerHTML = "";

 data.forEach(r => {

  const div = document.createElement("div");

  div.innerHTML = `
   <b>${r.from_user}</b> ➜ ${r.reported_user}<br>
   📝 ${r.reason}<br>

   <button onclick="banUser('${r.reported_user}')">
    🚨 Bannir
   </button>

   <button onclick="resolveReport('${r.id}')">
    ✅ Traité
   </button>

   <hr>
  `;

  box.appendChild(div);
 });
}
// ADMIN: résoudre un signalement
async function resolveReport(id){

 await supabaseClient
  .from('reports')
  .update({ status:"resolved" })
  .eq('id', id);

 loadReports();
}
// ADMIN: auto-ban
async function autoBanCheck(userId){

 const { data } = await supabaseClient
  .from('reports')
  .select('*')
  .eq('reported_user', userId);

 if(data.length >= 3){

  await supabaseClient
   .from('profiles')
   .update({ banned:true })
   .eq('id', userId);

  alert("🚨 Auto-ban déclenché");
 }
}