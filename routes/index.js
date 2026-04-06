const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { haalMatchesOp } = require('./matching')
const { normaliseerFilters } = require('../src/utils/array')

// Importeer de helper voor de grote reiskaarten
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat')

/**
 * helper functie: haalt reizen op, verrijkt deze met alle gebruikersdata en formatteert ze.
 */
async function haalReizenVoorRequest(req, limiet) {
    try {
        const db = req.app.get('db');
        const { ObjectId } = require('mongodb');
        const gebruikerId = req.session?.gebruiker?.id || null;

        const resultaat = await haalMatchesOp(db, gebruikerId, req.query, limiet);

        const reizenVerrijkt = await Promise.all(resultaat.map(async (reis) => {
            // A. Organisator
            let organisatorData = null;
            if (reis.gebruikerId) {
                organisatorData = await db.collection('gebruikers').findOne(
                    { _id: new ObjectId(reis.gebruikerId) },
                    { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
                );
            }

            // B. Deelnemers
            let deelnemersData = [];
            if (reis.deelnemers && Array.isArray(reis.deelnemers) && reis.deelnemers.length > 0) {
                const dIds = reis.deelnemers.map(id => new ObjectId(id));
                deelnemersData = await db.collection('gebruikers').find(
                    { _id: { $in: dIds } },
                    { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
                ).toArray();
            }

            // C. Aanvragers
            let aanvragenData = [];
            if (reis.gebruikers && Array.isArray(reis.gebruikers) && reis.gebruikers.length > 0) {
                const aIds = reis.gebruikers.map(id => new ObjectId(id));
                aanvragenData = await db.collection('gebruikers').find(
                    { _id: { $in: aIds } },
                    { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
                ).toArray();
            }

            return {
                ...reis,
                organisator: organisatorData,
                deelnemersLijst: deelnemersData,
                aanvragenLijst: aanvragenData
            };
        }));

        return formatteerGroteReizen(reizenVerrijkt);
    } catch (err) {
        console.error("Fout in haalReizenVoorRequest:", err);
        return []; 
    }
}

/**
 * helper functie: render 1 kaart naar HTML string
 */
function renderKaart(res, reis) {
    return new Promise((resolve, reject) => {
        res.render(
            'partials/reiskaartGroot',
            { data: { reis } },
            (err, rendered) => {
                if (err) return reject(err)
                resolve(rendered)
            }
        )
    })
}

// Homepage route
router.get('/', async (req, res) => {
    try {
        const resultaat = await haalReizenVoorRequest(req, 3);

        res.render('paginas/index', {
            data: {
                pagina: { titel: 'Home' },
                reizen: resultaat,
                filters: normaliseerFilters(req.query)
            }
        });
    } catch (err) {
        console.error("Fout bij laden homepage:", err);
        res.status(500).send('Fout bij laden');
    }
});

// Extra kaarten ophalen (Prefetch)
router.get('/meer', async (req, res) => {
    try {
        const reizen = await haalReizenVoorRequest(req, 5)

        let html = ''
        for (const reis of reizen) {
            html += await renderKaart(res, reis)
        }
        
        res.send(html)

    } catch (err) {
        console.error("Fout bij ophalen extra kaarten:", err)
        res.status(500).send('Er ging iets mis bij het ophalen van extra kaarten.')
    }
})

module.exports = router