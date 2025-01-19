const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const { Parser } = require('json2csv');
const fs = require('fs')
require("dotenv").config()
const passport = require("passport")
const Auth0Strategy = require("passport-auth0")
const session = require("express-session")

const app = express();
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}))
app.use(cors());
app.use(express.json());
app.set('views', path.join(__dirname, '..', 'views'))
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

console.log(process.env.AUTH0_DOMAIN);
console.log(process.env.AUTH0_CLIENT_ID);
console.log(process.env.AUTH0_CLIENT_SECRET);
console.log(process.env.AUTH0_CALLBACK_URL);

passport.use(new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL
  },
  function(accessToken, refreshtoken, extraParams, profile, done){
    return done(null, profile)
  }
))

passport.serializeUser(function(user, done){
  done(null, user)
})
passport.deserializeUser(function(user, done){
  done(null, user)
})

app.use(passport.initialize())
app.use(passport.session())


app.get("/login",
  passport.authenticate("auth0", {
    scope: "openid profile email"
  })
)

app.get("/callback",
  passport.authenticate("auth0", { failureRedirect: "/" }),
  (req, res) => {               // Ovdje će se ispisati nakon uspješne autentifikacije
    res.redirect("/protected");
  }
); 
app.get("/protected", (req, res)=>{
  if (!req.isAuthenticated() || !req.user){
    res.send("Nisi se ulogirao")
  }
  res.render("user")
})
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Greška pri odjavi:", err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Greška pri uništavanju sesije:", err);
        return next(err);
      }
      const logoutUrl = `https://dev-k2osxdagpiohmqbb.us.auth0.com/v2/logout?client_id=cLc3UaouRRJgjqRCbq6w9x3SP0fw1nmx&returnTo=${encodeURIComponent("http://localhost:3000/")}`;
      res.redirect(logoutUrl);
    });
  });
});



mongoose.connect('mongodb://localhost:27017/TechCompanies', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Povezano s bazom podataka'))
.catch(err => console.error('Greška pri povezivanju s bazom podataka:', err));

const Company = mongoose.model('Company', new mongoose.Schema({
  company_id: { type: String },  // Može ostati kao String, ako je samo tekstualni ID
  company_name: { type: String },
  founder: { type: String },
  established_year: { type: Number },  // Godina osnivanja, koristi Number
  headquarters: { type: String },
  industry: { type: String },
  number_of_employees: { type: Number },  // Broj zaposlenika, koristi Number
  annual_revenue: { type: Number },  // Prihod, koristi Number
  website: { type: String },
  products: [{ type: String }],  // Popis proizvoda, koristi Array of Strings
  description: { type: String }
}), 'companies');  // Kolekcija je 'companies'

app.get("/userProfile", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Neautorizirani pristup" });
  }
  res.render("profile")
})
app.get("/podaci", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Neautorizirani pristup" });
  }
  const podaci = {
    name: req.user.displayName,
    email: req.user.emails[0].value
  };
  res.json(podaci);
});


// API za refreshanje
app.get("/api/refresh", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Neautorizirani pristup" });
  }
  try {
    const companies = await Company.find();
    const updatedCompanies=[]
    companies.forEach((company)=>{
      const kontekst = "https://schema.org";
      const tip = "Organization";
      const ime = {
        "@type": "Name",
        "value": company.company_name
      };
      const osnivac = {
        "@type": "Person",
        "name": company.founder
      };
      const datum = {
        "@type": "Date",
        "value": company.established_year
      };
      const kompanija={
        "@context": kontekst,
        "@type": tip,
        "_id": company["_id"],
        "company_id": company.company_id,
        "company_name": ime,
        "founder": osnivac,
        "foundingDate": datum,
        "headquarters": company.headquarters,
        "industry": company.industry,
        "number_of_employees": company.number_of_employees,
        "annual_revenue": company.annual_revenue,
        "website": company.website,
        "products": Array.isArray(company.products) ? company.products : [],
        "description": company.description
      }
      updatedCompanies.push(kompanija);
    });
    const filepath = path.join(__dirname, "../frontend/public/companies.json")
    fs.writeFileSync(filepath, JSON.stringify(updatedCompanies, null, 2));
    res.send("Osvježeno");
  } catch (err) {
    console.error("Greška pri osvježavanju podataka:", err);
    res.status(500).send("Greška pri osvježavanju podataka");
  }
});

//API za preuzimanje u JSON formatu
app.get("/api/companies/json", async (req, res) => {
  try {
      const filepath = path.join(__dirname, "../frontend/public/companies.json")
      const data = await fs.promises.readFile(filepath, 'utf8')
      const jsonData = JSON.parse(data)
      res.json(jsonData);
  } catch (err) {
    console.error('Greška u obradi zahtjeva:', err);
    res.status(500).send("Greška pri dohvaćanju podataka");
  }
});

// API za preuzimanje podataka u CSV formatu
app.get('/api/companies/csv', async (req, res) => {
  try {
      const filepath = path.join(__dirname, "../frontend/public/companies.json")
      const data = await fs.promises.readFile(filepath, 'utf8')
      const jsonData = JSON.parse(data)
      const parser = new Parser();
      const csv = parser.parse(jsonData);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('companies.csv');
      res.send(csv);
  } catch (err) {
    console.error('Greška u obradi zahtjeva:', err);
    res.status(500).send("Greška pri dohvaćanju podataka");
  }
});




app.get("/", (req, res) => {
    res.render('index');
});
app.get("/datatable", (req, res) => {
  res.render('datatable');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Poslužitelj radi na http://localhost:${port}`);
});