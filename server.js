const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const app = express();

app.engine('ejs', engine); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

app.listen(3000, () => {
    console.log('Server draait op http://localhost:3000/');
});