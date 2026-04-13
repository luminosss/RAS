import express from "express";
import fetch from "node-fetch";
import Stripe from "stripe";0
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// STRIPE
const stripe = new Stripe(process.env.STRIPE_KEY);

// 💳 paiement
app.post("/buy", async (req,res)=>{

 const { type } = req.body;

 const prices = {
  premium: 1000,
  boost: 299
 };

 const session = await stripe.checkout.sessions.create({
  payment_method_types:["card"],
  mode:"payment",
  line_items:[{
   price_data:{
    currency:"eur",
    product_data:{ name:type },
    unit_amount: prices[type]
   },
   quantity:1
  }],
  success_url:"http://localhost:3000",
  cancel_url:"http://localhost:3000"
 });

 res.json({ url: session.url });
});

// 🧠 IA bio
app.post("/generate-bio", async (req,res)=>{

 const r = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":"Bearer " + process.env.OPENAI_KEY,
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1-mini",
   messages:[{
    role:"user",
    content:"Fais une bio courte pour app de rencontre"
   }]
  })
 });

 const j = await r.json();

 res.json({ bio: j.choices[0].message.content });
});

app.listen(3000, ()=>console.log("🚀 Server running"));


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
app.post("/buy", async (req,res)=>{

 const { type } = req.body;

 let price = 1000;

 if(type === "boost") price = 299;
 if(type === "superlikes") price = 499;

 const session = await stripe.checkout.sessions.create({
  payment_method_types:["card"],
  mode:"payment",
  line_items:[{
   price_data:{
    currency:"eur",
    product_data:{ name:type },
    unit_amount:price
   },
   quantity:1
  }],
  success_url:"http://localhost:3000",
  cancel_url:"http://localhost:3000"
 });

 res.json({ url: session.url });
});

if(event.type === "checkout.session.completed"){

 const session = event.data.object;

 await supabaseClient.from('payments').insert({
  user_id: session.client_reference_id,
  amount: session.amount_total / 100,
  type: session.metadata?.type
 });
}

 const type = session.metadata?.type;

 if(type === "premium"){
  await supabaseClient.from('profiles')
   .update({ premium: true })
   .eq('email', session.customer_email);
 }

 if(type === "boost"){
  await supabaseClient.from('profiles')
   .update({ boost_until: new Date(Date.now()+86400000) })
   .eq('email', session.customer_email);
 }

 if(type === "superlikes"){
  await supabaseClient.rpc("add_super_likes");
 }
