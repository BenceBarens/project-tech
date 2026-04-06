const express = require('express')
const router = express.Router()
const multer = require('multer')
const axios = require('axios')
const { ObjectId } = require('mongodb')
const xss = require('xss')

const upload = multer({ dest: 'public/uploads/coverfoto' })

router.get('/nieuwe-reis', (req, res) => {
  if (!req.session.gebruiker) {
    return res.render('paginas/inlog-required', { 
      data: { pagina: { titel: 'Inloggen vereist' } } 
    })
  }

  res.render('paginas/reis-aanmaken', { 
    data: { pagina: { titel: 'Nieuwe reis aanmaken' } } 
  })
})

router.get('/zoek-locatie', async (req, res) => {
  try {
    const verwijderAccenten = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    const origineleZoekTerm = req.query.q
    if (!origineleZoekTerm) return res.json([])

    const zoekTermSchoon = verwijderAccenten(origineleZoekTerm)
    const username = 'itsjoeyhere' 

    const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(origineleZoekTerm)}&maxRows=20&lang=nl&username=${username}&style=full&featureClass=P&featureClass=A`

    const response = await axios.get(url)

    if (response.data.status) {
      return res.status(401).json({ error: response.data.status.message })
    }

    const dataLijst = response.data.geonames || []

    const resultaten = dataLijst
      .map(plek => {
        const naam = plek.name
        const land = plek.countryName
        const display = (land && land !== naam) ? `${naam}, ${land}` : naam
        
        return {
          display_name: xss(display),
          schoonNaam: verwijderAccenten(naam)
        }
      })
      .filter(item => item.schoonNaam.startsWith(zoekTermSchoon))
      .sort((a, b) => a.display_name.length - b.display_name.length)

    res.json(resultaten.map(item => ({ display_name: item.display_name })).slice(0, 5))

  } catch (err) {
    console.error("Server Error:", err.message)
    res.status(500).json({ error: 'Er is iets misgegaan.' })
  }
})

router.post('/nieuwe-reis', upload.single('reisFoto'), async (req, res) => {
  try {
    const database = req.app.get('db') 
    
    if (!req.session.gebruiker) {
      return res.render('paginas/inlog-required', { 
        data: { pagina: { titel: 'Inloggen vereist' } } 
      })
    }

    const nieuweReis = {
        reisTitel: xss(req.body.reisTitel),
        reis_samenvatting: xss(req.body.reis_samenvatting),
        reis_beschrijving: xss(req.body.reis_beschrijving),
        startDatum: xss(req.body.startDatum),
        eindDatum: xss(req.body.eindDatum),
        bedragen: xss(req.body.bedragen),
        reizen: xss(req.body.reizen),
        verblijf: xss(req.body.verblijf),
        minLeeftijd: xss(req.body.minLeeftijd),
        maxLeeftijd: xss(req.body.maxLeeftijd),
        minReizigers: xss(req.body.minReizigers),
        maxReizigers: xss(req.body.maxReizigers),
        gebruikerId: new ObjectId(req.session.gebruiker.id)
    }

    // Saneer locaties (array check)
    if (req.body.gekozenLocaties) {
        const locaties = Array.isArray(req.body.gekozenLocaties) 
            ? req.body.gekozenLocaties 
            : [req.body.gekozenLocaties]
        nieuweReis.bestemmingen = locaties.map(loc => xss(loc))
    }

    if (req.file) {
      nieuweReis.fotoPad = req.file.filename
    }

    const resultaat = await database.collection('reizen').insertOne(nieuweReis)
    const nieuweReisId = resultaat.insertedId

    // Koppel aan gebruiker
    await database.collection('gebruikers').updateOne(
      { _id: new ObjectId(req.session.gebruiker.id) },
      { $push: { reizen: nieuweReisId } } 
    )

    res.redirect('/profiel')
    
  } catch (err) {
    console.error("Fout bij opslaan:", err)
    res.status(500).send("Er ging iets mis bij het opslaan van de reis.")
  }
})

module.exports = router