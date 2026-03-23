const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const { MongoClient } = require("mongodb")
const multer = require('multer')
const engine = require('ejs-mate')
const path = require('path')

const app = express()

// 1. CONFIGURATIE & MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const upload = multer({ dest: 'public/uploads/coverfoto' })

function toonHome(req, res) {
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            filters: { bestemmingen: [] }
        } 
    })
}

app.get('/inloggen', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Log in' }
        } 
    })
})

app.get('/registreren', (req, res) => {
    res.render('paginas/registreren', { 
        data: { 
            pagina: { titel: 'Registreren' }
        } 
    })
})

function toonNieuweReisFormulier(req, res) {
    res.render('paginas/reis-aanmaken', { 
        data: { pagina: { titel: 'Nieuwe reis aanmaken' } } 
    })
}

async function verwerkNieuweReis(req, res) {
    try {
        const collection = db.collection('reizen')
        
        const reisData = req.body
        if (req.file) {
            reisData.fotoPad = req.file.filename
        }

        await collection.insertOne(reisData)

        console.log("Reis succesvol opgeslagen in MongoDB!")
        res.redirect('/')
    } catch (err) {
        console.error("Fout bij opslaan:", err)
        res.status(500).send("Er ging iets mis bij het opslaan.")
    }
}

// 3. ROUTES KOPPELEN
app.get('/', toonHome)
app.get('/nieuwe-reis', toonNieuweReisFormulier)

app.post('/nieuwe-reis', upload.single('reisFoto'), verwerkNieuweReis)

// 4. DATABASE & SERVER START
const client = new MongoClient(process.env.DB_URI)
let db

async function connectDB() {
    try {
        await client.connect()
        db = client.db("reizen")
        console.log("MongoDB staat aan!")
        
        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })
    } catch (err) {
        console.error("Kon niet verbinden met MongoDB:", err)
    }
}

connectDB()

upload.single