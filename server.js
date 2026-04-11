import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
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

 async function updatePremium(email, status){

 await fetch("https://ngxrsfntupkrpuzaffov.supabase.co/rest/v1/profiles?email=eq."+email,{
  method:"PATCH",
  headers:{
   "apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neHJzZm50dXBrcnB1emFmZm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzk0MTEsImV4cCI6MjA5MTMxNTQxMX0.rferAxInyPefZ6e_gqlemLOlAkRowu_gmSazEQDH96w",
   "Authorization":"Bearer TA_CLE_ANON",
   "Content-Type":"application/json"
   
  },
 });
window.startPayment = function (){
 if(!currentUser) return alert("Connecte-toi");

 window.location.href = "https://buy.stripe.com/4gM5kCgQ6gRAgoz8LP5wI01";
};
}
