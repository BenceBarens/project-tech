console.log('script geladen')

document.addEventListener('DOMContentLoaded', () => {

const container = document.querySelector('.reisKaartContainer')
const knopAccepteren = document.getElementById('btn-accepteren')
const knopAfwijzen = document.getElementById('btn-afwijzen')

async function verwerkMatch(actie) {
    const eersteKaart = container.querySelector('.reiskaart')

    if (!eersteKaart) {
        alert('Geen reizen meer beschikbaar!')
        return
    }

    const reisId = eersteKaart.getAttribute('data-reis-id')

    console.log('klik!', actie, reisId) //debug

    try {
        const response = await fetch(`/reizen/${reisId}/verwerk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keuze: actie })
        })

        console.log('response:', response.status) //debug

        if (response.ok) {
            eersteKaart.style.transition = '0.3s'
            eersteKaart.style.transform =
                actie === 'accepteren'
                    ? 'translateX(200px)'
                    : 'translateX(-200px)'
            eersteKaart.style.opacity = '0'

            setTimeout(() => {
                eersteKaart.remove()
            }, 300)
        } else if (response.status === 401) {
            window.location.href = '/inloggen'
        }

    } catch (err) {
        console.error('Match kon niet worden verwerkt:', err)
    }
}

// kleine safety checks (belangrijk!)
if (knopAccepteren && knopAfwijzen && container) {
    knopAccepteren.addEventListener('click', () => verwerkMatch('accepteren'))
    knopAfwijzen.addEventListener('click', () => verwerkMatch('afwijzen'))
} else {
        console.log('knoppen of container niet gevonden ❌')
    }
})