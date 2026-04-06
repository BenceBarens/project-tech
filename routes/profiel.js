const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const multer = require('multer')
const bcryptjs = require('bcryptjs')
const xss = require('xss')
const { formatteerReizen } = require('../src/utils/reiskaartKleinFormat')
const { maakArray } = require('../src/utils/array')

// Configuratie voor het uploaden van profielfoto's
const upload = multer({ dest: 'public/uploads/profielfoto' })

/**
 * Hulpfunctie: Haalt profielgegevens (naam, foto) op voor gebruikers en deelnemers 
 * die aan een reis gekoppeld zijn.
 */
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

// 1. EIGEN PROFIEL BEKIJKEN
router.get('/profiel', async function(req, res) {
    try {
        const db = req.app.get('db')

        if (!req.session.gebruiker) {
            return res.redirect('/inloggen') 
        }

        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        })

        if (!gebruikerData) {
            return res.send("Gebruiker niet gevonden")
        }

        // Aangemaakte reizen ophalen en verrijken met aanvragers/deelnemers
        let deReizen = []
        if (gebruikerData.reizen && gebruikerData.reizen.length > 0) {
            const reisIds = gebruikerData.reizen.map(id =>
                typeof id === 'string' ? new ObjectId(id) : id
            )
            
            const opgehaaldeReizen = await db.collection('reizen').find({
                _id: { $in: reisIds }
            }).toArray()

            // Hier passen we de verrijking toe uit de 'deelnemers' branch
            const verrijkteReizen = await verrijkReizenMetGebruikers(db, opgehaaldeReizen)
            deReizen = formatteerReizen(verrijkteReizen);
        }

        // Reizen waaraan deze gebruiker zelf deelneemt ophalen
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

// 2. ANDERMANS PROFIEL BEKIJKEN
router.get('/profiel/:id', async (req, res) => {
    try {
        const db = req.app.get('db')
        const profielId = req.params.id

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

            deelnemendeReizen = formatteerReizen(opgehaaldeDeelnemendeReizen);
        }

        res.render('paginas/bezoek-profiel', {
            data: {
                pagina: { titel: (bekijkReiziger.voornaam ?? "") + " " + (bekijkReiziger.achternaam ?? "") },
                gebruiker: {
                    voornaam: bekijkReiziger.voornaam,
                    achternaam: bekijkReiziger.achternaam,
                    bio: bekijkReiziger.bio || (bekijkReiziger.voornaam + " heeft nog geen bio."),
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

// 3. PROFIEL BEWERKEN PAGINA (GET)
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

// 4. WIJZIGINGEN OPSLAAN (POST)
router.post('/profiel/bewerken', upload.single('profielfoto'), async (req, res) => {
    try {
        const db = req.app.get('db')
        
        const woonplaatsArray = maakArray(req.body.woonplaats)
        const gesaneerdeWoonplaats = xss(woonplaatsArray[0] || "")

        const voornaam = xss(req.body.voornaam)
        const achternaam = xss(req.body.achternaam)
        const email = xss(req.body.email)
        const geslacht = xss(req.body.geslacht)
        const bio = xss(req.body.bio)
        
        const { huidigWachtwoord, nieuwWachtwoord } = req.body
        
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(req.session.gebruiker.id)
        })

        const updateData = { 
            voornaam, 
            achternaam, 
            email, 
            geslacht, 
            woonplaats: gesaneerdeWoonplaats, 
            bio 
        }

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