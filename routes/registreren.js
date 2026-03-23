const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcryptjs = require('bcryptjs');

router.get('/registreren', (req, res) => {
    res.render('paginas/registreren', { 
        data: { 
            pagina: { titel: 'Registreren' }
        } 
    });
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

        if (!req.body.overslaan) {
            const eigenschappen = ['eigenschap1', 'eigenschap2', 'eigenschap3', 'eigenschap4', 'eigenschap5'];
            eigenschappen.forEach(e => {
                gebruiker[e] = Number(gebruiker[e] || 0);
            });
        } else {
            delete gebruiker.eigenschap1;
            delete gebruiker.eigenschap2;
            delete gebruiker.eigenschap3;
            delete gebruiker.eigenschap4;
            delete gebruiker.eigenschap5;
        }

        const bestaat = await collectie.findOne({ email: gebruiker.email });
        if (bestaat) {
            return res.send("Email bestaat al!");
        }

        await collectie.insertOne(gebruiker);
        res.redirect('/');

    } catch (err) {
        console.error("Fout bij registreren:", err);
        res.status(500).send("Er is iets misgegaan bij het verwerken van de gegevens.");
    }
}