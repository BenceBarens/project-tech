const express = require('express')
const router = express.Router()

router.get('/instellingen', (req, res) => {
    res.render('paginas/instellingen', { 
        data: { 
            pagina: { titel: 'Profiel bewerken' }
        } 
    })
})

module.exports = router