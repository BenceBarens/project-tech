const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs')
const xss = require('xss');



router.get('/inloggen', (req, res) => {
    if (req.session.gebruiker) {
        return res.redirect('/profiel')
    }
    else{
      res.render('paginas/inloggen', { 
          data: { 
              pagina: { titel: 'Login' }
          } 
      })
    }
})

module.exports = router

const { body, validationResult } = require('express-validator')

router.post(
  '/inloggen',
  [
    body('email').isEmail().withMessage('De ingevoerde aanmeldgegevens zijn onjuist.'),
    body('wachtwoord').notEmpty().withMessage('De ingevoerde aanmeldgegevens zijn onjuist.')
  ],
  async (req, res) => {

    const errors = validationResult(req)

    // VALIDATIE FOUTEN
    if (!errors.isEmpty()) {
      return res.render('paginas/inloggen', {
        data: {
          pagina: { titel: 'Login' },
          fouten: errors.array()
        }
      })
    }

    try {
      const db = req.app.get('db')

      const { email, wachtwoord } = req.body

      const collectie = db.collection('gebruikers')
      const gebruiker = await collectie.findOne({ email })

      if (!gebruiker) {
        return res.render('paginas/inloggen', {
          data: {
            pagina: { titel: 'Login' },
            fouten: [{ msg: 'De ingevoerde aanmeldgegevens zijn onjuist.' }]
          }
        })
      }

      const klopt = await bcryptjs.compare(wachtwoord, gebruiker.wachtwoord)

      if (!klopt) {
        return res.render('paginas/inloggen', {
          data: {
            pagina: { titel: 'Login' },
            fouten: [{ msg: 'De ingevoerde aanmeldgegevens zijn onjuist.' }]
          }
        })
      }

      req.session.gebruiker = {
        id: gebruiker._id,
        email: gebruiker.email,
        voornaam: gebruiker.voornaam
      }

      res.redirect('/profiel')

    } catch (err) {
      console.error(err)
      res.render('paginas/inloggen', {
        data: {
          pagina: { titel: 'Login' },
          fouten: [{ msg: 'Er ging iets mis, probeer opnieuw' }]
        }
      })
    }
  }
)