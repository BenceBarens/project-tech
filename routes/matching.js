const { ObjectId } = require('mongodb')
const { maakArray, normaliseerFilters } = require('../src/utils/array')
const { berekenLeeftijd } = require('../src/utils/leeftijd')

// reisdata uit DB. Objecten voor de reis zelf netjes maken
function normaliseer(reizen) {
    return reizen.map(reis => ({
        ...reis,
        verblijf: maakArray(reis.verblijf),
    }))
}

//DB inconsistentie recht trekken
function normaliseerGeslacht(waarde) {
    if (!waarde) return null

    const woord = String(waarde).trim().toLowerCase()

    if (woord === 'man' || woord === 'mannen') return 'mannen'
    if (woord === 'vrouw' || woord === 'vrouwen') return 'vrouwen'
    if (woord === 'anders') return 'anders'

    return woord

}
// automatische check op basis van gebruikersprofiel
function reisPastBijGebruiker(reis, gebruiker) {
    if (!gebruiker) return true

    const gebruikerGeslacht = normaliseerGeslacht(gebruiker.geslacht)
    const gebruikerLeeftijd = gebruiker?.geboorteDatum
        ? berekenLeeftijd(gebruiker.geboorteDatum)
        : null

    let reisGeslacht = []

    // altijd een array maken van "geslacht", want soms is het 1 string of undefined
    if (Array.isArray(reis.geslacht)) {
        reisGeslacht = reis.geslacht.map(normaliseerGeslacht)
    } else if (reis.geslacht) {
        reisGeslacht = [normaliseerGeslacht(reis.geslacht)]
    } else {
        reisGeslacht = []
    }

    // geslacht check
    if (reis.geslacht?.length > 0 && gebruikerGeslacht) {
        if (!reis.geslacht.includes(gebruikerGeslacht)) {
            return false
        }
    }

    // leeftijd check
    if (gebruikerLeeftijd !== null) {
        if (reis.minLeeftijd && gebruikerLeeftijd < Number(reis.minLeeftijd)) {
            return false
        }

        if (reis.maxLeeftijd && gebruikerLeeftijd > Number(reis.maxLeeftijd)) {
            return false
        }
    }

    return true
}

// filtering
function filter(reizen, query) {
    const filters = normaliseerFilters(query)

    const verblijfFilter = filters.verblijf
    const budgetFilter = filters.bedragen
    const reisFilter = filters.reizen

    const reizigersMin = Number(filters.reizigersMin)
    const reizigersMax = Number(filters.reizigersMax)

    return reizen.filter(reis => {
        // verblijf
        if (verblijfFilter.length > 0) {
            if (!verblijfFilter.some(waarde => reis.verblijf.includes(waarde))) {
                return false
            }
        }

        // budget
        if (budgetFilter.length > 0) {
            if (!budgetFilter.includes(reis.bedragen)) {
                return false
            }
        }

        // reizen
        if (reisFilter.length > 0) {
            if (!reisFilter.includes(reis.reizen)) {
                return false
            }
        }

        // reizigers min
        if (filters.reizigersMin) {
            if (Number(reis.maxReizigers) < reizigersMin) {
                return false
            }
        }

        // reizigers max
        if (filters.reizigersMax) {
            if (Number(reis.minReizigers) > reizigersMax) {
                return false
            }
        }

        return true
    })
}

async function haalMatchesOp(db, gebruikerId, query, limiet = 10) {
    const alleReizen = await db.collection('reizen').find().toArray()

    let reizenOmTeTonen = alleReizen
    let gebruiker = null

    if (gebruikerId) {
        gebruiker = await db.collection('gebruikers').findOne({
            _id: new ObjectId(gebruikerId)
        })

        const geaccepteerde = gebruiker?.geaccepteerdeReizen || []
        const afgewezen = gebruiker?.afgewezenReizen || []

        const verwerkteIds = [...geaccepteerde, ...afgewezen].map(id => id.toString())

        reizenOmTeTonen = reizenOmTeTonen.filter(reis =>
            !verwerkteIds.includes(reis._id.toString())
        )

        // automatische profielmatch
        reizenOmTeTonen = reizenOmTeTonen.filter(reis =>
            reisPastBijGebruiker(reis, gebruiker)
        )
    }

    if (query.excludeIds) {
        const excludeIds = query.excludeIds
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)

        reizenOmTeTonen = reizenOmTeTonen.filter(reis =>
            !excludeIds.includes(reis._id.toString())
        )
    }

    const genormaliseerdeReizen = normaliseer(reizenOmTeTonen)
    return filter(genormaliseerdeReizen, query).slice(0, limiet)
}

module.exports = {
    maakArray,
    normaliseer,
    filter,
    haalMatchesOp
}