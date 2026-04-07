function berekenLeeftijd(geboortedatum) {
    const vandaag = new Date()
    const geboorte = new Date(geboortedatum)

    let leeftijd = vandaag.getFullYear() - geboorte.getFullYear()
    const maandVerschil = vandaag.getMonth() - geboorte.getMonth()

    if (
        maandVerschil < 0 ||
        (maandVerschil === 0 && vandaag.getDate() < geboorte.getDate ())
    ) {
        leeftijd--
    }
    return leeftijd
}
module.exports = { berekenLeeftijd }