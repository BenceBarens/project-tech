console.log('aanvragen.js geladen')

document.addEventListener('click', async (event) => {
    const accepteerBtn = event.target.closest('.aanvraag-accepteren')
    const weigerBtn = event.target.closest('.aanvraag-weigeren')

    if (!accepteerBtn && !weigerBtn) return

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

        if (response.ok) {
            // De database is klaar, dus we verversen de boel
            window.location.reload()
        } else {
            const data = await response.json()
            alert('Fout: ' + (data.error || 'Kon aanvraag niet verwerken'))
        }

    } catch (err) {
        console.error('Fetch fout:', err)
        alert('Er ging iets mis met de verbinding.')
    }
})