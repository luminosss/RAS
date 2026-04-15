import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 Supabase admin
const supabaseClient = createClient(
 process.env.SUPABASE_URL,
 process.env.SUPABASE_SERVICE_KEY
);

app.get("/", (req,res)=>{
 res.send("Backend OK 🚀");
});


// 🔐 VERIFY PAYPAL
app.post("/verify-paypal", async (req,res)=>{

 try {

  const { subscriptionID, userId } = req.body;

  // 1. récupérer token PayPal
  const auth = Buffer.from(
   process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
  ).toString("base64");

  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token",{
   method:"POST",
   headers:{
    "Authorization": "Basic " + auth,
    "Content-Type":"application/x-www-form-urlencoded"
   },
   body:"grant_type=client_credentials"
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. vérifier abonnement
  const subRes = await fetch(
   `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionID}`,
   {
    headers:{
     "Authorization": "Bearer " + accessToken
    }
   }
  );

  const subData = await subRes.json();

  // 3. check status
  if(subData.status === "ACTIVE"){

   const until = new Date();
   until.setDate(until.getDate() + 30);

   // 4. activer premium
   await supabaseClient
    .from('profiles')
    .update({
     premium: true,
     premium_until: until
    })
    .eq('id', userId);

   // 5. enregistrer paiement
   await supabaseClient.from('payments').insert({
    user_id: userId,
    amount: 9.99,
    type: "paypal"
   });

   return res.json({ success:true });
  }

  res.json({ success:false });

 } catch(err){
  console.error(err);
  res.status(500).json({ error:"server error" });
 }

});


app.listen(process.env.PORT, ()=>{
 console.log("🚀 Server running on port " + process.env.PORT);
});

await supabaseClient.from('payments').insert({
 user_id: userId,
 amount: 10.00,
 type: "premium"
});

import fetch from "node-fetch";

app.post("/verify-paypal", async (req,res)=>{

 const { subscriptionID, userId } = req.body;

 // 🔑 récupérer access token PayPal
 const auth = Buffer.from(
  process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
 ).toString("base64");

 const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token",{
  method:"POST",
  headers:{
   "Authorization": "Basic " + auth,
   "Content-Type":"application/x-www-form-urlencoded"
  },
  body:"grant_type=client_credentials"
 });

 const tokenData = await tokenRes.json();

 const accessToken = tokenData.access_token;

 // 🔍 vérifier abonnement
 const subRes = await fetch(
  `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionID}`,
  {
   headers:{
    "Authorization": "Bearer " + accessToken
   }
  }
 );

 const subData = await subRes.json();

 if(subData.status === "ACTIVE"){

  // activer premium 30 jours
  const until = new Date();
  until.setDate(until.getDate() + 30);

  await supabaseClient
   .from('profiles')
   .update({
    premium: true,
    premium_until: until
   })
   .eq('id', userId);

  // 💰 enregistrer paiement
  await supabaseClient.from('payments').insert({
   user_id: userId,
   amount: 9.99,
   type: "paypal"
  });

  return res.json({ success:true });
 }

 res.json({ success:false });
});