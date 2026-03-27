// API om te zoeken naar landen. Grotendeels gedaan met behulp van Gemini.
// Link: https://gemini.google.com/share/690c13052854

const zoekVeld = document.getElementById('locatie-zoeken');
const suggestieLijst = document.getElementById('suggestie-lijst');
const container = document.getElementById('gekozen-locaties-container');

// 1. Luister naar input in het zoekveld
zoekVeld.addEventListener('input', async (e) => {
    const waarde = e.target.value.trim();
    
    // Alleen zoeken als er minimaal 3 letters getypt zijn
    if (waarde.length < 3) {
        suggestieLijst.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`/zoek-locatie?q=${encodeURIComponent(waarde)}`);
        const data = await res.json();
        
        suggestieLijst.innerHTML = '';
        
        if (Array.isArray(data)) {
            data.forEach(plek => {
                const li = document.createElement('li');
                li.classList.add('chipSuggestie');
                li.textContent = plek.display_name;
                
                li.onclick = () => {
                    voegLocatieToe(plek.display_name);
                    zoekVeld.value = '';
                    suggestieLijst.innerHTML = '';
                };
                
                suggestieLijst.appendChild(li);
            });
        }
    } catch (err) {
        console.error("Zoekfout:", err);
    }
});

// 2. Voeg een klikbare tag toe
function voegLocatieToe(naam) {
    // Check of de tag al bestaat (voorkomt dubbelen)
    const bestaandeTags = Array.from(container.querySelectorAll('input')).map(i => i.value);
    if (bestaandeTags.includes(naam)) return;

    const div = document.createElement('div');
    div.className = 'gekozen-locatie-tag';
    
    // De checkbox is onzichtbaar maar stuurt de data wel mee naar de server
    div.innerHTML = `
        <div class="chipVerwijderbaar">
            <input type="checkbox" name="bestemmingen" value="${naam}" checked > 
            <label>${naam}</label>
        </div>
    `;

    // Verwijder de tag als je erop klikt
    div.onclick = () => div.remove();

    container.appendChild(div);
}

// 3. Sluit de lijst als je ergens anders klikt
document.addEventListener('click', (e) => {
    if (e.target !== zoekVeld) {
        suggestieLijst.innerHTML = '';
    }
});