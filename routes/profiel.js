const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const multer = require('multer')
const bcryptjs = require('bcryptjs')
const xss = require('xss')
const { formatteerReizen } = require('../src/utils/reiskaartKleinFormat')

// Route waar profielfoto's worden opgeslagen
const upload = multer({ dest: 'public/uploads/profielfoto' })

router.get('/profiel', async function(req, res) {
    try {
        const db = req.app.get('db')

        // 1. Check of er iemand is ingelogd
        if (!req.session.gebruiker) {
            return res.redirect('/inloggen') 
        }

        // 2. Haal de volledige gebruikerData echt op uit de database
        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        })

        if (!gebruikerData) {
            return res.send("Gebruiker niet gevonden")
        }

        let deReizen = []
        if (gebruikerData.reizen && gebruikerData.reizen.length > 0) {
            const opgehaaldeReizen = await db.collection('reizen').find({
                _id: { $in: gebruikerData.reizen }
            }).toArray()

            // Formatteer de reizen voor eigen profiel
            deReizen = formatteerReizen(opgehaaldeReizen);
        }

        res.render('paginas/profiel', {
            data: {
                pagina: { titel: 'Mijn profiel' },
                gebruiker: {
                    voornaam: gebruikerData.voornaam,
                    achternaam: gebruikerData.achternaam,
                    bio: gebruikerData.bio || "Nog geen bio toegevoegd.",
                    woonplaats: gebruikerData.woonplaats || "Onbekend",
                    land: gebruikerData.land || "Onbekend",
                    profielfoto: gebruikerData.profielfoto ? '/uploads/profielfoto/' + gebruikerData.profielfoto : '/images/default-avatar.svg',              
                    reizen: deReizen
                }
            } 
        })
    } catch (err) {
        console.error("Profiel fout:", err)
        res.status(500).send("Er ging iets mis.")
    }
})

// Bekijk andermans profiel
router.get('/profiel/:id', async (req, res) => {
    try {
        const db = req.app.get('db')
        const profielId = req.params.id

        // Als de gebruiker ID hetzelfde is als jouw ingelogde ID, stuur mij naar eigen profiel
        if (req.session.gebruiker && req.session.gebruiker.id === profielId) {
            return res.redirect('/profiel')
        }
        
        const bekijkReiziger = await db.collection('gebruikers').findOne({
            _id: new ObjectId(profielId)
        })

        if (!bekijkReiziger) {
            return res.status(404).send("Deze reiziger bestaat niet.")
        }

        let deReizen = []
        if (bekijkReiziger.reizen && bekijkReiziger.reizen.length > 0) {
            const opgehaaldeReizen = await db.collection('reizen').find({
                _id: { $in: bekijkReiziger.reizen }
            }).toArray()

            deReizen = formatteerReizen(opgehaaldeReizen);
        }

        res.render('paginas/bezoek-profiel', {
            data: {
                pagina: { titel: (bekijkReiziger.voornaam ?? "") + " " + (bekijkReiziger.achternaam ?? "") },
                gebruiker: {
                    voornaam: bekijkReiziger.voornaam,
                    achternaam: bekijkReiziger.achternaam,
                    bio: bekijkReiziger.bio || (bekijkReiziger.voornaam + " heeft nog geen bio."),
                    profielfoto: bekijkReiziger.profielfoto ? '/uploads/profielfoto/' + bekijkReiziger.profielfoto : '/images/default-avatar.svg',
                    reizen: deReizen
                }
            }
        })
    } catch (err) {
        console.error("Fout bij het laden van een reizigers profiel:", err)
        res.status(500).send("Er ging iets mis.")
    }
})

router.get('/profiel-bewerken', async (req, res) => {
    try {
        const db = req.app.get('db')
        if (!req.session.gebruiker) return res.redirect('/inloggen')

        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        })

        const profielfotoPad = gebruikerData.profielfoto ? '/uploads/profielfoto/' + gebruikerData.profielfoto : '/images/default-avatar.svg'

        res.render('paginas/profiel-bewerken', {
            data: {
                pagina: { titel: 'Bewerk mijn profiel' },
                gebruiker: {
                    ...gebruikerData,
                    profielfoto: profielfotoPad
                }
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).send("Kon de bewerkpagina niet laden.")
    }
})

// Wijzigingen opslaan (POST)
router.post('/profiel/bewerken', upload.single('profielfoto'), async (req, res) => {
    try {
        const db = req.app.get('db')
        
        const voornaam = xss(req.body.voornaam)
        const achternaam = xss(req.body.achternaam)
        const email = xss(req.body.email)
        const geslacht = xss(req.body.geslacht)
        const woonplaats = xss(req.body.woonplaats)
        const land = xss(req.body.land)
        const bio = xss(req.body.bio)
        
        const { huidigWachtwoord, nieuwWachtwoord } = req.body
        
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(req.session.gebruiker.id)
        })

        const updateData = { voornaam, achternaam, email, geslacht, woonplaats, land, bio }

        if (req.file) { 
            updateData.profielfoto = req.file.filename 
        }

        if (nieuwWachtwoord && nieuwWachtwoord.trim() !== "") {
            const match = await bcryptjs.compare(huidigWachtwoord, gebruiker.wachtwoord)
            if (!match) {
                return res.send("Huidig wachtwoord is onjuist. Wijzigingen niet opgeslagen.")
            }
            updateData.wachtwoord = await bcryptjs.hash(nieuwWachtwoord, 10)
        }

        await db.collection('gebruikers').updateOne(
            { _id: new ObjectId(req.session.gebruiker.id) },
            { $set: updateData }
        )

        req.session.gebruiker.voornaam = voornaam

        res.redirect('/profiel')

    } catch (err) {
        console.error("Update fout:", err)
        res.status(500).send("Er ging iets mis bij het updaten.")
    }
})

module.exports = router