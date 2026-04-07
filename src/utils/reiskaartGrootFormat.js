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
    if (!reizen || !Array.isArray(reizen)) return []
    
    return reizen.map(reis => {
        const fixReiziger = (u) => {
            if (!u) return null
            return {
                ...u,
                voornaam: xss(u.voornaam || "Reiziger"),
                achternaam: xss(u.achternaam || ""),
                profielfoto: u.profielfoto 
                    ? '/uploads/profielfoto/' + u.profielfoto 
                    : '/images/default-avatar.svg'
            }
        }

        return {
            ...reis,
            organisator: fixReiziger(reis.organisator),
            // Deelnemers (Mensen die al meegaan)
            deelnemersLijst: (reis.deelnemersLijst || []).map(fixReiziger),
            // Aanvragen (Mensen die in de wachtrij staan)
            aanvragenLijst: (reis.aanvragenLijst || []).map(fixReiziger),
            
            reisTitel: xss(reis.reisTitel || "Reis"),
            bedragen: bedragLabels[reis.bedragen] || reis.bedragen,
            reizen: reisLabels[reis.reizen] || reis.reizen
        }
    })
}

module.exports = { formatteerGroteReizen }