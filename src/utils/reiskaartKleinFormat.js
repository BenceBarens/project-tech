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

function formatteerReizen(reizen) {
    if (!reizen || !Array.isArray(reizen)) return []
    
    return reizen.map(reis => {
        let geformatteerdeBestemmingen = ""
        
        if (reis.bestemmingen && Array.isArray(reis.bestemmingen)) {
            const aantalBestemmingen = reis.bestemmingen.length
            // Saneer de bestemmingen voordat we ze slicen en joinen
            const veiligeBestemmingen = reis.bestemmingen.map(b => xss(b))
            
            const eersteDrie = veiligeBestemmingen.slice(0, 3)
            geformatteerdeBestemmingen = eersteDrie.join(" | ")
            
            if (aantalBestemmingen > 3) {
                const resterend = aantalBestemmingen - 3
                geformatteerdeBestemmingen += ` | + ${resterend} andere plekken`
            }
        }

        return {
            ...reis,
            reisTitel: xss(reis.reisTitel),
            bedragen: bedragLabels[reis.bedragen] || reis.bedragen,
            reizen: reisLabels[reis.reizen] || reis.reizen,
            bestemmingen: geformatteerdeBestemmingen
        }
    })
}

module.exports = { formatteerReizen }