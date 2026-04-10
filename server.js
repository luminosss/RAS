import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const stripe = new Stripe(process.env.STRIPE_SECRET);

// 🔥 créer session abonnement
app.post("/create-checkout-session", async (req, res) => {

 const { email } = req.body;

 const customer = await stripe.customers.create({
  email: email
 });

 const session = await stripe.checkout.sessions.create({
  customer: customer.id,
  payment_method_types: ["card"],
  mode: "subscription",
  line_items: [{
   price: "price_1TKLt5CPuB7hpwNMaAaod3Ua", // 👈 ton ID
   quantity: 1
  }],
  success_url: "http://localhost:8000?success=true",
  cancel_url: "http://localhost:8000"
 });

 res.json({ url: session.url });
});
import bodyParser from "body-parser";

app.post("/webhook",
 bodyParser.raw({type: 'application/json'}),
 async (req, res) => {

 const sig = req.headers['stripe-signature'];

 let event;

 try {
  event = stripe.webhooks.constructEvent(
   req.body,
   sig,
   "whsec_e21fe8ae276e45581a3df1fdfe4c035d5ad5f7f488c4a593801c86fec1369a38" // 👈 ton secret
  );
 } catch (err) {
  console.log("❌ Webhook erreur:", err.message);
  return res.sendStatus(400);
 }

 // ✅ PAIEMENT OK
 if(event.type === "checkout.session.completed"){
  const session = event.data.object;
  const email = session.customer_details.email;

  await updatePremium(email, true);
 }

 // ❌ ABONNEMENT ANNULÉ
 if(event.type === "customer.subscription.deleted"){
  const sub = event.data.object;

  await updatePremiumByCustomer(sub.customer, false);
 }

 res.sendStatus(200);
});
app.get("/stats", async (req,res)=>{

 const customers = await stripe.customers.list({limit:100});
 const subs = await stripe.subscriptions.list({limit:100});

 res.json({
  clients: customers.data.length,
  abonnements: subs.data.length
 });

 async function updatePremium(email, status){

 await fetch("https://ngxrsfntupkrpuzaffov.supabase.co/rest/v1/profiles?email=eq."+email,{
  method:"PATCH",
  headers:{
   "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neHJzZm50dXBrcnB1emFmZm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzk0MTEsImV4cCI6MjA5MTMxNTQxMX0.rferAxInyPefZ6e_gqlemLOlAkRowu_gmSazEQDH96w",
   "Authorization":"Bearer TA_CLE_ANON",
   "Content-Type":"application/json"
  },
  body: JSON.stringify({
   premium: status,
   subscription_status: status ? "active" : "inactive"
  })
 });

}
});