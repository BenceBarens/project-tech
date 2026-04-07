const express = require('express')
const router = express.Router()

router.use(function(req, res) {
  res.status(404).render('paginas/404', { 
      data: { 
          pagina: { titel: '404 - Lost in Transit' }
      } 
  })
})

module.exports = router