const volgendeKnoppen = document.querySelectorAll('.btn-volgende')

volgendeKnoppen.forEach(knop => {
    knop.addEventListener('click', function(e) {
        const huidigeStap = this.closest('fieldset')
        const verplichteVelden = huidigeStap.querySelectorAll('[required]')
        let stapIsGeldig = true

        verplichteVelden.forEach(veld => {
            // Check of het veld geldig is volgens de browser regels
            if (!veld.checkValidity()) {
                stapIsGeldig = false
                
                // Voeg de rode border toe aan ELK required element
                if (veld.type === 'file') {
                    document.getElementById('dropzone').classList.add('input-error')
                    document.getElementById('file-error')?.classList.remove('hidden')
                } else {
                    veld.classList.add('input-error')
                }
                
                // Toon het wolkje voor extra verduidelijking
                veld.reportValidity();
            } else {
                // Reset als het veld inmiddels wel klopt
                veld.classList.remove('input-error')
            }
        })

        if (huidigeStap.id === 'stap5') {
            const locatiesLijst = document.getElementById('gekozen-locaties-container')
            const locatieInput = document.getElementById('locatie-zoeken')
            const locatieError = document.getElementById('locatie-error')

            // Check of er LI-elementen in de lijst staan
            if (locatiesLijst.children.length === 0) {
                stapIsGeldig = false
                locatieInput.classList.add('input-error'); // Maak het zoekveld rood als hint
                locatieError.style.display = 'block'
            } else {
                locatieInput.classList.remove('input-error')
                locatieError.style.display = 'none'
            }
        }

        // Blokkeer navigatie als er iets mist
        if (!stapIsGeldig) {
            e.preventDefault()
            e.stopPropagation()
        }
    })
})

// LIVE FEEDBACK: Verwijder de rode border zodra de gebruiker begint te typen
document.addEventListener('input', function(e) {
    const veld = e.target
    if (veld.hasAttribute('required') && veld.checkValidity()) {
        veld.classList.remove('input-error')
        
        // Specifieke reset voor de foto-upload
        if (veld.id === 'reisFoto') {
            document.getElementById('dropzone').classList.remove('input-error')
            document.getElementById('file-error')?.classList.add('hidden')
        }
    }
})