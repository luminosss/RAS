import express from "express";
import Stripe from "stripe";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const stripe = new Stripe("sk_test_xxx");

// STRIPE
app.post("/create-checkout-session", async (req,res)=>{

 const session = await stripe.checkout.sessions.create({
  payment_method_types:["card"],
  mode:"payment",
  line_items:[{
   price_data:{
    currency:"eur",
    product_data:{name:"Premium"},
    unit_amount:1000
   },
   quantity:1
  }],
  success_url:"http://localhost:3000",
  cancel_url:"http://localhost:3000"
 });

 res.json({url:session.url});
});

// IA BIO
app.post("/generate-bio", async (req,res)=>{

 const r = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":"Bearer YOUR_OPENAI_KEY",
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1-mini",
   messages:[{
    role:"user",
    content:"Fais une bio courte pour une app de rencontre"
   }]
  })
 });

 const j = await r.json();

 res.json({bio:j.choices[0].message.content});
});

app.listen(3000,()=>console.log("Server OK"));

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

app.post("/improve-profile", async (req, res) => {

 const { prenom, age, ville, bio, interests, looking_for } = req.body;

 const prompt = `
Améliore ce profil pour une app de rencontre :

Prénom: ${prenom}
Âge: ${age}
Ville: ${ville}
Bio actuelle: ${bio}
Intérêts: ${interests}
Recherche: ${looking_for}

Objectif :
- rendre la bio attirante
- fun et naturelle
- max 3 lignes
- ajouter intérêts pertinents

Réponds en JSON :
{
 "bio": "...",
 "interests": ["..."]
}
`;

 const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
   "Authorization": "Bearer YOUR_OPENAI_KEY",
   "Content-Type": "application/json"
  },
  body: JSON.stringify({
   model: "gpt-4.1-mini",
   messages: [{ role: "user", content: prompt }]
  })
 });

 const json = await response.json();

 const text = json.choices[0].message.content;

 const parsed = JSON.parse(text);

 res.json(parsed);
});

app.post("/ai-match", async (req,res)=>{

 const { me, users } = req.body;

 const prompt = `
Classe ces profils du meilleur au pire pour matcher avec :

Moi:
${JSON.stringify(me)}

Profils:
${JSON.stringify(users)}

Réponds uniquement en JSON:
["id1","id2","id3"]
`;

 const r = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":"Bearer YOUR_OPENAI_KEY",
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1-mini",
   messages:[{role:"user",content:prompt}]
  })
 });

 const j = await r.json();

 res.json({ matches: JSON.parse(j.choices[0].message.content) });
});

app.post("/analyze-photo", async (req,res)=>{

 // simple version (texte IA)
 const r = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":"Bearer YOUR_OPENAI_KEY",
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1-mini",
   messages:[{
    role:"user",
    content:"Donne des conseils pour une photo de profil attractive (visage visible, sourire, lumière)"
   }]
  })
 });

 const j = await r.json();

 res.json({ feedback: j.choices[0].message.content });
});
app.post("/boost-profile", async (req,res)=>{

 const profile = req.body;

 const r = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":"Bearer YOUR_OPENAI_KEY",
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1-mini",
   messages:[{
    role:"user",
    content:`Améliore ce profil: ${JSON.stringify(profile)}`
   }]
  })
 });

 const j = await r.json();

 res.json({ bio: j.choices[0].message.content });
});
app.post("/predict-match", async (req,res)=>{

 const { me, user } = req.body;

 let score = 0;

 // âge proche
 if(Math.abs(me.age - user.age) < 5) score += 0.3;

 // même ville
 if(me.ville === user.ville) score += 0.3;

 // intérêts communs
 if(me.interests && user.interests){
  const common = me.interests.filter(i => user.interests.includes(i));
  score += common.length * 0.1;
 }

 // clamp
 if(score > 1) score = 1;

 res.json({ probability: score });
});