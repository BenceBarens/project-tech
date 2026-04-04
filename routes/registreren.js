const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcryptjs = require('bcryptjs');

router.get('/registreren', (req, res) => {
    if (req.session.gebruiker) {
        return res.redirect('/profiel')
    } else {
        res.render('paginas/registreren', { 
            data: { pagina: { titel: 'Registreren' } }
        });
    }
});

const upload = multer({ dest: 'public/uploads/profielfoto' });

router.post('/registreren', upload.single('profielfoto'), verwerkRegistratie);

module.exports = router;

async function verwerkRegistratie(req, res) {
    try {
        const db = req.app.get('db');
        if (!db) {
            throw new Error("Database verbinding niet gevonden op req.app");
        }

        const collectie = db.collection('gebruikers');
        const gebruiker = { ...req.body };

        if (gebruiker.email) {
            gebruiker.email = gebruiker.email.toLowerCase().trim();
        }

        const bestaat = await collectie.findOne({ email: gebruiker.email });
        if (bestaat) {
            return res.render('paginas/registreren', {
                data: { pagina: { titel: 'Registreren' } },
                error: "Dit emailadres is al in gebruik.",
                formData: gebruiker
            });
        }

        // ✅ Wachtwoord validatie
        if (gebruiker.wachtwoord) {
            const wachtwoord = gebruiker.wachtwoord;
            const wachtwoordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

            if (!wachtwoordRegex.test(wachtwoord)) {
                return res.render('paginas/registreren', {
                    data: { pagina: { titel: 'Registreren' } },
                    error: "Wachtwoord moet minimaal 8 karakters bevatten, met minstens 1 cijfer en 1 speciaal teken.",
                    formData: gebruiker
                });
            }

            gebruiker.wachtwoord = await bcryptjs.hash(wachtwoord, 10);
        }

        if (req.file) {
            gebruiker.profielfoto = req.file.filename;
        }

        if (gebruiker.geboorteDatum) {
            gebruiker.geboorteDatum = gebruiker.geboorteDatum.split('T')[0];
        }

        const resultaat = await collectie.insertOne(gebruiker);

        req.session.gebruiker = {
            id: resultaat.insertedId,
            email: gebruiker.email,
            voornaam: gebruiker.voornaam
        };

        res.redirect('/profiel');

    } catch (err) {
        console.error("Fout bij registreren:", err);
        res.status(500).send("Er is iets misgegaan bij het verwerken van de gegevens.");
    }
}