// Navigation System
class Navigation {
    constructor() {
        this.routes = {
            'dashboard': {
                title: 'Dashboard',
                description: 'Overview of your Karnataka cuisine catalog with quick access'
            },
            'breakfast-catalog': {
                title: 'Breakfast Catalog',
                description: 'Browse and manage traditional Karnataka breakfast dishes'
            },
            'mains-catalog': {
                title: 'Mains Catalog', 
                description: 'Browse and manage Karnataka main course dishes'
            },
            'side-dishes-catalog': {
                title: 'Side Dishes Catalog',
                description: 'Browse side dishes from Karnataka, Andhra, and North Indian cuisines'
            },
            'accompaniments-catalog': {
                title: 'Accompaniments Catalog',
                description: 'Browse salads, raitas, chutneys and other accompaniments'
            }
        };
    }

    updatePageTitle(moduleId) {
        const route = this.routes[moduleId];
        if (route) {
            document.title = `${route.title} - ನಾಳೆ ಅಡುಗೆ ಏನು?`;
        }
    }

    updatePageMeta(moduleId) {
        const route = this.routes[moduleId];
        if (route) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', route.description);
            }
        }
    }

    // Handle browser back/forward buttons
    handlePopState(event) {
        if (event.state && event.state.module) {
            const moduleId = event.state.module;
            this.navigateToModule(moduleId, false);
        }
    }

    // Navigate to a module
    navigateToModule(moduleId, updateHistory = true) {
        // Update URL without page refresh
        if (updateHistory) {
            const url = moduleId === 'dashboard' ? '/' : `/${moduleId}`;
            history.pushState({ module: moduleId }, '', url);
        }

        // Update page metadata
        this.updatePageTitle(moduleId);
        this.updatePageMeta(moduleId);

        // Trigger module loading through main app
        if (window.app) {
            window.app.loadModule(moduleId);
        }
    }

    init() {
        // Handle browser navigation
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Set initial state
        const currentPath = window.location.pathname;
        let initialModule = 'dashboard';
        
        if (currentPath.includes('breakfast')) {
            initialModule = 'breakfast-catalog';
        } else if (currentPath.includes('mains')) {
            initialModule = 'mains-catalog';
        } else if (currentPath.includes('side-dishes')) {
            initialModule = 'side-dishes-catalog';
        } else if (currentPath.includes('accompaniments')) {
            initialModule = 'accompaniments-catalog';
        }

        // Set initial state without updating history
        history.replaceState({ module: initialModule }, '', currentPath);
    }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
    window.navigation.init();
});
