const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs')


router.get('/inloggen', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Login' }
        } 
    })
})

module.exports = router

// LOGIN VERWERKEN
router.post('/inloggen', async (req, res) => {
    try {
        const db = req.app.get('db')
        const { email, wachtwoord } = req.body

        const collectie = db.collection('gebruikers')

        // gebruiker zoeken
        const gebruiker = await collectie.findOne({ email: email })

        if (!gebruiker) {
            return res.send("Email of wachtwoord klopt niet")
        }

        // wachtwoord checken
        const klopt = await bcryptjs.compare(wachtwoord, gebruiker.wachtwoord)

        if (!klopt) {
            return res.send("Email of wachtwoord klopt niet")
        }

        // SESSION OPSLAAN
        req.session.gebruiker = {
            id: gebruiker._id,
            email: gebruiker.email,
            voornaam: gebruiker.voornaam
        }

        res.redirect('/')

    } catch (err) {
    console.error(err)
    res.send(err.message)
}
})


// wachtwoord tonen

module.exports = router