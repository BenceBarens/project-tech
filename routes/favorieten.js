const express = require('express')
const router = express.Router()

router.get('/favorieten', (req, res) => {
    res.render('paginas/favorieten', { 
        data: { 
            pagina: { titel: 'Favorieten' }
        } 
    })
})

module.exports = router