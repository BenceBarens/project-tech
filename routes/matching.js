const { ObjectId } = require('mongodb')
const { maakArray, normaliseerFilters } = require('../src/utils/array')


//reisdata uit DB. Objecten voor de reis zelf netjes maken
    function normaliseer (reizen) {
            return reizen.map(reis => ({
            ...reis,
          /*  bestemmingen: maakArray(reis.bestemmingen), */
          /*  activiteit: maakArray(reis.activiteit), */
            verblijf: maakArray(reis.verblijf),
        }))
    } 

     //////////////// filtering ///////////////
// URL/queryfilters consistent maken
    function filter(reizen, query) {
    const filters = normaliseerFilters(query)

    const verblijfFilter = filters.verblijf
    const budgetFilter = filters.bedragen

    const reizigersMin = Number(filters.reizigersMin)
    const reizigersMax = Number(filters.reizigersMax)
   
    return reizen.filter(reis => {

            //verblijf (array match)
            if (verblijfFilter.length > 0) {
                if (!verblijfFilter.some(waarde => reis.verblijf.includes (waarde))) {
                    return false
                }
            }   

            // budget (exact match)
            if (budgetFilter.length > 0) {
                if (!budgetFilter.includes (reis.bedragen)) {
                    return false
                }
            }

            //// range matches ////

            //reizigers min 
            if (filters.reizigersMin) {
                if (Number(reis.maxReizigers) < reizigersMin) {
                    return false
                }
            }

            //reizigers max 
            if (filters.reizigersMax) {
                if (Number(reis.minReizigers) > reizigersMax) {
                    return false
                }
            }

            return true
     })

    }
  
////////////////// matches ophalen ///////////////////

async function haalMatchesOp(db,gebruikerId,query, limiet=10) {
const alleReizen = await db.collection('reizen').find().toArray()

let reizenOmTeTonen = alleReizen

if (gebruikerId) {
 const gebruiker = await db.collection('gebruikers').findOne ({
            _id: new ObjectId(gebruikerId)
        })

        const geaccepteerde = gebruiker?.geaccepteerdeReizen || []
        const afgewezen = gebruiker?.afgewezenReizen || []

        const verwerkteIds = [...geaccepteerde, ...afgewezen].map(id => id.toString())

        reizenOmTeTonen = reizenOmTeTonen.filter(reis => 
            !verwerkteIds.includes(reis._id.toString())
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

//exporteren maakt code naar keuze zichtbaar voor index.js (encapsulation)
 module.exports = {
    maakArray,
    normaliseer,
    filter,
    haalMatchesOp
}

