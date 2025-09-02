// Accompaniments Catalog Module - Salads, Raitas, Chutneys and other accompaniments
class AccompanimentsCatalog {
    constructor() {
        this.allFoodItems = [];
        this.filteredItems = [];
        this.currentEditId = null;
        this.deleteItemId = null;
        
        // Don't auto-initialize - let main.js handle it
    }

    async init() {
        console.log('Initializing Accompaniments Catalog...');
        await this.loadData();
        
        // Wait for DOM elements to be available
        await this.waitForDOMElements();
        
        this.setupEventListeners();
        this.applyFilters();
        this.updateStatistics();
        
        window.accompanimentsCatalog = this;
        console.log('Accompaniments Catalog initialized. Global instance:', window.accompanimentsCatalog);
    }

    async waitForDOMElements() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const foodGrid = document.getElementById('foodGrid');
            const emptyState = document.getElementById('emptyState');
            
            if (foodGrid && emptyState) {
                console.log('AccompanimentsCatalog: DOM elements found after', attempts, 'attempts');
                return;
            }
            
            console.log('AccompanimentsCatalog: Waiting for DOM elements, attempt', attempts + 1);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.error('AccompanimentsCatalog: DOM elements not found after', maxAttempts, 'attempts');
    }

    async loadData() {
        try {
            // Load from JSON file first
            const accompanimentsResponse = await fetch('/data/accompaniments-catalog.json');
            const accompanimentsJson = await accompanimentsResponse.json();
            
            // Extract items from the JSON structure
            const sourceItems = this.extractItems(accompanimentsJson);
            
            // Merge with localStorage data (same logic as dashboard)
            this.allFoodItems = await this.mergeWithLocalStorage(sourceItems, 'accompaniments-catalog');
            
            console.log(`Loaded ${this.allFoodItems.length} accompaniment items (${sourceItems.length} from source + ${this.allFoodItems.length - sourceItems.length} from localStorage)`);
            
        } catch (error) {
            console.error('Error loading accompaniments data:', error);
            this.showAlert('Failed to load accompaniments data. Please refresh the page.', 'error');
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
        if (jsonData.accompaniments && jsonData.accompaniments.items) {
            return jsonData.accompaniments.items;
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

        const accompanimentForm = document.getElementById('accompanimentForm');
        if (accompanimentForm) {
            accompanimentForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const fetchNutritionBtn = document.getElementById('fetchNutritionBtn');
        if (fetchNutritionBtn) {
            fetchNutritionBtn.addEventListener('click', () => this.fetchNutritionInfo());
        }

        const foodGrid = document.getElementById('foodGrid');
        if (foodGrid) {
            foodGrid.addEventListener('click', (e) => {
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
        const regionLabel = item.region || 'Traditional';
        
        return `
            <div class="food-card card">
                <div class="food-card-header">
                    <div class="food-emoji">${emoji}</div>
                    <h4 class="food-name">${item.name}</h4>
                    <div class="food-badges">
                        <span class="badge badge-${item.type}">${typeLabel}</span>
                        <span class="badge badge-region">${regionLabel}</span>
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
            <div class="food-card add-new-card" onclick="window.accompanimentsCatalog?.openAddDishModal()">
                <div class="add-new-content">
                    <div class="add-new-icon">➕</div>
                    <h4 class="add-new-title">Add New Dish</h4>
                    <p class="add-new-description">Add a new accompaniment to your collection</p>
                </div>
            </div>
        `;
    }

    async openAddDishModal() {
        console.log('Opening Add Dish modal from Accompaniments catalog...');
        
        // Navigate to Dashboard and then show the modal with pre-selected type
        if (window.navigation && window.navigation.navigateToModule) {
            // Navigate to dashboard
            window.navigation.navigateToModule('dashboard');
            
            // Wait a bit for Dashboard to load and then show modal with pre-selected type
            setTimeout(() => {
                if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                    window.dashboard.showAddDishModal('accompaniment');
                } else {
                    console.warn('Dashboard not ready, trying again...');
                    setTimeout(() => {
                        if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                            window.dashboard.showAddDishModal('accompaniment');
                        }
                    }, 500);
                }
            }, 300);
        } else {
            alert('Unable to open Add Dish modal. Please navigate to Dashboard manually.');
        }
    }

    getDishEmoji(item) {
        const name = item.name.toLowerCase();
        const type = item.type?.toLowerCase() || '';
        
        if (type === 'raita' || name.includes('raita')) return '🥛';
        if (type === 'salad' || name.includes('kosambari') || name.includes('salad')) return '🥗';
        if (type === 'chutney' || name.includes('chutney')) return '🌿';
        if (type === 'pickle' || name.includes('pickle')) return '🥒';
        if (type === 'crispy' || name.includes('papad')) return '🍘';
        if (name.includes('yogurt') || name.includes('rice')) return '🍚';
        
        return '🥄'; // default accompaniment emoji
    }

    formatType(type) {
        const typeMap = {
            'salad': 'Salad',
            'raita': 'Raita',
            'chutney': 'Chutney',
            'pickle': 'Pickle',
            'crispy': 'Crispy',
            'rice-based': 'Rice Based'
        };
        
        return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    updateStatistics() {
        const totalCount = document.getElementById('totalCount');
        const healthyCount = document.getElementById('healthyCount');
        const avgCalories = document.getElementById('avgCalories');

        if (totalCount) totalCount.textContent = this.filteredItems.length;
        
        if (healthyCount) {
            // Count low-calorie items (under 100 calories)
            const lowCalCount = this.filteredItems.filter(item => 
                item.nutrition?.calories && item.nutrition.calories < 100
            ).length;
            healthyCount.textContent = lowCalCount;
        }
        
        if (avgCalories) {
            const totalCalories = this.filteredItems.reduce((sum, item) => {
                return sum + (item.nutrition?.calories || 0);
            }, 0);
            
            const avgCal = this.filteredItems.length > 0 ? Math.round(totalCalories / this.filteredItems.length) : 0;
            avgCalories.textContent = avgCal;
        }
    }

    populateForm(item) {
        document.getElementById('dishName').value = item.name || '';
        document.getElementById('dishDescription').value = item.description || '';
        document.getElementById('dishType').value = item.type || '';
        
        document.getElementById('applicableLunch').checked = item.applicableFor?.includes('Lunch') || false;
        document.getElementById('applicableDinner').checked = item.applicableFor?.includes('Dinner') || false;
        
        const nutrition = item.nutrition || {};
        document.getElementById('calories').value = nutrition.calories || '';
        document.getElementById('protein').value = nutrition.protein || '';
        document.getElementById('carbs').value = nutrition.carbs || '';
        document.getElementById('fat').value = nutrition.fat || '';
    }

    clearForm() {
        document.getElementById('accompanimentForm').reset();
    }

    closeModal() {
        document.getElementById('accompanimentModal').classList.remove('active');
        this.clearForm();
        this.currentEditId = null;
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
        this.showAlert(`Accompaniment ${action} successfully!`, 'success');
    }

    getFormData() {
        const applicableFor = [];
        if (document.getElementById('applicableLunch').checked) {
            applicableFor.push('Lunch');
        }
        if (document.getElementById('applicableDinner').checked) {
            applicableFor.push('Dinner');
        }

        return {
            name: document.getElementById('dishName').value.trim(),
            description: document.getElementById('dishDescription').value.trim(),
            category: 'accompaniments',
            type: document.getElementById('dishType').value,
            applicableFor: applicableFor,
            nutrition: {
                calories: parseInt(document.getElementById('calories').value) || 0,
                protein: parseFloat(document.getElementById('protein').value) || 0,
                carbs: parseFloat(document.getElementById('carbs').value) || 0,
                fat: parseFloat(document.getElementById('fat').value) || 0
            },
            region: 'Pan-Indian'
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

        if (dishLower.includes('raita')) {
            nutrition = { calories: 80, protein: 4, carbs: 10, fat: 3 };
        } else if (dishLower.includes('kosambari') || dishLower.includes('salad')) {
            nutrition = { calories: 60, protein: 2, carbs: 12, fat: 1 };
        } else if (dishLower.includes('chutney')) {
            nutrition = { calories: 30, protein: 1, carbs: 5, fat: 1 };
        } else if (dishLower.includes('pickle')) {
            nutrition = { calories: 25, protein: 0, carbs: 6, fat: 0 };
        } else if (dishLower.includes('papad')) {
            nutrition = { calories: 40, protein: 2, carbs: 6, fat: 1 };
        } else if (dishLower.includes('yogurt') || dishLower.includes('rice')) {
            nutrition = { calories: 160, protein: 6, carbs: 30, fat: 2 };
        } else {
            nutrition = { calories: 50, protein: 2, carbs: 8, fat: 1 };
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

    async addItem(data) {
        const newItem = {
            ...data,
            id: 'ac_user_' + Date.now()
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
            this.showAlert('Accompaniment deleted successfully!', 'success');
        }
        this.closeDeleteModal();
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.deleteItemId = null;
    }

    async persistChanges() {
        try {
            await this.saveToLocalStorage();
            console.log('Accompaniments changes persisted to localStorage');
        } catch (error) {
            console.error('Failed to persist changes:', error);
            this.showAlert('Changes saved locally in browser memory.', 'warning');
        }
    }

    async saveToLocalStorage() {
        try {
            if (window.dataStorage) {
                const success = window.dataStorage.saveCatalogData('accompaniments-catalog', this.allFoodItems);
                if (success) {
                    console.log('Successfully saved accompaniments data to localStorage');
                    return true;
                } else {
                    console.error('Failed to save accompaniments data to localStorage');
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

// Accompaniments Catalog Module - Salads, Raitas, Chutneys and other accompaniments
// This module is initialized by main.js after DOM and dependencies are loaded
