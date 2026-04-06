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
        // 1. Formatteer de organisator (en saneer namen voor de zekerheid)
        if (reis.organisator) {
            reis.organisator.voornaam = xss(reis.organisator.voornaam)
            reis.organisator.achternaam = xss(reis.organisator.achternaam)
            reis.organisator.profielfoto = reis.organisator.profielfoto 
                ? '/uploads/profielfoto/' + reis.organisator.profielfoto 
                : '/images/default-avatar.svg'
        }

        // 2. Formatteer deelnemers
        if (reis.deelnemersLijst && Array.isArray(reis.deelnemersLijst)) {
            reis.deelnemersLijst = reis.deelnemersLijst.map(deelnemer => ({
                ...deelnemer,
                voornaam: xss(deelnemer.voornaam),
                achternaam: xss(deelnemer.achternaam),
                profielfoto: deelnemer.profielfoto 
                    ? '/uploads/profielfoto/' + deelnemer.profielfoto 
                    : '/images/default-avatar.svg'
            }))
        }

        // 3. Vertaal labels en saneer titels/beschrijvingen
        return {
            ...reis,
            reisTitel: xss(reis.reisTitel),
            reis_samenvatting: xss(reis.reis_samenvatting),
            bedragen: bedragLabels[reis.bedragen] || reis.bedragen,
            reizen: reisLabels[reis.reizen] || reis.reizen
        }
    })
}

module.exports = { formatteerGroteReizen }