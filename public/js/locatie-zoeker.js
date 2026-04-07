// API om te zoeken naar landen. Grotendeels gedaan met behulp van Gemini.
// Link: https://gemini.google.com/share/690c13052854

const zoekVeld = document.getElementById('locatie-zoeken')
const suggestieLijst = document.getElementById('suggestie-lijst')
const container = document.getElementById('gekozen-locaties-container')

const inputNaam = container.getAttribute('data-input-name') || 'bestemmingen'
const maxLocaties = parseInt(container.getAttribute('data-max')) || 999

zoekVeld.addEventListener('input', async (e) => {
    const waarde = e.target.value.trim()
    
    if (waarde.length < 3) {
        suggestieLijst.innerHTML = ''
        return
    }

    try {
        const res = await fetch("/zoek-locatie?q=" + encodeURIComponent(waarde))
        const data = await res.json()
        
        suggestieLijst.innerHTML = ''
        
        if (Array.isArray(data)) {
            data.forEach(plek => {
                const li = document.createElement('li')
                li.classList.add('chipSuggestie')
                li.textContent = plek.display_name
                
                li.onclick = () => {
                    voegLocatieToe(plek.display_name)
                    zoekVeld.value = ''
                    suggestieLijst.innerHTML = ''
                }
                
                suggestieLijst.appendChild(li)
            })
        }
    } catch (err) {
        console.error("Zoekfout:", err)
    }
})

function voegLocatieToe(naam) {
    const huidigeTags = container.querySelectorAll('.gekozen-locatie-tag')
    
    if (maxLocaties === 1 && huidigeTags.length > 0) {
        container.innerHTML = ''
    } 
    else {
        const bestaandeTags = Array.from(container.querySelectorAll('input')).map(i => i.value)
        if (bestaandeTags.includes(naam)) return
    }

    const div = document.createElement('div')
    div.className = 'gekozen-locatie-tag'

    div.innerHTML = 
        '<div class="chipVerwijderbaar">' +
            '<input type="checkbox" name="' + inputNaam + '" value="' + naam + '" checked style="display:none">' +
        '<label>' + naam + '</label>' +
        '</div>'

    div.onclick = () => div.remove()
    container.appendChild(div)
}

document.addEventListener('click', (e) => {
    if (e.target !== zoekVeld) suggestieLijst.innerHTML = ''
})