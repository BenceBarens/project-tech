const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const xss = require('xss') // Cruciaal voor beveiliging

// PAGINA TONEN (GET)
router.get('/reis-bewerken/:id', async (req, res) => {
    const db = req.app.get('db')
    const id = req.params.id

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) })

        if (!reis) return res.status(404).render('404')

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

        if (!req.session.gebruiker || reis.gebruikerId.toString() !== req.session.gebruiker.id.toString()) {
            return res.redirect('/reis/' + id)
        }

        const toArrayEnSaneer = (value) => {
            if (!value) return []
            const arr = Array.isArray(value) ? value : [value]
            return arr.map(item => xss(item)) // Elk item in de array saniteren
        }

        // Bestemmingen (komt vaak als comma-separated string uit de front-end)
        let geformatteerdeBestemmingen = []
        if (req.body.bestemmingen) {
            geformatteerdeBestemmingen = req.body.bestemmingen
                .split(',')
                .map(b => xss(b.trim()))
                .filter(b => b.length > 0)
        }

        let geslachtArray = []
        if (req.body.geslacht) {
            geslachtArray = [xss(req.body.geslacht)]
        }

        // ==============================
        // 💾 DATABASE UPDATE
        // ==============================
        await db.collection('reizen').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    reisTitel: xss(req.body.reisTitel),
                    startDatum: xss(req.body.startDatum),
                    eindDatum: xss(req.body.eindDatum),
                    aantalDagen: xss(req.body.aantalDagen),

                    reis_beschrijving: xss(req.body.reis_beschrijving),
                    reis_samenvatting: xss(req.body.reis_samenvatting),

                    minReizigers: xss(req.body.minReizigers),
                    maxReizigers: xss(req.body.maxReizigers),
                    minLeeftijd: xss(req.body.minLeeftijd),
                    maxLeeftijd: xss(req.body.maxLeeftijd),

                    geslacht: geslachtArray,
                    bestemmingen: geformatteerdeBestemmingen,

                    bedragen: xss(req.body.bedragen),
                    reizen: xss(req.body.reizen),

                    activiteit: toArrayEnSaneer(req.body.activiteit),
                    verblijf: toArrayEnSaneer(req.body.verblijf)
                }
            }
        )

        res.redirect('/reis/' + id)

    } catch (err) {
        console.error("Update fout in reis-bewerken:", err)
        res.status(500).send("Fout bij opslaan van de wijzigingen.")
    }
})

module.exports = router