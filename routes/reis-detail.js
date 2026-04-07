const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat')

router.get('/reis/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id
    const sessieGebruikerId = req.session.gebruiker?.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })

        if (!reis) {
            return res.status(404).render('404')
        }

        // A. Eigenaar check
        let isEigenaar = false
        if (sessieGebruikerId && reis.gebruikerId) {
            isEigenaar = reis.gebruikerId.toString() === sessieGebruikerId.toString()
        }

        // B. Deelnemer check (Zit de huidige gebruiker in de deelnemerslijst?)
        const isDeelnemer = reis.deelnemers?.some(uid => uid.toString() === sessieGebruikerId?.toString())

        // C. Mag de bezoeker contactgegevens zien?
        const magContactZien = isEigenaar || isDeelnemer

        // D. Organisator ophalen (met email/telefoon als dat mag)
        let organisatorData = null
        if (reis.gebruikerId && ObjectId.isValid(reis.gebruikerId)) {
            const projectie = { voornaam: 1, achternaam: 1, profielfoto: 1 }
            if (magContactZien) {
                projectie.email = 1
                projectie.telefoonNummer = 1
            }

            organisatorData = await db.collection('gebruikers').findOne(
                { _id: new ObjectId(reis.gebruikerId) },
                { projection: projectie }
            )
        }

        // E. AANVRAGEN ophalen (mensen in de 'gebruikers' array - Alleen voor de host)
        let aanvragenData = []
        if (isEigenaar && reis.gebruikers && Array.isArray(reis.gebruikers)) {
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

        // F. DEELNEMERS ophalen (mensen in de 'deelnemers' array)
        let deelnemersData = []
        if (reis.deelnemers && Array.isArray(reis.deelnemers)) {
            const deelnemerIds = reis.deelnemers
                .filter(uid => uid != null && uid !== "")
                .map(uid => new ObjectId(uid))

            if (deelnemerIds.length > 0) {
                const projectie = { voornaam: 1, achternaam: 1, profielfoto: 1 }
                if (magContactZien) {
                    projectie.email = 1
                    projectie.telefoonNummer = 1
                }

                deelnemersData = await db.collection('gebruikers').find(
                    { _id: { $in: deelnemerIds } },
                    { projection: projectie }
                ).toArray()
            }
        }

        // Combineer alle data
        const volledigeReisData = {
            ...reis,
            organisator: organisatorData || { voornaam: "Onbekende", achternaam: "Reiziger", profielfoto: null },
            aanvragenLijst: aanvragenData,
            deelnemersLijst: deelnemersData
        }

        const geformatteerdeReis = formatteerGroteReizen([volledigeReisData])[0]

        res.render('paginas/reis-detail', { 
            data: { 
                reis: geformatteerdeReis,
                isEigenaar: isEigenaar,
                magContactZien: magContactZien, // Doorgegeven aan EJS
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