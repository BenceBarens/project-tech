const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('paginas/registreren', { 
        data: { 
            pagina: { titel: 'Registreren' }
        } 
    })
})

module.exports = router