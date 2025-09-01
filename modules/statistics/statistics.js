// Statistics Module - Analytics and insights
class Statistics {
    constructor() {
        this.foodData = [];
        this.stats = {};
        this.init();
    }

    async init() {
        console.log('Initializing Statistics Module...');
        this.showLoading();
        await this.loadData();
        this.calculateStatistics();
        this.renderStatistics();
        this.hideLoading();
    }

    async loadData() {
        try {
            // Load from the same sources as food catalog
            const breakfastResponse = await fetch('/data/breakfast-catalog.json');
            const breakfastJson = await breakfastResponse.json();
            
            const mealsResponse = await fetch('/data/meals-catalog.json');
            const mealsJson = await mealsResponse.json();
            
            // Extract items
            const breakfastItems = this.extractItems(breakfastJson);
            const mealItems = this.extractItems(mealsJson);
            
            // Combine all items
            this.foodData = [...breakfastItems, ...mealItems];
            
            // Load user customizations
            this.loadUserCustomizations();
            
            console.log(`Loaded ${this.foodData.length} items for statistics`);
            
        } catch (error) {
            console.error('Error loading data for statistics:', error);
            this.showError('Error loading statistics data');
        }
    }

    extractItems(jsonData) {
        const items = [];
        const defaultItems = jsonData.foodCatalog.defaultItems;
        
        Object.keys(defaultItems).forEach(categoryKey => {
            defaultItems[categoryKey].forEach(item => {
                items.push(item);
            });
        });
        
        return items;
    }

    loadUserCustomizations() {
        const userItems = localStorage.getItem('userFoodItems');
        if (userItems) {
            try {
                const parsedItems = JSON.parse(userItems);
                this.foodData = [...this.foodData, ...parsedItems];
            } catch (error) {
                console.error('Error loading user customizations:', error);
            }
        }
    }

    calculateStatistics() {
        if (this.foodData.length === 0) {
            this.stats = {
                total: 0,
                breakfast: 0,
                meals: 0,
                vegetarian: 0,
                nonVegetarian: 0,
                avgNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
            };
            return;
        }

        // Basic counts
        this.stats.total = this.foodData.length;
        this.stats.breakfast = this.foodData.filter(item => item.category === 'breakfast').length;
        this.stats.meals = this.foodData.filter(item => item.category === 'meal').length;
        this.stats.vegetarian = this.foodData.filter(item => item.type === 'vegetarian').length;
        this.stats.nonVegetarian = this.foodData.filter(item => item.type === 'non-vegetarian').length;
        this.stats.mains = this.foodData.filter(item => item.type === 'mains').length;
        this.stats.sideDishGravy = this.foodData.filter(item => item.type === 'side-dish-gravy').length;
        this.stats.sideDishSabji = this.foodData.filter(item => item.type === 'side-dish-sabji').length;

        // Calculate average nutrition
        const nutritionTotals = this.foodData.reduce((totals, item) => {
            const nutrition = item.nutrition || {};
            return {
                calories: totals.calories + (nutrition.calories || 0),
                protein: totals.protein + (nutrition.protein || 0),
                carbs: totals.carbs + (nutrition.carbs || 0),
                fat: totals.fat + (nutrition.fat || 0)
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        this.stats.avgNutrition = {
            calories: Math.round(nutritionTotals.calories / this.stats.total),
            protein: Math.round((nutritionTotals.protein / this.stats.total) * 10) / 10,
            carbs: Math.round((nutritionTotals.carbs / this.stats.total) * 10) / 10,
            fat: Math.round((nutritionTotals.fat / this.stats.total) * 10) / 10
        };

        // Find popular/special dishes
        this.stats.popularBreakfast = this.getPopularDish('breakfast');
        this.stats.popularMeal = this.getPopularDish('meal');
        this.stats.healthiestDish = this.getHealthiestDish();
        this.stats.topNutritiousDishes = this.getTopNutritiousDishes();

        console.log('Statistics calculated:', this.stats);
    }

    getPopularDish(category) {
        const categoryDishes = this.foodData.filter(item => item.category === category);
        if (categoryDishes.length === 0) return null;

        // For now, just return a well-known dish or the first one
        const popularDishes = {
            'breakfast': ['Mysore Masala Dosa', 'Benne Dosa', 'Set Dosa'],
            'meal': ['Bisi Bele Bath', 'Ragi Mudde', 'Vangi Bath']
        };

        const preferredNames = popularDishes[category] || [];
        
        for (const name of preferredNames) {
            const dish = categoryDishes.find(item => 
                item.name.toLowerCase().includes(name.toLowerCase())
            );
            if (dish) return dish;
        }

        return categoryDishes[0]; // Fallback to first dish
    }

    getHealthiestDish() {
        if (this.foodData.length === 0) return null;

        // Simple health score: high protein, low fat, reasonable calories
        const scored = this.foodData
            .filter(item => item.nutrition && item.nutrition.calories)
            .map(item => {
                const n = item.nutrition;
                const score = (n.protein || 0) * 2 - (n.fat || 0) + 
                            (n.calories <= 200 ? 10 : 0); // bonus for low calories
                return { ...item, healthScore: score };
            })
            .sort((a, b) => b.healthScore - a.healthScore);

        return scored[0] || null;
    }

    getTopNutritiousDishes(count = 5) {
        if (this.foodData.length === 0) return [];

        return this.foodData
            .filter(item => item.nutrition && item.nutrition.calories)
            .sort((a, b) => (b.nutrition.protein || 0) - (a.nutrition.protein || 0))
            .slice(0, count);
    }

    renderStatistics() {
        this.renderOverview();
        this.renderCategoryBreakdown();
        this.renderNutritionAnalysis();
        this.renderPopularDishes();
    }

    renderOverview() {
        document.getElementById('totalDishes').textContent = this.stats.total;
        document.getElementById('breakfastDishes').textContent = this.stats.breakfast;
        document.getElementById('mealDishes').textContent = this.stats.meals;
        document.getElementById('vegDishes').textContent = this.stats.vegetarian;
    }

    renderCategoryBreakdown() {
        const breakfastList = document.getElementById('breakfastList');
        const mealList = document.getElementById('mealList');

        if (breakfastList) {
            const breakfastItems = this.foodData.filter(item => item.category === 'breakfast');
            breakfastList.innerHTML = breakfastItems.length > 0 
                ? breakfastItems.map(item => this.createCategoryItem(item)).join('')
                : '<p class="text-center text-muted">No breakfast items found</p>';
        }

        if (mealList) {
            const mealItems = this.foodData.filter(item => item.category === 'meal');
            mealList.innerHTML = mealItems.length > 0
                ? mealItems.map(item => this.createCategoryItem(item)).join('')
                : '<p class="text-center text-muted">No meal items found</p>';
        }
    }

    createCategoryItem(item) {
        return `
            <div class="category-item">
                <span class="category-item-name">${item.name}</span>
                <span class="category-item-type ${item.type.replace('-', '')}">${this.formatType(item.type)}</span>
            </div>
        `;
    }

    renderNutritionAnalysis() {
        const avg = this.stats.avgNutrition;
        
        document.getElementById('avgCalories').textContent = avg.calories;
        document.getElementById('avgProtein').textContent = `${avg.protein}g`;
        document.getElementById('avgCarbs').textContent = `${avg.carbs}g`;
        document.getElementById('avgFat').textContent = `${avg.fat}g`;

        const topDishesContainer = document.getElementById('topNutritiousDishes');
        if (topDishesContainer && this.stats.topNutritiousDishes.length > 0) {
            topDishesContainer.innerHTML = this.stats.topNutritiousDishes
                .map(item => this.createTopDishItem(item))
                .join('');
        }
    }

    createTopDishItem(item) {
        const calories = item.nutrition?.calories || 0;
        return `
            <div class="top-dish-item">
                <span class="top-dish-name">${item.name}</span>
                <span class="top-dish-calories">${calories} cal</span>
            </div>
        `;
    }

    renderPopularDishes() {
        this.renderPopularDish('popularBreakfast', this.stats.popularBreakfast);
        this.renderPopularDish('popularMeal', this.stats.popularMeal);
        this.renderPopularDish('healthiestDish', this.stats.healthiestDish);
    }

    renderPopularDish(containerId, dish) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!dish) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }

        const emoji = this.getFoodEmoji(dish.name);
        const calories = dish.nutrition?.calories || 'N/A';
        const protein = dish.nutrition?.protein || 'N/A';

        container.innerHTML = `
            <div class="popular-item-emoji">${emoji}</div>
            <div class="popular-item-name">${dish.name}</div>
            <div class="popular-item-description">${dish.description.substring(0, 80)}...</div>
            <div class="text-muted mt-10">
                <small>${calories} cal | ${protein}g protein</small>
            </div>
        `;
    }

    getFoodEmoji(foodName) {
        const name = foodName.toLowerCase();
        
        if (name.includes('dosa')) return '🥞';
        if (name.includes('idli')) return '🍰';
        if (name.includes('vada')) return '🍩';
        if (name.includes('rice') || name.includes('bath')) return '🍚';
        if (name.includes('ragi') || name.includes('mudde')) return '⚪';
        if (name.includes('sambar') || name.includes('rasam')) return '🍲';
        
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

    exportData() {
        const exportData = {
            statistics: this.stats,
            generatedOn: new Date().toISOString(),
            totalItems: this.foodData.length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `karnataka-food-statistics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showAlert('Statistics exported successfully!', 'success');
    }

    async refreshData() {
        this.showLoading();
        await this.loadData();
        this.calculateStatistics();
        this.renderStatistics();
        this.hideLoading();
        this.showAlert('Statistics refreshed!', 'success');
    }

    showLoading() {
        // Could show loading state for each section
        console.log('Loading statistics...');
    }

    hideLoading() {
        console.log('Statistics loaded');
        // Ensure global access
        window.statistics = this;
    }

    showError(message) {
        const container = document.querySelector('.statistics-module .container');
        if (container) {
            container.innerHTML = `
                <div class="empty-stats">
                    <h3>Error Loading Statistics</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.statistics && window.statistics.refreshData()">
                        Try Again
                    </button>
                </div>
            `;
        }
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
}

// Global instance
let statistics;

// Initialize when DOM is loaded
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Statistics;
} else {
    // Browser environment
    window.Statistics = Statistics;
}
