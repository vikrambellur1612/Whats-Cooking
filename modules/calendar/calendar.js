// Calendar Module - Meal Planning Calendar
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentWeekStart = this.getWeekStart(new Date());
        this.selectedDate = null;
        this.currentMealType = null;
        this.selectedMeals = [];
        this.menuPlans = JSON.parse(localStorage.getItem('menuPlans')) || {};
        this.availableMeals = {
            breakfast: [],
            mains: [],
            sides: [],
            accompaniments: []
        };
    }

    async init() {
        console.log('Initializing Calendar...');
        
        // Wait for DOM elements to be available
        await this.waitForDOMElements();
        
        // Load available meals from all catalogs
        await this.loadAvailableMeals();
        
        this.setupEventListeners();
        this.renderCalendarView();
        this.updateStatistics();
        
        // Ensure global access
        window.calendar = this;
        console.log('Calendar initialized. Global instance:', window.calendar);
    }

    async waitForDOMElements() {
        console.log('Calendar: Waiting for DOM elements...');
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkElements = () => {
                const calendarView = document.getElementById('calendarView');
                const weeklyView = document.getElementById('weeklyView');
                
                console.log(`Calendar: Attempt ${attempts + 1} - calendarView: ${calendarView ? 'found' : 'null'}, weeklyView: ${weeklyView ? 'found' : 'null'}`);
                
                if (calendarView && weeklyView) {
                    console.log('Calendar: DOM elements found!');
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    console.error('Calendar: DOM elements not found after', maxAttempts, 'attempts');
                    reject(new Error('Missing DOM elements'));
                    return;
                }
                
                requestAnimationFrame(checkElements);
            };
            
            checkElements();
        });
    }

    async loadAvailableMeals() {
        try {
            // Load breakfast items
            try {
                const breakfastResponse = await fetch('/data/breakfast-catalog.json');
                if (breakfastResponse.ok) {
                    const breakfastData = await breakfastResponse.json();
                    this.availableMeals.breakfast = breakfastData.breakfast?.items || [];
                    console.log(`Loaded ${this.availableMeals.breakfast.length} breakfast items`);
                }
            } catch (error) {
                console.warn('Failed to load breakfast data:', error);
                this.availableMeals.breakfast = [];
            }

            // Load mains items
            try {
                const mainsResponse = await fetch('/data/mains-catalog.json');
                if (mainsResponse.ok) {
                    const mainsData = await mainsResponse.json();
                    this.availableMeals.mains = mainsData.mains?.items || [];
                    console.log(`Loaded ${this.availableMeals.mains.length} mains items`);
                }
            } catch (error) {
                console.warn('Failed to load mains data:', error);
                this.availableMeals.mains = [];
            }

            // Load side dishes (note: correct filename is side-dishes-catalog.json)
            try {
                const sidesResponse = await fetch('/data/side-dishes-catalog.json');
                if (sidesResponse.ok) {
                    const sidesData = await sidesResponse.json();
                    this.availableMeals.sides = sidesData.sideDishes?.items || sidesData.sides?.items || [];
                    console.log(`Loaded ${this.availableMeals.sides.length} side dish items`);
                }
            } catch (error) {
                console.warn('Failed to load side dishes data:', error);
                this.availableMeals.sides = [];
            }

            // Load accompaniments
            try {
                const accompResponse = await fetch('/data/accompaniments-catalog.json');
                if (accompResponse.ok) {
                    const accompData = await accompResponse.json();
                    this.availableMeals.accompaniments = accompData.accompaniments?.items || [];
                    console.log(`Loaded ${this.availableMeals.accompaniments.length} accompaniment items`);
                }
            } catch (error) {
                console.warn('Failed to load accompaniments data:', error);
                this.availableMeals.accompaniments = [];
            }

            // Also try to load from localStorage if catalogs have been updated
            this.loadFromLocalStorage();

            console.log('Available meals loaded:', {
                breakfast: this.availableMeals.breakfast.length,
                mains: this.availableMeals.mains.length,
                sides: this.availableMeals.sides.length,
                accompaniments: this.availableMeals.accompaniments.length
            });
            
        } catch (error) {
            console.error('Error loading available meals:', error);
            this.showAlert('Some meal catalogs could not be loaded. You can still plan menus with available items.', 'warning');
        }
    }

    // Load additional items from localStorage that may have been added by other modules
    loadFromLocalStorage() {
        try {
            // Check breakfast catalog localStorage
            const breakfastLocal = localStorage.getItem('breakfast-catalog');
            if (breakfastLocal) {
                const parsedBreakfast = JSON.parse(breakfastLocal);
                const localBreakfast = parsedBreakfast.items || [];
                // Add only new items that aren't already in the list
                localBreakfast.forEach(item => {
                    const exists = this.availableMeals.breakfast.some(existing => 
                        (existing.id || existing.name) === (item.id || item.name)
                    );
                    if (!exists) {
                        this.availableMeals.breakfast.push(item);
                    }
                });
            }

            // Check mains catalog localStorage
            const mainsLocal = localStorage.getItem('mains-catalog');
            if (mainsLocal) {
                const parsedMains = JSON.parse(mainsLocal);
                const localMains = parsedMains.items || [];
                localMains.forEach(item => {
                    const exists = this.availableMeals.mains.some(existing => 
                        (existing.id || existing.name) === (item.id || item.name)
                    );
                    if (!exists) {
                        this.availableMeals.mains.push(item);
                    }
                });
            }

            // Check side dishes catalog localStorage
            const sidesLocal = localStorage.getItem('side-dishes-catalog');
            if (sidesLocal) {
                const parsedSides = JSON.parse(sidesLocal);
                const localSides = parsedSides.items || [];
                localSides.forEach(item => {
                    const exists = this.availableMeals.sides.some(existing => 
                        (existing.id || existing.name) === (item.id || item.name)
                    );
                    if (!exists) {
                        this.availableMeals.sides.push(item);
                    }
                });
            }

            // Check accompaniments catalog localStorage
            const accompLocal = localStorage.getItem('accompaniments-catalog');
            if (accompLocal) {
                const parsedAccomp = JSON.parse(accompLocal);
                const localAccomp = parsedAccomp.items || [];
                localAccomp.forEach(item => {
                    const exists = this.availableMeals.accompaniments.some(existing => 
                        (existing.id || existing.name) === (item.id || item.name)
                    );
                    if (!exists) {
                        this.availableMeals.accompaniments.push(item);
                    }
                });
            }

        } catch (error) {
            console.warn('Error loading from localStorage:', error);
        }
    }

    setupEventListeners() {
        // View toggle buttons
        document.getElementById('calendarViewBtn')?.addEventListener('click', () => this.showCalendarView());
        document.getElementById('weeklyViewBtn')?.addEventListener('click', () => this.showWeeklyView());

        // Calendar navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.navigateMonth(1));

        // Weekly navigation
        document.getElementById('prevWeek')?.addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek')?.addEventListener('click', () => this.navigateWeek(1));

        // Meal search
        document.getElementById('mealSearchInput')?.addEventListener('input', (e) => {
            this.filterMealSelector(e.target.value);
        });
    }

    showCalendarView() {
        document.getElementById('calendarView').classList.remove('hidden');
        document.getElementById('weeklyView').classList.add('hidden');
        document.getElementById('calendarViewBtn').classList.add('active');
        document.getElementById('weeklyViewBtn').classList.remove('active');
        this.renderCalendarView();
    }

    showWeeklyView() {
        document.getElementById('calendarView').classList.add('hidden');
        document.getElementById('weeklyView').classList.remove('hidden');
        document.getElementById('calendarViewBtn').classList.remove('active');
        document.getElementById('weeklyViewBtn').classList.add('active');
        this.renderWeeklyView();
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendarView();
    }

    navigateWeek(direction) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
        this.renderWeeklyView();
    }

    renderCalendarView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        let calendarHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const hasMenu = this.menuPlans[dateStr] && Object.keys(this.menuPlans[dateStr]).length > 0;
            
            const dayClass = `calendar-day ${isToday ? 'today' : ''} ${hasMenu ? 'has-menu' : ''}`;
            
            // Calculate nutritional information for the day
            let totalCalories = 0;
            let totalProtein = 0;
            let mealCount = 0;
            
            if (hasMenu) {
                const dayMenu = this.menuPlans[dateStr];
                Object.values(dayMenu).forEach(mealArray => {
                    if (Array.isArray(mealArray)) {
                        mealArray.forEach(meal => {
                            if (meal.nutrition) {
                                totalCalories += meal.nutrition.calories || 0;
                                totalProtein += meal.nutrition.protein || 0;
                                mealCount++;
                            }
                        });
                    }
                });
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateStr}" onclick="window.calendar.openDayDetail('${dateStr}')">
                    <div class="day-number">${day}</div>
                    ${hasMenu ? `
                        <div class="nutrition-summary">
                            <div class="nutrition-item">
                                <span class="nutrition-icon">🔥</span>
                                <span class="nutrition-value">${totalCalories}</span>
                                <span class="nutrition-label">cal</span>
                            </div>
                            <div class="nutrition-item">
                                <span class="nutrition-icon">💪</span>
                                <span class="nutrition-value">${Math.round(totalProtein)}g</span>
                                <span class="nutrition-label">protein</span>
                            </div>
                            ${mealCount > 0 ? `<div class="meal-count">${mealCount} meals</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        document.getElementById('calendarDays').innerHTML = calendarHTML;
    }

    renderWeeklyView() {
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let tableHTML = '';
        
        // Update week range header
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekRangeText = `${this.formatDateShort(this.currentWeekStart)} - ${this.formatDateShort(weekEnd)}`;
        document.getElementById('currentWeekRange').textContent = weekRangeText;

        // Generate table rows for each day of the week
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);
            const dayMenu = this.menuPlans[dateStr] || {};
            
            const isToday = date.toDateString() === new Date().toDateString();
            const rowClass = isToday ? 'today-row' : '';
            
            tableHTML += `
                <tr class="${rowClass}">
                    <td class="day-cell">
                        <div class="day-name">${weekDays[i]}</div>
                        <div class="day-date">${this.formatDateShort(date)}</div>
                    </td>
                    <td class="meal-cell" data-date="${dateStr}" data-meal="breakfast">
                        ${this.renderMealCell(dayMenu.breakfast, 'breakfast', dateStr)}
                    </td>
                    <td class="meal-cell" data-date="${dateStr}" data-meal="mains">
                        ${this.renderMealCell(dayMenu.mains, 'mains', dateStr)}
                    </td>
                    <td class="meal-cell" data-date="${dateStr}" data-meal="sides">
                        ${this.renderMealCell(dayMenu.sides, 'sides', dateStr)}
                    </td>
                    <td class="meal-cell" data-date="${dateStr}" data-meal="accompaniments">
                        ${this.renderMealCell(dayMenu.accompaniments, 'accompaniments', dateStr)}
                    </td>
                </tr>
            `;
        }

        document.getElementById('weeklyTableBody').innerHTML = tableHTML;

        // Add click listeners to meal cells
        document.querySelectorAll('.meal-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const date = cell.getAttribute('data-date');
                const mealType = cell.getAttribute('data-meal');
                this.openQuickMealSelector(date, mealType);
            });
        });
    }

    renderMealCell(meals, mealType, dateStr) {
        if (!meals || meals.length === 0) {
            return `<div class="empty-meal" onclick="window.calendar.openQuickMealSelector('${dateStr}', '${mealType}')">➕ Add ${mealType}</div>`;
        }

        return meals.map(meal => 
            `<div class="meal-item">
                <span class="meal-name">${meal.name}</span>
                <button class="remove-meal-btn" onclick="window.calendar.removeMealFromDay('${dateStr}', '${mealType}', '${meal.id || meal.name}')">×</button>
            </div>`
        ).join('');
    }

    openDayDetail(dateStr) {
        this.selectedDate = dateStr;
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateFormatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        document.getElementById('dayDetailTitle').textContent = `📅 Menu for ${dayName}, ${dateFormatted}`;
        
        this.renderDayMenuSections();
        document.getElementById('dayDetailModal').classList.add('active');
    }

    renderDayMenuSections() {
        const dayMenu = this.menuPlans[this.selectedDate] || {};
        
        // Render each meal section
        ['breakfast', 'mains', 'sides', 'accompaniments'].forEach(mealType => {
            const container = document.getElementById(`${mealType === 'sides' ? 'side' : mealType === 'accompaniments' ? 'accompaniment' : mealType}Items`);
            const meals = dayMenu[mealType] || [];
            
            let html = '';
            meals.forEach(meal => {
                html += `
                    <div class="selected-meal-item">
                        <span class="meal-emoji">${this.getMealEmoji(meal, mealType)}</span>
                        <span class="meal-name">${meal.name}</span>
                        <button class="remove-btn" onclick="window.calendar.removeMealFromSelection('${mealType}', '${meal.id || meal.name}')">×</button>
                    </div>
                `;
            });
            
            // Add the "Add more" button
            html += `
                <div class="add-meal-item" onclick="window.calendar.showMealSelector('${mealType}')">
                    <span class="add-icon">➕</span>
                    <span>Add ${this.getMealTypeLabel(mealType)}</span>
                </div>
            `;
            
            container.innerHTML = html;
        });
    }

    showMealSelector(mealType) {
        this.currentMealType = mealType;
        this.selectedMeals = [];
        
        document.getElementById('mealSelectorTitle').textContent = `Select ${this.getMealTypeLabel(mealType)}`;
        
        this.renderMealSelectorGrid();
        document.getElementById('mealSelectorModal').classList.add('active');
    }

    renderMealSelectorGrid() {
        const meals = this.availableMeals[this.currentMealType] || [];
        const dayMenu = this.menuPlans[this.selectedDate] || {};
        const currentMeals = dayMenu[this.currentMealType] || [];
        const currentMealIds = new Set(currentMeals.map(meal => meal.id || meal.name));
        
        let html = '';
        meals.forEach(meal => {
            const isAlreadySelected = currentMealIds.has(meal.id || meal.name);
            const isSelected = this.selectedMeals.some(selected => (selected.id || selected.name) === (meal.id || meal.name));
            
            html += `
                <div class="meal-selector-item ${isAlreadySelected ? 'already-selected' : ''} ${isSelected ? 'selected' : ''}" 
                     onclick="window.calendar.toggleMealSelection('${meal.id || meal.name}')">
                    <div class="meal-emoji">${this.getMealEmoji(meal, this.currentMealType)}</div>
                    <div class="meal-name">${meal.name}</div>
                    ${isAlreadySelected ? '<div class="already-added-badge">Added</div>' : ''}
                </div>
            `;
        });
        
        document.getElementById('mealSelectorGrid').innerHTML = html;
    }

    toggleMealSelection(mealId) {
        const meal = this.availableMeals[this.currentMealType].find(m => (m.id || m.name) === mealId);
        if (!meal) return;
        
        const existingIndex = this.selectedMeals.findIndex(selected => (selected.id || selected.name) === mealId);
        
        if (existingIndex >= 0) {
            this.selectedMeals.splice(existingIndex, 1);
        } else {
            this.selectedMeals.push(meal);
        }
        
        this.renderMealSelectorGrid();
    }

    addSelectedMeals() {
        if (this.selectedMeals.length === 0) {
            this.showAlert('Please select at least one item.', 'warning');
            return;
        }
        
        if (!this.menuPlans[this.selectedDate]) {
            this.menuPlans[this.selectedDate] = {};
        }
        
        if (!this.menuPlans[this.selectedDate][this.currentMealType]) {
            this.menuPlans[this.selectedDate][this.currentMealType] = [];
        }
        
        // Count how many items were actually added
        let addedCount = 0;
        this.selectedMeals.forEach(meal => {
            // Check if item already exists to avoid duplicates
            const exists = this.menuPlans[this.selectedDate][this.currentMealType].some(existing => 
                (existing.id || existing.name) === (meal.id || meal.name)
            );
            
            if (!exists) {
                this.menuPlans[this.selectedDate][this.currentMealType].push(meal);
                addedCount++;
            }
        });
        
        this.saveMenuPlans();
        this.closeMealSelector();
        this.renderDayMenuSections();
        this.updateStatistics();
        this.renderCalendarView(); // Refresh calendar to show indicators
        this.renderWeeklyView(); // Refresh weekly view
        
        const mealTypeLabel = this.getMealTypeLabel(this.currentMealType);
        if (addedCount > 0) {
            this.showAlert(`✅ Added ${addedCount} ${mealTypeLabel.toLowerCase()}!`, 'success');
        } else {
            this.showAlert(`All selected items were already in your menu.`, 'info');
        }
    }

    openQuickMealSelector(dateStr, mealType) {
        this.selectedDate = dateStr;
        this.showMealSelector(mealType);
    }

    removeMealFromDay(dateStr, mealType, mealId) {
        if (!this.menuPlans[dateStr] || !this.menuPlans[dateStr][mealType]) return;
        
        const index = this.menuPlans[dateStr][mealType].findIndex(meal => (meal.id || meal.name) === mealId);
        if (index >= 0) {
            this.menuPlans[dateStr][mealType].splice(index, 1);
            
            // Clean up empty arrays and objects
            if (this.menuPlans[dateStr][mealType].length === 0) {
                delete this.menuPlans[dateStr][mealType];
            }
            if (Object.keys(this.menuPlans[dateStr]).length === 0) {
                delete this.menuPlans[dateStr];
            }
            
            this.saveMenuPlans();
            this.renderWeeklyView();
            this.updateStatistics();
            this.showAlert('Item removed from menu!', 'success');
        }
    }

    removeMealFromSelection(mealType, mealId) {
        if (!this.menuPlans[this.selectedDate] || !this.menuPlans[this.selectedDate][mealType]) return;
        
        const index = this.menuPlans[this.selectedDate][mealType].findIndex(meal => (meal.id || meal.name) === mealId);
        if (index >= 0) {
            this.menuPlans[this.selectedDate][mealType].splice(index, 1);
            
            // Clean up empty arrays
            if (this.menuPlans[this.selectedDate][mealType].length === 0) {
                delete this.menuPlans[this.selectedDate][mealType];
            }
            
            this.renderDayMenuSections();
        }
    }

    saveDayMenu() {
        this.saveMenuPlans();
        this.closeDayModal();
        this.renderCalendarView();
        this.renderWeeklyView();
        this.updateStatistics();
        this.showAlert('Menu saved successfully!', 'success');
    }

    closeDayModal() {
        document.getElementById('dayDetailModal').classList.remove('active');
        this.selectedDate = null;
    }

    closeMealSelector() {
        document.getElementById('mealSelectorModal').classList.remove('active');
        this.currentMealType = null;
        this.selectedMeals = [];
    }

    filterMealSelector(searchTerm) {
        const items = document.querySelectorAll('.meal-selector-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.meal-name').textContent.toLowerCase();
            if (name.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    updateStatistics() {
        const totalPlannedDays = Object.keys(this.menuPlans).length;
        let breakfastCount = 0, mainsCount = 0, sidesCount = 0;
        
        Object.values(this.menuPlans).forEach(dayMenu => {
            if (dayMenu.breakfast) breakfastCount += dayMenu.breakfast.length;
            if (dayMenu.mains) mainsCount += dayMenu.mains.length;
            if (dayMenu.sides) sidesCount += dayMenu.sides.length;
        });
        
        document.getElementById('plannedDays').textContent = totalPlannedDays;
        document.getElementById('breakfastCount').textContent = breakfastCount;
        document.getElementById('mainsCount').textContent = mainsCount;
        document.getElementById('sidesCount').textContent = sidesCount;
    }

    // Method to refresh available meals - can be called when switching to Calendar module
    async refreshAvailableMeals() {
        console.log('Refreshing available meals...');
        await this.loadAvailableMeals();
        this.showAlert('Meal catalogs refreshed!', 'success');
    }

    // Method to show Add Dish modal for different meal types
    showAddDishModal(mealType = 'breakfast', existingItem = null) {
        // Navigate to Dashboard to use the Add Dish modal
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

    // Helper functions
    formatDate(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    formatDateShort(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    getMealTypeLabel(mealType) {
        const labels = {
            'breakfast': 'Breakfast Items',
            'mains': 'Main Dishes',
            'sides': 'Side Dishes',
            'accompaniments': 'Accompaniments'
        };
        return labels[mealType] || mealType;
    }

    getMealEmoji(meal, mealType) {
        // First check if the meal has a specific emoji based on its name
        const name = meal.name?.toLowerCase() || '';
        
        // Breakfast items
        if (mealType === 'breakfast') {
            if (name.includes('dosa')) return '🥞';
            if (name.includes('idli')) return '🍙';
            if (name.includes('vada')) return '🍩';
            if (name.includes('upma')) return '🍲';
            if (name.includes('poha')) return '🍚';
            return '🌅';
        }
        
        // Main dishes
        if (mealType === 'mains') {
            if (name.includes('rice') || name.includes('biryani')) return '🍚';
            if (name.includes('curry')) return '🍛';
            if (name.includes('sambar')) return '🍲';
            if (name.includes('dal')) return '🥘';
            return '🍽️';
        }
        
        // Side dishes
        if (mealType === 'sides') {
            if (name.includes('fry')) return '🥗';
            if (name.includes('curry')) return '🍛';
            if (name.includes('sabji')) return '🥬';
            return '🥗';
        }
        
        // Accompaniments
        if (mealType === 'accompaniments') {
            if (name.includes('rice')) return '🍚';
            if (name.includes('roti') || name.includes('chapati')) return '🫓';
            if (name.includes('naan')) return '🫓';
            return '🍛';
        }
        
        return '🍽️';
    }

    saveMenuPlans() {
        localStorage.setItem('menuPlans', JSON.stringify(this.menuPlans));
    }

    showAlert(message, type = 'info') {
        // Use the same compact alert system as other modules
        if (window.dashboard && window.dashboard.showAlert) {
            window.dashboard.showAlert(message, type);
        } else {
            // Fallback alert
            console.log(`${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    }
}

// This module is initialized by main.js after DOM and dependencies are loaded
