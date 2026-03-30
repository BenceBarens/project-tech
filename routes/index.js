const express = require('express')
const router = express.Router()

const { normaliseer, filter } = require('../public/js/matching')

router.get('/', async (req, res) => {

    // reis binnenhalen 
        try {
        const db = req.app.get('db')

        //checken wat vanuit form binnenkomt
        console.log("filters:", req.query)

        //alle reizen ophalen
        const alleReizen = await db.collection('reizen').find().toArray()


        const reizen = normaliseer(alleReizen)
        const resultaat = filter(reizen,req.query)


console.log('Aantal resultaten:', resultaat.length)

        // homepagina inladen 
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            reizen: resultaat

        } 
    })
} catch (err) {
     console.error(err)
     res.status(500).send('Fout bij het laden van de reis.')
}
     })

module.exports = router





