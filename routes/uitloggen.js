const express = require('express')
const router = express.Router()

router.get('/uitloggen', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/')
    }
    res.clearCookie('connect.sid')
    res.redirect('/inloggen')
  })
})

module.exports = router