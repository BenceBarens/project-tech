const dotenv = require("dotenv");
dotenv.config();

const express = require('express');
const { MongoClient } = require("mongodb");
const multer = require('multer');
const engine = require('ejs-mate');
const path = require('path');

const app = express();

// --- 1. CONFIGURATIE & MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer configuratie voor uploads
const upload = multer({ dest: 'public/uploads/coverfoto' });

// --- 2. ROUTE FUNCTIES (CONTROLLERS) ---

function toonHome(req, res) {
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            filters: { bestemmingen: [] }
        } 
    });
}

function toonInloggen(req, res) {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Log in' }
        } 
    });
}

function toonRegistreren(req, res) {
    res.render('paginas/registreren', { 
        data: { 
            pagina: { titel: 'Registreren' }
        } 
    });
}

function toonNieuweReisFormulier(req, res) {
    res.render('paginas/reis-aanmaken', { 
        data: { pagina: { titel: 'Nieuwe reis aanmaken' } } 
    });
}

async function verwerkNieuweReis(req, res) {
    try {
        const collection = db.collection('reizen');
        const reisData = req.body;
        
        if (req.file) {
            reisData.fotoPad = req.file.filename;
        }

        await collection.insertOne(reisData);
        console.log("Reis succesvol opgeslagen in MongoDB!");
        res.redirect('/');
    } catch (err) {
        console.error("Fout bij opslaan:", err);
        res.status(500).send("Er ging iets mis bij het opslaan.");
    }
}

// --- 3. ROUTES KOPPELEN ---

app.get('/', toonHome);
app.get('/inloggen', toonInloggen);
app.get('/registreren', toonRegistreren);
app.get('/nieuwe-reis', toonNieuweReisFormulier);

// POST route voor het uploaden van een nieuwe reis
app.post('/nieuwe-reis', upload.single('reisFoto'), verwerkNieuweReis);

// --- 4. 404 AFHANDELING ---
// Deze MOET als laatste route staan, vlak voor de database connectie
app.use((req, res) => {
    res.status(404).render('paginas/404', { 
        data: { 
            pagina: { titel: '404 - Niet gevonden' } 
        } 
    });
});

// --- 5. DATABASE & SERVER START ---

const client = new MongoClient(process.env.DB_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("reizen");
        console.log("MongoDB staat aan!");
        
        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/');
        });
    } catch (err) {
        console.error("Kon niet verbinden met MongoDB:", err);
        process.exit(1);
    }
}

connectDB();