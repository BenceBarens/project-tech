const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

router.get('/reis/:id', async (req, res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    try {
        const reis = await db.collection('reizen').findOne({ _id: new ObjectId(id) });

        if (!reis) {
            return res.status(404).render('404');
        }

        let isEigenaar = false;

        if (req.session.gebruiker) {
            isEigenaar = reis.gebruikerId.toString() === req.session.gebruiker.id.toString();
        }

        res.render('paginas/reis-detail', { 
            data: { 
                reis: reis,
                isEigenaar: isEigenaar,
                gebruiker: req.session.gebruiker,
                pagina: { titel: reis.reisTitel } 
            } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Er is iets misgegaan bij het ophalen van de reis.");
    }
});

module.exports = router;