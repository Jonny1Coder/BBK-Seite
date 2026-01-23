// Theme Manager for BBK-Seite
// Manages 3 modes: auto (device preference), light, dark

(function() {
    'use strict';
    
    const THEME_KEY = 'bbk-theme-mode';
    const THEMES = {
        AUTO: 'auto',
        LIGHT: 'light',
        DARK: 'dark'
    };
    
    // Get current theme mode from localStorage, default to 'auto'
    function getStoredTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        return Object.values(THEMES).includes(stored) ? stored : THEMES.AUTO;
    }
    
    // Save theme mode to localStorage
    function setStoredTheme(mode) {
        localStorage.setItem(THEME_KEY, mode);
    }
    
    // Get the effective theme to apply (light or dark)
    function getEffectiveTheme(mode) {
        if (mode === THEMES.AUTO) {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return THEMES.DARK;
            }
            return THEMES.LIGHT;
        }
        return mode;
    }
    
    // Apply theme to the document
    function applyTheme(effectiveTheme) {
        if (effectiveTheme === THEMES.DARK) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
    
    // Update theme icon based on current mode
    function updateThemeIcon(mode) {
        const icon = document.querySelector('.theme-toggle-btn .material-icons');
        if (!icon) return;
        
        switch(mode) {
            case THEMES.AUTO:
                icon.textContent = 'brightness_auto';
                break;
            case THEMES.LIGHT:
                icon.textContent = 'light_mode';
                break;
            case THEMES.DARK:
                icon.textContent = 'dark_mode';
                break;
        }
    }
    
    // Cycle through theme modes
    function cycleTheme() {
        const currentMode = getStoredTheme();
        let nextMode;
        
        switch(currentMode) {
            case THEMES.AUTO:
                nextMode = THEMES.LIGHT;
                break;
            case THEMES.LIGHT:
                nextMode = THEMES.DARK;
                break;
            case THEMES.DARK:
                nextMode = THEMES.AUTO;
                break;
            default:
                nextMode = THEMES.AUTO;
        }
        
        setStoredTheme(nextMode);
        const effectiveTheme = getEffectiveTheme(nextMode);
        applyTheme(effectiveTheme);
        updateThemeIcon(nextMode);
    }
    
    // Initialize theme on page load
    function initTheme() {
        const mode = getStoredTheme();
        const effectiveTheme = getEffectiveTheme(mode);
        applyTheme(effectiveTheme);
        updateThemeIcon(mode);
        
        // Listen for system theme changes when in auto mode
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addEventListener('change', (e) => {
                const currentMode = getStoredTheme();
                if (currentMode === THEMES.AUTO) {
                    applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
                }
            });
        }
    }
    
    // Create and add theme toggle button to the page
    function createThemeToggle() {
        // Check if button already exists
        if (document.querySelector('.theme-toggle-btn')) return;
        
        const button = document.createElement('button');
        button.className = 'nav-btn theme-toggle-btn';
        button.title = 'Thema umschalten: Auto → Hell → Dunkel → Auto';
        button.setAttribute('aria-label', 'Thema umschalten');
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'brightness_auto';
        
        button.appendChild(icon);
        button.addEventListener('click', cycleTheme);
        
        // Find the nav container or create one if it doesn't exist
        let nav = document.querySelector('.top-nav');
        if (!nav) {
            nav = document.createElement('nav');
            nav.className = 'top-nav';
            document.body.insertBefore(nav, document.body.firstChild);
        }
        nav.appendChild(button);
        
        // Update icon to reflect current mode
        updateThemeIcon(getStoredTheme());
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            createThemeToggle();
        });
    } else {
        initTheme();
        createThemeToggle();
    }
    
    // Export functions for potential external use
    window.BBKTheme = {
        cycle: cycleTheme,
        getMode: getStoredTheme,
        getEffective: () => getEffectiveTheme(getStoredTheme())
    };
})();
