const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Login' }
        } 
    })
})

module.exports = router