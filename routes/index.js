const express = require('express')
const router = express.Router()

const { haalMatchesOp } = require('./matching')
const { normaliseerFilters } = require('../utils/array')

// helper functie: haalt reizen op op basis van request
async function haalReizenVoorRequest(req,limiet) {
    const db = req.app.get('db')
    const gebruikerId = req.session?.gebruiker?.id || null

    console.log('filters:', req.query)

    return haalMatchesOp(
        db,
        gebruikerId,
        req.query,
        limiet
    )  
}

//helper functie: render 1 kaart naar HTML  
function renderKaart(res, reis) {
    return new Promise((resolve,reject) => {
        res.render(
            'partials/reiskaartGroot',
            { data: {reis} },
            (err, rendered) => {
                if (err) return reject(err)
                    resolve(rendered)
            }
        )
    })
}

router.get('/', async (req, res) => {

    // reis binnenhalen 
        try {
            const resultaat = await haalReizenVoorRequest(req,3)

            res.render('paginas/index', {
                data: {
                    pagina: {titel: 'Home' },
                    reizen: resultaat,
                    filters: normaliseerFilters(req.query) // filter toevoegen
                    }
            })
        } catch (err) {
            console.error(err)
            res.status(500).send('Fout bij laden')
        }
    })

      
// extra kaarten ophalen (prefetch)
router.get('/meer', async (req,res) => {
   try {
       const reizen = await haalReizenVoorRequest(req, 5)

       let html = ''

       for (const reis of reizen) {
       html += await renderKaart (res, reis)
    }
       
       res.send(html)

    } catch (err) {
    console.error(err)
    res.status(500).send('Fout bij het ophalen van extra kaarten')
   }
})
      
module.exports = router
 




