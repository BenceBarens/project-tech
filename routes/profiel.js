const express = require('express')
const router = express.Router()

router.get('/profiel', (req, res) => {
    res.render('paginas/profiel', { 
        data: { 
            pagina: { titel: 'Mijn profiel' }
        } 
    })
})

module.exports = router