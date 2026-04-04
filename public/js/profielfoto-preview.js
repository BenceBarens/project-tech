const fotoInput = document.getElementById('profielfoto');
const previewImage = document.getElementById('image-preview');

fotoInput.addEventListener('change', function() {
    const file = this.files[0];

    if (file) {
        const reader = new FileReader();

        reader.addEventListener('load', function() {
            previewImage.setAttribute('src', this.result);
        });

        reader.readAsDataURL(file);
    }
});