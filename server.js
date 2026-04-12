const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe("sk_test_TA_CLE_SECRETE");

// 👉 CRÉER SESSION CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
 try {
  const { email } = req.body;

  const session = await stripe.checkout.sessions.create({
   payment_method_types: ["card"],
   mode: "subscription",
   customer_email: email,

   line_items: [
    {
     price: "price_TON_ID_STRIPE", // ⚠️ à créer dans Stripe
     quantity: 1,
    },
   ],

   success_url: "http://localhost:5500?success=true",
   cancel_url: "http://localhost:5500?cancel=true",
  });

  res.json({ url: session.url });

 } catch (err) {
  console.error(err);
  res.status(500).json({ error: err.message });
 }
});
const bodyParser = require("body-parser");

// ⚠️ IMPORTANT pour Stripe
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
 const event = req.body;

 if (event.type === "checkout.session.completed") {

  const session = event.data.object;
  const email = session.customer_email;

  console.log("Paiement OK pour :", email);

  // 👉 appeler Supabase pour activer premium
  await fetch("https://TON-PROJET.supabase.co/rest/v1/profiles?email=eq." + email, {
   method: "PATCH",
   headers: {
    "apikey": "TA_SERVICE_ROLE_KEY",
    "Authorization": "Bearer TA_SERVICE_ROLE_KEY",
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    premium: true
   })
  });
 }

 res.sendStatus(200);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
app.use(cors({
 origin: "*"
}));