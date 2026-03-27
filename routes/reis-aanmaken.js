const express = require('express')
const router = express.Router()
const multer = require('multer')
const axios = require('axios')
const { ObjectId } = require('mongodb')

const upload = multer({ dest: 'public/uploads/coverfoto' })

router.get('/nieuwe-reis', (req, res) => {
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
    // Functie om accenten te verwijderen: bijv. "Málaga" -> "Malaga"
    const verwijderAccenten = (str) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const origineleZoekTerm = req.query.q;
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
          // We slaan een "schone" versie van de naam op voor de vergelijking
          schoonNaam: verwijderAccenten(naam)
        };
      })
      .filter(item => {
        // We vergelijken nu de "schone" zoekterm met de "schone" naam
        // "mal" matcht nu op "Malaga" (van Málaga)
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
    
    if (!req.session.gebruiker) {
      return res.redirect('/inloggen')
  }

    const reisData = req.body

    // Zorgt ervoor dat gekozenLocaties altijd een lijst (array) is in je database
    if (reisData.gekozenLocaties && !Array.isArray(reisData.gekozenLocaties)) {
      reisData.gekozenLocaties = [reisData.gekozenLocaties]
  }
    
    if (req.file) {
      reisData.fotoPad = req.file.filename
    }

    // Voeg de ID van de gebruiker toe aan de reis
    reisData.gebruikerId = new ObjectId(req.session.gebruiker.id)

    const resultaat = await reizenCollectie.insertOne(reisData)
    const nieuweReisId = resultaat.insertedId

    await gebruikersCollectie.updateOne(
      { _id: new ObjectId(req.session.gebruiker.id) },
      { $push: { reizen: nieuweReisId } } 
    )
    console.log("Reis succesvol opgeslagen in MongoDB en gekoppeld aan gebruiker!")
    res.redirect('/profiel')
    
  } catch (err) {
    console.error("Fout bij opslaan:", err)
    res.status(500).send("Er ging iets mis bij het opslaan.")
  }
})

module.exports = router