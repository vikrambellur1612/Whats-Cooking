// Breakfast Catalog Module - Dedicated to Karnataka Breakfast Dishes
class BreakfastCatalog {
    constructor() {
        this.allFoodItems = [];
        this.filteredItems = [];
        this.currentEditId = null;
        this.deleteItemId = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Breakfast Catalog...');
        await this.loadData();
        this.setupEventListeners();
        this.applyFilters();
        this.updateStatistics();
        
        window.breakfastCatalog = this;
        console.log('Breakfast Catalog initialized. Global instance:', window.breakfastCatalog);
    }

    async loadData() {
        try {
            // Load from JSON file first
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastJson = await breakfastResponse.json();
            
            // Extract items from the JSON structure
            const sourceItems = this.extractItems(breakfastJson);
            
            // Merge with localStorage data (same logic as dashboard)
            this.allFoodItems = await this.mergeWithLocalStorage(sourceItems, 'breakfast-catalog');
            
            console.log(`Loaded ${this.allFoodItems.length} breakfast items (${sourceItems.length} from source + ${this.allFoodItems.length - sourceItems.length} from localStorage)`);
            
        } catch (error) {
            console.error('Error loading breakfast data:', error);
            this.showAlert('Failed to load breakfast data. Please refresh the page.', 'error');
        }
    }

    // Merge source data with any new items added to localStorage
    async mergeWithLocalStorage(sourceItems, storageKey) {
        try {
            const localData = localStorage.getItem(storageKey);
            if (localData) {
                const parsedData = JSON.parse(localData);
                const localItems = parsedData.items || [];
                
                // Find items that are in localStorage but not in source data
                const sourceIds = new Set(sourceItems.map(item => item.id));
                const newLocalItems = localItems.filter(item => !sourceIds.has(item.id));
                
                // Merge arrays
                return [...sourceItems, ...newLocalItems];
            }
            return sourceItems;
        } catch (error) {
            console.warn(`Error merging localStorage for ${storageKey}:`, error);
            return sourceItems;
        }
    }

    extractItems(jsonData) {
        if (jsonData.breakfast && jsonData.breakfast.items) {
            return jsonData.breakfast.items;
        } else if (Array.isArray(jsonData)) {
            return jsonData;
        } else {
            console.warn('Unexpected JSON structure:', jsonData);
            return [];
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Removed Add Breakfast button and modal-related event listeners
        // Users can add new dishes from the Dashboard's "Add New Dish" feature

        const foodGrid = document.getElementById('foodGrid');
        if (foodGrid) {
            foodGrid.addEventListener('click', (e) => {
                // Only keep delete functionality - add/edit is handled via dashboard
                if (e.target.classList.contains('delete-btn')) {
                    const itemId = e.target.getAttribute('data-id');
                    this.deleteItem(itemId);
                }
            });
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';

        this.filteredItems = this.allFoodItems.filter(item => {
            const matchesSearch = searchTerm === '' || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm);

            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            return matchesSearch && matchesType;
        });

        this.renderFoodGrid();
        this.updateStatistics();
    }

    renderFoodGrid() {
        const foodGrid = document.getElementById('foodGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!foodGrid || !emptyState) return;

        if (this.filteredItems.length === 0) {
            foodGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        foodGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Render food items
        const foodCards = this.filteredItems.map(item => this.createFoodCard(item)).join('');
        
        // Add "Add New Dish" card at the end
        const addNewCard = this.createAddNewCard();
        
        foodGrid.innerHTML = foodCards + addNewCard;
    }

    createFoodCard(item) {
        const emoji = this.getDishEmoji(item);
        const typeLabel = this.formatType(item.type);
        
        return `
            <div class="food-card card">
                <div class="food-card-header">
                    <div class="food-emoji">${emoji}</div>
                    <h4 class="food-name">${item.name}</h4>
                    <div class="food-badges">
                        <span class="badge badge-${item.type}">${typeLabel}</span>
                    </div>
                    <p class="food-description">${item.description}</p>
                </div>
                
                ${item.nutrition ? `
                <div class="food-card-body">
                    <div class="nutrition-info">
                        <div class="nutrition-title">Nutrition (per serving)</div>
                        <div class="nutrition-grid">
                            <div class="nutrition-item">
                                <div class="nutrition-value">${item.nutrition.calories || 0}</div>
                                <div class="nutrition-label">Cal</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${item.nutrition.protein || 0}g</div>
                                <div class="nutrition-label">Protein</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${item.nutrition.carbs || 0}g</div>
                                <div class="nutrition-label">Carbs</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${item.nutrition.fat || 0}g</div>
                                <div class="nutrition-label">Fat</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="food-card-actions">
                    <button class="action-btn delete-btn" data-id="${item.id || item.name}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    createAddNewCard() {
        return `
            <div class="food-card add-new-card" onclick="window.breakfastCatalog?.openAddDishModal()">
                <div class="add-new-content">
                    <div class="add-new-icon">➕</div>
                    <h4 class="add-new-title">Add New Dish</h4>
                    <p class="add-new-description">Add a new breakfast item to your collection</p>
                </div>
            </div>
        `;
    }

    async openAddDishModal() {
        console.log('Opening Add Dish modal from Breakfast catalog...');
        
        // Navigate to Home/Calendar first, then use its showAddDishModal method
        if (window.navigation && window.navigation.navigateToModule) {
            // First try Home module which can handle add dish requests
            if (window.home && typeof window.home.showAddDishModal === 'function') {
                window.home.showAddDishModal('breakfast');
                return;
            }
            
            // Fallback: Navigate to Dashboard and then show modal
            window.navigation.navigateToModule('dashboard');
            
            // Wait a bit for Dashboard to load and then show modal with pre-selected type
            setTimeout(() => {
                if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                    window.dashboard.showAddDishModal('breakfast');
                } else {
                    console.warn('Dashboard not ready, trying again...');
                    setTimeout(() => {
                        if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                            window.dashboard.showAddDishModal('breakfast');
                        } else {
                            this.showAlert('Unable to open Add Dish modal. Please use Dashboard menu to add dishes.', 'warning');
                        }
                    }, 500);
                }
            }, 300);
        } else {
            this.showAlert('Unable to open Add Dish modal. Please use Dashboard menu to add dishes.', 'warning');
        }
    }

    getDishEmoji(item) {
        const name = item.name.toLowerCase();
        
        // Breakfast-specific emojis
        if (name.includes('dosa')) return '🫓';
        if (name.includes('idli')) return '⚪';
        if (name.includes('vada')) return '🍩';
        if (name.includes('upma')) return '🍚';
        if (name.includes('poha')) return '🥣';
        if (name.includes('paratha')) return '🫓';
        if (name.includes('uttapam')) return '🥞';
        if (name.includes('sheera') || name.includes('kesari')) return '🍮';
        if (name.includes('chutney')) return '🥄';
        if (name.includes('sambar')) return '🍲';
        if (name.includes('coffee') || name.includes('tea')) return '☕';
        
        return '🌅'; // default breakfast emoji
    }

    formatType(type) {
        const typeMap = {
            'main': 'Main Dish',
            'side': 'Side Dish',
            'beverage': 'Beverage',
            'sweet': 'Sweet',
            'snack': 'Snack',
            'traditional': 'Traditional',
            'light': 'Light'
        };
        
        return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    updateStatistics() {
        const totalCount = document.getElementById('totalCount');
        const vegCount = document.getElementById('vegCount');
        const avgCalories = document.getElementById('avgCalories');

        if (totalCount) totalCount.textContent = this.filteredItems.length;
        
        if (vegCount) {
            const vegetarianCount = this.filteredItems.filter(item => 
                !item.name.toLowerCase().includes('egg') && 
                !item.name.toLowerCase().includes('meat') &&
                !item.name.toLowerCase().includes('chicken')
            ).length;
            vegCount.textContent = vegetarianCount;
        }
        
        if (avgCalories) {
            const totalCalories = this.filteredItems.reduce((sum, item) => {
                return sum + (item.nutrition?.calories || 0);
            }, 0);
            
            const avgCal = this.filteredItems.length > 0 ? Math.round(totalCalories / this.filteredItems.length) : 0;
            avgCalories.textContent = avgCal;
        }
    }

    async fetchNutritionInfo() {
        const dishNameInput = document.getElementById('dishName');
        const statusElement = document.getElementById('nutritionStatus');
        
        if (!dishNameInput.value.trim()) {
            statusElement.textContent = '⚠️ Please enter a dish name first';
            statusElement.className = 'nutrition-status error';
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'nutrition-status';
            }, 3000);
            return;
        }

        const dishName = dishNameInput.value.trim();
        statusElement.textContent = '🔍 Fetching nutrition info...';
        statusElement.className = 'nutrition-status loading';

        setTimeout(() => {
            this.setEstimatedNutrition(dishName);
            statusElement.textContent = '✅ Estimated nutrition values filled';
            statusElement.className = 'nutrition-status success';
            
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'nutrition-status';
            }, 3000);
        }, 1000);
    }

    setEstimatedNutrition(dishName) {
        const dishLower = dishName.toLowerCase();
        let nutrition = {};

        // Breakfast-specific estimations
        if (dishLower.includes('dosa')) {
            nutrition = { calories: 120, protein: 4, carbs: 22, fat: 2 };
        } else if (dishLower.includes('idli')) {
            nutrition = { calories: 35, protein: 2, carbs: 6, fat: 0.5 };
        } else if (dishLower.includes('vada')) {
            nutrition = { calories: 180, protein: 6, carbs: 20, fat: 8 };
        } else if (dishLower.includes('upma')) {
            nutrition = { calories: 200, protein: 5, carbs: 35, fat: 5 };
        } else if (dishLower.includes('poha')) {
            nutrition = { calories: 180, protein: 4, carbs: 32, fat: 4 };
        } else if (dishLower.includes('paratha')) {
            nutrition = { calories: 250, protein: 6, carbs: 35, fat: 10 };
        } else if (dishLower.includes('uttapam')) {
            nutrition = { calories: 150, protein: 5, carbs: 28, fat: 3 };
        } else if (dishLower.includes('sheera') || dishLower.includes('kesari')) {
            nutrition = { calories: 220, protein: 4, carbs: 40, fat: 6 };
        } else if (dishLower.includes('chutney')) {
            nutrition = { calories: 25, protein: 1, carbs: 4, fat: 1 };
        } else {
            // Generic breakfast estimation
            nutrition = { calories: 150, protein: 4, carbs: 25, fat: 4 };
        }

        this.populateNutritionFields({ nutrition });
    }

    populateNutritionFields(data) {
        const nutrition = data.nutrition || data;
        
        if (nutrition.calories) {
            document.getElementById('calories').value = Math.round(nutrition.calories);
        }
        if (nutrition.protein) {
            document.getElementById('protein').value = Math.round(nutrition.protein * 10) / 10;
        }
        if (nutrition.carbs || nutrition.carbohydrates) {
            document.getElementById('carbs').value = Math.round((nutrition.carbs || nutrition.carbohydrates) * 10) / 10;
        }
        if (nutrition.fat) {
            document.getElementById('fat').value = Math.round(nutrition.fat * 10) / 10;
        }
    }

    // Modal-related methods removed - dishes are added via Dashboard's "Add New Dish" feature
    // Only delete functionality is retained for catalog management
    
    deleteItem(itemId) {
        const item = this.allFoodItems.find(item => (item.id || item.name) === itemId);
        if (!item) return;

        this.deleteItemId = itemId;
        document.getElementById('deleteDishName').textContent = item.name;
        
        // Show the modal and ensure it's in the viewport
        const modal = document.getElementById('deleteModal');
        modal.classList.add('active');
        
        // Prevent body scroll while modal is open
        document.body.style.overflow = 'hidden';
        
        // Ensure modal is focused for accessibility
        setTimeout(() => {
            const firstButton = modal.querySelector('button');
            if (firstButton) firstButton.focus();
        }, 100);
    }

    async confirmDelete() {
        const index = this.allFoodItems.findIndex(item => (item.id || item.name) === this.deleteItemId);
        if (index !== -1) {
            this.allFoodItems.splice(index, 1);
            await this.persistChanges();
            this.applyFilters();
            this.showAlert('Breakfast item deleted successfully!', 'success');
        }
        this.closeDeleteModal();
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        this.deleteItemId = null;
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';
        alert.style.maxWidth = '500px';
        alert.style.padding = '15px 20px';
        alert.style.borderRadius = '8px';
        alert.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        alert.style.fontWeight = '500';
        
        switch(type) {
            case 'success':
                alert.style.backgroundColor = '#d4edda';
                alert.style.color = '#155724';
                alert.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                alert.style.backgroundColor = '#f8d7da';
                alert.style.color = '#721c24';
                alert.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                alert.style.backgroundColor = '#fff3cd';
                alert.style.color = '#856404';
                alert.style.border = '1px solid #ffeaa7';
                break;
            default:
                alert.style.backgroundColor = '#d1ecf1';
                alert.style.color = '#0c5460';
                alert.style.border = '1px solid #bee5eb';
        }
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
        
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.breakfast-catalog-module')) {
        window.breakfastCatalog = new BreakfastCatalog();
    }
});
