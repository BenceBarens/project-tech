//////// geaccepteerde en afgewezen reizen in DB aan gebruiker toevoegen ////////
const express= require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')

router.post('/reizen/:id/verwerk', async (req, res) => {

    try {
        const db = req.app.get('db')
        const gebruikerId = req.session?.gebruiker?.id

        if (!gebruikerId) {
            return res.status(401).json({ error: 'Niet ingelogd' })
        }

        const gebruikerObjectId = new ObjectId(gebruikerId)
        const reisId = new ObjectId(req.params.id)
        const keuze = req.body.keuze

        if (keuze === 'accepteren') {
            await db.collection('gebruikers').updateOne(
                {_id: gebruikerObjectId },
                {
                   $addToSet: {geaccepteerdeReizen: reisId },
                   $pull: {afgewezenReizen: reisId }
                }
            )

            await db.collection('reizen').updateOne(
                {_id: reisId },
                {
                   $addToSet: {gebruikers: gebruikerObjectId }
                }
            )
        }   else if (keuze === 'afwijzen') {
            await db.collection('gebruikers').updateOne(
                {_id: gebruikerObjectId },
                {
                   $addToSet: { afgewezenReizen: reisId },
                   $pull: { geaccepteerdeReizen: reisId }
                }
            )

            console.log('match:', req.params.id, req.body.keuze)

            await db.collection('reizen').updateOne(
                {_id: reisId },
                {
                    $pull: {gebruikers: gebruikerObjectId }
                }
            )
        } else {
            return res.status(400).json({ error: 'Ongeldige keuze'})
        }

      res.status(200).json({ succes: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Match kon niet worden verwerkt' })
    }
})

module.exports=router

