const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { normaliseer } = require('./matching') 
const { formatteerReizen } = require('../src/utils/reiskaartKleinFormat')

async function haalFavorietenOp(db, gebruikerId) {
    try {
        const gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(gebruikerId)
        })

        const geaccepteerdeIds = gebruiker?.geaccepteerdeReizen || []

        if (geaccepteerdeIds.length === 0) {
            return []
        }

        const favorieteReizen = await db.collection('reizen').find({
            _id: { $in: geaccepteerdeIds.map(id => new ObjectId(id)) }
        }).toArray()

        const genormaliseerdeReizen = normaliseer(favorieteReizen)
        return formatteerReizen(genormaliseerdeReizen)

    } catch (err) {
        console.error("Fout in haalFavorietenOp:", err)
        return []
    }
}

router.get('/aanvragen', async (req, res) => {
    try {
        const db = req.app.get('db')
        if (!req.session.gebruiker) return res.render('paginas/inlog-required')

        const mijnFavorieten = await haalFavorietenOp(db, req.session.gebruiker.id)

        res.render('paginas/aanvragen', {
            data: {
                pagina: { titel: 'Mijn Favorieten' },
                reizen: mijnFavorieten
            }
        })
    } catch (err) {
        console.error("Route fout:", err)
        res.status(500).send("Kon favorieten niet laden.")
    }
})

// Route voor ACCEPTEREN
router.post('/reizen/:reisId/deelnemers/:gebruikerId/accepteer', async (req, res) => {
    try {
        const db = req.app.get('db')
        const { reisId, gebruikerId } = req.params

        // 1. Voeg toe aan 'deelnemers' en verwijder uit 'gebruikers' bij de REIS
        await db.collection('reizen').updateOne(
            { _id: new ObjectId(reisId) },
            { 
                $addToSet: { deelnemers: new ObjectId(gebruikerId) },
                $pull: { gebruikers: new ObjectId(gebruikerId) }
            }
        )

        // 2. Voeg de reis toe aan 'deelnemendeReizen' bij de GEBRUIKER
        await db.collection('gebruikers').updateOne(
            { _id: new ObjectId(gebruikerId) },
            { $addToSet: { deelnemendeReizen: new ObjectId(reisId) } }
        )

        res.json({ status: 'ok' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Accepteren mislukt' })
    }
})

// Route voor WEIGEREN
router.post('/reizen/:reisId/deelnemers/:gebruikerId/weiger', async (req, res) => {
    try {
        const db = req.app.get('db')
        const { reisId, gebruikerId } = req.params

        // Verwijder de gebruiker uit de aanvragenlijst van de reis
        await db.collection('reizen').updateOne(
            { _id: new ObjectId(reisId) },
            { $pull: { gebruikers: new ObjectId(gebruikerId) } }
        )

        res.json({ status: 'ok' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Weigeren mislukt' })
    }
})

module.exports = router
