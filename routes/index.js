const express = require('express')
const router = express.Router()

const { haalMatchesOp } = require('./matching')

router.get('/', async (req, res) => {

    // reis binnenhalen 
        try {
        const db = req.app.get('db')
        const gebruikerId = req.session?.gebruiker?.id || null

        console.log('filters:', req.query)
    
         //alle reizen ophalen
        const resultaat = await haalMatchesOp(
            db,
            gebruikerId,
            req.query
        )

        res.render('paginas/index', {
            data: {
                pagina: { titel: 'Home' },
                reizen: resultaat
            }
        })

    } catch (err) {
        console.error(err)
        res.status(500).send('Fout bij laden')
    }
})
      
module.exports = router
 




