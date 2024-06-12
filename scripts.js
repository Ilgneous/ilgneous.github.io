document.addEventListener('DOMContentLoaded', function() {
    var dropdownButtons = document.querySelectorAll('.dropdown-btn');

    dropdownButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent the default link behavior
            this.classList.toggle('active');
            var dropdownContainer = this.nextElementSibling;
            if (dropdownContainer.style.display === 'block') {
                dropdownContainer.style.display = 'none';
            } else {
                dropdownContainer.style.display = 'block';
            }
        });
    });
});
