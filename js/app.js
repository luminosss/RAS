const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

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

async function loadProfiles(){

 const container = document.getElementById("profiles");
 container.innerHTML = "";

 const { data } = await supabaseClient
  .from('profiles')
  .select('*')
  .neq('id', currentUser.id);

 data.forEach(u => {

  const card = document.createElement("div");
  card.className = "box";

  card.innerHTML = `
   <img src="${u.photo_url || 'https://picsum.photos/300'}">
   <h3>${u.prenom || "Sans nom"}</h3>
   <p>${u.ville || ""}</p>
   <button onclick="likeUser('${u.id}')">❤️</button>
  `;

  container.appendChild(card);
 });
}
async function likeUser(id){

 await supabaseClient.from('likes').insert({
  from_user: currentUser.id,
  to_user: id
 });

 alert("Like envoyé ❤️");
}
let currentChatUser = null;

function openChat(userId){
 currentChatUser = userId;
 loadMessages();
}

async function loadMessages(){

 const { data } = await supabaseClient
  .from('messages')
  .select('*')
  .or(`from_user.eq.${currentUser.id},to_user.eq.${currentChatUser}`);

 const box = document.getElementById("chatBox");
 box.innerHTML = "";

 data.forEach(m => {
  const div = document.createElement("div");
  div.innerText = m.text;
  box.appendChild(div);
 });
}

async function sendMessage(){

 const text = document.getElementById("msgInput").value;

 await supabaseClient.from('messages').insert({
  from_user: currentUser.id,
  to_user: currentChatUser,
  text
 });

 loadMessages();
}
