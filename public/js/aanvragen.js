console.log('aanvragen.js geladen')

document.addEventListener('click', async (event) => {
    const accepteerBtn = event.target.closest('.aanvraag-accepteren')
    const weigerBtn = event.target.closest('.aanvraag-weigeren')

    if (!accepteerBtn && !weigerBtn) return

    console.log('aanvragen.js geladen')

    const knop = accepteerBtn || weigerBtn
    const reisId = knop.dataset.reisId
    const gebruikerId = knop.dataset.gebruikerId

    const isAccept = knop.classList.contains('aanvraag-accepteren')
    const url = isAccept
    ? `/reizen/${reisId}/deelnemers/${gebruikerId}/accepteer`
    : `/reizen/${reisId}/deelnemers/${gebruikerId}/weiger`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })

         console.log('response status:', response.status)

        const data = await response.json()
 
        if (!response.ok) {
            throw new Error(data.error || 'Er ging iets mis')
        }

        // UI update
        const aanvraagItem = knop.closest('.aanvraag-item')
            console.log('aanvraagItem:', aanvraagItem)

        if (aanvraagItem) {
            aanvraagItem.remove()
        }

        // check of lijst leeg is > blok weglaten
        const lijst = knop.closest('.aanvragen-container')?.querySelector('.aanvragen-lijst')
        if (lijst && lijst.children.length === 0) {
            lijst.closest('.aanvragen-container')?.remove()
        }

    } catch (err) {
        console.error(err)
        alert('Actie mislukt')
    }
})