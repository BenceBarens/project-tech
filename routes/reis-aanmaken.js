const express = require('express')
const router = express.Router()
const multer = require('multer')

const upload = multer({ dest: 'public/uploads/coverfoto' })

router.get('/nieuwe-reis', (req, res) => {
  res.render('paginas/reis-aanmaken', { 
    data: { 
      pagina: { titel: 'Nieuwe reis aanmaken' } 
    } 
  })
})

// Verwerk de data (POST)
router.post('/nieuwe-reis', upload.single('reisFoto'), async (req, res) => {
  try {
    const database = req.app.get('db') 
    const collection = database.collection('reizen')
    
    const reisData = req.body
    
    if (req.file) {
      reisData.fotoPad = req.file.filename
    }

    await collection.insertOne(reisData)
    console.log("Reis succesvol opgeslagen in MongoDB!")
    res.redirect('/')
    
  } catch (err) {
    console.error("Fout bij opslaan:", err)
    res.status(500).send("Er ging iets mis bij het opslaan.")
  }
})

module.exports = router