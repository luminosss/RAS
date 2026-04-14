import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

// 🔐 sécurité
app.use(rateLimit({
 windowMs: 15 * 60 * 1000,
 max: 100
}));

const supabaseClient = createClient(
 process.env.SUPABASE_URL,
 process.env.SUPABASE_SERVICE_KEY
);

// STRIPE

// 💳 paiement


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


app.post("/register", async (req,res)=>{

 const { email, password } = req.body;

 const { data, error } = await supabaseClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true
 });

 if(error){
  return res.status(400).json({ error: error.message });
 }

 res.json({ success:true, user:data.user });
});
app.use((req,res,next)=>{

 const allowed = ["http://localhost:5500"];

 if(!allowed.includes(req.headers.origin)){
  return res.status(403).send("Blocked");
 }

 next();
});