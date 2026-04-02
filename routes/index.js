const express = require('express')
const router = express.Router()
const { haalMatchesOp } = require('./matching')

// Importeer de nieuwe helper voor de grote reiskaarten
const { formatteerGroteReizen } = require('../src/utils/reiskaartGrootFormat')

/**
 * helper functie: haalt reizen op op basis van request
 * De data wordt hier direct door de formatter gehaald
 */
async function haalReizenVoorRequest(req, limiet) {
    try {
        const db = req.app.get('db')
        const gebruikerId = req.session?.gebruiker?.id || null

        console.log('filters:', req.query)

        // Haal de ruwe data op uit de matching module
        const resultaat = await haalMatchesOp(
            db,
            gebruikerId,
            req.query,
            limiet
        )

        // Formatteer de resultaten direct naar leesbare tekst
        // Dit zorgt ervoor dat zowel de homepage als de /meer route de juiste data krijgen
        return formatteerGroteReizen(resultaat);
        
    } catch (err) {
        console.error("Fout in haalReizenVoorRequest:", err)
        throw err; // Gooi de fout door naar de route handler
    }
}

/**
 * helper functie: render 1 kaart naar HTML string
 * Wordt vooral gebruikt voor de AJAX /meer route
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
        // Haal 3 geformatteerde reizen op
        const resultaat = await haalReizenVoorRequest(req, 3)

        res.render('paginas/index', {
            data: {
                pagina: { titel: 'Home' },
                reizen: resultaat
            }
        })
    } catch (err) {
        console.error("Fout bij laden homepage:", err)
        res.status(500).send('Fout bij laden van de homepagina')
    }
})

// Extra kaarten ophalen (prefetch/infinite scroll)
router.get('/meer', async (req, res) => {
    try {
        // Haal 5 extra geformatteerde reizen op
        const reizen = await haalReizenVoorRequest(req, 5)

        let html = ''

        // Loop door de reizen en plak de gerenderde HTML achter elkaar
        for (const reis of reizen) {
            html += await renderKaart(res, reis)
        }
        
        // Stuur de volledige HTML-string terug naar de client
        res.send(html)

    } catch (err) {
        console.error("Fout bij ophalen extra kaarten:", err)
        res.status(500).send('Fout bij het ophalen van extra kaarten')
    }
})

module.exports = router