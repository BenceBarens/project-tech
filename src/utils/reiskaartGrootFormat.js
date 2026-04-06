const xss = require('xss')

const bedragLabels = {
    'bedrag1': '€0 tot €500',
    'bedrag2': '€500 tot €1K',
    'bedrag3': '€1K tot €1.5K',
    'bedrag4': '€1.5K tot €2.5K',
    'bedrag5': '€2.5K tot €5K',
    'bedrag6': 'Meer dan €5K'
}

const reisLabels = {
    'reis-optie1': 'Rondreis',
    'reis-optie2': 'Resort',
    'reis-optie3': 'Wintersport',
    'reis-optie4': 'Camping',
    'reis-optie5': 'City trip',
    'reis-optie6': 'Safari'
}

function formatteerGroteReizen(reizen) {
    if (!reizen || !Array.isArray(reizen)) return [];
    
    return reizen.map(reis => {
        const kopie = { ...reis };

        // Organisator pad fix
        if (kopie.organisator) {
            kopie.organisator.profielfoto = kopie.organisator.profielfoto 
                ? '/uploads/profielfoto/' + kopie.organisator.profielfoto 
                : '/images/default-avatar.svg';
        }

        // Deelnemers pad fix
        if (Array.isArray(kopie.deelnemersLijst)) {
            kopie.deelnemersLijst = kopie.deelnemersLijst.map(d => ({
                ...d,
                profielfoto: d.profielfoto ? '/uploads/profielfoto/' + d.profielfoto : '/images/default-avatar.svg'
            }));
        } else {
            kopie.deelnemersLijst = []; // Altijd een array maken
        }

        // Aanvragers pad fix
        if (Array.isArray(kopie.aanvragenLijst)) {
            kopie.aanvragenLijst = kopie.aanvragenLijst.map(a => ({
                ...a,
                profielfoto: a.profielfoto ? '/uploads/profielfoto/' + a.profielfoto : '/images/default-avatar.svg'
            }));
        } else {
            kopie.aanvragenLijst = []; // Altijd een array maken
        }

        return kopie;
    });
}

module.exports = { formatteerGroteReizen }