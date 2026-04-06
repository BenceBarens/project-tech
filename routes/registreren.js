const express = require('express')
const router = express.Router()
const multer = require('multer')
const bcryptjs = require('bcryptjs')
const xss = require('xss')
const { maakArray } = require('../src/utils/array')

const upload = multer({ dest: 'public/uploads/profielfoto' })

router.get('/registreren', (req, res) => {
    if (req.session.gebruiker) {
        return res.redirect('/profiel')
    } else {
        res.render('paginas/registreren', { 
            data: { pagina: { titel: 'Registreren' } }
        })
    }
})

router.post('/registreren', upload.single('profielfoto'), verwerkRegistratie)

async function verwerkRegistratie(req, res) {
    try {
        const db = req.app.get('db')
        const collectie = db.collection('gebruikers')

        // 1. Verwerk de woonplaats uit de API-zoeker
        const woonplaatsArray = maakArray(req.body.woonplaats)
        const geselecteerdeWoonplaats = woonplaatsArray[0] || ""

        // 2. Bouw het nieuwe gebruikersobject op (zonder persoonlijkheden, mét telefoonnummer)
        const gebruiker = {
            voornaam: xss(req.body.voornaam),
            achternaam: xss(req.body.achternaam),
            email: xss(req.body.email).toLowerCase().trim(),
            woonplaats: xss(geselecteerdeWoonplaats),
            geslacht: xss(req.body.geslacht),
            telefoonNummer: xss(req.body.telefoonNummer),
            geboorteDatum: req.body.geboorteDatum ? xss(req.body.geboorteDatum).split('T')[0] : null,
            bio: xss(req.body.bio || ""),
            wachtwoord: req.body.wachtwoord // Wordt hieronder gehasht
        }

        // Check of email al bestaat
        const bestaat = await collectie.findOne({ email: gebruiker.email })
        if (bestaat) {
            return res.render('paginas/registreren', {
                data: { pagina: { titel: 'Registreren' } },
                error: "Dit emailadres is al in gebruik.",
                formData: gebruiker
            })
        }

        // Wachtwoord validatie & Hashing
        if (gebruiker.wachtwoord) {
            const wachtwoordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
            if (!wachtwoordRegex.test(gebruiker.wachtwoord)) {
                return res.render('paginas/registreren', {
                    data: { pagina: { titel: 'Registreren' } },
                    error: "Wachtwoord moet minimaal 8 karakters bevatten, met minstens 1 cijfer en 1 speciaal teken.",
                    formData: gebruiker
                })
            }
            gebruiker.wachtwoord = await bcryptjs.hash(gebruiker.wachtwoord, 10)
        }

        if (req.file) {
            gebruiker.profielfoto = req.file.filename
        }

        const resultaat = await collectie.insertOne(gebruiker)

        // Sessie vullen
        req.session.gebruiker = {
            id: resultaat.insertedId,
            email: gebruiker.email,
            voornaam: gebruiker.voornaam
        }

        res.redirect('/profiel')

    } catch (err) {
        console.error("Fout bij registreren:", err)
        res.status(500).send("Er is iets misgegaan bij het verwerken van de gegevens.")
    }
}

module.exports = router