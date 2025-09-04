// Main Application Controller
class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.modules = {};
        this.init();
    }

    async init() {
        console.log('Initializing What\'s Cooking App...');
        
        // Setup navigation
        this.setupNavigation();
        
        // Load initial module
        await this.loadModule('calendar');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const moduleId = btn.getAttribute('data-module');
                if (moduleId && moduleId !== this.currentModule) {
                    // Use navigation system for proper routing
                    if (window.navigation) {
                        window.navigation.navigateToModule(moduleId);
                    } else {
                        // Fallback if navigation system not loaded yet
                        await this.loadModule(moduleId);
                        this.currentModule = moduleId;
                        
                        // Update active nav button
                        navButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }
                }
            });
        });
    }

    async loadModule(moduleId) {
        this.showLoading();
        
        try {
            const moduleConfig = this.getModuleConfig(moduleId);
            
            if (!moduleConfig) {
                throw new Error(`Module ${moduleId} not found`);
            }

            // Update active nav button
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(b => b.classList.remove('active'));
            const activeButton = document.querySelector(`[data-module="${moduleId}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }

            // Load module HTML
            console.log(`Loading HTML from: ${moduleConfig.htmlPath}`);
            const htmlResponse = await fetch(moduleConfig.htmlPath);
            
            if (!htmlResponse.ok) {
                throw new Error(`Failed to load HTML: ${htmlResponse.status} ${htmlResponse.statusText}`);
            }
            
            const htmlContent = await htmlResponse.text();
            console.log(`HTML Content loaded (${htmlContent.length} characters):`, htmlContent.substring(0, 200) + '...');
            
            // Load module CSS
            await this.loadModuleCSS(moduleConfig.cssPath, moduleId);
            
            // Load module JS
            await this.loadModuleJS(moduleConfig.jsPath, moduleId);
            
            // Inject HTML
            const mainContent = document.getElementById('main-content');
            console.log('Before injection - main-content exists:', !!mainContent);
            mainContent.innerHTML = htmlContent;
            console.log('After injection - main-content innerHTML length:', mainContent.innerHTML.length);
            
            // Force browser to parse and render the injected HTML
            await new Promise(resolve => {
                // Use requestAnimationFrame to ensure DOM is fully rendered
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
            
            // Initialize module
            await this.initializeModule(moduleId);
            
            // Update current module
            this.currentModule = moduleId;
            
        } catch (error) {
            console.error(`Error loading module ${moduleId}:`, error);
            this.showError(`Failed to load ${moduleId} module`);
        } finally {
            this.hideLoading();
        }
    }

    getModuleConfig(moduleId) {
        const configs = {
            'dashboard': {
                htmlPath: 'modules/dashboard/dashboard.html',
                cssPath: 'modules/dashboard/dashboard.css',
                jsPath: 'modules/dashboard/dashboard.js',
                className: 'Dashboard'
            },
            'breakfast-catalog': {
                htmlPath: 'modules/breakfast-catalog/breakfast-catalog.html',
                cssPath: 'modules/breakfast-catalog/breakfast-catalog.css',
                jsPath: 'modules/breakfast-catalog/breakfast-catalog.js',
                className: 'BreakfastCatalog'
            },
            'mains-catalog': {
                htmlPath: 'modules/mains-catalog/mains-catalog.html',
                cssPath: 'modules/mains-catalog/mains-catalog.css',
                jsPath: 'modules/mains-catalog/mains-catalog.js',
                className: 'MainsCatalog'
            },
            'side-dishes-catalog': {
                htmlPath: 'modules/side-dishes-catalog/side-dishes-catalog.html',
                cssPath: 'modules/side-dishes-catalog/side-dishes-catalog.css',
                jsPath: 'modules/side-dishes-catalog/side-dishes-catalog.js',
                className: 'SideDishesCatalog'
            },
            'accompaniments-catalog': {
                htmlPath: 'modules/accompaniments-catalog/accompaniments-catalog.html',
                cssPath: 'modules/accompaniments-catalog/accompaniments-catalog.css',
                jsPath: 'modules/accompaniments-catalog/accompaniments-catalog.js',
                className: 'AccompanimentsCatalog'
            },
            'calendar': {
                htmlPath: 'modules/calendar/home.html',
                cssPath: 'modules/calendar/home.css',
                jsPath: 'modules/calendar/home.js',
                className: 'Home'
            },
            'about': {
                htmlPath: 'modules/about/about.html',
                cssPath: 'modules/about/about.css',
                jsPath: 'modules/about/about.js',
                className: 'About'
            }
        };
        
        return configs[moduleId];
    }

    async loadModuleCSS(cssPath, moduleId) {
        // Check if CSS is already loaded
        if (document.getElementById(`css-${moduleId}`)) {
            return;
        }

        const link = document.createElement('link');
        link.id = `css-${moduleId}`;
        link.rel = 'stylesheet';
        link.href = cssPath;
        
        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    async loadModuleJS(jsPath, moduleId) {
        // Check if JS is already loaded
        if (document.getElementById(`js-${moduleId}`)) {
            return;
        }

        const script = document.createElement('script');
        script.id = `js-${moduleId}`;
        // Add cache-busting parameter
        script.src = jsPath + '?v=' + Date.now();
        
        return new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    async initializeModule(moduleId) {
        // Wait a bit for the script to be executed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Wait additional time for DOM to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (moduleId === 'dashboard') {
            if (typeof Dashboard !== 'undefined') {
                this.modules.dashboard = new Dashboard();
                window.dashboard = this.modules.dashboard;
                await this.modules.dashboard.init();
                console.log('Dashboard module initialized and globally accessible');
            } else {
                console.error('Dashboard class not found');
            }
        } else if (moduleId === 'breakfast-catalog') {
            if (typeof BreakfastCatalog !== 'undefined') {
                this.modules.breakfastCatalog = new BreakfastCatalog();
                window.breakfastCatalog = this.modules.breakfastCatalog;
                console.log('Breakfast Catalog module initialized and globally accessible');
            } else {
                console.error('BreakfastCatalog class not found');
            }
        } else if (moduleId === 'mains-catalog') {
            if (typeof MainsCatalog !== 'undefined') {
                this.modules.mainsCatalog = new MainsCatalog();
                window.mainsCatalog = this.modules.mainsCatalog;
                await this.modules.mainsCatalog.init();
                console.log('Mains Catalog module initialized and globally accessible');
            } else {
                console.error('MainsCatalog class not found');
            }
        } else if (moduleId === 'side-dishes-catalog') {
            if (typeof SideDishesCatalog !== 'undefined') {
                this.modules.sideDishesCatalog = new SideDishesCatalog();
                window.sideDishesCatalog = this.modules.sideDishesCatalog;
                await this.modules.sideDishesCatalog.init();
                console.log('Side Dishes Catalog module initialized and globally accessible');
            } else {
                console.error('SideDishesCatalog class not found');
            }
        } else if (moduleId === 'accompaniments-catalog') {
            if (typeof AccompanimentsCatalog !== 'undefined') {
                this.modules.accompanimentsCatalog = new AccompanimentsCatalog();
                window.accompanimentsCatalog = this.modules.accompanimentsCatalog;
                await this.modules.accompanimentsCatalog.init();
                console.log('Accompaniments Catalog module initialized and globally accessible');
            } else {
                console.error('AccompanimentsCatalog class not found');
            }
        } else if (moduleId === 'calendar') {
            if (typeof Home !== 'undefined') {
                this.modules.calendar = new Home();
                window.home = this.modules.calendar;
                await this.modules.calendar.init();
                console.log('Home module initialized and globally accessible');
            } else {
                console.error('Home class not found');
            }
        } else if (moduleId === 'about') {
            if (typeof About !== 'undefined') {
                this.modules.about = new About();
                window.about = this.modules.about;
                console.log('About module initialized and globally accessible');
            } else {
                console.error('About class not found');
            }
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container">
                <div class="alert alert-error">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Debug helper for clearing service worker cache
    window.clearSWCache = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration) {
                const caches = await window.caches.keys();
                await Promise.all(caches.map(cache => window.caches.delete(cache)));
                await registration.unregister();
                console.log('Service worker cache cleared. Refreshing page...');
                window.location.reload(true);
            }
        }
    };
    
    console.log('Debug: Use clearSWCache() to clear service worker cache');
});
