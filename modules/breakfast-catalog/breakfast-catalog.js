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
            // First check if we have data in localStorage
            const storedItems = window.dataStorage?.getCatalogData('breakfast-catalog');
            
            if (storedItems && storedItems.length > 0) {
                this.allFoodItems = storedItems;
                console.log(`Loaded ${this.allFoodItems.length} breakfast items from localStorage`);
                return;
            }

            // If no localStorage data, load from JSON file
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastJson = await breakfastResponse.json();
            
            this.allFoodItems = this.extractItems(breakfastJson);
            
            // Save to localStorage for future use
            if (window.dataStorage) {
                window.dataStorage.saveCatalogData('breakfast-catalog', this.allFoodItems);
            }
            
            console.log(`Loaded ${this.allFoodItems.length} breakfast items from JSON file`);
            
        } catch (error) {
            console.error('Error loading breakfast data:', error);
            this.showAlert('Failed to load breakfast data. Please refresh the page.', 'error');
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

        const addBreakfastBtn = document.getElementById('addBreakfastBtn');
        if (addBreakfastBtn) {
            addBreakfastBtn.addEventListener('click', () => this.showAddModal());
        }

        const breakfastForm = document.getElementById('breakfastForm');
        if (breakfastForm) {
            breakfastForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const fetchNutritionBtn = document.getElementById('fetchNutritionBtn');
        if (fetchNutritionBtn) {
            fetchNutritionBtn.addEventListener('click', () => this.fetchNutritionInfo());
        }

        const foodGrid = document.getElementById('foodGrid');
        if (foodGrid) {
            foodGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-btn')) {
                    const itemId = e.target.getAttribute('data-id');
                    this.editItem(itemId);
                } else if (e.target.classList.contains('delete-btn')) {
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

        foodGrid.innerHTML = this.filteredItems.map(item => this.createFoodCard(item)).join('');
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
                    <button class="action-btn edit-btn" data-id="${item.id || item.name}">
                        ✏️ Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id || item.name}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
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

    showAddModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Breakfast Item';
        document.getElementById('submitBtnText').textContent = 'Add Breakfast Item';
        this.clearForm();
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        const modal = document.getElementById('breakfastModal');
        modal.classList.add('active');
        
        // Focus on first input field
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    editItem(itemId) {
        const item = this.allFoodItems.find(item => (item.id || item.name) === itemId);
        if (!item) return;

        this.currentEditId = itemId;
        document.getElementById('modalTitle').textContent = 'Edit Breakfast Item';
        document.getElementById('submitBtnText').textContent = 'Update Breakfast Item';
        
        this.populateForm(item);
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        const modal = document.getElementById('breakfastModal');
        modal.classList.add('active');
        
        // Focus on first input field
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    populateForm(item) {
        document.getElementById('dishName').value = item.name || '';
        document.getElementById('dishDescription').value = item.description || '';
        document.getElementById('dishType').value = item.type || '';
        
        const nutrition = item.nutrition || {};
        document.getElementById('calories').value = nutrition.calories || '';
        document.getElementById('protein').value = nutrition.protein || '';
        document.getElementById('carbs').value = nutrition.carbs || '';
        document.getElementById('fat').value = nutrition.fat || '';
    }

    clearForm() {
        document.getElementById('breakfastForm').reset();
    }

    closeModal() {
        document.getElementById('breakfastModal').classList.remove('active');
        this.clearForm();
        this.currentEditId = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;

        if (this.currentEditId) {
            await this.updateItem(formData);
        } else {
            await this.addItem(formData);
        }
        
        this.closeModal();
        this.applyFilters();
        
        const action = this.currentEditId ? 'updated' : 'added';
        this.showAlert(`Breakfast item ${action} successfully!`, 'success');
    }

    getFormData() {
        return {
            name: document.getElementById('dishName').value.trim(),
            description: document.getElementById('dishDescription').value.trim(),
            category: 'breakfast',
            type: document.getElementById('dishType').value,
            nutrition: {
                calories: parseInt(document.getElementById('calories').value) || 0,
                protein: parseFloat(document.getElementById('protein').value) || 0,
                carbs: parseFloat(document.getElementById('carbs').value) || 0,
                fat: parseFloat(document.getElementById('fat').value) || 0
            },
            region: 'Karnataka'
        };
    }

    validateFormData(data) {
        if (!data.name) {
            this.showAlert('Please enter a dish name', 'error');
            return false;
        }
        
        if (!data.description) {
            this.showAlert('Please enter a description', 'error');
            return false;
        }
        
        if (!data.type) {
            this.showAlert('Please select a type', 'error');
            return false;
        }
        
        return true;
    }

    async saveToLocalStorage() {
        try {
            if (window.dataStorage) {
                const success = window.dataStorage.saveCatalogData('breakfast-catalog', this.allFoodItems);
                if (success) {
                    console.log('Successfully saved breakfast data to localStorage');
                    return true;
                } else {
                    console.error('Failed to save breakfast data to localStorage');
                    return false;
                }
            } else {
                console.error('DataStorage not available');
                return false;
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    async persistChanges() {
        try {
            await this.saveToLocalStorage();
            console.log('Breakfast changes persisted to localStorage');
        } catch (error) {
            console.error('Failed to persist changes:', error);
            this.showAlert('Changes saved locally in browser memory.', 'warning');
        }
    }

    async addItem(data) {
        const newItem = {
            ...data,
            id: 'bf_user_' + Date.now()
        };
        
        this.allFoodItems.push(newItem);
        await this.persistChanges();
    }

    async updateItem(data) {
        const index = this.allFoodItems.findIndex(item => (item.id || item.name) === this.currentEditId);
        if (index !== -1) {
            const updatedItem = {
                ...this.allFoodItems[index],
                ...data
            };
            this.allFoodItems[index] = updatedItem;
            await this.persistChanges();
        }
    }

    deleteItem(itemId) {
        const item = this.allFoodItems.find(item => (item.id || item.name) === itemId);
        if (!item) return;

        this.deleteItemId = itemId;
        document.getElementById('deleteDishName').textContent = item.name;
        document.getElementById('deleteModal').classList.add('active');
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
        document.getElementById('deleteModal').classList.remove('active');
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
