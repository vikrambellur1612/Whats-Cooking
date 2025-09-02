// Dashboard Module - Landing Page with Statistics and Lucky Meal Plan
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

        // Developer tools buttons
        const downloadAllBtn = document.getElementById('downloadAllCatalogsBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                this.downloadAllCatalogs();
            });
        }

        const clearLocalStorageBtn = document.getElementById('clearLocalStorageBtn');
        if (clearLocalStorageBtn) {
            clearLocalStorageBtn.addEventListener('click', () => {
                this.clearLocalStorage();
            });
        }

        // Make toggleDevTools globally available
        window.toggleDevTools = () => {
            const devTools = document.getElementById('devTools');
            const toggleBtn = document.getElementById('toggleDevToolsBtn');
            if (devTools.style.display === 'none') {
                devTools.style.display = 'block';
                toggleBtn.textContent = '🔧 Hide Developer Tools';
            } else {
                devTools.style.display = 'none';
                toggleBtn.textContent = '🔧 Developer Tools';
            }
        };

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

        // Lucky button
        const luckyBtn = document.getElementById('luckyBtn');
        if (luckyBtn) {
            console.log('Lucky button found, attaching event listener');
            luckyBtn.addEventListener('click', () => {
                console.log('Lucky button clicked!');
                this.generateMealPlan();
            });
        } else {
            console.error('Lucky button not found!');
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
    }

    async generateMealPlan() {
        console.log('generateMealPlan called');
        const luckyBtn = document.getElementById('luckyBtn');
        
        // Show loading state
        luckyBtn.classList.add('loading');
        luckyBtn.textContent = 'Generating...';

        try {
            // Add a small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get random breakfast item
            const randomBreakfast = this.getRandomItem(this.breakfastItems);
            console.log('Random breakfast:', randomBreakfast);
            
            // Get random main item
            const randomMain = this.getRandomItem(this.mainsItems);
            console.log('Random main:', randomMain);

            // Get random side dish
            const randomSideDish = this.getRandomItem(this.sideDishesItems);
            console.log('Random side dish:', randomSideDish);

            // Get random accompaniment
            const randomAccompaniment = this.getRandomItem(this.accompanimentsItems);
            console.log('Random accompaniment:', randomAccompaniment);

            // Display the meal plan
            this.showMealPlan(randomBreakfast, randomMain, randomSideDish, randomAccompaniment);

        } catch (error) {
            console.error('Error generating meal plan:', error);
            this.showAlert('Failed to generate meal plan. Please try again.', 'error');
        } finally {
            // Reset button state
            luckyBtn.classList.remove('loading');
            luckyBtn.textContent = '🎲 Get My Meal Plan';
        }
    }

    getRandomItem(items) {
        if (!items || items.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    }

    showMealPlan(breakfast, main, sideDish, accompaniment) {
        console.log('showMealPlan called with:', { breakfast, main, sideDish, accompaniment });
        
        // Populate breakfast suggestion
        const breakfastSection = document.getElementById('breakfastSuggestion');
        if (breakfastSection && breakfast) {
            breakfastSection.innerHTML = this.createSuggestionHtml(breakfast);
            console.log('Breakfast suggestion populated');
        } else {
            console.warn('Breakfast section not found or no breakfast data');
        }

        // Populate main dish suggestion  
        const mainSection = document.getElementById('mainSuggestion');
        if (mainSection && main) {
            mainSection.innerHTML = this.createSuggestionHtml(main);
            console.log('Main dish suggestion populated');
        } else {
            console.warn('Main dish section not found or no main dish data');
        }

        // Populate side dish suggestion  
        const sideDishSection = document.getElementById('sideDishSuggestion');
        if (sideDishSection && sideDish) {
            sideDishSection.innerHTML = this.createSuggestionHtml(sideDish);
            console.log('Side dish suggestion populated');
        } else {
            console.warn('Side dish section not found or no side dish data');
        }

        // Populate accompaniment suggestion  
        const accompanimentSection = document.getElementById('accompanimentSuggestion');
        if (accompanimentSection && accompaniment) {
            accompanimentSection.innerHTML = this.createSuggestionHtml(accompaniment);
            console.log('Accompaniment suggestion populated');
        } else {
            console.warn('Accompaniment section not found or no accompaniment data');
        }

        // Show modal
        const modal = document.getElementById('mealPlanModal');
        if (modal) {
            modal.classList.add('active');
            console.log('Modal shown');
        } else {
            console.error('Modal not found!');
        }
    }

    createSuggestionHtml(item) {
        const emoji = this.getDishEmoji(item);
        const typeLabel = this.formatType(item.type);
        
        return `
            <div class="suggestion-dish">
                <div class="suggestion-emoji">${emoji}</div>
                <h5 class="suggestion-name">${item.name}</h5>
                <p class="suggestion-description">${item.description}</p>
                <div class="suggestion-badges">
                    <span class="badge badge-${item.type}">${typeLabel}</span>
                    ${item.nutrition?.calories ? `<span class="badge badge-nutrition">${item.nutrition.calories} cal</span>` : ''}
                </div>
            </div>
        `;
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
        
        // Main dishes
        if (name.includes('rice') || name.includes('bath')) return '🍚';
        if (name.includes('biryani')) return '🍛';
        if (name.includes('pulao')) return '🍚';
        
        // Side dishes
        if (name.includes('sambar')) return '🍲';
        if (name.includes('rasam')) return '🍵';
        if (name.includes('dal')) return '🥣';
        if (name.includes('curry')) return '🍛';
        if (name.includes('sabji') || name.includes('palya')) return '🥗';
        if (name.includes('gojju')) return '�';
        
        // Accompaniments
        if (name.includes('chutney')) return '🥄';
        if (name.includes('pickle') || name.includes('achar')) return '🥒';
        if (name.includes('raita')) return '🥛';
        if (name.includes('papad')) return '�';
        if (name.includes('kosambari')) return '🥗';
        if (name.includes('salad')) return '🥗';
        if (name.includes('sweet') || name.includes('payasa') || name.includes('halwa')) return '🍮';
        
        // Category-based fallbacks
        if (category === 'breakfast') return '🌅';
        if (category === 'mains' || type === 'mains') return '🍽️';
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

    generateNewPlan() {
        this.generateMealPlan();
    }

    closeMealPlanModal() {
        document.getElementById('mealPlanModal').classList.remove('active');
    }

    showAlert(message, type = 'info') {
        // Create alert element
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
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
        
        // Add click to dismiss
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        });
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

    // Add New Dish Modal functionality
    showAddDishModal() {
        const modal = document.getElementById('addDishModal');
        if (modal) {
            modal.classList.add('active');
            this.resetAddDishForm();
            this.showStep(1); // Start with first step
        }
    }

    closeAddDishModal() {
        const modal = document.getElementById('addDishModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    resetAddDishForm() {
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
        const formData = new FormData(form);
        
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
            id: Date.now().toString(),
            dateAdded: new Date().toISOString()
        };

        // Validate required fields
        if (!dishData.name || !dishData.type || !dishData.cuisine) {
            this.showAlert('Please fill in all required fields (Name, Type, and Cuisine).', 'warning');
            return;
        }

        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '🔄 Adding...';
            submitBtn.disabled = true;

            // Save dish to appropriate category in localStorage
            await this.saveDishToStorage(dishData);
            
            // Add to current data arrays
            this.addDishToArrays(dishData);
            
            // Update statistics
            this.updateStatistics();
            
            // Close modal and show success message
            this.closeAddDishModal();
            this.showAlert(`🎉 ${dishData.name} has been added successfully!`, 'success');
            
        } catch (error) {
            console.error('Error adding dish:', error);
            this.showAlert('Failed to add dish. Please try again.', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '✨ Add Dish to Collection';
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
        let storageKey, sourceDataStructure;
        if (dishData.type === 'breakfast') {
            storageKey = 'breakfast-catalog';
            sourceDataStructure = 'breakfast';
        } else if (dishData.type === 'main-dish') {
            storageKey = 'mains-catalog';
            sourceDataStructure = 'mains';
        } else if (dishData.type === 'side-dish-gravy' || dishData.type === 'side-dish-sabji') {
            storageKey = 'side-dishes-catalog';
            sourceDataStructure = 'sideDishes';
        } else if (dishData.type === 'accompaniment') {
            storageKey = 'accompaniments-catalog';
            sourceDataStructure = 'accompaniments';
        } else {
            storageKey = 'mains-catalog';
            sourceDataStructure = 'mains';
        }

        // Get existing data from localStorage (if any)
        const existingLocalData = JSON.parse(localStorage.getItem(storageKey)) || { items: [] };
        
        // Add new dish to localStorage
        existingLocalData.items.push(dishData);
        localStorage.setItem(storageKey, JSON.stringify(existingLocalData));

        // Create the complete merged data structure for download
        await this.createCompleteUpdatedCatalog(storageKey, sourceDataStructure, dishData);
    }

    async createCompleteUpdatedCatalog(storageKey, sourceDataStructure, newDishData) {
        try {
            // Load the original source file to get the complete structure
            const sourceFileName = `${storageKey}.json`;
            const response = await fetch(`/data/${sourceFileName}`);
            const originalData = await response.json();

            // Add the new dish to the original structure
            if (originalData[sourceDataStructure] && originalData[sourceDataStructure].items) {
                originalData[sourceDataStructure].items.push(newDishData);
            } else {
                // Fallback structure if original doesn't exist
                originalData[sourceDataStructure] = {
                    items: [newDishData]
                };
            }

            // Download the complete updated file
            this.downloadUpdatedCatalog(storageKey, originalData);
            
            console.log(`Created complete updated ${sourceFileName} with ${originalData[sourceDataStructure].items.length} items`);
        } catch (error) {
            console.error('Error creating complete catalog:', error);
            // Fallback to simple download
            const fallbackData = { items: [newDishData] };
            this.downloadUpdatedCatalog(storageKey, fallbackData);
        }
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
            
            // Show helpful message to user
            this.showAlert(
                `📥 ${catalogName}.json downloaded! Please replace the file in your /data/ directory and commit to Git.`, 
                'info'
            );
        } catch (error) {
            console.error('Error downloading catalog:', error);
        }
    }

    // Utility method to download all current catalogs (helpful for backup/sync)
    downloadAllCatalogs() {
        const catalogs = [
            { key: 'breakfast-catalog', structure: 'breakfast', items: this.breakfastItems },
            { key: 'mains-catalog', structure: 'mains', items: this.mainsItems },
            { key: 'side-dishes-catalog', structure: 'sideDishes', items: this.sideDishesItems },
            { key: 'accompaniments-catalog', structure: 'accompaniments', items: this.accompanimentsItems }
        ];

        catalogs.forEach(catalog => {
            const data = {
                [catalog.structure]: {
                    items: catalog.items
                }
            };
            setTimeout(() => {
                this.downloadUpdatedCatalog(catalog.key, data);
            }, 500); // Small delay between downloads
        });

        this.showAlert('📥 All catalog files will be downloaded. Please replace them in your /data/ directory.', 'info');
    }

    // Clear localStorage to reset to original data
    clearLocalStorage() {
        const catalogs = ['breakfast-catalog', 'mains-catalog', 'side-dishes-catalog', 'accompaniments-catalog'];
        
        if (confirm('Are you sure you want to clear all local data? This will reset the app to use only the original catalog files.')) {
            catalogs.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.showAlert('🗑️ Local data cleared! Please refresh the page to reload original data.', 'warning');
            
            // Automatically refresh after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    addDishToArrays(dishData) {
        // Add to appropriate array based on type
        if (dishData.type === 'breakfast') {
            this.breakfastItems.push(dishData);
        } else if (dishData.type === 'main-dish') {
            this.mainsItems.push(dishData);
        } else if (dishData.type === 'side-dish-gravy' || dishData.type === 'side-dish-sabji') {
            this.sideDishesItems.push(dishData);
        } else if (dishData.type === 'accompaniment') {
            this.accompanimentsItems.push(dishData);
        }
        
        // Add to all items array
        this.allFoodItems.push(dishData);
    }
}

// Note: Initialization is handled by main.js module loader
// No automatic DOMContentLoaded initialization needed
