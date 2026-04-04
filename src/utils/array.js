//data normaliseren (consistent maken)
//Bron: OpenAI. (2026). ChatGPT (GPT-5.3) [Large language model]. Geraadpleegd op 29 maart 2026, van https://chat.openai.com 
//prompt: Hoe maak ik arrays bij een data model bestaande uit arrays en strings?
function maakArray(waarde) {
    if (Array.isArray(waarde)) return waarde
    if (!waarde) return []
    return [waarde]
}

function normaliseerFilters(query) {
    return {
        bedragen: maakArray(query.bedragen),
        verblijf: maakArray(query.verblijf),
        reizen: maakArray(query.reizen),
        reizigersMin: query.reizigersMin || '',
        reizigersMax: query.reizigersMax || ''
    }
}

module.exports = { maakArray, normaliseerFilters }