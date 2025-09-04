// Home Module - Mobile-First Card-Based Meal Planning with Historical Analytics
class Home {
    constructor() {
        this.menuPlans = {};
        this.mealHistory = {}; // Historical data for analytics
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
        this.loadMealHistory();
    }

    async init() {
        console.log('Initializing Home module...');
        
        try {
            await this.loadAvailableMeals();
            this.setupEventListeners();
            this.renderMealPlanCards();
            this.updateStatistics();
            
            // Set default date to tomorrow
            this.setDefaultDate();
            
            // Ensure global access
            window.home = this;
            console.log('Home module initialized successfully. Methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
        } catch (error) {
            console.error('Error during Home module initialization:', error);
            throw error;
        }
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
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        const selectedDate = document.getElementById('selectedDate');
        if (!selectedDate) {
            console.warn('Date input element not found');
            return;
        }
        
        // Set minimum date to today
        selectedDate.min = todayString;
        
        // Find the next available date (earliest day without a meal plan)
        let nextAvailableDate = new Date();
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 1); // Start from tomorrow
        
        // Look for the first date without a meal plan (check up to 30 days ahead)
        let daysChecked = 0;
        const maxDaysToCheck = 30;
        
        while (daysChecked < maxDaysToCheck) {
            const dateString = nextAvailableDate.toISOString().split('T')[0];
            
            // Check if this date already has a meal plan
            if (!this.menuPlans[dateString]) {
                // Found an available date
                selectedDate.value = dateString;
                this.currentDate = dateString;
                console.log('Smart default date set to next available day:', dateString);
                return;
            }
            
            // Move to next day
            nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
            daysChecked++;
        }
        
        // If all dates in the next 30 days have meal plans, just use tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        selectedDate.value = tomorrowString;
        this.currentDate = tomorrowString;
        console.log('All upcoming dates have meal plans, defaulting to tomorrow:', tomorrowString);
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
            const sidesResponse = await fetch('/data/side-dishes-catalog.json');
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
        if (category === 'breakfast' && jsonData.breakfast && jsonData.breakfast.items) {
            return jsonData.breakfast.items;
        } else if (category === 'mains' && jsonData.mains && jsonData.mains.items) {
            return jsonData.mains.items;
        } else if (category === 'sides' && jsonData.sideDishes && jsonData.sideDishes.items) {
            return jsonData.sideDishes.items;
        } else if (category === 'accompaniments' && jsonData.accompaniments && jsonData.accompaniments.items) {
            return jsonData.accompaniments.items;
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
        
        // Set default date to tomorrow every time modal opens
        this.setDefaultDate();
        
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
        // Get the selected date from the input field
        const selectedDateInput = document.getElementById('selectedDate');
        const selectedDate = selectedDateInput ? selectedDateInput.value : null;
        
        if (!selectedDate) {
            this.showAlert('Please select a date for the meal plan.', 'warning');
            // Focus on the date input to help user
            if (selectedDateInput) {
                selectedDateInput.focus();
            }
            return;
        }
        
        // Validate that the date is not in the past (except today)
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate < today) {
            this.showAlert('Please select today or a future date for your meal plan.', 'warning');
            if (selectedDateInput) {
                selectedDateInput.focus();
            }
            return;
        }
        
        // Update current date
        this.currentDate = selectedDate;
        
        // Check if at least one item is selected
        const totalItems = Object.values(this.selectedItems).reduce((sum, items) => sum + items.length, 0);
        if (totalItems === 0) {
            this.showAlert('Please select at least one meal item.', 'warning');
            return;
        }
        
        // Save the meal plan
        this.menuPlans[this.currentDate] = {...this.selectedItems};
        this.saveMenuPlans();
        
        // Add to history when the date passes
        this.updateMealHistory(this.currentDate, this.selectedItems);
        
        // Refresh the display
        this.renderMealPlanCards();
        this.updateStatistics();
        
        // Close modal
        this.closeMealSuggestionModal();
        
        // Show success message with the selected date
        this.showAlert(`Menu plan saved for ${this.formatDateForDisplay(this.currentDate)}! 🎉`, 'success');
    }

    renderMealPlanCards() {
        const container = document.getElementById('mealPlanCards');
        if (!container) return;

        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Filter out past dates and sort remaining dates
        const sortedDates = Object.keys(this.menuPlans)
            .filter(date => date >= todayString)
            .sort();
        
        // Move past dates to history
        Object.keys(this.menuPlans).forEach(date => {
            if (date < todayString) {
                this.updateMealHistory(date, this.menuPlans[date]);
                delete this.menuPlans[date];
            }
        });
        
        // Save updated menu plans
        this.saveMenuPlans();
        
        if (sortedDates.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = sortedDates.map(date => {
            const dayMenu = this.menuPlans[date];
            const nutrition = this.calculateDayNutrition(dayMenu);
            const totalItems = this.countDayItems(dayMenu);
            
            return `
                <div class="meal-plan-card compact">
                    <div class="meal-card-header">
                        <div class="date-section">
                            <div class="meal-card-date">${this.formatDateForDisplay(date)}</div>
                            <div class="meal-card-day">${this.formatDayOfWeek(date)}</div>
                        </div>
                        <div class="nutrition-summary">
                            <div class="nutrition-highlight">
                                <span class="nutrition-value">${nutrition.calories}</span>
                                <span class="nutrition-label">cal</span>
                            </div>
                            <div class="nutrition-secondary">
                                ${nutrition.protein}g protein • ${totalItems} items
                            </div>
                        </div>
                    </div>
                    
                    <div class="meal-summary-section">
                        ${this.renderCompactCategorySummary(dayMenu)}
                    </div>
                    
                    <div class="meal-card-actions compact">
                        <button class="meal-card-btn edit" onclick="window.home?.editMealPlan?.('${date}') || console.error('Home module not loaded')" title="Edit meal plan">
                            ✏️
                        </button>
                        <button class="meal-card-btn delete" onclick="window.home?.deleteMealPlan?.('${date}') || console.error('Home module not loaded')" title="Delete meal plan">
                            🗑️
                        </button>
                        <button class="meal-card-btn expand" onclick="window.home?.showMealPlanDetails?.('${date}') || console.error('Home module not loaded')" title="View details">
                            �️
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

    renderCompactCategorySummary(dayMenu) {
        const categories = [
            { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
            { key: 'mains', icon: '🍛', label: 'Mains' },
            { key: 'sides', icon: '🥗', label: 'Sides' },
            { key: 'accompaniments', icon: '🫓', label: 'Accompaniments' }
        ];

        return categories
            .filter(cat => dayMenu[cat.key] && dayMenu[cat.key].length > 0)
            .map(cat => {
                const items = dayMenu[cat.key];
                const itemNames = items.slice(0, 2).map(item => item.name).join(', ');
                const moreCount = items.length > 2 ? ` +${items.length - 2} more` : '';
                
                return `
                    <div class="compact-category">
                        <span class="compact-icon">${cat.icon}</span>
                        <div class="compact-content">
                            <div class="compact-label">${cat.label} (${items.length})</div>
                            <div class="compact-items">${itemNames}${moreCount}</div>
                        </div>
                    </div>
                `;
            }).join('') || `
                <div class="compact-category empty">
                    <span class="compact-icon">🍽️</span>
                    <div class="compact-content">
                        <div class="compact-label">No meals planned</div>
                    </div>
                </div>
            `;
    }

    showMealPlanDetails(date) {
        const dayMenu = this.menuPlans[date];
        if (!dayMenu) return;

        // Create a detailed view modal
        const modal = document.createElement('div');
        modal.className = 'meal-details-modal';
        modal.innerHTML = `
            <div class="modal-content meal-details-content">
                <div class="modal-header">
                    <h2>Meal Plan Details</h2>
                    <h3>${this.formatDateForDisplay(date)} - ${this.formatDayOfWeek(date)}</h3>
                    <button class="close-btn" onclick="this.closest('.meal-details-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="detailed-nutrition-summary">
                        ${(() => {
                            const nutrition = this.calculateDayNutrition(dayMenu);
                            return `
                                <div class="nutrition-grid">
                                    <div class="nutrition-card">
                                        <div class="nutrition-number">${nutrition.calories}</div>
                                        <div class="nutrition-text">Calories</div>
                                    </div>
                                    <div class="nutrition-card">
                                        <div class="nutrition-number">${nutrition.protein}g</div>
                                        <div class="nutrition-text">Protein</div>
                                    </div>
                                    <div class="nutrition-card">
                                        <div class="nutrition-number">${nutrition.carbs}g</div>
                                        <div class="nutrition-text">Carbs</div>
                                    </div>
                                    <div class="nutrition-card">
                                        <div class="nutrition-number">${nutrition.fat}g</div>
                                        <div class="nutrition-text">Fat</div>
                                    </div>
                                </div>
                            `;
                        })()}
                    </div>
                    <div class="detailed-meals-section">
                        ${this.renderDetailedCategorySummary('breakfast', dayMenu.breakfast, '🌅', 'Breakfast')}
                        ${this.renderDetailedCategorySummary('mains', dayMenu.mains, '🍛', 'Main Dishes')}
                        ${this.renderDetailedCategorySummary('sides', dayMenu.sides, '🥗', 'Side Dishes')}
                        ${this.renderDetailedCategorySummary('accompaniments', dayMenu.accompaniments, '🫓', 'Accompaniments')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    renderDetailedCategorySummary(category, items, icon, label) {
        if (!items || items.length === 0) {
            return `
                <div class="meal-category-detail">
                    <div class="category-header-detail">
                        <span class="category-icon-detail">${icon}</span>
                        <span class="category-title-detail">${label}</span>
                        <span class="category-count-badge">0</span>
                    </div>
                    <div class="category-items-detail empty">
                        <p class="no-items-text">No ${label.toLowerCase()} planned</p>
                    </div>
                </div>
            `;
        }

        const totalNutrition = items.reduce((sum, item) => {
            if (item.nutrition) {
                sum.calories += parseInt(item.nutrition.calories) || 0;
                sum.protein += parseFloat(item.nutrition.protein) || 0;
            }
            return sum;
        }, { calories: 0, protein: 0 });

        return `
            <div class="meal-category-detail">
                <div class="category-header-detail">
                    <span class="category-icon-detail">${icon}</span>
                    <span class="category-title-detail">${label}</span>
                    <span class="category-count-badge">${items.length}</span>
                </div>
                <div class="category-items-detail">
                    ${items.map(item => `
                        <div class="meal-item-detail">
                            <div class="item-name-detail">${item.name}</div>
                            ${item.nutrition ? `
                                <div class="item-nutrition-detail">
                                    <span class="nutrition-badge">${item.nutrition.calories || 0} cal</span>
                                    <span class="nutrition-badge">${item.nutrition.protein || 0}g protein</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                    ${items.length > 0 && totalNutrition.calories > 0 ? `
                        <div class="category-nutrition-total">
                            <strong>Total: ${totalNutrition.calories} cal, ${totalNutrition.protein.toFixed(1)}g protein</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    calculateDayNutrition(dayMenu) {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        Object.values(dayMenu).forEach(categoryItems => {
            if (Array.isArray(categoryItems)) {
                categoryItems.forEach(item => {
                    if (item.nutrition) {
                        totalCalories += parseInt(item.nutrition.calories) || 0;
                        totalProtein += parseFloat(item.nutrition.protein) || 0;
                        totalCarbs += parseFloat(item.nutrition.carbs) || 0;
                        totalFat += parseFloat(item.nutrition.fat) || 0;
                    }
                });
            }
        });
        
        return {
            calories: totalCalories,
            protein: Math.round(totalProtein * 10) / 10,
            carbs: Math.round(totalCarbs * 10) / 10,
            fat: Math.round(totalFat * 10) / 10
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

    // Historical Data Methods
    updateMealHistory(date, mealPlan) {
        if (!this.mealHistory[date]) {
            this.mealHistory[date] = {
                ...mealPlan,
                createdAt: new Date().toISOString(),
                nutrition: this.calculateDayNutrition(mealPlan)
            };
            
            // Clean up history older than 3 months
            this.cleanOldHistory();
            this.saveMealHistory();
        }
    }
    
    cleanOldHistory() {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        Object.keys(this.mealHistory).forEach(date => {
            if (date < cutoffDate) {
                delete this.mealHistory[date];
            }
        });
    }
    
    // Analytics Methods for Dashboard
    getMealAnalytics() {
        const historyDates = Object.keys(this.mealHistory).sort();
        if (historyDates.length === 0) {
            return {
                favBreakfast: { name: 'No data', count: 0 },
                favMains: { name: 'No data', count: 0 },
                favSides: { name: 'No data', count: 0 },
                favAccompaniments: { name: 'No data', count: 0 },
                avgNutritionWeekly: [],
                avgDaily: {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                },
                totalMealsTracked: 0,
                daysTracked: 0
            };
        }
        
        // Count frequency of each meal
        const mealCounts = {
            breakfast: {},
            mains: {},
            sides: {},
            accompaniments: {}
        };
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalDays = historyDates.length;
        
        historyDates.forEach(date => {
            const dayData = this.mealHistory[date];
            
            // Count meal frequencies
            Object.keys(mealCounts).forEach(category => {
                if (dayData[category]) {
                    dayData[category].forEach(item => {
                        const key = item.name;
                        mealCounts[category][key] = (mealCounts[category][key] || 0) + 1;
                    });
                }
            });
            
            // Aggregate nutrition
            if (dayData.nutrition) {
                totalCalories += dayData.nutrition.calories || 0;
                totalProtein += dayData.nutrition.protein || 0;
                totalCarbs += dayData.nutrition.carbs || 0;
                totalFat += dayData.nutrition.fat || 0;
            }
        });
        
        // Find favorites
        const getFavorite = (category) => {
            const items = mealCounts[category];
            if (Object.keys(items).length === 0) return { name: 'No data', count: 0 };
            
            const sortedItems = Object.entries(items).sort((a, b) => b[1] - a[1]);
            return { name: sortedItems[0][0], count: sortedItems[0][1] };
        };
        
        // Calculate weekly averages for last 12 weeks
        const weeklyNutrition = this.calculateWeeklyNutrition(historyDates);
        
        return {
            favBreakfast: getFavorite('breakfast'),
            favMains: getFavorite('mains'),
            favSides: getFavorite('sides'),
            favAccompaniments: getFavorite('accompaniments'),
            avgNutritionWeekly: weeklyNutrition,
            avgDaily: {
                calories: Math.round(totalCalories / totalDays),
                protein: Math.round((totalProtein / totalDays) * 10) / 10,
                carbs: Math.round((totalCarbs / totalDays) * 10) / 10,
                fat: Math.round((totalFat / totalDays) * 10) / 10
            },
            totalMealsTracked: Object.values(mealCounts).reduce((total, category) => {
                return total + Object.values(category).reduce((sum, count) => sum + count, 0);
            }, 0),
            daysTracked: totalDays
        };
    }
    
    calculateWeeklyNutrition(historyDates) {
        const weeks = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekStartStr = weekStart.toISOString().split('T')[0];
            const weekEndStr = weekEnd.toISOString().split('T')[0];
            
            const weekData = historyDates
                .filter(date => date >= weekStartStr && date <= weekEndStr)
                .map(date => this.mealHistory[date].nutrition);
            
            if (weekData.length > 0) {
                const avgCalories = Math.round(weekData.reduce((sum, day) => sum + (day.calories || 0), 0) / weekData.length);
                const avgProtein = Math.round((weekData.reduce((sum, day) => sum + (day.protein || 0), 0) / weekData.length) * 10) / 10;
                
                weeks.push({
                    week: `Week ${12 - i}`,
                    startDate: weekStartStr,
                    avgCalories,
                    avgProtein,
                    daysTracked: weekData.length
                });
            } else {
                weeks.push({
                    week: `Week ${12 - i}`,
                    startDate: weekStartStr,
                    avgCalories: 0,
                    avgProtein: 0,
                    daysTracked: 0
                });
            }
        }
        
        return weeks;
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
    
    loadMealHistory() {
        try {
            const stored = localStorage.getItem('home_meal_history');
            if (stored) {
                this.mealHistory = JSON.parse(stored);
                // Clean old data on load
                this.cleanOldHistory();
            }
        } catch (error) {
            console.warn('Error loading meal history from localStorage:', error);
            this.mealHistory = {};
        }
    }

    saveMealHistory() {
        try {
            localStorage.setItem('home_meal_history', JSON.stringify(this.mealHistory));
        } catch (error) {
            console.error('Error saving meal history to localStorage:', error);
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
        console.log('Home module DOM found, initializing...');
        window.home = new Home();
        window.home.init().then(() => {
            console.log('Home module fully initialized and ready');
        }).catch(error => {
            console.error('Error initializing Home module:', error);
        });
    } else {
        console.warn('Home module DOM not found');
    }
});
