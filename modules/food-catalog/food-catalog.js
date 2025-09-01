// Food Catalog Module - Complete CRUD functionality
class FoodCatalog {
    constructor() {
        this.breakfastData = [];
        this.mealData = [];
        this.allFoodItems = [];
        this.filteredItems = [];
        this.currentEditId = null;
        this.deleteItemId = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Food Catalog...');
        await this.loadData();
        this.setupEventListeners();
        this.applyFilters();
        this.updateStatistics();
        
        // Ensure global access is set
        window.foodCatalog = this;
        console.log('Food Catalog initialized. Global instance:', window.foodCatalog);
    }

    async loadData() {
        try {
            // Load breakfast data
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastJson = await breakfastResponse.json();
            
            // Load meals data
            const mealsResponse = await fetch('/data/meals-catalog.json');
            const mealsJson = await mealsResponse.json();
            
            // Extract items from nested structure
            this.breakfastData = this.extractItems(breakfastJson);
            this.mealData = this.extractItems(mealsJson);
            
            // Combine all items
            this.allFoodItems = [...this.breakfastData, ...this.mealData];
            
            console.log(`Loaded ${this.allFoodItems.length} food items`);
            
            // Load user customizations from localStorage
            this.loadUserCustomizations();
            
        } catch (error) {
            console.error('Error loading food data:', error);
            this.showAlert('Error loading food data. Please try again later.', 'error');
        }
    }

    extractItems(jsonData) {
        const items = [];
        const categories = jsonData.foodCatalog.categories;
        const defaultItems = jsonData.foodCatalog.defaultItems;
        
        Object.keys(defaultItems).forEach(categoryKey => {
            defaultItems[categoryKey].forEach(item => {
                items.push({
                    ...item,
                    categoryName: categories[categoryKey] || categoryKey
                });
            });
        });
        
        return items;
    }

    loadUserCustomizations() {
        const userItems = localStorage.getItem('userFoodItems');
        if (userItems) {
            try {
                const parsedItems = JSON.parse(userItems);
                this.allFoodItems = [...this.allFoodItems, ...parsedItems];
            } catch (error) {
                console.error('Error loading user customizations:', error);
            }
        }
    }

    saveUserCustomizations() {
        // Save only user-added items (those without predefined IDs)
        const userItems = this.allFoodItems.filter(item => 
            !item.id || (!item.id.startsWith('bf') && !item.id.startsWith('ml'))
        );
        localStorage.setItem('userFoodItems', JSON.stringify(userItems));
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Add new dish button
        const addFoodBtn = document.getElementById('addFoodBtn');
        if (addFoodBtn) {
            addFoodBtn.addEventListener('click', () => this.showAddModal());
        }

        // Form submission
        const foodForm = document.getElementById('foodForm');
        if (foodForm) {
            foodForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Nutrition fetch button
        const fetchNutritionBtn = document.getElementById('fetchNutritionBtn');
        if (fetchNutritionBtn) {
            fetchNutritionBtn.addEventListener('click', () => this.fetchNutritionInfo());
        }

        // Modal close on backdrop click
        const modal = document.getElementById('foodModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) this.closeDeleteModal();
            });
        }
        
        // Ensure global access
        window.foodCatalog = this;
        console.log('Food catalog event listeners setup complete');
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';

        this.filteredItems = this.allFoodItems.filter(item => {
            // Search filter
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

            // Type filter
            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            return matchesSearch && matchesCategory && matchesType;
        });

        this.renderFoodGrid();
        this.updateStatistics();
    }

    renderFoodGrid() {
        const foodGrid = document.getElementById('foodGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!foodGrid) return;

        if (this.filteredItems.length === 0) {
            foodGrid.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        foodGrid.innerHTML = this.filteredItems.map(item => this.createFoodCard(item)).join('');
        
        // Ensure global instance is available
        window.foodCatalog = this;
        
        // Add event delegation for edit/delete buttons
        this.setupCardEventListeners();
    }

    createFoodCard(item) {
        const emoji = this.getFoodEmoji(item.name);
        const nutrition = item.nutrition || {};
        
        return `
            <div class="food-card">
                <div class="food-card-header">
                    <div class="food-emoji">${emoji}</div>
                    <h3 class="food-name">${item.name}</h3>
                    <div class="food-badges">
                        <span class="badge badge-${item.type}">${this.formatType(item.type)}</span>
                        <span class="badge badge-${item.category}">${this.formatCategory(item.category)}</span>
                    </div>
                    <p class="food-description">${item.description}</p>
                </div>
                <div class="food-card-body">
                    <div class="nutrition-info">
                        <div class="nutrition-title">Nutritional Info (per serving)</div>
                        <div class="nutrition-grid">
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.calories || 'N/A'}</div>
                                <div class="nutrition-label">Cal</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.protein || 'N/A'}</div>
                                <div class="nutrition-label">Protein</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.carbs || 'N/A'}</div>
                                <div class="nutrition-label">Carbs</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.fat || 'N/A'}</div>
                                <div class="nutrition-label">Fat</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="food-card-actions">
                    <button class="action-btn edit-btn" data-action="edit" data-item-id="${item.id || item.name}">
                        ✏️ Edit
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" data-item-id="${item.id || item.name}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    getFoodEmoji(foodName) {
        const name = foodName.toLowerCase();
        
        // Breakfast items
        if (name.includes('dosa')) return '🥞';
        if (name.includes('idli')) return '🍰';
        if (name.includes('vada')) return '🍩';
        if (name.includes('upma')) return '🥣';
        if (name.includes('poha')) return '🍚';
        if (name.includes('uttapam')) return '🥞';
        if (name.includes('sheera')) return '🍮';
        
        // Rice dishes
        if (name.includes('rice') || name.includes('bath')) return '🍚';
        if (name.includes('biryani')) return '🍛';
        
        // Curries and sides
        if (name.includes('sambar') || name.includes('rasam')) return '🍲';
        if (name.includes('curry') || name.includes('palkya')) return '🍛';
        
        // Sweets
        if (name.includes('pak') || name.includes('holige') || name.includes('chiroti')) return '🍯';
        
        // Roti/Bread
        if (name.includes('roti') || name.includes('rotti')) return '🫓';
        if (name.includes('mudde')) return '⚪';
        
        // Default
        return '🍽️';
    }

    formatType(type) {
        const typeMap = {
            'mains': 'Mains',
            'side-dish-gravy': 'Side Dish - Gravy',
            'side-dish-sabji': 'Side Dish - Sabji',
            'vegetarian': 'Veg',
            'non-vegetarian': 'Non-Veg'
        };
        return typeMap[type] || type;
    }

    formatCategory(category) {
        return category === 'breakfast' ? 'Breakfast' : 'Meal';
    }

    updateStatistics() {
        const totalCount = document.getElementById('totalCount');
        const breakfastCount = document.getElementById('breakfastCount');
        const mealCount = document.getElementById('mealCount');

        if (totalCount) totalCount.textContent = this.filteredItems.length;
        if (breakfastCount) breakfastCount.textContent = this.filteredItems.filter(item => item.category === 'breakfast').length;
        if (mealCount) mealCount.textContent = this.filteredItems.filter(item => item.category === 'meal').length;
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

        try {
            // Using Edamam Nutrition Analysis API
            const response = await fetch('http://localhost:3001/api/nutrition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dishName: dishName,
                    servingSize: '100g' // Default serving size
                })
            });

            if (!response.ok) {
                // Fallback to a mock nutrition data based on dish type
                console.log('API not available, using estimated values');
                this.setEstimatedNutrition(dishName);
                statusElement.textContent = '✅ Estimated nutrition values filled';
                statusElement.className = 'nutrition-status success';
            } else {
                const nutritionData = await response.json();
                this.populateNutritionFields(nutritionData);
                statusElement.textContent = '✅ Nutrition info fetched successfully';
                statusElement.className = 'nutrition-status success';
            }
        } catch (error) {
            console.error('Error fetching nutrition info:', error);
            this.setEstimatedNutrition(dishName);
            statusElement.textContent = '✅ Estimated nutrition values filled';
            statusElement.className = 'nutrition-status success';
        }

        // Clear status after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'nutrition-status';
        }, 5000);
    }

    setEstimatedNutrition(dishName) {
        const dishLower = dishName.toLowerCase();
        let nutrition = {};

        // Estimate based on dish type and common Karnataka dishes
        if (dishLower.includes('dosa') || dishLower.includes('idli')) {
            nutrition = { calories: 150, protein: 4, carbs: 28, fat: 3 };
        } else if (dishLower.includes('rice') || dishLower.includes('bath')) {
            nutrition = { calories: 350, protein: 8, carbs: 65, fat: 8 };
        } else if (dishLower.includes('curry') || dishLower.includes('sambar')) {
            nutrition = { calories: 120, protein: 6, carbs: 18, fat: 4 };
        } else if (dishLower.includes('roti') || dishLower.includes('chapati')) {
            nutrition = { calories: 200, protein: 6, carbs: 38, fat: 4 };
        } else if (dishLower.includes('fry') || dishLower.includes('sabji')) {
            nutrition = { calories: 160, protein: 4, carbs: 20, fat: 7 };
        } else if (dishLower.includes('sweet') || dishLower.includes('payasa')) {
            nutrition = { calories: 280, protein: 5, carbs: 45, fat: 10 };
        } else {
            // Generic estimation
            nutrition = { calories: 200, protein: 6, carbs: 30, fat: 6 };
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
        document.getElementById('modalTitle').textContent = 'Add New Dish';
        document.getElementById('submitBtnText').textContent = 'Add Dish';
        this.clearForm();
        document.getElementById('foodModal').classList.add('active');
    }

    editItem(itemId) {
        const item = this.allFoodItems.find(item => (item.id || item.name) === itemId);
        if (!item) return;

        this.currentEditId = itemId;
        document.getElementById('modalTitle').textContent = 'Edit Dish';
        document.getElementById('submitBtnText').textContent = 'Update Dish';
        
        this.populateForm(item);
        document.getElementById('foodModal').classList.add('active');
    }

    populateForm(item) {
        document.getElementById('dishName').value = item.name || '';
        document.getElementById('dishDescription').value = item.description || '';
        document.getElementById('dishCategory').value = item.category || '';
        document.getElementById('dishType').value = item.type || '';
        
        // Applicable for checkboxes
        document.getElementById('applicableBreakfast').checked = item.applicableFor?.includes('Breakfast') || false;
        document.getElementById('applicableLunch').checked = item.applicableFor?.includes('Lunch') || false;
        document.getElementById('applicableDinner').checked = item.applicableFor?.includes('Dinner') || false;
        
        // Nutrition
        const nutrition = item.nutrition || {};
        document.getElementById('calories').value = nutrition.calories || '';
        document.getElementById('protein').value = nutrition.protein || '';
        document.getElementById('carbs').value = nutrition.carbs || '';
        document.getElementById('fat').value = nutrition.fat || '';
    }

    clearForm() {
        document.getElementById('foodForm').reset();
    }

    closeModal() {
        document.getElementById('foodModal').classList.remove('active');
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
        this.saveUserCustomizations();
        
        const action = this.currentEditId ? 'updated' : 'added';
        this.showAlert(`Dish ${action} successfully!`, 'success');
    }

    getFormData() {
        const applicableFor = [];
        if (document.getElementById('applicableBreakfast').checked) applicableFor.push('Breakfast');
        if (document.getElementById('applicableLunch').checked) applicableFor.push('Lunch');
        if (document.getElementById('applicableDinner').checked) applicableFor.push('Dinner');

        return {
            name: document.getElementById('dishName').value.trim(),
            description: document.getElementById('dishDescription').value.trim(),
            category: document.getElementById('dishCategory').value,
            type: document.getElementById('dishType').value,
            applicableFor: applicableFor,
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
        
        if (!data.category) {
            this.showAlert('Please select a category', 'error');
            return false;
        }
        
        if (!data.type) {
            this.showAlert('Please select a type', 'error');
            return false;
        }
        
        // Check for duplicate names (excluding current item when editing)
        const existingItem = this.allFoodItems.find(item => 
            item.name.toLowerCase() === data.name.toLowerCase() && 
            (item.id || item.name) !== this.currentEditId
        );
        
        if (existingItem) {
            this.showAlert('A dish with this name already exists', 'error');
            return false;
        }
        
        return true;
    }

    async saveToJsonFile(category) {
        try {
            const items = this.allFoodItems.filter(item => item.category === category);
            const filename = category === 'breakfast' ? 'breakfast-catalog.json' : 'meals-catalog.json';
            
            // Create the proper structure that matches the original JSON files
            const jsonData = {
                [category]: {
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        type: item.type,
                        category: item.category,
                        nutrition: item.nutrition,
                        applicableFor: item.applicableFor,
                        region: item.region
                    }))
                }
            };

            const response = await fetch(`http://localhost:3001/api/save-catalog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    data: jsonData
                })
            });

            if (!response.ok) {
                console.error('Failed to save to JSON file:', response.statusText);
                // Fallback to localStorage for persistence
                this.saveToLocalStorage(category, jsonData);
                return false;
            }

            console.log(`Successfully saved ${category} data to ${filename}`);
            return true;
        } catch (error) {
            console.error('Error saving to JSON file:', error);
            // Fallback to localStorage
            const items = this.allFoodItems.filter(item => item.category === category);
            const jsonData = {
                [category]: {
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        type: item.type,
                        category: item.category,
                        nutrition: item.nutrition,
                        applicableFor: item.applicableFor,
                        region: item.region
                    }))
                }
            };
            this.saveToLocalStorage(category, jsonData);
            return false;
        }
    }

    saveToLocalStorage(category, data) {
        const key = category === 'breakfast' ? 'breakfast-catalog-backup' : 'meals-catalog-backup';
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Saved ${category} data to localStorage as backup`);
    }

    async persistChanges(item, operation) {
        const category = item.category;
        
        try {
            await this.saveToJsonFile(category);
            console.log(`${operation} operation persisted for ${category} category`);
        } catch (error) {
            console.error(`Failed to persist ${operation} operation:`, error);
            this.showAlert(`Changes saved locally but couldn't sync to server. Data will be restored on refresh.`, 'warning');
        }
    }

    async addItem(data) {
        const newItem = {
            ...data,
            id: 'user_' + Date.now(),
            categoryName: data.category === 'breakfast' ? 'User Added Breakfast' : 'User Added Meals'
        };
        
        this.allFoodItems.push(newItem);
        
        // Persist changes to JSON file
        await this.persistChanges(newItem, 'add');
    }

    async updateItem(data) {
        const index = this.allFoodItems.findIndex(item => (item.id || item.name) === this.currentEditId);
        if (index !== -1) {
            const updatedItem = {
                ...this.allFoodItems[index],
                ...data
            };
            this.allFoodItems[index] = updatedItem;
            
            // Persist changes to JSON file
            await this.persistChanges(updatedItem, 'update');
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
            const itemToDelete = this.allFoodItems[index];
            this.allFoodItems.splice(index, 1);
            
            // Persist changes to JSON file
            await this.persistChanges(itemToDelete, 'delete');
            
            this.applyFilters();
            this.saveUserCustomizations();
            this.showAlert('Dish deleted successfully!', 'success');
        }
        this.closeDeleteModal();
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.deleteItemId = null;
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '10001';
        alert.style.minWidth = '300px';
        alert.style.animation = 'slideInRight 0.3s ease-out';
        
        document.body.appendChild(alert);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, 3000);
    }

    setupCardEventListeners() {
        const foodGrid = document.getElementById('foodGrid');
        if (!foodGrid) return;
        
        // Remove existing listener if any
        foodGrid.removeEventListener('click', this.handleCardActions);
        
        // Add event delegation for all card actions
        this.handleCardActions = (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            const itemId = button.getAttribute('data-item-id');
            
            console.log('Card action clicked:', action, itemId);
            
            if (action === 'edit') {
                this.editItem(itemId);
            } else if (action === 'delete') {
                this.deleteItem(itemId);
            }
        };
        
        foodGrid.addEventListener('click', this.handleCardActions);
    }
}

// Global instance
let foodCatalog;

// Initialize when DOM is loaded
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodCatalog;
} else {
    // Browser environment
    window.FoodCatalog = FoodCatalog;
}
