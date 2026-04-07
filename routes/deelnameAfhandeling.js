const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')

// Aanvraag accepteren
router.post('/reizen/:reisId/deelnemers/:gebruikerId/accepteer', async (req, res) => {

    try {
        const db = req.app.get('db')
        const organisatorId = req.session?.gebruiker?.id

        if (!organisatorId) {
            return res.status(401).json({ error: 'Niet ingelogd' })
        }

        const reisId = new ObjectId (req.params.reisId)
        const deelnemerId = new ObjectId(req.params.gebruikerId)

        const reis = await db.collection('reizen').findOne({ _id: reisId })

        if (!reis) {
            return res.status(404).json({ error: 'Reis niet gevonden' })
        }

        //Alleen organisator mag aanvragen accepteren
        if (String(reis.gebruikerId) !== String(organisatorId)) {
            return res.status(403).json({ error: 'Geen toestemming' })
        }

        // Van aanvraag naar deelnemer
        await db.collection('reizen').updateOne(
           { _id: reisId },
           {
               $pull: {gebruikers: deelnemerId },
               $addToSet: { deelnemers: deelnemerId }
           }
        )

        // Reis toevoegen aan profiel van deelnemer
        await db.collection('gebruikers').updateOne(
            { _id: deelnemerId },
            {
                $addToSet: { deelnemendeReizen: reisId }
            }
        )

        res.status(200).json({ succes: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Aanvraag kon niet worden geaccepteerd' })
    }
})

// Aanvraag weigeren

router.post('/reizen/:reisId/deelnemers/:gebruikerId/weiger', async (req, res) => {

    try {
        const db = req.app.get('db')
        const organisatorId = req.session?.gebruiker?.id

        if (!organisatorId) {
            return res.status(401).json({ error: 'Niet ingelogd' })
        }

        const reisId = new ObjectId (req.params.reisId)
        const deelnemerId = new ObjectId(req.params.gebruikerId)

        const reis = await db.collection('reizen').findOne({ _id: reisId })

        if (!reis) {
            return res.status(404).json({ error: 'Reis niet gevonden' })
        }

        //Alleen organisator mag aanvragen weigeren
        if (String(reis.gebruikerId) !== String(organisatorId)) {
            return res.status(403).json({ error: 'Geen toestemming' })
        }

        // Alleen verwijderen uit aanvragen
        await db.collection('reizen').updateOne(
           { _id: reisId },
           {
               $pull: {gebruikers: deelnemerId }
           }
        )

        res.status(200).json({ succes: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Kon aanvraag niet weigeren' })
    }
})

module.exports = router
