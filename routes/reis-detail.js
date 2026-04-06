const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat');

router.get('/reis/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) });

        if (!reis) {
            return res.status(404).render('404');
        }

        let organisatorData = null;
        if (reis.gebruikerId && ObjectId.isValid(reis.gebruikerId)) {
            organisatorData = await db.collection('gebruikers').findOne(
                { _id: new ObjectId(reis.gebruikerId) },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            );
        }

        let deelnemersData = [];
        if (reis.gebruikers && Array.isArray(reis.gebruikers) && reis.gebruikers.length > 0) {
            const deelnemerIds = reis.gebruikers.map(uid => new ObjectId(uid));
            deelnemersData = await db.collection('gebruikers').find(
                { _id: { $in: deelnemerIds } },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            ).toArray();
        }

        let isEigenaar = false;
        if (req.session.gebruiker && reis.gebruikerId) {
            isEigenaar = reis.gebruikerId.toString() === req.session.gebruiker.id.toString();
        }

        const volledigeReisData = {
            ...reis,
            organisator: organisatorData || { voornaam: "Onbekende", achternaam: "Reiziger", profielfoto: null },
            deelnemersLijst: deelnemersData
        };

        const geformatteerdeReis = formatteerGroteReizen([volledigeReisData])[0];

        res.render('paginas/reis-detail', { 
            data: { 
                reis: geformatteerdeReis,
                isEigenaar: isEigenaar,
                gebruiker: req.session.gebruiker,
                pagina: { titel: geformatteerdeReis.reisTitel } 
            } 
        });

    } catch (err) {
        console.error("Detailpagina fout:", err);
        res.status(500).send("Er is iets misgegaan bij het ophalen van de reis.");
    }
});

module.exports = router;