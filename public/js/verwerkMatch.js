console.log('script geladen')

document.addEventListener('DOMContentLoaded', () => {

const container = document.querySelector('.reisKaartContainer')
const knopAccepteren = document.getElementById('btn-accepteren')
const knopAfwijzen = document.getElementById('btn-afwijzen')

let buffer = []
let isFetching = false 
let geladenIds = new Set()

//nieuwe kaarten ophalen (partial)
async function fetchNieuweKaarten() {
if (isFetching) return
isFetching = true

try {
    const exclude = Array.from(geladenIds).join(',')

    const params = new URLSearchParams(window.location.search)
    params.set('excludeIds', exclude)

    const response = await fetch(`/meer?${params.toString()}`)

    if (!response.ok) {
       throw new Error(`Serverfout: ${response.status}`)
    }

    const html = await response.text()

    const temp = document.createElement('div')
    temp.innerHTML  = html 

    const nieuweKaarten = temp.querySelectorAll('.reiskaartGroot')

    nieuweKaarten.forEach(kaart => {
        const id = kaart.getAttribute('data-reis-id')
        if (id) geladenIds.add(id)
    })

    buffer.push(...nieuweKaarten)
} catch (err) {
    console.error('Fout bij het ophalen van de kaarten', err)
} finally {
    isFetching = false
}
}

// 1 kaart toevoegen aan DOM
function voegKaartToe() {
    if (buffer.length === 0) return

    const kaart = buffer.shift()
    container.appendChild(kaart)
}

// zorg dat er altijd 3 kaarten zijn
async function vulAan() {
    const aantal = container.querySelectorAll('.reiskaartGroot').length

    if (aantal < 3) {
        if (buffer.length === 0) {
           await fetchNieuweKaarten()
        }
        
        voegKaartToe()
    }
    
// buffer bijna leeg > alvast nieuwe halen
if (buffer.length < 2) {
    fetchNieuweKaarten()
  }
}

async function verwerkMatch(actie) {
    const eersteKaart = container.querySelector('.reiskaartGroot')

    if (!eersteKaart) {
        alert('Geen reizen meer beschikbaar!')
        return
    }

    const reisId = eersteKaart.getAttribute('data-reis-id')

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

            setTimeout(async () => {
                eersteKaart.remove()
                await vulAan()
            }, 300)

        } else if (response.status === 401) {
            window.location.href = '/inloggen'
        }

    } catch (err) {
        console.error('Match kon niet worden verwerkt:', err)
    }
}

// init
if (knopAccepteren && knopAfwijzen && container) {
    const bestaandeKaarten = container.querySelectorAll('.reiskaartGroot')

    bestaandeKaarten.forEach(kaart => {
        const id = kaart.getAttribute('data-reis-id')
        if(id) geladenIds.add(id)
    })

    knopAccepteren.addEventListener('click', () => verwerkMatch('accepteren'))
    knopAfwijzen.addEventListener('click', () => verwerkMatch('afwijzen'))

   // meteen buffer vullen bij start
   fetchNieuweKaarten()

}
})
