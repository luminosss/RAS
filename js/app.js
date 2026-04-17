// =============================
// APP.JS — VERSION PRO COMPLETE
// =============================

let currentUser = null;
let currentChatUser = null;
let isUserPremium = false;
let dailyLikes = 0;
// =============================
// INIT
// =============================
async function init(){
  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "auth.html";
    return;
  }

  currentUser = data.user;

  // ✅ CHECK BAN
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("banned")
    .eq("id", currentUser.id)
    .single();

  if(profile?.banned){
    alert("🚫 Compte banni");
    await logout();
    return;
  }

  await checkPremium();
  await updateOnlineStatus();
  setupRealtime();
  loadProfiles();
}

document.addEventListener("DOMContentLoaded", init);

// =============================
// REALTIME (messages + profiles + matches)
// =============================
function setupRealtime(){
  // nouveaux messages
  supabaseClient
    .channel('messages-live')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, payload => {
      const msg = payload.new;

      if(
        currentChatUser &&
        ((msg.from_user === currentUser.id && msg.to_user === currentChatUser) ||
        (msg.to_user === currentUser.id && msg.from_user === currentChatUser))
      ){
        displayMessage(msg);
      }
    })
    .subscribe();

  // nouveaux matchs
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
}

// =============================
// ONLINE STATUS
// =============================
async function updateOnlineStatus(){
  if(!currentUser) return;

  await supabaseClient
    .from("profiles")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", currentUser.id);
}

setInterval(updateOnlineStatus, 15000);

function getStatus(user){
  if(!user.last_seen) return "⚫ Hors ligne";

  const diff = (new Date() - new Date(user.last_seen)) / 1000;

  if(diff < 60) return "🟢 En ligne";
  if(diff < 300) return "🟡 Actif";

  return "⚫ Hors ligne";
}

// =============================
// LOAD PROFILES 
// =============================
async function loadProfiles(){
  const grid = document.getElementById("profilesGrid");
  if(!grid) return;

  grid.innerHTML = "";


  if(!data) return;

  const me = data.find(u => u.id === currentUser.id);

  data.sort((a,b)=> computeMatchScore(me,b) - computeMatchScore(me,a));

  data.forEach(user => {
    const card = createSwipeCard(user);
    grid.appendChild(card);
  });
}

// =============================
// INIT PROFILE
// =============================
async function initProfile(){
  const { data } = await supabaseClient.auth.getUser();
// =============================
function createSwipeCard(user){
  const card = document.createElement("div");
  card.className = "card swipe-card";

card.innerHTML = `
  <img src="${user.photo_url || 'https://picsum.photos/300'}">
  <div class="card-content">
    <h3>${user.prenom}</h3>
    <p>${user.age || ''} ans • ${user.ville || ''}</p>
    <p class="bio">${user.bio || ''}</p>
    ${user.premium ? '<span class="premium">💎 Premium</span>' : ''}

    <div class="actions">
      <button onclick="likeUser('${user.id}')">❤️</button>
      <button onclick="openChat('${user.id}')">💬</button>
    </div>
  </div>
`;

  let startX = 0;

  card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener("touchmove", e => {
    let moveX = e.touches[0].clientX - startX;
    card.style.transform = `translateX(${moveX}px) rotate(${moveX/10}deg)`;
  });

  card.addEventListener("touchend", async e => {
    let diff = e.changedTouches[0].clientX - startX;

    if(diff > 100){
      await likeUser(user.id);
      card.remove();
    }
    else if(diff < -100){
      card.remove();
    }
    else{
      card.style.transform = "";
    }
  });

  card.onclick = () => openProfile(user);

  return card;
}

// =============================
// MATCH SCORE
// =============================
function computeMatchScore(me, user){
  if(!me) return 0;

  let score = 0;

  if(me.ville === user.ville) score += 30;

  if(me.age && user.age){
    const diff = Math.abs(me.age - user.age);
    score += Math.max(0, 30 - diff * 2);
  }

  if(me.bio && user.bio){
    const a = me.bio.toLowerCase().split(" ");
    const b = user.bio.toLowerCase().split(" ");
    const overlap = a.filter(w => b.includes(w));
    score += overlap.length * 2;
  }

  return Math.min(100, score);
}

// =============================
// PROFILE MODAL
// =============================
function openChat(userId){
  if(!isUserPremium){
    alert("💎 Premium requis");
    return;
  }

  currentChatUser = userId;
  document.getElementById("chatInterface").style.display = "block";
  loadMessages();
}
function openProfile(user){
  const modal = document.getElementById("profileModal");
  if(!modal) return;

function closeModal(){
  const modal = document.getElementById("profileModal");
  if(modal) modal.style.display = "none";
}

// =============================
// LIKE + MATCH
// =============================
async function likeUser(targetId){
if(!isUserPremium){
  if(dailyLikes >= 5){
    alert("💎 Passe Premium pour plus de likes");
    return;
  }
  dailyLikes++;
}

  await supabaseClient.from("likes").insert({
    from_user: currentUser.id,
    to_user: targetId
  });

  checkMatch(targetId);
}

async function checkMatch(targetId){
  const { data } = await supabaseClient
    .from("likes")
    .select("*")
    .eq("from_user", targetId)
    .eq("to_user", currentUser.id);
const { data: matchExist } = await supabaseClient .from("matches") .select("*") .or(`and(user1.eq.${currentUser.id},user2.eq.${targetId}),and(user1.eq.${targetId},user2.eq.${currentUser.id})`) .single(); 
    showToast("💘 MATCH !");
  }
}
  if(data.length > 0){
    await supabaseClient.from("matches").insert({
      user1: currentUser.id,
      user2: targetId
    });


if(matchExist.length > 0) return;

// =============================
// CHAT + TYPING
// =============================
async function loadMessages(){
  const box = document.getElementById("chatBox");
  if(!box) return;

  box.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(from_user.eq.${currentUser.id},to_user.eq.${currentChatUser}),and(from_user.eq.${currentChatUser},to_user.eq.${currentUser.id})`)
    .order("created_at", { ascending: true });

  if(error) return console.error(error);

  data.forEach(displayMessage);
}

function displayMessage(m){
  const box = document.getElementById("chatBox");

  const div = document.createElement("div");
  div.className = m.from_user === currentUser.id ? "me" : "other";
  div.innerText = m.text;

const { data, error } = await supabaseClient
  .from("profiles")
  .select("*");

if(error || !data) return;
  box.appendChild(div);
}

async function sendMessage(){
  const input = document.getElementById("msgInput");
  if(!input || !currentChatUser) return;

  const text = input.value;
if(!text.trim()) return;

  await supabaseClient.from("messages").insert({
    from_user: currentUser.id,
    to_user: currentChatUser,
    text
  });
const spamWords = ["crypto", "invest", "bitcoin", "cashapp"];

if(spamWords.some(w => text.toLowerCase().includes(w))){
  await supabaseClient
    .from("profiles")
    .update({
      fake_score: 80,
      is_suspect: true
    })
    .eq("id", currentUser.id);

  alert("🚨 Message suspect détecté");
}

  input.value = "";
}

// =============================
// TOAST
// =============================
function showToast(text){
  const div = document.createElement("div");

  div.innerText = text;
  div.style = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:black;
    color:white;
    padding:10px 20px;
    border-radius:20px;
  `;

  document.body.appendChild(div);

  setTimeout(()=> div.remove(), 3000);
}

// =============================
// PREMIUM
// =============================
async function checkPremium(){
  const { data } = await supabaseClient
    .from("profiles")
    .select("premium, premium_until")
    .eq("id", currentUser.id)
    .single();

  if(!data) return;

  const now = new Date();

  if(data.premium && data.premium_until){
    const expire = new Date(data.premium_until);

    if(expire > now){
      isUserPremium = true;
    } else {
      await supabaseClient
        .from("profiles")
        .update({ premium: false })
        .eq("id", currentUser.id);

      isUserPremium = false;
    }
  }
}

async function buyPremium(){

  if(isUserPremium){
    alert("Déjà premium");
    return;
  }

  // simulation paiement
  const confirmPay = confirm("Payer 10€ pour Premium ?");

  if(!confirmPay) return;

  const { data } = await supabaseClient.auth.getUser();

  const res = await fetch("https://www.paypal.com/ncp/payment/DAZH6Y75U8WJA/create-order", {  
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: data.user.id
    })
  });

  const result = await res.json();

  if(result.success){
    alert("💎 Paiement réussi !");
    location.reload();
  } else {
    alert("Erreur paiement");
  }
}

// =============================
// REPORT
// =============================
async function reportUser(userId){
  const reason = prompt("Pourquoi signaler ?");
  if(!reason) return;

  await supabaseClient.from("reports").insert({
    from_user: currentUser.id,
    reported_user: userId,
    reason
  });

  showToast("🚨 Signalement envoyé");
}

// =============================
// LOGOUT
// =============================
async function logout(){
  await supabaseClient.auth.signOut();
  window.location.href = "auth.html";
}


async function analyzeProfile(user){

  let score = 0;

  if(!user.photo_url) score += 30;
  if(!user.bio) score += 20;
  if(!user.age) score += 10;

  // mots suspects
  const suspiciousWords = ["crypto", "bitcoin", "onlyfans", "telegram", "argent"];

  if(user.bio){
    const bio = user.bio.toLowerCase();

    suspiciousWords.forEach(word => {
      if(bio.includes(word)) score += 40;
    });
  }

  // update DB
  await supabaseClient
    .from("profiles")
    .update({
      fake_score: score,
      is_suspect: score > 60
    })
    .eq("id", user.id);
}
  }