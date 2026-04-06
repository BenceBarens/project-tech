const dotenv = require("dotenv")
dotenv.config()

const express = require('express')
const session = require('express-session')
const { MongoClient } = require('mongodb')
const engine = require('ejs-mate')
const path = require('path')

const app = express() 

// --- CONFIGURATIE & MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))

app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}))

// Middleware om sessie data beschikbaar te maken in EJS templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
})

// --- ROUTE HANDLERS IMPORTEREN ---
const home = require("./routes/index")
const reisAanmaken = require("./routes/reis-aanmaken")
const aanvragen = require("./routes/aanvragen")
const profiel = require("./routes/profiel")
const reisDetail = require("./routes/reis-detail")
const reisBewerken = require("./routes/reis-bewerken") // NIEUW
const login = require("./routes/inloggen")
const register = require("./routes/registreren")
const reisAfhandelingDB = require('./routes/reisAfhandelingDB')
const deelnameAfhandeling = require('./routes/deelnameAfhandeling')
const logout = require("./routes/uitloggen")
const error404 = require("./routes/404")

// --- ROUTE HANDLERS KOPPELEN ---
app.use('/', home)
app.use('/', reisAanmaken)
app.use('/', aanvragen)
app.use('/', profiel)
app.use('/', reisDetail)
app.use('/', reisBewerken)
app.use('/', reisAfhandelingDB)
app.use('/', deelnameAfhandeling)

app.use('/', login)
app.use('/', register)
app.use('/', logout)
app.use('/', error404) 

// --- DATABASE & SERVER START ---
const client = new MongoClient(process.env.DB_URI)

async function connectDB() {
    try {
        await client.connect()
        const db = client.db("opgeslagen-data")
        app.set('db', db) 
        console.log("MongoDB is verbonden 🫡")
        app.listen(3000, () => {
            console.log('Server draait op http://localhost:3000/')
        })
    } catch (err) {
        console.error("Kon niet verbinden met MongoDB:", err)
        process.exit(1)
    }
}

connectDB()