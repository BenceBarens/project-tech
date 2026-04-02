const { ObjectId } = require('mongodb')

//data normaliseren (consistent maken)
//Bron: OpenAI. (2026). ChatGPT (GPT-5.3) [Large language model]. Geraadpleegd op 29 maart 2026, van https://chat.openai.com 
//prompt: Hoe maak ik arrays bij een data model bestaande uit arrays en strings?
function maakArray(waarde) {
    if (Array.isArray(waarde)) return waarde
    if (!waarde) return []
    return [waarde]
}

//immutability/ immutable transformation ( maakt een nieuwe array, oude wordt niet veranderd)
//zorgt voor minder bugs 
    function normaliseer (reizen) {
            return reizen.map(reis => ({
            ...reis,
            bestemmingen: maakArray(reis.bestemmingen),
            activiteit: maakArray(reis.activiteit),
            verblijf: maakArray(reis.verblijf),
            geslacht: maakArray(reis.geslacht)
        }))
    }

     //////////////// filtering ///////////////

    function filter(reizen, query) {
    const verblijfFilter = maakArray(query.verblijf)
    const geslachtFilter = maakArray(query.geslacht)
    const budgetFilter = maakArray(query.bedragen)

    const reizigersMin = Number(query.reizigersMin)
    const reizigersMax = Number(query.reizigersMax)
    const leeftijdMin = Number(query.leeftijdMin)
    const leeftijdMax = Number(query.leeftijdMax)


    return reizen.filter(reis => {

            //verblijf (array match)
            if (verblijfFilter.length > 0) {
                if (!verblijfFilter.some(waarde => reis.verblijf.includes (waarde))) {
                    return false
                }
            }   

            //geslacht (array match)
            if (geslachtFilter.length > 0) {
                if (!geslachtFilter.some(waarde => reis.geslacht.includes (waarde))) {
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
            if (query.reizigersMin) {
                if (Number(reis.maxReizigers) < reizigersMin) {
                    return false
                }
            }

            //reizigers max 
            if (query.reizigersMax) {
                if (Number(reis.minReizigers) > reizigersMax) {
                    return false
                }
            }

             //leeftijd min
            if (query.leeftijdMin) {
                if (Number(reis.maxLeeftijd) < leeftijdMin) {
                    return false
                }
            }

              //leeftijd max
            if (query.leeftijdMax) {
                if (Number(reis.minLeeftijd) > leeftijdMax) {
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

