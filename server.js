const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const {MongoClient} = require('mongodb');
const multer = require('multer')
const engine = require('ejs-mate')
const path = require('path')

// DIT IS DE REGEL DIE BOVENAAN MOET STAAN:
const app = express() 

// --- CONFIGURATIE & MIDDLEWARE ---
// Nu pas kun je 'app' gebruiken
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// --- ROUTE HANDLERS IMPORTEREN ---
const home = require("./routes/index")
const login = require("./routes/inloggen")
const register = require("./routes/registreren")
const reisAanmaken = require("./routes/reis-aanmaken")
const error404 = require("./routes/404")

// --- ROUTE HANDLERS KOPPELEN ---
app.use('/', home)
app.use('/', login)
app.use('/', register)
app.use('/', reisAanmaken)

// --- 404 AFHANDELING ---
app.use('/', error404) 

// --- DATABASE & SERVER START ---
const client = new MongoClient(process.env.DB_URI)

async function connectDB() {
    try {
        await client.connect()
        const db = client.db("reizen")
        
        // Deel de database met je route-bestanden
        app.set('db', db) 
        
        console.log("MongoDB staat aan!")
        
        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })
    } catch (err) {
        console.error("Kon niet verbinden met MongoDB:", err)
        process.exit(1)
    }
}

connectDB()