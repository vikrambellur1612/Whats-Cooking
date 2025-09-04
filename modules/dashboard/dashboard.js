// Dashboard Module - Landing Page with Statistics
class Dashboard {
    constructor() {
        this.allFoodItems = [];
        this.breakfastItems = [];
        this.mainsItems = [];
        this.sideDishesItems = [];
        this.accompanimentsItems = [];
    }

    async init() {
        console.log('Initializing Dashboard...');
        await this.loadData();
        this.setupEventListeners();
        this.updateStatistics();
        
        // Refresh analytics in case Home module data is available (with longer delay)
        setTimeout(() => {
            this.updateMealHistoryAnalytics();
        }, 1000);
        
        // Ensure global access
        window.dashboard = this;
        console.log('Dashboard initialized. Global instance:', window.dashboard);
    }

    async loadData() {
        try {
            // Load breakfast data
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastJson = await breakfastResponse.json();
            
            // Load mains data
            const mainsResponse = await fetch('/data/mains-catalog.json');
            const mainsJson = await mainsResponse.json();
            
            // Load side dishes data
            const sideDishesResponse = await fetch('/data/side-dishes-catalog.json');
            const sideDishesJson = await sideDishesResponse.json();
            
            // Load accompaniments data
            const accompanimentsResponse = await fetch('/data/accompaniments-catalog.json');
            const accompanimentsJson = await accompanimentsResponse.json();
            
            // Extract items from nested structure and merge with localStorage
            this.breakfastItems = await this.mergeWithLocalStorage(this.extractItems(breakfastJson), 'breakfast-catalog');
            this.mainsItems = await this.mergeWithLocalStorage(this.extractItems(mainsJson, 'mains'), 'mains-catalog');
            this.sideDishesItems = await this.mergeWithLocalStorage(this.extractItems(sideDishesJson, 'sideDishes'), 'side-dishes-catalog');
            this.accompanimentsItems = await this.mergeWithLocalStorage(this.extractItems(accompanimentsJson, 'accompaniments'), 'accompaniments-catalog');
            
            // Combine all items for total calculations
            this.allFoodItems = [...this.breakfastItems, ...this.mainsItems, ...this.sideDishesItems, ...this.accompanimentsItems];
            
            console.log(`Loaded ${this.breakfastItems.length} breakfast, ${this.mainsItems.length} mains, ${this.sideDishesItems.length} side dishes, ${this.accompanimentsItems.length} accompaniments`);
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showAlert('Failed to load food data. Please refresh the page.', 'error');
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

    extractItems(jsonData, category) {
        if (jsonData.breakfast && jsonData.breakfast.items) {
            return jsonData.breakfast.items;
        } else if (jsonData.mains && jsonData.mains.items) {
            return jsonData.mains.items;
        } else if (jsonData.sideDishes && jsonData.sideDishes.items) {
            return jsonData.sideDishes.items;
        } else if (jsonData.accompaniments && jsonData.accompaniments.items) {
            return jsonData.accompaniments.items;
        } else if (jsonData.meal && jsonData.meal.items) {
            return jsonData.meal.items;
        } else if (Array.isArray(jsonData)) {
            return jsonData;
        } else {
            console.warn('Unexpected JSON structure:', jsonData);
            return [];
        }
    }

    setupEventListeners() {
        // Global search functionality
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performGlobalSearch(e.target.value);
            });
        }

        // Add New Dish modal
        const addNewDishBtn = document.getElementById('addNewDishBtn');
        if (addNewDishBtn) {
            addNewDishBtn.addEventListener('click', () => {
                this.showAddDishModal();
            });
        }

        // Add Dish Form
        const addDishForm = document.getElementById('addDishForm');
        if (addDishForm) {
            addDishForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddDishSubmit();
            });

            // Add visual feedback for dish type selection
            addDishForm.addEventListener('change', (e) => {
                if (e.target.name === 'dishType') {
                    // Remove selected class from all cards
                    document.querySelectorAll('.dish-type-card').forEach(card => {
                        card.classList.remove('selected');
                    });
                    // Add selected class to the parent card
                    const selectedCard = e.target.closest('.dish-type-card');
                    if (selectedCard) {
                        selectedCard.classList.add('selected');
                    }
                }
            });
        }

        // Auto-fetch nutrition button
        const fetchNutritionBtn = document.getElementById('fetchNutritionBtn');
        if (fetchNutritionBtn) {
            fetchNutritionBtn.addEventListener('click', () => {
                this.fetchNutritionInfo();
            });
        }

        // Breakfast card click
        const breakfastCard = document.getElementById('breakfastCard');
        if (breakfastCard) {
            breakfastCard.addEventListener('click', () => {
                this.navigateToModule('breakfast-catalog');
            });
        }

        // Mains card click
        const mainsCard = document.getElementById('mainsCard');
        if (mainsCard) {
            mainsCard.addEventListener('click', () => {
                this.navigateToModule('mains-catalog');
            });
        }

        // Side dishes card click
        const sideDishesCard = document.getElementById('sideDishesCard');
        if (sideDishesCard) {
            sideDishesCard.addEventListener('click', () => {
                this.navigateToModule('side-dishes-catalog');
            });
        }

        // Accompaniments card click
        const accompanimentsCard = document.getElementById('accompanimentsCard');
        if (accompanimentsCard) {
            accompanimentsCard.addEventListener('click', () => {
                this.navigateToModule('accompaniments-catalog');
            });
        }


    }

    navigateToModule(moduleId) {
        if (window.navigation) {
            window.navigation.navigateToModule(moduleId);
        }
    }

    updateStatistics() {
        // Update main counts
        const breakfastCount = document.getElementById('breakfastCount');
        const mainsCount = document.getElementById('mainsCount');
        const sideDishesCount = document.getElementById('sideDishesCount');
        const accompanimentsCount = document.getElementById('accompanimentsCount');
        const totalCount = document.getElementById('totalCount');
        
        if (breakfastCount) breakfastCount.textContent = this.breakfastItems.length;
        if (mainsCount) mainsCount.textContent = this.mainsItems.length;
        if (sideDishesCount) sideDishesCount.textContent = this.sideDishesItems.length;
        if (accompanimentsCount) accompanimentsCount.textContent = this.accompanimentsItems.length;
        if (totalCount) totalCount.textContent = this.allFoodItems.length;

        // Update analytics
        this.updateAnalytics();
    }

    updateAnalytics() {
        const vegCount = document.getElementById('vegCount');
        const avgCalories = document.getElementById('avgCalories');

        // Count vegetarian options
        const vegetarianCount = this.allFoodItems.filter(item => 
            item.type === 'vegetarian' || item.type === 'mains' || item.type === 'side-dish-gravy' || item.type === 'side-dish-sabji'
        ).length;

        if (vegCount) vegCount.textContent = vegetarianCount;

        // Calculate average calories
        const totalCalories = this.allFoodItems.reduce((sum, item) => {
            return sum + (item.nutrition?.calories || 0);
        }, 0);
        
        const avgCal = this.allFoodItems.length > 0 ? Math.round(totalCalories / this.allFoodItems.length) : 0;
        if (avgCalories) avgCalories.textContent = avgCal;
        
        // Update meal history analytics
        this.updateMealHistoryAnalytics();
    }
    
    updateMealHistoryAnalytics() {
        try {
            // Get analytics from Home module if available
            const analytics = window.home && typeof window.home.getMealAnalytics === 'function' 
                ? window.home.getMealAnalytics() 
                : null;
            
            if (analytics && analytics.favBreakfast && analytics.avgDaily) {
                // Update favorite dishes
                const favBreakfastEl = document.getElementById('favBreakfast');
                const favMainsEl = document.getElementById('favMains');
                const favSidesEl = document.getElementById('favSides');
                const favAccompanimentsEl = document.getElementById('favAccompaniments');
                
                if (favBreakfastEl) favBreakfastEl.textContent = analytics.favBreakfast?.name || 'No data';
                if (favMainsEl) favMainsEl.textContent = analytics.favMains?.name || 'No data';
                if (favSidesEl) favSidesEl.textContent = analytics.favSides?.name || 'No data';
                if (favAccompanimentsEl) favAccompanimentsEl.textContent = analytics.favAccompaniments?.name || 'No data';
                
                // Update daily averages
                const avgDailyCaloriesEl = document.getElementById('avgDailyCalories');
                const avgDailyProteinEl = document.getElementById('avgDailyProtein');
                const totalMealsTrackedEl = document.getElementById('totalMealsTracked');
                const daysTrackedEl = document.getElementById('daysTracked');
                
                if (avgDailyCaloriesEl) avgDailyCaloriesEl.textContent = analytics.avgDaily?.calories || 0;
                if (avgDailyProteinEl) avgDailyProteinEl.textContent = (analytics.avgDaily?.protein || 0) + 'g';
                if (totalMealsTrackedEl) totalMealsTrackedEl.textContent = analytics.totalMealsTracked || 0;
                if (daysTrackedEl) daysTrackedEl.textContent = analytics.daysTracked || 0;
                
                // Update weekly nutrition chart
                if (analytics.avgNutritionWeekly) {
                    this.updateWeeklyNutritionChart(analytics.avgNutritionWeekly);
                }
            } else {
                this.showNoAnalyticsData();
            }
        } catch (error) {
            console.warn('Error updating meal history analytics:', error);
            this.showNoAnalyticsData();
        }
    }
    
    showNoAnalyticsData() {
        // Show no data message for analytics
        const analyticsElements = [
            'favBreakfast', 'favMains', 'favSides', 'favAccompaniments',
            'avgDailyCalories', 'avgDailyProtein', 'totalMealsTracked', 'daysTracked'
        ];
        
        analyticsElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'No data';
        });
        
        // Clear the chart
        const chartContainer = document.getElementById('weeklyNutritionChart');
        if (chartContainer) {
            chartContainer.innerHTML = '<p>No nutrition data available yet. Start planning meals in the Home section!</p>';
        }
    }
    
    updateWeeklyNutritionChart(weeklyData) {
        const chartContainer = document.getElementById('weeklyNutritionChart');
        if (!chartContainer || !weeklyData) return;
        
        // Simple text-based chart (can be enhanced with chart libraries later)
        const maxCalories = Math.max(...weeklyData.map(w => w.avgCalories), 1);
        const maxProtein = Math.max(...weeklyData.map(w => w.avgProtein), 1);
        
        const chartHTML = weeklyData.slice(-8).map(week => `
            <div class="chart-bar">
                <div class="week-label">${week.week.replace('Week ', 'W')}</div>
                <div class="bar-container">
                    <div class="calories-bar" style="height: ${(week.avgCalories / maxCalories) * 100}%" title="${week.avgCalories} cal avg"></div>
                    <div class="protein-bar" style="height: ${(week.avgProtein / maxProtein) * 100}%" title="${week.avgProtein}g protein avg"></div>
                </div>
                <div class="bar-values">
                    <span class="calories-value">${week.avgCalories}</span>
                    <span class="protein-value">${week.avgProtein}g</span>
                </div>
            </div>
        `).join('');
        
        chartContainer.innerHTML = chartHTML || '<p>No nutrition data available</p>';
    }

    getDishEmoji(item) {
        const name = item.name.toLowerCase();
        const type = item.type;
        const category = item.category;
        
        // Breakfast items
        if (name.includes('dosa')) return '🥞';
        if (name.includes('idli')) return '🍘';
        if (name.includes('upma')) return '🍚';
        if (name.includes('poha')) return '🍛';
        if (name.includes('paratha')) return '🫓';
        
        // Main dishes with subcategorization
        if (type === 'mains-rice' || name.includes('rice') || name.includes('bath') || name.includes('biryani') || name.includes('pulao')) return '🍚';
        if (type === 'mains-wheat' || name.includes('roti') || name.includes('chapati') || name.includes('naan') || name.includes('bread')) return '🫓';
        if (name.includes('biryani')) return '�';
        
        // Side dishes
        if (name.includes('sambar')) return '🍲';
        if (name.includes('rasam')) return '🍵';
        if (name.includes('dal')) return '🥣';
        if (name.includes('curry')) return '🍛';
        if (name.includes('sabji') || name.includes('palya')) return '🥗';
        if (name.includes('gojju')) return '🥫';
        
        // Accompaniments
        if (name.includes('chutney')) return '🥄';
        if (name.includes('pickle') || name.includes('achar')) return '🥒';
        if (name.includes('raita')) return '🥛';
        if (name.includes('papad')) return '🥐';
        if (name.includes('kosambari')) return '🥗';
        if (name.includes('salad')) return '🥗';
        if (name.includes('sweet') || name.includes('payasa') || name.includes('halwa')) return '🍮';
        
        // Category-based fallbacks
        if (category === 'breakfast') return '🌅';
        if (category === 'mains' || type === 'mains' || type === 'mains-rice' || type === 'mains-wheat') return '🍽️';
        if (category === 'side-dishes') {
            if (type === 'side-dish-gravy') return '🍲';
            if (type === 'side-dish-sabji') return '🥗';
            return '🥘';
        }
        if (category === 'accompaniments') {
            if (type === 'salad') return '🥗';
            if (type === 'chutney') return '🥄';
            if (type === 'sweet') return '🍮';
            return '🥗';
        }
        
        return '🍽️'; // default
    }

    formatType(type) {
        const typeMap = {
            'mains': 'Main Dish',
            'main-dish': 'Main Dish', 
            'mains-rice': 'Mains - Rice Based',
            'mains-wheat': 'Mains - Wheat/Cereal Based',
            'side-dish-gravy': 'Side Dish - Gravy',
            'side-dish-sabji': 'Side Dish - Sabji',
            'vegetarian': 'Vegetarian',
            'non-vegetarian': 'Non-Vegetarian',
            'salad': 'Salad',
            'chutney': 'Chutney',
            'pickle': 'Pickle',
            'raita': 'Raita',
            'sweet': 'Sweet',
            'papad': 'Papad'
        };
        
        return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }



    showAlert(message, type = 'info') {
        // Clear any existing alerts of the same type to prevent stacking
        const existingAlerts = document.querySelectorAll(`.alert.alert-${type}`);
        existingAlerts.forEach(alert => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        });
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = message.replace(/\n/g, '<br>'); // Convert newlines to <br>
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '280px';
        alert.style.maxWidth = '400px';
        alert.style.padding = '12px 16px';
        alert.style.borderRadius = '6px';
        alert.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.12)';
        alert.style.fontWeight = '500';
        alert.style.fontSize = '0.9em';
        alert.style.lineHeight = '1.4';
        alert.style.whiteSpace = 'pre-line'; // Preserve line breaks
        alert.style.transition = 'all 0.3s ease';
        alert.style.transform = 'translateX(100%)';
        alert.style.opacity = '0';
        alert.style.cursor = 'pointer';
        
        // Set colors based on type
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
        
        // Add smooth fade-in animation
        requestAnimationFrame(() => {
            alert.style.transform = 'translateX(0)';
            alert.style.opacity = '1';
        });
        
        // Auto remove after shorter time for better UX
        const autoRemoveTime = type === 'success' ? 2500 : (message.length > 100 ? 4000 : 3000);
        setTimeout(() => {
            if (alert.parentNode) {
                // Smooth fade-out animation
                alert.style.transform = 'translateX(100%)';
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 300);
            }
        }, autoRemoveTime);
        
        // Add click to dismiss with smooth animation
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.style.transform = 'translateX(100%)';
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 300);
            }
        });
        
        // Add close button for longer messages
        if (message.length > 100) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '5px';
            closeBtn.style.right = '10px';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.color = 'inherit';
            closeBtn.onclick = () => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            };
            alert.appendChild(closeBtn);
        }
    }

    // Global search functionality
    performGlobalSearch(query) {
        if (!query || query.length < 2) {
            this.hideSearchResults();
            return;
        }

        const searchQuery = query.toLowerCase();
        const results = this.allFoodItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery)
        );

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>No dishes found for "${query}"</p>
                    <small>Try searching with different keywords</small>
                </div>
            `;
        } else {
            const resultsHTML = results.map(item => `
                <div class="search-result-item">
                    <div class="search-result-emoji">${this.getDishEmoji(item)}</div>
                    <div class="search-result-content">
                        <h5 class="search-result-name">${item.name}</h5>
                        <p class="search-result-description">${item.description}</p>
                        <div class="search-result-badges">
                            <span class="badge badge-${item.type}">${this.formatType(item.type)}</span>
                            ${item.nutrition?.calories ? `<span class="badge badge-nutrition">${item.nutrition.calories} cal</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = resultsHTML;
        }
        
        resultsContainer.style.display = 'block';
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    // Add New Dish Modal functionality - now supports editing existing dishes
    showAddDishModal(preselectedType = null, existingDish = null) {
        const modal = document.getElementById('addDishModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = modal?.querySelector('button[type="submit"]');
        
        if (modal) {
            modal.classList.add('active');
            
            // Scroll to top for better mobile experience - ensures modal is visible
            // Small delay to let modal opening animation start first
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
            
            // Update modal title and submit button based on whether we're adding or editing
            if (modalTitle) {
                modalTitle.textContent = existingDish ? '✏️ Edit Dish' : '✨ Add New Dish';
            }
            
            if (submitBtn) {
                submitBtn.textContent = existingDish ? '✨ Update Dish' : '✨ Add Dish to Collection';
            }
            
            this.resetAddDishForm(!!existingDish);
            
            // Pre-populate form if editing existing dish (do this after reset to preserve editing state)
            if (existingDish) {
                this.populateFormWithExistingDish(existingDish);
            }
            
            // Pre-select dish type if provided
            if (preselectedType) {
                const dishTypeRadio = document.querySelector(`input[name="dishType"][value="${preselectedType}"]`);
                if (dishTypeRadio) {
                    dishTypeRadio.checked = true;
                    // Trigger visual feedback
                    dishTypeRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            
            this.showStep(1); // Start with first step
        }
    }

    closeAddDishModal() {
        const modal = document.getElementById('addDishModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    populateFormWithExistingDish(dish) {
        // Populate basic information
        const dishNameInput = document.getElementById('dishName');
        if (dishNameInput) dishNameInput.value = dish.name || '';
        
        const dishDescriptionInput = document.getElementById('dishDescription');
        if (dishDescriptionInput) dishDescriptionInput.value = dish.description || '';
        
        // Select dish type
        if (dish.type) {
            const dishTypeRadio = document.querySelector(`input[name="dishType"][value="${dish.type}"]`);
            if (dishTypeRadio) {
                dishTypeRadio.checked = true;
                // Trigger visual feedback
                dishTypeRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Select cuisine type
        const cuisineSelect = document.getElementById('cuisineType');
        if (cuisineSelect && dish.cuisine) {
            cuisineSelect.value = dish.cuisine;
        }
        
        // Set diet type checkboxes
        if (dish.mealTypes && Array.isArray(dish.mealTypes)) {
            dish.mealTypes.forEach(mealType => {
                const checkbox = document.querySelector(`input[name="mealType"][value="${mealType}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Populate nutrition information if available
        if (dish.nutrition) {
            const caloriesInput = document.getElementById('calories');
            if (caloriesInput) caloriesInput.value = dish.nutrition.calories || '';
            
            const proteinInput = document.getElementById('protein');
            if (proteinInput) proteinInput.value = dish.nutrition.protein || '';
            
            const carbsInput = document.getElementById('carbs');
            if (carbsInput) carbsInput.value = dish.nutrition.carbs || '';
            
            const fatInput = document.getElementById('fat');
            if (fatInput) fatInput.value = dish.nutrition.fat || '';
        }
        
        // Store the existing dish ID for update operations
        this.currentEditingDish = dish;
    }

    resetAddDishForm(preserveEditingState = false) {
        const form = document.getElementById('addDishForm');
        if (form) {
            form.reset();
        }
        // Reset all steps to inactive
        document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
        document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
        
        // Reset visual feedback for dish type cards
        document.querySelectorAll('.dish-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Clear nutrition status
        const nutritionStatus = document.getElementById('nutritionStatus');
        if (nutritionStatus) {
            nutritionStatus.innerHTML = '';
        }
        
        // Clear editing state only if not preserving it
        if (!preserveEditingState) {
            this.currentEditingDish = null;
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById(`step${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Make showStep globally available
        window.showStep = (step) => this.showStep(step);
    }

    async handleAddDishSubmit() {
        const form = document.getElementById('addDishForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Prevent multiple submissions
        if (submitBtn.disabled) {
            return;
        }
        
        const formData = new FormData(form);
        const isEditing = this.currentEditingDish !== null && this.currentEditingDish !== undefined;
        
        // Debug logging to help troubleshoot
        console.log('Form submission:', { 
            isEditing, 
            currentEditingDish: this.currentEditingDish 
        });
        
        // Get form values
        const dishData = {
            name: formData.get('dishName'),
            description: formData.get('dishDescription') || 'A delicious dish', // Default description if empty
            type: formData.get('dishType'),
            cuisine: formData.get('cuisineType'),
            mealTypes: formData.getAll('mealType'),
            nutrition: {
                calories: parseInt(formData.get('calories')) || 0,
                protein: parseFloat(formData.get('protein')) || 0,
                carbs: parseFloat(formData.get('carbs')) || 0,
                fat: parseFloat(formData.get('fat')) || 0
            },
            // Use existing ID for editing, generate new for adding
            id: isEditing ? (this.currentEditingDish?.id || this.currentEditingDish?.name || Date.now().toString()) : Date.now().toString(),
            dateAdded: isEditing ? (this.currentEditingDish?.dateAdded || new Date().toISOString()) : new Date().toISOString(),
            dateModified: isEditing ? new Date().toISOString() : undefined
        };

        // Validate required fields with better error handling
        if (!dishData.name) {
            this.showAlert('Please enter a dish name.', 'warning');
            this.showStep(1); // Go back to step 1
            const dishNameInput = document.getElementById('dishName');
            if (dishNameInput) {
                dishNameInput.focus();
            }
            return;
        }
        
        if (!dishData.type) {
            this.showAlert('Please select a dish type.', 'warning');
            this.showStep(2); // Go back to step 2
            return;
        }
        
        if (!dishData.cuisine) {
            this.showAlert('Please select a cuisine style.', 'warning');
            this.showStep(2); // Go back to step 2
            const cuisineSelect = document.getElementById('cuisineType');
            if (cuisineSelect) {
                cuisineSelect.focus();
            }
            return;
        }

        try {
            // Show loading state
            const originalText = submitBtn.textContent;
            const actionText = isEditing ? 'Updating...' : 'Adding...';
            submitBtn.textContent = `🔄 ${actionText}`;
            submitBtn.disabled = true;

            if (isEditing) {
                // Update existing dish
                await this.updateDishInStorage(dishData);
                this.updateDishInArrays(dishData);
            } else {
                // Add new dish
                await this.saveDishToStorage(dishData);
                this.addDishToArrays(dishData);
            }
            
            // Update statistics
            this.updateStatistics();
            
            // Close modal and show success message
            this.closeAddDishModal();
            const actionWord = isEditing ? 'updated' : 'added';
            this.showAlert(`✅ ${dishData.name} ${actionWord} successfully!`, 'success');
            
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} dish:`, error);
            
            // Show appropriate error message based on the error
            const actionWord = isEditing ? 'updated' : 'added';
            const errorMessage = error.message.includes('Failed to save dish to server') 
                ? `⚠️ ${dishData.name} was ${actionWord} locally but couldn't be saved to the server. ${error.message}`
                : `Failed to ${isEditing ? 'update' : 'add'} dish. Please try again.`;
            
            this.showAlert(errorMessage, error.message.includes('saved locally') ? 'warning' : 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                const defaultText = isEditing ? '✨ Update Dish' : '✨ Add Dish to Collection';
                submitBtn.textContent = defaultText;
                submitBtn.disabled = false;
            }
        }
    }

    // Auto-fetch nutrition information
    async fetchNutritionInfo() {
        const dishNameInput = document.getElementById('dishName');
        const dishName = dishNameInput.value.trim();
        
        if (!dishName) {
            this.showAlert('Please enter a dish name first to fetch nutrition info.', 'warning');
            return;
        }

        const nutritionStatus = document.getElementById('nutritionStatus');
        const fetchBtn = document.getElementById('fetchNutritionBtn');
        
        try {
            // Show loading state
            fetchBtn.disabled = true;
            fetchBtn.textContent = '🔄 Fetching...';
            nutritionStatus.innerHTML = '<small style="color: #007bff;">Fetching nutrition data...</small>';

            // Simulate API call with some mock data based on dish name
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock nutrition data (in a real app, this would be an API call)
            const mockNutrition = this.generateMockNutrition(dishName);
            
            // Fill in the nutrition fields
            document.getElementById('calories').value = mockNutrition.calories;
            document.getElementById('protein').value = mockNutrition.protein;
            document.getElementById('carbs').value = mockNutrition.carbs;
            document.getElementById('fat').value = mockNutrition.fat;
            
            nutritionStatus.innerHTML = '<small style="color: #28a745;">✓ Nutrition data updated successfully!</small>';
            
        } catch (error) {
            console.error('Error fetching nutrition:', error);
            nutritionStatus.innerHTML = '<small style="color: #dc3545;">Failed to fetch nutrition data. Please enter manually.</small>';
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = '🔍 Auto-fetch nutrition data';
            
            // Clear status after 3 seconds
            setTimeout(() => {
                if (nutritionStatus) {
                    nutritionStatus.innerHTML = '';
                }
            }, 3000);
        }
    }

    generateMockNutrition(dishName) {
        const name = dishName.toLowerCase();
        
        // Basic nutrition estimates based on dish name
        let calories = 200, protein = 8, carbs = 30, fat = 6;
        
        if (name.includes('rice') || name.includes('biryani')) {
            calories = 350; protein = 12; carbs = 65; fat = 8;
        } else if (name.includes('dal') || name.includes('sambar')) {
            calories = 150; protein = 12; carbs = 25; fat = 3;
        } else if (name.includes('dosa') || name.includes('idli')) {
            calories = 120; protein = 4; carbs = 22; fat = 2;
        } else if (name.includes('curry') || name.includes('sabji')) {
            calories = 180; protein = 6; carbs = 15; fat = 10;
        } else if (name.includes('sweet') || name.includes('dessert')) {
            calories = 280; protein = 4; carbs = 45; fat = 12;
        }
        
        return { calories, protein, carbs, fat };
    }

    async saveDishToStorage(dishData) {
        // Determine which storage category to use
        let storageKey, fileName, sourceDataStructure;
        if (dishData.type === 'breakfast') {
            storageKey = 'breakfast-catalog';
            fileName = 'breakfast-catalog.json';
            sourceDataStructure = 'breakfast';
        } else if (dishData.type === 'main-dish' || dishData.type === 'mains-rice' || dishData.type === 'mains-wheat') {
            storageKey = 'mains-catalog';
            fileName = 'mains-catalog.json';
            sourceDataStructure = 'mains';
        } else if (dishData.type === 'side-dish-gravy' || dishData.type === 'side-dish-sabji') {
            storageKey = 'side-dishes-catalog';
            fileName = 'side-dishes-catalog.json';
            sourceDataStructure = 'sideDishes';
        } else if (dishData.type === 'accompaniment') {
            storageKey = 'accompaniments-catalog';
            fileName = 'accompaniments-catalog.json';
            sourceDataStructure = 'accompaniments';
        } else {
            // Default to mains for any unrecognized type
            storageKey = 'mains-catalog';
            fileName = 'mains-catalog.json';
            sourceDataStructure = 'mains';
        }

        try {
            // Load the current source file to get the complete structure
            const response = await fetch(`/data/${fileName}`);
            const originalData = await response.json();

            // Add the new dish to the original structure
            if (originalData[sourceDataStructure] && originalData[sourceDataStructure].items) {
                originalData[sourceDataStructure].items.push(dishData);
            } else {
                // Fallback structure if original doesn't exist
                originalData[sourceDataStructure] = {
                    items: [dishData]
                };
            }

            // Save the updated data to the server
            const saveResponse = await fetch('/api/save-catalog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: fileName,
                    data: originalData
                })
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.error || 'Failed to save dish to server');
            }

            const result = await saveResponse.json();
            console.log(`Dish "${dishData.name}" saved successfully:`, result.message);

            // Also update localStorage for immediate UI consistency
            const existingLocalData = JSON.parse(localStorage.getItem(storageKey)) || { items: [] };
            existingLocalData.items.push(dishData);
            localStorage.setItem(storageKey, JSON.stringify(existingLocalData));

        } catch (error) {
            console.error('Error saving dish:', error);
            
            // Fallback: save only to localStorage if server fails
            const existingLocalData = JSON.parse(localStorage.getItem(storageKey)) || { items: [] };
            existingLocalData.items.push(dishData);
            localStorage.setItem(storageKey, JSON.stringify(existingLocalData));
            
            throw new Error(`Failed to save dish to server: ${error.message}. Dish saved locally only.`);
        }
    }

    async updateDishInStorage(dishData) {
        // Use the same logic as saveDishToStorage but with update semantics
        await this.saveDishToStorage(dishData);
    }

    updateDishInArrays(dishData) {
        // Find and update the dish in the appropriate array
        const updateInArray = (array) => {
            const index = array.findIndex(item => (item.id || item.name) === (dishData.id || dishData.name));
            if (index !== -1) {
                array[index] = dishData;
                return true;
            }
            return false;
        };

        // Update in appropriate array based on type
        if (dishData.type === 'breakfast') {
            updateInArray(this.breakfastItems);
        } else if (dishData.type === 'main-dish' || dishData.type === 'mains-rice' || dishData.type === 'mains-wheat') {
            updateInArray(this.mainsItems);
        } else if (dishData.type === 'side-dish-gravy' || dishData.type === 'side-dish-sabji') {
            updateInArray(this.sideDishesItems);
        } else if (dishData.type === 'accompaniment') {
            updateInArray(this.accompanimentsItems);
        }
        
        // Update in all items array
        updateInArray(this.allFoodItems);
    }

    addDishToArrays(dishData) {
        // Add to appropriate array based on type
        if (dishData.type === 'breakfast') {
            this.breakfastItems.push(dishData);
        } else if (dishData.type === 'main-dish' || dishData.type === 'mains-rice' || dishData.type === 'mains-wheat') {
            this.mainsItems.push(dishData);
        } else if (dishData.type === 'side-dish-gravy' || dishData.type === 'side-dish-sabji') {
            this.sideDishesItems.push(dishData);
        } else if (dishData.type === 'accompaniment') {
            this.accompanimentsItems.push(dishData);
        }
        
        // Add to all items array
        this.allFoodItems.push(dishData);
    }

    downloadUpdatedCatalog(catalogName, data) {
        try {
            // Create downloadable JSON file
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create temporary download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${catalogName}.json`;
            downloadLink.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`Downloaded updated ${catalogName}.json file`);
            
            console.log(`Downloaded updated ${catalogName}.json file`);
            
            // Only show simple notification for individual dish additions, not detailed instructions
            // Detailed instructions are shown only when using Developer Tools section
        } catch (error) {
            console.error('Error downloading catalog:', error);
        }
    }

    getTypeDisplayName(type) {
        const typeMap = {
            'breakfast': 'Breakfast',
            'main-dish': 'Main Dishes',
            'mains-rice': 'Main Dishes',
            'mains-wheat': 'Main Dishes',
            'side-dish-gravy': 'Side Dishes',
            'side-dish-sabji': 'Side Dishes',
            'accompaniment': 'Accompaniments'
        };
        return typeMap[type] || 'Main Dishes';
    }
}

// Note: Initialization is handled by main.js module loader
// No automatic DOMContentLoaded initialization needed
