const express = require('express')
const router = express.Router()

router.get('/inloggen', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Login' }
        } 
    })
})

module.exports = router