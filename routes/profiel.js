const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const multer = require('multer')
const bcryptjs = require('bcryptjs')
const { formatteerReizen } = require('../src/utils/reiskaartKleinFormat')

// Route waar profielfoto's worden opgeslagen
const upload = multer({ dest: 'public/uploads/profielfoto' })

async function verrijkReizenMetGebruikers (db, reizen) {
    return Promise.all(reizen.map(async (reis) => {
        let aanvragenData = []
        if (reis.gebruikers && Array.isArray(reis.gebruikers) && reis.gebruikers.length > 0) {
            const aanvraagIds = reis.gebruikers.map(id =>
                typeof id === 'string' ? new ObjectId(id) : id
            )

            aanvragenData = await db.collection('gebruikers').find(
                { _id: { $in: aanvraagIds } },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            ).toArray()
        }

        let deelnemersData = []
        if (reis.deelnemers && Array.isArray(reis.deelnemers) && reis.deelnemers.length > 0) {
            const deelnemerIds = reis.deelnemers.map(id =>
                typeof id === 'string' ? new ObjectId(id) : id
            )

        deelnemersData = await db.collection('gebruikers').find(
                { _id: { $in: deelnemerIds } },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            ).toArray()
        }

        return {
            ...reis,
            aanvragenLijst: aanvragenData,
            deelnemersLijst: deelnemersData
        }
    }))
}

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

        console.log('PROFIEL ROUTE BEREIKT')
        console.log('ingelogde gebruiker:', req.session.gebruiker.id)
        console.log('gebruikerData.deelnemendeReizen:', gebruikerData.deelnemendeReizen)


        if (!gebruikerData) {
            return res.send("Gebruiker niet gevonden")
        }

        let deReizen = []
        if (gebruikerData.reizen && gebruikerData.reizen.length > 0) {
            const reisIds = gebruikerData.reizen.map(id =>
                typeof id === 'string' ? new ObjectId(id) : id
            )
            
            // Reizen ophalen
            const opgehaaldeReizen = await db.collection('reizen').find({
                _id: { $in: reisIds }
            }).toArray()

            // Reizen verrijken met aanvraagdata
            const verrijkteReizen = await verrijkReizenMetGebruikers(db, opgehaaldeReizen)

            // Formatteer de reizen voor eigen profiel
            deReizen = formatteerReizen(verrijkteReizen);
        }

        let deelnemendeReizen = []
if (gebruikerData.deelnemendeReizen && gebruikerData.deelnemendeReizen.length > 0) {
    const deelnemendeReisIds = gebruikerData.deelnemendeReizen.map(id =>
        typeof id === 'string' ? new ObjectId(id) : id
    )

    const opgehaaldeDeelnemendeReizen = await db.collection('reizen').find({
        _id: { $in: deelnemendeReisIds }
    }).toArray()

    deelnemendeReizen = formatteerReizen(opgehaaldeDeelnemendeReizen)
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
                    reizen: deReizen,
                    deelnemendeReizen: deelnemendeReizen
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

          let deelnemendeReizen = []
        if (bekijkReiziger.deelnemendeReizen && bekijkReiziger.deelnemendeReizen.length > 0) {
            const opgehaaldeDeelnemendeReizen = await db.collection('reizen').find({
                _id: { $in: bekijkReiziger.deelnemendeReizen }
            }).toArray()

            console.log('ruwe deelnemende reizen uit DB:', opgehaaldeDeelnemendeReizen)

            deelnemendeReizen = formatteerReizen(opgehaaldeDeelnemendeReizen);

            console.log('geformatteerde deelnemende reizen:', deelnemendeReizen)
        }

        res.render('paginas/bezoek-profiel', {
            data: {
                pagina: { titel: "Profiel van " + bekijkReiziger.voornaam },
                gebruiker: {
                    voornaam: bekijkReiziger.voornaam,
                    achternaam: bekijkReiziger.achternaam,
                    bio: bekijkReiziger.bio || "Deze reiziger heeft nog geen bio.",
                    profielfoto: bekijkReiziger.profielfoto ? '/uploads/profielfoto/' + bekijkReiziger.profielfoto : '/images/default-avatar.svg',
                    reizen: deReizen,
                    deelnemendeReizen: deelnemendeReizen
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
        const { huidigWachtwoord, nieuwWachtwoord, voornaam, achternaam, email, geslacht, woonplaats, land, bio } = req.body
        
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(req.session.gebruiker.id)
        })

        const updateData = { voornaam, achternaam, email, geslacht, woonplaats, land, bio }

        if (req.file) { 
            updateData.profielfoto = req.file.filename 
        }

        // Alleen als de gebruiker een nieuw wachtwoord heeft ingevuld
        if (nieuwWachtwoord && nieuwWachtwoord.trim() !== "") {
            const match = await bcryptjs.compare(huidigWachtwoord, gebruiker.wachtwoord)

            if (!match) {
                return res.send("Huidig wachtwoord is onjuist. Wijzigingen niet opgeslagen.")
            }

            updateData.wachtwoord = await bcryptjs.hash(nieuwWachtwoord, 10)
        }

        // Update de database
        await db.collection('gebruikers').updateOne(
            { _id: new ObjectId(req.session.gebruiker.id) },
            { $set: updateData }
        )

        res.redirect('/profiel')

    } catch (err) {
        console.error("Update fout:", err)
        res.status(500).send("Er ging iets mis bij het updaten.")
    }
})

module.exports = router