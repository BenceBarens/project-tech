const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { normaliseer } = require('./matching'); 
const { formatteerReizen } = require('../src/utils/reiskaartKleinFormat');

async function haalFavorietenOp(db, gebruikerId) {
    try {
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(gebruikerId)
        });

        const geaccepteerdeIds = gebruiker?.geaccepteerdeReizen || [];

        if (geaccepteerdeIds.length === 0) {
            return [];
        }

        const favorieteReizen = await db.collection('reizen').find({
            _id: { $in: geaccepteerdeIds.map(id => new ObjectId(id)) }
        }).toArray();

        const genormaliseerdeReizen = normaliseer(favorieteReizen);
        return formatteerReizen(genormaliseerdeReizen);

    } catch (err) {
        console.error("Fout in haalFavorietenOp:", err);
        return [];
    }
}

router.get('/favorieten', async (req, res) => {
    try {
        const db = req.app.get('db');
        if (!req.session.gebruiker) return res.redirect('/inloggen');

        const mijnFavorieten = await haalFavorietenOp(db, req.session.gebruiker.id);

        res.render('paginas/favorieten', {
            data: {
                pagina: { titel: 'Mijn Favorieten' },
                reizen: mijnFavorieten
            }
        });
    } catch (err) {
        console.error("Route fout:", err);
        res.status(500).send("Kon favorieten niet laden.");
    }
});

router.post('/reis-accepteren', async (req, res) => {
    try {
        const db = req.app.get('db');
        const { reisId } = req.body; 
        const gebruikerId = req.session.gebruiker?.id;

        if (!gebruikerId) return res.status(401).json({ error: 'Niet ingelogd' });

        await db.collection('gebruikers').updateOne(
            { _id: new ObjectId(gebruikerId) },
            { $addToSet: { geaccepteerdeReizen: new ObjectId(reisId) } }
        );

        res.json({ status: 'ok' }); 
    } catch (err) {
        console.error("Fout bij opslaan:", err);
        res.status(500).json({ error: 'Fout bij opslaan' });
    }
});

module.exports = router;