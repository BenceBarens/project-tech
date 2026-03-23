const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const { MongoClient } = require("mongodb")
const multer = require('multer')
const engine = require('ejs-mate')
const path = require('path')
const bcryptjs = require('bcryptjs')

const app = express()

// CONFIGURATIE & MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const upload = multer({ dest: 'public/uploads/' })

//////////////////////////////
// PAGINA'S
//////////////////////////////

function toonHome(req, res) {
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            filters: { bestemmingen: [] }
        } 
    })
}

function toonRegistratie(req, res) {
    res.render('paginas/registreren', { 
        data: { pagina: { titel: 'Registreren' } } 
    })
}

//////////////////////////////
// REGISTRATIE LOGICA
//////////////////////////////

async function verwerkRegistratie(req, res) {
    try {
        const collectie = db.collection('gebruikers')
        const gebruiker = { ...req.body } // maak een kopie zodat we geen velden verliezen

        // wachtwoord hashen
        if (gebruiker.wachtwoord) {
            const hashed = await bcryptjs.hash(gebruiker.wachtwoord, 10)
            gebruiker.wachtwoord = hashed
        }

        // profielfoto
        if (req.file) {
            gebruiker.profielfoto = req.file.filename
        }

        // geboortedatum opslaan als string
        if (gebruiker.geboorteDatum) {
        gebruiker.geboorteDatum = gebruiker.geboorteDatum.split('T')[0];
}

        // eigenschappen alleen toevoegen als Overslaan niet is aangeklikt
        if (!req.body.overslaan) {
            // indien velden leeg zijn, zet ze op 0
            gebruiker.eigenschap1 = Number(gebruiker.eigenschap1 || 0)
            gebruiker.eigenschap2 = Number(gebruiker.eigenschap2 || 0)
            gebruiker.eigenschap3 = Number(gebruiker.eigenschap3 || 0)
            gebruiker.eigenschap4 = Number(gebruiker.eigenschap4 || 0)
            gebruiker.eigenschap5 = Number(gebruiker.eigenschap5 || 0)
        } else {
            // verwijder alleen de eigenschappen zodat ze niet in DB komen
            delete gebruiker.eigenschap1
            delete gebruiker.eigenschap2
            delete gebruiker.eigenschap3
            delete gebruiker.eigenschap4
            delete gebruiker.eigenschap5
        }

        // controleer dubbele email
        const bestaat = await collectie.findOne({ email: gebruiker.email })
        if (bestaat) {
            return res.send("Email bestaat al!")
        }

        // opslaan in MongoDB
        await collectie.insertOne(gebruiker)

        console.log("Gebruiker succesvol opgeslagen!")
        res.redirect('/')

    } catch (err) {
        console.error("Fout bij registreren:", err)
        res.send("Registratie mislukt")
    }
}

//////////////////////////////
// ROUTES
//////////////////////////////

app.get('/', toonHome)
app.get('/registreren', toonRegistratie)
app.post('/registreren', upload.single('profielfoto'), verwerkRegistratie)

//////////////////////////////
// DATABASE & SERVER START
//////////////////////////////

const client = new MongoClient(process.env.DB_URI)
let db

async function connectDB() {
    try {
        await client.connect()
        db = client.db("Gebruikers")

        console.log("MongoDB verbonden!")

        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })

    } catch (err) {
        console.error("Database fout:", err)
    }
}

connectDB()