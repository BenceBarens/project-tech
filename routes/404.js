const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.render('paginas/404', { 
      data: { 
          pagina: { titel: '404' }
      } 
  })
})

module.exports = router