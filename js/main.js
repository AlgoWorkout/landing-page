// =================================
// SMOOTH SCROLLING FOR NAVIGATION
// =================================

document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Only handle internal anchor links
            if (href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // =================================
    // SCROLL ANIMATIONS
    // =================================

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all feature cards and strategy cards
    const animatedElements = document.querySelectorAll('.feature-card, .strategy-card, .pricing-card, .pipeline-stage');
    animatedElements.forEach(el => observer.observe(el));

    // =================================
    // MOBILE MENU TOGGLE (Future Enhancement)
    // =================================

    // This can be expanded later to add mobile menu functionality

    // =================================
    // THEME TOGGLE
    // =================================

    const themeToggle = document.getElementById('theme-toggle');

    // Get current theme from localStorage or system preference
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('algoworkout-theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme to document
    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // Save theme preference
    function saveTheme(theme) {
        localStorage.setItem('algoworkout-theme', theme);
    }

    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveTheme(newTheme);
    }

    // Add click listener to theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('algoworkout-theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    console.log('AlgoWorkout website loaded successfully!');
});
