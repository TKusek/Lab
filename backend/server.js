const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const { Parser } = require('json2csv');

const app = express();
app.use(cors());
app.use(express.json());
app.set('views', path.join(__dirname, '..', 'views'))
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

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

// API za dohvat svih podataka o kompanijama
app.get("/api/companies", async (req, res) => {
  try {
      const companies = await Company.find();
      console.log(companies)
      res.json(companies);
  } catch (err) {
      res.status(500).send("Greška pri dohvaćanju podataka");
  }
});

// API za preuzimanje podataka u JSON formatu
app.get('/api/companies/json', async (req, res) => {
  try {
      const companies = await Company.find();
      res.json(companies);
  } catch (err) {
      res.status(500).send("Greška pri dohvaćanju podataka");
  }
});

// API za preuzimanje podataka u CSV formatu
app.get('/api/companies/csv', async (req, res) => {
  try {
      const companies = await Company.find();
      const parser = new Parser();
      const csv = parser.parse(companies);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('companies.csv');
      res.send(csv);
  } catch (err) {
      res.status(500).send("Greška pri dohvaćanju podataka");
  }
});
// API za preuzimanje filtriranih podataka u JSON formatu
app.get('/api/companies/filtered/json', async (req, res) => {
  try {
      const { keyword, attributeIndex } = req.query;  
      const filter = {};  
      const companies = await Company.find(filter);  
      res.json(companies);
  } catch (err) {
      res.status(500).send("Greška pri dohvaćanju podataka");
  }
});

// API za preuzimanje filtriranih podataka u CSV formatu
app.get('/api/companies/filtered/csv', async (req, res) => {
  try {
      const { keyword, attributeIndex } = req.query;
      const filter = {};  
      const companies = await Company.find(filter);
      const parser = new Parser();
      const csv = parser.parse(companies);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('filtered_companies.csv');
      res.send(csv);
  } catch (err) {
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