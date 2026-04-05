const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// PAGINA TONEN
router.get('/reis-bewerken/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) });

        if (!reis) return res.status(404).render('404');

        // Beveiliging: alleen eigenaar
        if (!req.session.gebruiker || reis.gebruikerId.toString() !== req.session.gebruiker.id.toString()) {
            return res.redirect('/reis/' + id);
        }

        res.render('paginas/reis-bewerken', {
            data: {
                reis: reis,
                pagina: { titel: 'Reis bewerken' }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Fout bij laden.");
    }
});


router.post('/reis-bewerken/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) });

        if (!reis) return res.status(404).render('404');

        // 🔒 Beveiliging: alleen eigenaar
        if (!req.session.gebruiker || reis.gebruikerId.toString() !== req.session.gebruiker.id.toString()) {
            return res.redirect('/reis/' + id);
        }

        // ==============================
        // 🧠 DATA VERWERKING
        // ==============================

        // Helper voor checkbox arrays
        const toArray = (value) => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        };

        // Bestemmingen (string → array)
        let bestemmingen = [];
        if (req.body.bestemmingen) {
            bestemmingen = req.body.bestemmingen
                .split(',')
                .map(b => b.trim())
                .filter(b => b.length > 0);
        }

        // Geslacht (dropdown → array in DB)
        let geslacht = [];
        if (req.body.geslacht) {
            geslacht = [req.body.geslacht];
        }

        // ==============================
        // 💾 DATABASE UPDATE
        // ==============================
        await db.collection('reizen').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    reisTitel: req.body.reisTitel,
                    startDatum: req.body.startDatum,
                    eindDatum: req.body.eindDatum,
                    aantalDagen: req.body.aantalDagen,

                    reis_beschrijving: req.body.reis_beschrijving,
                    reis_samenvatting: req.body.reis_samenvatting,

                    minReizigers: req.body.minReizigers,
                    maxReizigers: req.body.maxReizigers,
                    minLeeftijd: req.body.minLeeftijd,
                    maxLeeftijd: req.body.maxLeeftijd,

                    geslacht: geslacht,
                    bestemmingen: bestemmingen,

                    bedragen: req.body.bedragen,

                    activiteit: toArray(req.body.activiteit),
                    reizen: req.body.reizen,
                    verblijf: toArray(req.body.verblijf)
                }
            }
        );

        // 🔁 Terug naar detailpagina
        res.redirect('/reis/' + id);

    } catch (err) {
        console.error(err);
        res.status(500).send("Fout bij opslaan.");
    }
});

module.exports = router;