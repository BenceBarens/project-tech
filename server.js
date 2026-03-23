const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const app = express();

app.engine('ejs', engine); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.render('paginas/index', { 
        data: { 
            pagina: { titel: 'Home' },
            filters: { bestemmingen: [] }
        } 
    });
});

app.get('/nieuwe-reis', (req, res) => {
    res.render('paginas/reis-aanmaken', { 
        data: { 
            pagina: { titel: 'Nieuwe reis aanmaken' }
        } 
    });
});

app.get('/inloggen', (req, res) => {
    res.render('paginas/inloggen', { 
        data: { 
            pagina: { titel: 'Log in' }
        } 
    });
});

app.get('/registreren', (req, res) => {
    res.render('paginas/registreren', { 
        data: { 
            pagina: { titel: 'Registreren' }
        } 
    });
});

app.get('/profiel', function (req, res) {
    res.render('paginas/profiel', {
        data: {
            pagina: { titel: 'Profiel' },
            gebruiker: gebruiker
        }
    })
})

app.get('/favorieten', function (req, res) {
    res.render('paginas/favorieten', {
        data: {
            pagina: { titel: 'Favorieten' },
            gebruiker: gebruiker
        }
    })
})

app.get('/instellingen', function (req, res) {
    res.render('paginas/instellingen', {
        data: {
            pagina: { titel: 'Instellingen' },
            gebruiker: gebruiker
        }
    })
})

app.post('/uitloggen', function (req, res) {
res.redirect('/inloggen')
})

app.use((req, res) => {
    res.status(404).render('paginas/404', { 
        data: { 
            pagina: { titel: '404 - Niet gevonden' } 
        } 
    });
});

app.listen(3000, () => {
    console.log('Server draait op http://localhost:3000/');
});