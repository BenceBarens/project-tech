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
                veld.reportValidity()
            } else {
                // Reset als het veld inmiddels wel klopt
                veld.classList.remove('input-error')
            }
        })

        // Blokkeer navigatie als er iets mist
        if (!stapIsGeldig) {
            e.preventDefault()
            e.stopPropagation()
        }
    })
})

document.addEventListener('input', function(e) {
    const veld = e.target
    if (veld.hasAttribute('required') && veld.checkValidity()) {
        veld.classList.remove('input-error')
        
        if (veld.id === 'reisFoto') {
            document.getElementById('dropzone').classList.remove('input-error')
            document.getElementById('file-error')?.classList.add('hidden')
        }
    }
})