console.log('script geladen met CSS animaties')

document.addEventListener('DOMContentLoaded', () => {

    const container = document.querySelector('.reisKaartContainer')
    const knopAccepteren = document.getElementById('btn-accepteren')
    const knopAfwijzen = document.getElementById('btn-afwijzen')

    if (!container) return // Safety check

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
            temp.innerHTML = html 

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

    // --- AANGEPASTE FUNCTIE ---
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

            if (response.ok) {
                if (actie === 'accepteren') {
                    eersteKaart.classList.add('swipe-rechts')
                } else {
                    eersteKaart.classList.add('swipe-links')
                }

                setTimeout(async () => {
                    eersteKaart.remove()
                    await vulAan()
                }, 500)

            } else if (response.status === 401) {
                window.location.href = '/inloggen'
            } else {
                const data = await response.json()
                alert('Fout: ' + (data.error || 'Kon keuze niet verwerken'))
                eersteKaart.classList.remove('swipe-rechts', 'swipe-links')
            }

        } catch (err) {
            console.error('Match kon niet worden verwerkt:', err)
            eersteKaart.classList.remove('swipe-rechts', 'swipe-links')
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

        fetchNieuweKaarten()
    }
})