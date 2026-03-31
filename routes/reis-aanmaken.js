const express = require('express')
const router = express.Router()
const multer = require('multer')
const axios = require('axios')
const { ObjectId } = require('mongodb')

const upload = multer({ dest: 'public/uploads/coverfoto' })

router.get('/nieuwe-reis', (req, res) => {
  if (!req.session.gebruiker) {
    return res.render('paginas/inlog-required', { 
      data: { 
        pagina: { titel: 'Inloggen vereist' } 
      } 
    })
  }

  res.render('paginas/reis-aanmaken', { 
    data: { 
      pagina: { titel: 'Nieuwe reis aanmaken' } 
    } 
  })
})

// API om te zoeken naar landen. Grotendeels gedaan met behulp van Gemini.
// Link: https://gemini.google.com/share/690c13052854

router.get('/zoek-locatie', async (req, res) => {
  try {
    const verwijderAccenten = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const origineleZoekTerm = req.query.q;
    if (!origineleZoekTerm) return res.json([]);

    const zoekTermSchoon = verwijderAccenten(origineleZoekTerm);
    const username = 'itsjoeyhere'; 

    const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(origineleZoekTerm)}&maxRows=20&lang=nl&username=${username}&style=full&featureClass=P&featureClass=A`;

    const response = await axios.get(url);

    if (response.data.status) {
      return res.status(401).json({ error: response.data.status.message });
    }

    const dataLijst = response.data.geonames || [];

    const resultaten = dataLijst
      .map(plek => {
        const naam = plek.name;
        const land = plek.countryName;
        const display = (land && land !== naam) ? `${naam}, ${land}` : naam;
        
        return {
          display_name: display,
          schoonNaam: verwijderAccenten(naam)
        };
      })
      .filter(item => {
        return item.schoonNaam.startsWith(zoekTermSchoon);
      })
      .sort((a, b) => a.display_name.length - b.display_name.length);

    const schoneResultaten = resultaten.map(item => ({ display_name: item.display_name }));
    res.json(schoneResultaten.slice(0, 5));

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: 'Er is iets misgegaan.' });
  }
});

router.post('/nieuwe-reis', upload.single('reisFoto'), async (req, res) => {
  try {
    const database = req.app.get('db') 
    const reizenCollectie = database.collection('reizen')
    const gebruikersCollectie = database.collection('gebruikers')
    
    // Dubbele check: mocht de sessie verlopen tijdens het invullen
    if (!req.session.gebruiker) {
      return res.render('paginas/inlog-required', { 
        data: { 
          pagina: { titel: 'Inloggen vereist' } 
        } 
      })
    }

    const reisData = req.body

    // Normaliseer locaties: zorg dat het altijd een array is
    if (reisData.gekozenLocaties && !Array.isArray(reisData.gekozenLocaties)) {
      reisData.gekozenLocaties = [reisData.gekozenLocaties]
    }
    
    if (req.file) {
      reisData.fotoPad = req.file.filename
    }

    // Koppel de reis aan de huidige gebruiker
    reisData.gebruikerId = new ObjectId(req.session.gebruiker.id)

    const resultaat = await reizenCollectie.insertOne(reisData)
    const nieuweReisId = resultaat.insertedId

    await gebruikersCollectie.updateOne(
      { _id: new ObjectId(req.session.gebruiker.id) },
      { $push: { reizen: nieuweReisId } } 
    )

    console.log("Reis succesvol opgeslagen en gekoppeld aan gebruiker!");
    res.redirect('/profiel');
    
  } catch (err) {
    console.error("Fout bij opslaan:", err);
    res.status(500).send("Er ging iets mis bij het opslaan van de reis.");
  }
})

module.exports = router;