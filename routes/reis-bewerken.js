const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const xss = require('xss')
const { maakArray } = require('../src/utils/array') // Belangrijk voor de checkbox-verwerking

// PAGINA TONEN (GET)
router.get('/reis-bewerken/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })

        if (!reis) return res.status(404).render('404')

        // Beveiliging: alleen de eigenaar mag bewerken
        if (!req.session.gebruiker || reis.gebruikerId.toString() !== req.session.gebruiker.id.toString()) {
            return res.redirect('/reis/' + id)
        }

        res.render('paginas/reis-bewerken', {
            data: {
                reis: reis,
                pagina: { titel: 'Reis bewerken' }
            }
        })

    } catch (err) {
        console.error("Fout bij laden bewerkpagina:", err)
        res.status(500).send("Fout bij laden.")
    }
})

// DATA OPSLAAN (POST)
router.post('/reis-bewerken/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })

        if (!reis) return res.status(404).render('404')

        // 🔒 Eigenaar-check
        if (!req.session.gebruiker || reis.gebruikerId.toString() !== req.session.gebruiker.id.toString()) {
            return res.redirect('/reis/' + id)
        }

        // Helper om input (string of array) altijd als veilige array terug te geven
        const toArrayEnSaneer = (value) => {
            const arr = maakArray(value)
            return arr.map(item => xss(item))
        }

        // ==============================
        // 💾 DATABASE UPDATE
        // ==============================
        await db.collection('reizen').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    // Tekstvelden
                    reisTitel: xss(req.body.reisTitel),
                    startDatum: xss(req.body.startDatum),
                    eindDatum: xss(req.body.eindDatum),
                    aantalDagen: xss(req.body.aantalDagen),
                    reis_beschrijving: xss(req.body.reis_beschrijving),
                    reis_samenvatting: xss(req.body.reis_samenvatting),
                    
                    // Numerieke velden (als tekst opgeslagen)
                    minReizigers: xss(req.body.minReizigers),
                    maxReizigers: xss(req.body.maxReizigers),
                    minLeeftijd: xss(req.body.minLeeftijd),
                    maxLeeftijd: xss(req.body.maxLeeftijd),

                    // Keuzemenu's en Radio's
                    geslacht: toArrayEnSaneer(req.body.geslacht),
                    bedragen: xss(req.body.bedragen),
                    reizen: xss(req.body.reizen),

                    // Checkbox groepen (gebruiken de helper)
                    bestemmingen: toArrayEnSaneer(req.body.bestemmingen),
                    activiteit: toArrayEnSaneer(req.body.activiteit),
                    verblijf: toArrayEnSaneer(req.body.verblijf)
                }
            }
        )

        // Terug naar de detailpagina
        res.redirect('/reis/' + id)

    } catch (err) {
        console.error("Update fout in reis-bewerken:", err)
        res.status(500).send("Fout bij opslaan van de wijzigingen.")
    }
})

module.exports = router