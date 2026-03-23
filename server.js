const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const { MongoClient } = require("mongodb")
const multer = require('multer')
const engine = require('ejs-mate')
const path = require('path')
const bcryptjs = require('bcryptjs')

const app = express()

// 1. CONFIGURATIE & MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const upload = multer({ dest: 'public/uploads/' })

//////////////////////////////
//        PAGINA'S          //
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
//     REGISTRATIE LOGICA   //
//////////////////////////////

async function verwerkRegistratie(req, res) {
    try {
        const collectie = db.collection('gebruikers')
        const gebruiker = req.body

        console.log("Ontvangen data:", gebruiker)

        // wachtwoord hashen
        const hashed = await bcryptjs.hash(gebruiker.wachtwoord, 10)
        gebruiker.wachtwoord = hashed

        // foto upload
        if (req.file) {
            gebruiker.profielfoto = req.file.filename
        }

        // geboortedatum samenvoegen
        gebruiker.geboorteDatum = {
            dag: gebruiker.geboorteDag,
            maand: gebruiker.geboorteMaand,
            jaar: gebruiker.geboorteJaar
        }

        delete gebruiker.geboorteDag
        delete gebruiker.geboorteMaand
        delete gebruiker.geboorteJaar

        // check dubbele email
        const bestaat = await collectie.findOne({ email: gebruiker.email })
        if (bestaat) {
            return res.send("Email bestaat al!")
        }

        // opslaan
        await collectie.insertOne(gebruiker)

        console.log("Gebruiker opgeslagen!")
        res.redirect('/')

    } catch (err) {
        console.error("Fout:", err)
        res.send("Registratie mislukt")
    }
}

//////////////////////////////
//        ROUTES            //
//////////////////////////////

app.get('/', toonHome)
app.get('/registreren', toonRegistratie)

app.post('/registreren', upload.single('profielfoto'), verwerkRegistratie)

//////////////////////////////
//   DATABASE & SERVER      //
//////////////////////////////

const client = new MongoClient(process.env.DB_URI)
let db

async function connectDB() {
    try {
        await client.connect()
        db = client.db("project-tech")

        console.log("MongoDB verbonden!")

        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })

    } catch (err) {
        console.error("Database fout:", err)
    }
}

connectDB()