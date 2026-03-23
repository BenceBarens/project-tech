const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const multer = require('multer')
const engine = require('ejs-mate')
const path = require('path')
const bcryptjs = require('bcryptjs')
const { MongoClient } = require('mongodb')

const app = express()

// CONFIG
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.engine('ejs', engine) 
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const upload = multer({ dest: 'public/uploads/' })

//////////////////////////////
//        DATABASE          //
//////////////////////////////

const client = new MongoClient(process.env.DB_URI)
let db

async function connectDB() {
    try {
        await client.connect()
        db = client.db("gebruikersDB")
        console.log("MongoDB verbonden!")

        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })

    } catch (err) {
        console.error("Database fout:", err)
    }
}

connectDB()

//////////////////////////////
//        PAGINA'S          //
//////////////////////////////

app.get('/', (req, res) => {
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            filters: { bestemmingen: [] }
        } 
    })
})

app.get('/nieuwe-reis', (req, res) => {
    res.render('paginas/reis-aanmaken', { 
        data: { pagina: { titel: 'Nieuwe reis aanmaken' } }
    })
})

app.get('/inloggen', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { pagina: { titel: 'Log in' } }
    })
})

app.get('/registreren', (req, res) => {
    res.render('paginas/registreren', { 
        data: { pagina: { titel: 'Registreren' } }
    })
})

//////////////////////////////
//       Registreren        //
//////////////////////////////

async function verwerkRegistratie(req, res) {
    try {
        const collectie = db.collection('gebruikers')
        const gebruiker = req.body

        //VERPLICHTE VELDEN
        const verplichteVelden = ['voornaam', 'email', 'wachtwoord', 'land', 'geslacht']

        for (let veld of verplichteVelden) {
            if (!gebruiker[veld] || gebruiker[veld].trim() === '') {
                return res.send(`${veld} is verplicht`)
            }
        }

        // GEBOORTEDATUM
        if (!gebruiker.geboorteDag || !gebruiker.geboorteMaand || !gebruiker.geboorteJaar) {
            return res.send("Geboortedatum is verplicht")
        }

        // WACHTWOORD LENGTE
        if (gebruiker.wachtwoord.length < 6) {
            return res.send("Wachtwoord moet minimaal 6 tekens zijn")
        }

        //HASH
        const hashed = await bcryptjs.hash(gebruiker.wachtwoord, 10)
        gebruiker.wachtwoord = hashed

        //FOTO
        if (req.file) {
            gebruiker.profielfoto = req.file.filename
        }

        //GEBOORTEDATUM
        gebruiker.geboorteDatum = {
            dag: gebruiker.geboorteDag,
            maand: gebruiker.geboorteMaand,
            jaar: gebruiker.geboorteJaar
        }

        delete gebruiker.geboorteDag
        delete gebruiker.geboorteMaand
        delete gebruiker.geboorteJaar

        //EXTRA: dubbele email check
        const bestaat = await collectie.findOne({ email: gebruiker.email })
        if (bestaat) {
            return res.send("Email bestaat al!")
        }

        //OPSLAAN IN MONGODB
        await collectie.insertOne(gebruiker)

        console.log("Gebruiker opgeslagen in MongoDB!")
        res.redirect('/inloggen')

    } catch (err) {
        console.error("Fout bij registreren:", err)
        res.send("Registratie mislukt")
    }
}

//////////////////////////////
//        ROUTES            //
//////////////////////////////

app.post('/registreren', upload.single('profielfoto'), verwerkRegistratie)