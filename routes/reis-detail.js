const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat')

router.get('/reis/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })
        if (!reis) return res.status(404).render('404')

        // A. Organisator ophalen
        let organisatorData = null
        if (reis.gebruikerId) {
            organisatorData = await db.collection('gebruikers').findOne(
                { _id: new ObjectId(reis.gebruikerId) },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            )
        }

        // B. AANVRAGEN ophalen (mensen in reis.gebruikers)
        let aanvragenData = []
        if (reis.gebruikers && Array.isArray(reis.gebruikers) && reis.gebruikers.length > 0) {
            const aanvraagIds = reis.gebruikers.map(uid => new ObjectId(uid))
            aanvragenData = await db.collection('gebruikers').find(
                { _id: { $in: aanvraagIds } },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            ).toArray()
        }

        // C. TOEGELATEN DEELNEMERS ophalen (mensen in reis.deelnemers)
        let toegelatenDeelnemersData = []
        if (reis.deelnemers && Array.isArray(reis.deelnemers) && reis.deelnemers.length > 0) {
            const deelnemerIds = reis.deelnemers.map(uid => new ObjectId(uid))
            toegelatenDeelnemersData = await db.collection('gebruikers').find(
                { _id: { $in: deelnemerIds } },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            ).toArray()
        }

        let isEigenaar = false
        if (req.session.gebruiker && reis.gebruikerId) {
            isEigenaar = reis.gebruikerId.toString() === req.session.gebruiker.id.toString()
        }

        // Voeg beide lijsten toe aan de data
        const volledigeReisData = {
            ...reis,
            organisator: organisatorData || { voornaam: "Onbekende", achternaam: "Reiziger", profielfoto: null },
            aanvragenLijst: aanvragenData,         // De 'gebruikers' array
            deelnemersLijst: toegelatenDeelnemersData // De 'deelnemers' array
        }

        const geformatteerdeReis = formatteerGroteReizen([volledigeReisData])[0]

        res.render('paginas/reis-detail', { 
            data: { 
                reis: geformatteerdeReis,
                isEigenaar: isEigenaar,
                gebruiker: req.session.gebruiker,
                pagina: { titel: geformatteerdeReis.reisTitel } 
            } 
        })

    } catch (err) {
        console.error("Detailpagina fout:", err)
        res.status(500).send("Er is iets misgegaan bij het ophalen van de reis.")
    }
})

module.exports = router