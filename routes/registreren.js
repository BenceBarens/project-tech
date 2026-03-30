const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcryptjs = require('bcryptjs');

router.get('/registreren', (req, res) => {
    if (req.session.gebruiker) {
        return res.redirect('/profiel')
    }
    else{
        res.render('paginas/registreren', { 
            data: { 
                pagina: { titel: 'Registreren' }
            } 
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

        if (gebruiker.wachtwoord) {
            gebruiker.wachtwoord = await bcryptjs.hash(gebruiker.wachtwoord, 10);
        }

        if (req.file) {
            gebruiker.profielfoto = req.file.filename;
        }

        if (gebruiker.geboorteDatum) {
            gebruiker.geboorteDatum = gebruiker.geboorteDatum.split('T')[0];
        }


        const bestaat = await collectie.findOne({ email: gebruiker.email });
        if (bestaat) {
            return res.send("Email bestaat al!");
        }

        const resultaat = await collectie.insertOne(gebruiker);
        
        // --- DE FIX: Sessie vullen na registratie ---
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

