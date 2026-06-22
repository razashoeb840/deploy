// Theme Management Script
// Handles theme switching and persistence across the application

const themes = {
    DEFAULT: 'theme-default',
    DARK_1: 'theme-dark-1', // 3D JS (Vanta) / Sci-Fi
    DARK_2: 'theme-dark-2'  // Cinematic Video / Bio-Medical
};

// Initialize theme immediately to prevent flickering
(function initTheme() {
    const savedTheme = localStorage.getItem('medipulse_theme') || themes.DEFAULT;
    document.documentElement.className = savedTheme; // Apply to html tag
    document.addEventListener('DOMContentLoaded', () => {
        applyThemeEffects(savedTheme);
        updateSwitcherUI(savedTheme);
    });
})();

let vantaEffect = null;

function setTheme(themeName) {
    localStorage.setItem('medipulse_theme', themeName);
    document.documentElement.className = themeName;
    applyThemeEffects(themeName);
    updateSwitcherUI(themeName);
}

function updateSwitcherUI(themeName) {
    // Legacy support for older dropdowns if they still exist
    const selector = document.getElementById('themeSelector');
    if (selector) {
        selector.value = themeName;
    }
    
    // Update new icon-based menu
    const options = document.querySelectorAll('.theme-option');
    options.forEach(opt => {
        opt.classList.remove('active');
        if(opt.getAttribute('onclick').includes(themeName)) {
            opt.classList.add('active');
        }
    });
}

function renderThemeSwitcher() {
    const containers = document.querySelectorAll('.theme-selector-container');
    const currentTheme = localStorage.getItem('medipulse_theme') || themes.DEFAULT;
    
    containers.forEach(c => {
        c.innerHTML = `
            <div class="theme-icon-switcher" onclick="toggleThemeMenu(event)" title="Change Theme">
                <i class="fas fa-palette"></i>
            </div>
            <div class="theme-dropdown-menu" id="themeDropdownMenu">
                <div class="theme-option ${currentTheme === themes.DEFAULT ? 'active' : ''}" onclick="setTheme('theme-default')">
                    <i class="fas fa-sun"></i> Light Mode
                </div>
                <div class="theme-option ${currentTheme === themes.DARK_1 ? 'active' : ''}" onclick="setTheme('theme-dark-1')">
                    <i class="fas fa-space-shuttle"></i> Omnitrix
                </div>
                <div class="theme-option ${currentTheme === themes.DARK_2 ? 'active' : ''}" onclick="setTheme('theme-dark-2')">
                    <i class="fas fa-heartbeat"></i> Bio-Medical
                </div>
            </div>
        `;
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if(!e.target.closest('.theme-selector-container')) {
            document.querySelectorAll('.theme-dropdown-menu').forEach(m => m.classList.remove('show'));
        }
    });
}

window.toggleThemeMenu = function(e) {
    e.stopPropagation();
    document.querySelectorAll('.theme-dropdown-menu').forEach(m => m.classList.toggle('show'));
}

document.addEventListener('DOMContentLoaded', renderThemeSwitcher);

function applyThemeEffects(themeName) {
    // Check if we are on the index page (where backgrounds live)
    const banner = document.querySelector('.banner');
    const vantaContainer = document.getElementById('vanta-bg');
    const videoContainer = document.getElementById('video-bg');
    const defaultBg = document.getElementById('default-bg');

    if (!banner) return; // Not on index page, CSS handles the rest

    // Reset backgrounds
    if (vantaContainer) vantaContainer.style.display = 'none';
    if (videoContainer) videoContainer.style.display = 'none';
    if (defaultBg) defaultBg.style.display = 'none';
    
    // Destroy existing Vanta effect if any (Vanta.NET disabled in favor of optimized starfield canvas)
    if (vantaEffect) {
        vantaEffect.destroy();
        vantaEffect = null;
    }

    const canvas = document.getElementById('stars');
    if (canvas) {
        if (themeName === themes.DARK_1) {
            canvas.style.display = 'block';
            if (typeof triggerWarp === 'function') triggerWarp();
        } else {
            canvas.style.display = 'none';
        }
    }

    if (themeName === themes.DARK_1) {
        // Starfield canvas is used instead of Vanta
    } else if (themeName === themes.DARK_2) {
        if (videoContainer) {
            videoContainer.style.display = 'block';
            const vid = videoContainer.querySelector('video');
            if (vid) {
                vid.play().catch(e => console.log('Video autoplay blocked', e));
            }
        }
    } else {
        // DEFAULT
        if (defaultBg) {
            defaultBg.style.display = 'block';
        }
    }
}

// Function to inject theme switcher into header dynamically if not present
// But since we will modify HTML directly, we can just export global functions.
window.setTheme = setTheme;

// Shared Role-based Authorization Check
window.checkUserRole = function(allowedRoles, redirectUrl = '8login.html') {
    const role = localStorage.getItem('userRole');
    if (!role || (!allowedRoles.includes(role) && role !== 'guest')) {
        alert('Access Denied. Authorized access required.');
        window.location.href = redirectUrl;
    }
};

