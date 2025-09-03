// Home Module - Mobile-First Card-Based Meal Planning
class Home {
    constructor() {
        this.menuPlans = {};
        this.availableMeals = {
            breakfast: [],
            mains: [],
            sides: [],
            accompaniments: []
        };
        this.selectedItems = {
            breakfast: [],
            mains: [],
            sides: [],
            accompaniments: []
        };
        this.currentDate = '';
        this.currentCategory = '';
        this.loadMenuPlans();
    }

    async init() {
        console.log('Initializing Home module...');
        
        await this.loadAvailableMeals();
        this.setupEventListeners();
        this.renderMealPlanCards();
        this.updateStatistics();
        
        // Set default date to tomorrow
        this.setDefaultDate();
        
        // Ensure global access
        window.home = this;
        console.log('Home module initialized successfully');
    }

    setupEventListeners() {
        // Meal Suggestion Modal
        const closeSuggestionModal = document.getElementById('closeSuggestionModal');
        if (closeSuggestionModal) {
            closeSuggestionModal.addEventListener('click', () => this.closeMealSuggestionModal());
        }

        const saveMealPlan = document.getElementById('saveMealPlan');
        if (saveMealPlan) {
            saveMealPlan.addEventListener('click', () => this.saveMealPlan());
        }

        const cancelMealPlan = document.getElementById('cancelMealPlan');
        if (cancelMealPlan) {
            cancelMealPlan.addEventListener('click', () => this.closeMealSuggestionModal());
        }

        // Category Selector Modal
        const closeCategorySelector = document.getElementById('closeCategorySelector');
        if (closeCategorySelector) {
            closeCategorySelector.addEventListener('click', () => this.closeCategorySelector());
        }

        const addSelectedItems = document.getElementById('addSelectedItems');
        if (addSelectedItems) {
            addSelectedItems.addEventListener('click', () => this.addSelectedItemsToCategory());
        }

        const cancelCategorySelection = document.getElementById('cancelCategorySelection');
        if (cancelCategorySelection) {
            cancelCategorySelection.addEventListener('click', () => this.closeCategorySelector());
        }

        // Search functionality
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) {
            categorySearch.addEventListener('input', (e) => this.filterCategoryItems(e.target.value));
        }

        // Date input
        const selectedDate = document.getElementById('selectedDate');
        if (selectedDate) {
            selectedDate.addEventListener('change', (e) => {
                this.currentDate = e.target.value;
            });
        }

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        
        const selectedDate = document.getElementById('selectedDate');
        if (selectedDate) {
            selectedDate.value = dateString;
            this.currentDate = dateString;
        }
    }

    async loadAvailableMeals() {
        try {
            // Load breakfast items
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastData = await breakfastResponse.json();
            this.availableMeals.breakfast = this.extractItems(breakfastData, 'breakfast');

            // Load mains items
            const mainsResponse = await fetch('/data/mains-catalog.json');
            const mainsData = await mainsResponse.json();
            this.availableMeals.mains = this.extractItems(mainsData, 'mains');

            // Load sides items
            const sidesResponse = await fetch('/data/sides-catalog.json');
            const sidesData = await sidesResponse.json();
            this.availableMeals.sides = this.extractItems(sidesData, 'sides');

            // Load accompaniments items
            const accompanimentsResponse = await fetch('/data/accompaniments-catalog.json');
            const accompanimentsData = await accompanimentsResponse.json();
            this.availableMeals.accompaniments = this.extractItems(accompanimentsData, 'accompaniments');

            console.log('Available meals loaded:', {
                breakfast: this.availableMeals.breakfast.length,
                mains: this.availableMeals.mains.length,
                sides: this.availableMeals.sides.length,
                accompaniments: this.availableMeals.accompaniments.length
            });

        } catch (error) {
            console.error('Error loading meal data:', error);
            this.showAlert('Failed to load meal data. Some features may not work properly.', 'warning');
        }
    }

    extractItems(jsonData, category) {
        if (jsonData[category] && jsonData[category].items) {
            return jsonData[category].items;
        } else if (Array.isArray(jsonData)) {
            return jsonData;
        } else {
            console.warn(`Unexpected JSON structure for ${category}:`, jsonData);
            return [];
        }
    }

    showMealSuggestionModal() {
        this.clearSelectedItems();
        this.generateRandomSuggestions();
        
        const modal = document.getElementById('mealSuggestionModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeMealSuggestionModal() {
        const modal = document.getElementById('mealSuggestionModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.clearSelectedItems();
    }

    clearSelectedItems() {
        this.selectedItems = {
            breakfast: [],
            mains: [],
            sides: [],
            accompaniments: []
        };
    }

    generateRandomSuggestions() {
        // Generate 2-3 random suggestions for each category
        const categories = ['breakfast', 'mains', 'sides', 'accompaniments'];
        
        categories.forEach(category => {
            const availableItems = this.availableMeals[category];
            if (availableItems.length > 0) {
                // Get 2-3 random items
                const suggestionCount = Math.min(availableItems.length, Math.floor(Math.random() * 2) + 2);
                const suggestions = [];
                
                while (suggestions.length < suggestionCount) {
                    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                    if (!suggestions.find(item => item.id === randomItem.id)) {
                        suggestions.push({...randomItem});
                    }
                }
                
                this.selectedItems[category] = suggestions;
            }
        });
        
        this.renderSuggestions();
    }

    refreshCategorySuggestions(category) {
        const availableItems = this.availableMeals[category];
        if (availableItems.length > 0) {
            // Generate new suggestions for this category
            const suggestionCount = Math.min(availableItems.length, Math.floor(Math.random() * 2) + 2);
            const suggestions = [];
            
            while (suggestions.length < suggestionCount) {
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                if (!suggestions.find(item => item.id === randomItem.id)) {
                    suggestions.push({...randomItem});
                }
            }
            
            this.selectedItems[category] = suggestions;
            this.renderCategorySuggestions(category);
        }
    }

    renderSuggestions() {
        const categories = ['breakfast', 'mains', 'sides', 'accompaniments'];
        categories.forEach(category => {
            this.renderCategorySuggestions(category);
        });
    }

    renderCategorySuggestions(category) {
        const container = document.getElementById(`suggested${category.charAt(0).toUpperCase() + category.slice(1)}`);
        if (!container) return;

        const items = this.selectedItems[category] || [];
        
        container.innerHTML = items.map(item => `
            <div class="suggestion-item selected" onclick="window.home.toggleSuggestionItem('${category}', '${item.id}')">
                <h5>${item.name}</h5>
                <p>${item.description || ''}</p>
                ${item.nutrition ? `
                    <div class="item-nutrition">
                        <small>${item.nutrition.calories || 0} cal • ${item.nutrition.protein || 0}g protein</small>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    toggleSuggestionItem(category, itemId) {
        const itemIndex = this.selectedItems[category].findIndex(item => item.id === itemId);
        
        if (itemIndex > -1) {
            // Remove item
            this.selectedItems[category].splice(itemIndex, 1);
        } else {
            // Add item back (shouldn't happen in current design, but keeping for flexibility)
            const item = this.availableMeals[category].find(item => item.id === itemId);
            if (item) {
                this.selectedItems[category].push({...item});
            }
        }
        
        this.renderCategorySuggestions(category);
    }

    showCategorySelector(category) {
        this.currentCategory = category;
        
        const modal = document.getElementById('categorySelectorModal');
        const title = document.getElementById('categorySelectorTitle');
        
        if (title) {
            title.textContent = `Add More ${category.charAt(0).toUpperCase() + category.slice(1)} Items`;
        }
        
        this.renderCategoryItems();
        
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeCategorySelector() {
        const modal = document.getElementById('categorySelectorModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Clear search
        const search = document.getElementById('categorySearch');
        if (search) {
            search.value = '';
        }
    }

    renderCategoryItems() {
        const container = document.getElementById('categoryItems');
        if (!container) return;

        const items = this.availableMeals[this.currentCategory] || [];
        
        container.innerHTML = items.map(item => `
            <div class="category-item" data-item-id="${item.id}" onclick="window.home.toggleCategoryItem(this, '${item.id}')">
                <div class="item-emoji">${this.getItemEmoji(item, this.currentCategory)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description || ''}</div>
                ${item.nutrition ? `
                    <div class="item-nutrition">
                        <small>${item.nutrition.calories || 0} cal</small>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    toggleCategoryItem(element, itemId) {
        element.classList.toggle('selected');
    }

    filterCategoryItems(searchTerm) {
        const items = document.querySelectorAll('.category-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.item-name').textContent.toLowerCase();
            const description = item.querySelector('.item-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    addSelectedItemsToCategory() {
        const selectedElements = document.querySelectorAll('.category-item.selected');
        const itemsToAdd = [];
        
        selectedElements.forEach(element => {
            const itemId = element.getAttribute('data-item-id');
            const item = this.availableMeals[this.currentCategory].find(item => item.id === itemId);
            if (item && !this.selectedItems[this.currentCategory].find(selected => selected.id === itemId)) {
                itemsToAdd.push({...item});
            }
        });
        
        if (itemsToAdd.length > 0) {
            this.selectedItems[this.currentCategory].push(...itemsToAdd);
            this.renderCategorySuggestions(this.currentCategory);
            this.showAlert(`Added ${itemsToAdd.length} items to ${this.currentCategory}!`, 'success');
        }
        
        this.closeCategorySelector();
    }

    saveMealPlan() {
        if (!this.currentDate) {
            this.showAlert('Please select a date for the meal plan.', 'warning');
            return;
        }
        
        // Check if at least one item is selected
        const totalItems = Object.values(this.selectedItems).reduce((sum, items) => sum + items.length, 0);
        if (totalItems === 0) {
            this.showAlert('Please select at least one meal item.', 'warning');
            return;
        }
        
        // Save the meal plan
        this.menuPlans[this.currentDate] = {...this.selectedItems};
        this.saveMenuPlans();
        
        // Refresh the display
        this.renderMealPlanCards();
        this.updateStatistics();
        
        // Close modal
        this.closeMealSuggestionModal();
        
        // Show success message
        this.showAlert(`Menu plan saved for ${this.formatDateForDisplay(this.currentDate)}!`, 'success');
    }

    renderMealPlanCards() {
        const container = document.getElementById('mealPlanCards');
        if (!container) return;

        const sortedDates = Object.keys(this.menuPlans).sort();
        
        if (sortedDates.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = sortedDates.map(date => {
            const dayMenu = this.menuPlans[date];
            const nutrition = this.calculateDayNutrition(dayMenu);
            const totalItems = this.countDayItems(dayMenu);
            
            return `
                <div class="meal-plan-card">
                    <div class="meal-card-header">
                        <div>
                            <div class="meal-card-date">${this.formatDateForDisplay(date)}</div>
                            <div class="meal-card-day">${this.formatDayOfWeek(date)}</div>
                        </div>
                        <div class="meal-card-nutrition">
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.calories}</div>
                                <div class="nutrition-label">Cal</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-value">${nutrition.protein}g</div>
                                <div class="nutrition-label">Protein</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="meal-categories-grid">
                        ${this.renderCategorySummary('breakfast', dayMenu.breakfast, '🌅')}
                        ${this.renderCategorySummary('mains', dayMenu.mains, '🍛')}
                        ${this.renderCategorySummary('sides', dayMenu.sides, '🥗')}
                        ${this.renderCategorySummary('accompaniments', dayMenu.accompaniments, '🫓')}
                    </div>
                    
                    <div class="meal-card-actions">
                        <button class="meal-card-btn edit" onclick="window.home.editMealPlan('${date}')">
                            Edit Menu
                        </button>
                        <button class="meal-card-btn delete" onclick="window.home.deleteMealPlan('${date}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCategorySummary(category, items, icon) {
        const count = items ? items.length : 0;
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        
        return `
            <div class="meal-category-summary">
                <div class="category-icon">${icon}</div>
                <div class="category-count">${count}</div>
                <div class="category-label">${label}</div>
            </div>
        `;
    }

    calculateDayNutrition(dayMenu) {
        let totalCalories = 0;
        let totalProtein = 0;
        
        Object.values(dayMenu).forEach(categoryItems => {
            if (Array.isArray(categoryItems)) {
                categoryItems.forEach(item => {
                    if (item.nutrition) {
                        totalCalories += parseInt(item.nutrition.calories) || 0;
                        totalProtein += parseFloat(item.nutrition.protein) || 0;
                    }
                });
            }
        });
        
        return {
            calories: totalCalories,
            protein: Math.round(totalProtein * 10) / 10
        };
    }

    countDayItems(dayMenu) {
        return Object.values(dayMenu).reduce((sum, categoryItems) => {
            return sum + (Array.isArray(categoryItems) ? categoryItems.length : 0);
        }, 0);
    }

    editMealPlan(date) {
        this.currentDate = date;
        this.selectedItems = JSON.parse(JSON.stringify(this.menuPlans[date]));
        
        const selectedDate = document.getElementById('selectedDate');
        if (selectedDate) {
            selectedDate.value = date;
        }
        
        this.renderSuggestions();
        
        const modal = document.getElementById('mealSuggestionModal');
        const title = document.getElementById('suggestionModalTitle');
        
        if (title) {
            title.textContent = `Edit Menu for ${this.formatDateForDisplay(date)}`;
        }
        
        if (modal) {
            modal.classList.add('active');
        }
    }

    deleteMealPlan(date) {
        if (confirm(`Are you sure you want to delete the meal plan for ${this.formatDateForDisplay(date)}?`)) {
            delete this.menuPlans[date];
            this.saveMenuPlans();
            this.renderMealPlanCards();
            this.updateStatistics();
            this.showAlert('Meal plan deleted successfully!', 'success');
        }
    }

    updateStatistics() {
        const plannedDaysCount = document.getElementById('plannedDaysCount');
        const totalMealsCount = document.getElementById('totalMealsCount');
        
        const plannedDays = Object.keys(this.menuPlans).length;
        let totalMeals = 0;
        
        Object.values(this.menuPlans).forEach(dayMenu => {
            totalMeals += this.countDayItems(dayMenu);
        });
        
        if (plannedDaysCount) plannedDaysCount.textContent = plannedDays;
        if (totalMealsCount) totalMealsCount.textContent = totalMeals;
    }

    // Method for compatibility with catalog modules
    showAddDishModal(mealType = 'breakfast', existingItem = null) {
        // Navigate to Dashboard to use the Add Dish modal since Home doesn't have one
        if (window.navigation && window.navigation.navigateToModule) {
            window.navigation.navigateToModule('dashboard');
            
            setTimeout(() => {
                if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                    window.dashboard.showAddDishModal(mealType, existingItem);
                } else {
                    console.warn('Dashboard not ready, trying again...');
                    setTimeout(() => {
                        if (window.dashboard && typeof window.dashboard.showAddDishModal === 'function') {
                            window.dashboard.showAddDishModal(mealType, existingItem);
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

    // Utility methods
    formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatDayOfWeek(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    getItemEmoji(item, category) {
        const name = item.name.toLowerCase();
        
        // Category-specific emojis
        if (category === 'breakfast') {
            if (name.includes('idli') || name.includes('dosa')) return '🥞';
            if (name.includes('coffee') || name.includes('tea')) return '☕';
            if (name.includes('juice')) return '🥤';
            return '🌅';
        }
        
        if (category === 'mains') {
            if (name.includes('rice') || name.includes('biryani')) return '🍚';
            if (name.includes('curry')) return '🍛';
            if (name.includes('dal')) return '🥘';
            return '🍽️';
        }
        
        if (category === 'sides') {
            if (name.includes('fry') || name.includes('sabji')) return '🥗';
            if (name.includes('sambar')) return '🍲';
            return '🥄';
        }
        
        if (category === 'accompaniments') {
            if (name.includes('roti') || name.includes('naan')) return '🫓';
            if (name.includes('pickle')) return '🥒';
            if (name.includes('papad')) return '🥙';
            return '🍞';
        }
        
        return '🍽️';
    }

    // Data persistence
    loadMenuPlans() {
        try {
            const stored = localStorage.getItem('home_menu_plans');
            if (stored) {
                this.menuPlans = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Error loading menu plans from localStorage:', error);
            this.menuPlans = {};
        }
    }

    saveMenuPlans() {
        try {
            localStorage.setItem('home_menu_plans', JSON.stringify(this.menuPlans));
        } catch (error) {
            console.error('Error saving menu plans to localStorage:', error);
        }
    }

    // Alert system
    showAlert(message, type = 'info') {
        // Clear any existing alerts of the same type
        const existingAlerts = document.querySelectorAll(`.alert.alert-${type}`);
        existingAlerts.forEach(alert => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        });
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '10000';
        alert.style.minWidth = '280px';
        alert.style.maxWidth = '400px';
        alert.style.padding = '12px 16px';
        alert.style.borderRadius = '12px';
        alert.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        alert.style.fontWeight = '500';
        alert.style.fontSize = '0.9rem';
        alert.style.backdropFilter = 'blur(10px)';
        
        // Set colors based on type
        switch(type) {
            case 'success':
                alert.style.background = 'rgba(81, 207, 102, 0.9)';
                alert.style.color = 'white';
                alert.style.border = '1px solid rgba(81, 207, 102, 0.3)';
                break;
            case 'error':
                alert.style.background = 'rgba(255, 107, 107, 0.9)';
                alert.style.color = 'white';
                alert.style.border = '1px solid rgba(255, 107, 107, 0.3)';
                break;
            case 'warning':
                alert.style.background = 'rgba(255, 212, 59, 0.9)';
                alert.style.color = '#333';
                alert.style.border = '1px solid rgba(255, 212, 59, 0.3)';
                break;
            default:
                alert.style.background = 'rgba(102, 126, 234, 0.9)';
                alert.style.color = 'white';
                alert.style.border = '1px solid rgba(102, 126, 234, 0.3)';
        }
        
        document.body.appendChild(alert);
        
        // Animate in
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            alert.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            alert.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after 2.5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 300);
            }
        }, 2500);
        
        // Click to dismiss
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 300);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.home-module')) {
        window.home = new Home();
        window.home.init();
    }
});
