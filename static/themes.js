document.addEventListener('DOMContentLoaded', function() {
    // Toast auto-hide functionality
    const toastElements = document.querySelectorAll('[id^="toast-"]');
    
    toastElements.forEach(function(toast) {
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 10000);
    });

    var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Function to update icons based on current theme
    function updateThemeIcons() {
        if (document.documentElement.classList.contains('dark')) {
            themeToggleLightIcon.classList.remove('hidden');
            themeToggleDarkIcon.classList.add('hidden');
        } else {
            themeToggleDarkIcon.classList.remove('hidden');
            themeToggleLightIcon.classList.add('hidden');
        }
    }

    // Initialize icons on page load
    updateThemeIcons();

    var themeToggleBtn = document.getElementById('theme-toggler');

    themeToggleBtn.addEventListener('click', function() {
        // Toggle dark class
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
        
        // Update icons after toggle
        updateThemeIcons();
    });
});
