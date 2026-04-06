const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat')

router.get('/reis/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })

        if (!reis) {
            return res.status(404).render('404')
        }

        // A. Organisator ophalen
        let organisatorData = null
        if (reis.gebruikerId && ObjectId.isValid(reis.gebruikerId)) {
            organisatorData = await db.collection('gebruikers').findOne(
                { _id: new ObjectId(reis.gebruikerId) },
                { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
            )
        }

        // B. AANVRAGEN ophalen (mensen in de 'gebruikers' array van de reis)
        let aanvragenData = []
        if (reis.gebruikers && Array.isArray(reis.gebruikers)) {
            // Filter om er zeker van te zijn dat we geen null-waarden proberen te zoeken
            const aanvraagIds = reis.gebruikers
                .filter(uid => uid != null && uid !== "")
                .map(uid => new ObjectId(uid))

            if (aanvraagIds.length > 0) {
                aanvragenData = await db.collection('gebruikers').find(
                    { _id: { $in: aanvraagIds } },
                    { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
                ).toArray()
            }
        }

        // C. DEELNEMERS ophalen (mensen in de 'deelnemers' array van de reis)
        let deelnemersData = []
        if (reis.deelnemers && Array.isArray(reis.deelnemers)) {
            const deelnemerIds = reis.deelnemers
                .filter(uid => uid != null && uid !== "")
                .map(uid => new ObjectId(uid))

            if (deelnemerIds.length > 0) {
                deelnemersData = await db.collection('gebruikers').find(
                    { _id: { $in: deelnemerIds } },
                    { projection: { voornaam: 1, achternaam: 1, profielfoto: 1 } }
                ).toArray()
            }
        }

        // D. Eigenaar check
        let isEigenaar = false
        if (req.session.gebruiker && reis.gebruikerId) {
            isEigenaar = reis.gebruikerId.toString() === req.session.gebruiker.id.toString()
        }

        // Combineer alle data
        const volledigeReisData = {
            ...reis,
            organisator: organisatorData || { voornaam: "Onbekende", achternaam: "Reiziger", profielfoto: null },
            aanvragenLijst: aanvragenData,      // Voor de host
            deelnemersLijst: deelnemersData    // Voor iedereen
        }

        // Formatteer (voor paden naar foto's etc.)
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
        res.status(500).send("Er is iets misgegaan.")
    }
})

module.exports = router