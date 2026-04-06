//////// geaccepteerde en afgewezen reizen in DB aan gebruiker toevoegen ////////
const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')

router.post('/reizen/:id/verwerk', async (req, res) => {
    try {
        const db = req.app.get('db')
        const gebruikerId = req.session?.gebruiker?.id

        // 1. Inlog check
        if (!gebruikerId) {
            return res.status(401).json({ error: 'Niet ingelogd' })
        }

        const gebruikerObjectId = new ObjectId(gebruikerId)
        const reisId = new ObjectId(req.params.id)
        
        const keuze = req.body.keuze

        // 2. Logica voor ACCEPTEREN
        if (keuze === 'accepteren') {
            await db.collection('gebruikers').updateOne(
                { _id: gebruikerObjectId },
                {
                    $addToSet: { geaccepteerdeReizen: reisId },
                    $pull: { afgewezenReizen: reisId }
                }
            )

            await db.collection('reizen').updateOne(
                { _id: reisId },
                {
                    $addToSet: { gebruikers: gebruikerObjectId }
                }
            )

        // 3. Logica voor AFWIJZEN
        } else if (keuze === 'afwijzen') {
            await db.collection('gebruikers').updateOne(
                { _id: gebruikerObjectId },
                {
                    $addToSet: { afgewezenReizen: reisId },
                    $pull: { geaccepteerdeReizen: reisId }
                }
            )

            await db.collection('reizen').updateOne(
                { _id: reisId },
                {
                    $pull: { gebruikers: gebruikerObjectId }
                }
            )

        // 4. Fallback voor ongeldige data (XSS-beveiliging door validatie)
        } else {
            return res.status(400).json({ error: 'Ongeldige keuze' })
        }

        res.status(200).json({ succes: true })

    } catch (err) {
        console.error("Fout bij verwerken reis-keuze:", err)
        res.status(500).json({ error: 'Match kon niet worden verwerkt' })
    }
})

module.exports = router