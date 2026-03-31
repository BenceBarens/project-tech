const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const multer = require('multer')
const bcryptjs = require('bcryptjs')

// Route waar profielfoto's worden opgeslagen
const upload = multer({ dest: 'public/uploads/profielfoto' });

router.get('/profiel', async function(req, res) {
    try {
        const db = req.app.get('db')

        // Dubbel check of er iemand is ingelogd
        if (!req.session.gebruiker) {
            return res.redirect('/inloggen')
        }

        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        });

        if (!gebruikerData) {
            return res.send("Gebruiker niet gevonden")
        }

        let deReizen = []
        if (gebruikerData.reizen && gebruikerData.reizen.length > 0) {
            deReizen = await db.collection('reizen').find({
                _id: { $in: gebruikerData.reizen }
            }) .toArray()
        }

        // Stuur de data naar profiel pagina
        res.render('paginas/profiel', {
            data: {
                pagina: { titel: 'Mijn profiel' },
                gebruiker: {
                    voornaam: gebruikerData.voornaam,
                    achternaam: gebruikerData.achternaam,
                    bio: gebruikerData["bio"] || "Nog geen bio toegevoegd.",
                    woonplaats: gebruikerData.woonplaats || "Onbekend",
                    land: gebruikerData.land || "Onbekend",
                    profielfoto: gebruikerData.profielfoto ? '/uploads/profielfoto/' + gebruikerData.profielfoto : '/images/default-avatar.svg',              
                    reizen: deReizen
                }
            } 
        })
    } catch (err) {
        console.error("Profiel fout:", err);
        res.status(500).send("Er ging iets mis.");
    }
})

router.get('/profiel-bewerken', async (req, res) => {
    try {
        const db = req.app.get('db')
        if (!req.session.gebruiker) return res.redirect('/inloggen')

        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        })

        // Voeg hier de pad-logica toe
        const profielfotoPad = gebruikerData.profielfoto 
            ? '/uploads/profielfoto/' + gebruikerData.profielfoto 
            : '/images/default-avatar.svg';

        res.render('paginas/profiel-bewerken', {
            data: {
                pagina: { titel: 'Bewerk mijn profiel' },
                gebruiker: {
                    ...gebruikerData, // Kopieer alle bestaande data
                    profielfoto: profielfotoPad // Overschrijf de foto met het juiste pad
                }
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).send("Kon de bewerkpagina niet laden.");
    }
})

// Wijzigingen opslaan (POST)
// Wijzigingen opslaan (POST)
router.post('/profiel/bewerken', upload.single('profielfoto'), async (req, res) => {
    try {
        const db = req.app.get('db')
        const { huidigWachtwoord, nieuwWachtwoord, voornaam, achternaam, email, geslacht, woonplaats, land, bio } = req.body
        
        // Haal de huidige gebruiker op uit de database
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(req.session.gebruiker.id)
        })

        const updateData = { voornaam, achternaam, email, geslacht, woonplaats, land, bio }

        // Foto check
        if (req.file) { 
            updateData.profielfoto = req.file.filename 
        }

        // WACHTWOORD LOGICA: Alleen als de gebruiker een nieuw wachtwoord heeft ingevuld
        if (nieuwWachtwoord && nieuwWachtwoord.trim() !== "") {
            // Vergelijk het getypte huidige wachtwoord met de hash uit de DB
            const match = await bcryptjs.compare(huidigWachtwoord, gebruiker.wachtwoord)

            if (!match) {
                return res.send("Huidig wachtwoord is onjuist. Wijzigingen niet opgeslagen.")
            }

            // Hash het nieuwe wachtwoord en voeg toe aan de updateData
            updateData.wachtwoord = await bcryptjs.hash(nieuwWachtwoord, 10)
        }

        // UPDATE DATABASE: Dit moet BINNEN de try staan
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