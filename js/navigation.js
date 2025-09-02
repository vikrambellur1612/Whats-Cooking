// Navigation System with Sidebar Support
class Navigation {
    constructor() {
        this.routes = {
            'dashboard': {
                title: 'Home - ನಾಳೆ ಅಡುಗೆ ಏನು?',
                description: 'Your Indian cuisine catalog at a glance'
            },
            'breakfast-catalog': {
                title: 'Breakfast Catalog',
                description: 'Browse and manage traditional Indian breakfast dishes'
            },
            'mains-catalog': {
                title: 'Mains Catalog', 
                description: 'Browse and manage Indian main course dishes'
            },
            'side-dishes-catalog': {
                title: 'Side Dishes Catalog',
                description: 'Browse Indian side dishes from various cuisines'
            },
            'accompaniments-catalog': {
                title: 'Accompaniments Catalog',
                description: 'Browse salads, raitas, chutneys and other accompaniments'
            }
        };
        
        this.sidebar = null;
        this.sidebarOverlay = null;
        this.menuToggle = null;
        this.sidebarClose = null;
        this.isSidebarOpen = false;
    }

    initSidebar() {
        // Get DOM elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.menuToggle = document.getElementById('menu-toggle');
        this.sidebarClose = document.getElementById('sidebar-close');

        if (!this.sidebar || !this.sidebarOverlay || !this.menuToggle || !this.sidebarClose) {
            console.error('Sidebar elements not found');
            return;
        }

        // Add event listeners
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.sidebarClose.addEventListener('click', () => this.closeSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                this.closeSidebar(false); // Don't animate on desktop
            }
        });

        // Auto-open sidebar on desktop
        if (window.innerWidth >= 1024) {
            this.sidebar.classList.add('open');
        }
    }

    toggleSidebar() {
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.add('open');
        this.sidebarOverlay.classList.add('active');
        this.menuToggle.classList.add('active');
        this.isSidebarOpen = true;
        
        // Prevent body scroll on mobile
        if (window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeSidebar(animate = true) {
        if (!animate) {
            this.sidebar.style.transition = 'none';
            this.sidebarOverlay.style.transition = 'none';
        }

        this.sidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
        this.menuToggle.classList.remove('active');
        this.isSidebarOpen = false;
        
        // Re-enable body scroll
        document.body.style.overflow = '';

        if (!animate) {
            // Reset transitions after animation frame
            requestAnimationFrame(() => {
                this.sidebar.style.transition = '';
                this.sidebarOverlay.style.transition = '';
            });
        }
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
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 1024 && this.isSidebarOpen) {
            this.closeSidebar();
        }

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
        // Initialize sidebar
        this.initSidebar();

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

    // Modal utility functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Show the modal
        modal.classList.add('active');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Global modal functions for backward compatibility
window.showModal = function(modalId) {
    if (window.navigation) {
        window.navigation.showModal(modalId);
    } else {
        // Fallback
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
};

window.hideModal = function(modalId) {
    if (window.navigation) {
        window.navigation.hideModal(modalId);
    } else {
        // Fallback
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
    window.navigation.init();
});
