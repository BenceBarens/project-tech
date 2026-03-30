const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')

router.get('/profiel', async function(req, res) {
    try {
        const db = req.app.get('db')

        // Dubbel check of er iemand is ingelogd
        if (!req.session.gebruiker) {
            return res.redirect('/inloggen')
        }

        const gebruikerData = await db.collection('gebruikers').findOne({ 
            _id: new ObjectId(req.session.gebruiker.id) 
        });

        if (!gebruikerData) {
            return res.send("Gebruiker niet gevonden")
        }

        let deReizen = []
        if (gebruikerData.reizen && gebruikerData.reizen.length > 0) {
            deReizen = await db.collection('reizen').find({
                _id: { $in: gebruikerData.reizen }
            }) .toArray()
        }

        // Stuur de data naar profiel pagina
        res.render('paginas/profiel', {
            data: {
                pagina: { titel: 'Mijn profiel' },
                gebruiker: {
                    voornaam: gebruikerData.voornaam,
                    achternaam: gebruikerData.achternaam,
                    bio: gebruikerData["bio"] || "Nog geen bio toegevoegd.",
                    woonplaats: gebruikerData.woonplaats,
                    land: gebruikerData.land,
                    profielfoto: gebruikerData.profielfoto ? '/uploads/profielfoto/' + gebruikerData.profielfoto : '/images/default-avatar.svg',              
                    reizen: deReizen
                }
            }
        })
    } catch (err) {
        console.error("Profiel fout:", err);
        res.status(500).send("Er ging iets mis.")
}
})

module.exports = router