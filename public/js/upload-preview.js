const fileInput = document.getElementById('reisFoto')
const preview = document.getElementById('image-preview')
const textContent = document.getElementById('dropzone-text')

fileInput.addEventListener('change', function() {
    const file = this.files[0] // Pak het gekozen bestand
    
    if (file) {
        const reader = new FileReader() // Maak een hulpstukje om het bestand te lezen
        
        reader.onload = function(e) {
            // Zodra de browser de foto heeft gelezen:
            preview.src = e.target.result      // Stop de foto-data in de <img> src
            preview.classList.remove('hidden') // Maak de <img> zichtbaar
            textContent.classList.add('hidden') // Verberg de tekst en het icoon
        }
        
        reader.readAsDataURL(file) // Start het lezen van de foto
    }
})