// Mains Catalog Module - Dedicated to Karnataka Main Dishes (Lunch & Dinner)
class MainsCatalog {
    constructor() {
        this.allFoodItems = [];
        this.filteredItems = [];
        this.currentEditId = null;
        this.deleteItemId = null;
        
        // Don't auto-initialize - let main.js handle it
    }

    async init() {
        console.log('Initializing Mains Catalog...');
        await this.loadData();
        
        // Wait for DOM elements to be available
        await this.waitForDOMElements();
        
        this.setupEventListeners();
        this.applyFilters();
        this.updateStatistics();
        
        window.mainsCatalog = this;
        console.log('Mains Catalog initialized. Global instance:', window.mainsCatalog);
    }

    async waitForDOMElements() {
        console.log('MainsCatalog: Waiting for DOM elements...');
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20; // Increased from 10
            
            const checkElements = () => {
                const foodGrid = document.getElementById('foodGrid');
                const emptyState = document.getElementById('emptyState');
                
                console.log(`MainsCatalog: Attempt ${attempts + 1} - foodGrid: ${foodGrid ? 'found' : 'null'}, emptyState: ${emptyState ? 'found' : 'null'}`);
                
                if (foodGrid && emptyState) {
                    console.log('MainsCatalog: DOM elements found!');
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    console.error('MainsCatalog: DOM elements not found after', maxAttempts, 'attempts');
                    
                    // Debug: Check what's actually in the DOM
                    const mainContent = document.getElementById('main-content');
                    console.log('MainsCatalog: main-content innerHTML:', mainContent ? mainContent.innerHTML : 'null');
                    console.log('MainsCatalog: All elements with id foodGrid:', document.querySelectorAll('#foodGrid'));
                    console.log('MainsCatalog: All elements with id emptyState:', document.querySelectorAll('#emptyState'));
                    
                    reject(new Error('Missing DOM elements - foodGrid: ' + foodGrid + ' emptyState: ' + emptyState));
                    return;
                }
                
                // Use requestAnimationFrame instead of setTimeout for better timing
                requestAnimationFrame(checkElements);
            };
            
            checkElements();
        });
    }

    async loadData() {
        try {
            const mainsResponse = await fetch('/data/mains-catalog.json');
            const mainsJson = await mainsResponse.json();
            
            this.allFoodItems = this.extractItems(mainsJson);
            console.log(`Loaded ${this.allFoodItems.length} main dish items`);
            
        } catch (error) {
            console.error('Error loading mains data:', error);
            this.showAlert('Failed to load mains data. Please refresh the page.', 'error');
        }
    }

    extractItems(jsonData) {
        if (jsonData.mains && jsonData.mains.items) {
            return jsonData.mains.items;
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

        const addMainBtn = document.getElementById('addMainBtn');
        if (addMainBtn) {
            addMainBtn.addEventListener('click', () => this.showAddModal());
        }

        const mainForm = document.getElementById('mainForm');
        if (mainForm) {
            mainForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
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
        
        console.log('MainsCatalog renderFoodGrid:', foodGrid, emptyState, this.filteredItems.length);
        
        if (!foodGrid || !emptyState) {
            console.error('MainsCatalog: Missing DOM elements - foodGrid:', foodGrid, 'emptyState:', emptyState);
            return;
        }

        if (this.filteredItems.length === 0) {
            foodGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        foodGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        const cardsHTML = this.filteredItems.map(item => this.createFoodCard(item)).join('');
        console.log('MainsCatalog: Generated cards HTML length:', cardsHTML.length);
        foodGrid.innerHTML = cardsHTML;
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
        
        if (name.includes('rice') || name.includes('bath')) return '🍚';
        if (name.includes('curry')) return '🍛';
        if (name.includes('sambar')) return '🍲';
        if (name.includes('rasam')) return '🍵';
        if (name.includes('dal')) return '🥘';
        if (name.includes('roti')) return '🫓';
        if (name.includes('biryani')) return '🍛';
        if (name.includes('pulao')) return '🍚';
        if (name.includes('fry') || name.includes('sabji')) return '🥗';
        
        return '🍽️'; // default meal emoji
    }

    formatType(type) {
        const typeMap = {
            'mains': 'Mains',
            'side-dish-gravy': 'Side Dish - Gravy',
            'side-dish-sabji': 'Side Dish - Sabji', 
            'vegetarian': 'Vegetarian',
            'non-vegetarian': 'Non-Vegetarian'
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
                item.type === 'vegetarian' || item.type === 'mains' || item.type === 'side-dish-gravy' || item.type === 'side-dish-sabji'
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

        // Meal-specific estimations
        if (dishLower.includes('rice') || dishLower.includes('bath')) {
            nutrition = { calories: 350, protein: 8, carbs: 65, fat: 8 };
        } else if (dishLower.includes('curry') || dishLower.includes('sambar')) {
            nutrition = { calories: 150, protein: 8, carbs: 22, fat: 4 };
        } else if (dishLower.includes('dal')) {
            nutrition = { calories: 120, protein: 9, carbs: 18, fat: 2 };
        } else if (dishLower.includes('biryani')) {
            nutrition = { calories: 450, protein: 12, carbs: 75, fat: 12 };
        } else if (dishLower.includes('roti')) {
            nutrition = { calories: 200, protein: 6, carbs: 38, fat: 4 };
        } else if (dishLower.includes('fry') || dishLower.includes('sabji')) {
            nutrition = { calories: 160, protein: 4, carbs: 20, fat: 7 };
        } else {
            // Generic meal estimation
            nutrition = { calories: 220, protein: 7, carbs: 35, fat: 6 };
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
        document.getElementById('modalTitle').textContent = 'Add New Main Dish';
        document.getElementById('submitBtnText').textContent = 'Add Main Dish';
        this.clearForm();
        document.getElementById('mainModal').classList.add('active');
    }

    editItem(itemId) {
        const item = this.allFoodItems.find(item => (item.id || item.name) === itemId);
        if (!item) return;

        this.currentEditId = itemId;
        document.getElementById('modalTitle').textContent = 'Edit Main Dish';
        document.getElementById('submitBtnText').textContent = 'Update Main Dish';
        
        this.populateForm(item);
        document.getElementById('mainModal').classList.add('active');
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
        document.getElementById('mainForm').reset();
    }

    closeModal() {
        document.getElementById('mainModal').classList.remove('active');
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
        this.showAlert(`Main dish ${action} successfully!`, 'success');
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
            category: 'mains',
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
        
        if (!data.type) {
            this.showAlert('Please select a type', 'error');
            return false;
        }
        
        return true;
    }

    async saveToJsonFile() {
        try {
            const jsonData = {
                mains: {
                    items: this.allFoodItems.map(item => ({
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
                    filename: 'mains-catalog.json',
                    data: jsonData
                })
            });

            if (!response.ok) {
                console.error('Failed to save to JSON file:', response.statusText);
                return false;
            }

            console.log('Successfully saved mains data');
            return true;
        } catch (error) {
            console.error('Error saving to JSON file:', error);
            return false;
        }
    }

    async persistChanges() {
        try {
            await this.saveToJsonFile();
            console.log('Mains changes persisted');
        } catch (error) {
            console.error('Failed to persist changes:', error);
            this.showAlert('Changes saved locally but couldn\'t sync to server.', 'warning');
        }
    }

    async addItem(data) {
        const newItem = {
            ...data,
            id: 'ml_user_' + Date.now()
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
            this.showAlert('Main dish deleted successfully!', 'success');
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

// Mains Catalog Module - Dedicated to Karnataka Main Dishes (Lunch & Dinner)
// This module is initialized by main.js after DOM and dependencies are loaded
