// Development vs Production Data Handling
// This script helps switch between development mode (JSON files) and production mode (localStorage)

class DataManager {
    static isDevelopment() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    static async loadCatalogData(catalogName) {
        if (this.isDevelopment()) {
            console.log(`🔧 Development mode: Loading ${catalogName} from JSON file`);
            try {
                const response = await fetch(`/data/${catalogName}.json`);
                const data = await response.json();
                return this.extractItems(data, catalogName);
            } catch (error) {
                console.error(`Error loading ${catalogName} from JSON:`, error);
                return [];
            }
        } else {
            console.log(`📱 Production mode: Loading ${catalogName} from localStorage/IndexedDB`);
            return this.loadFromLocalStorage(catalogName);
        }
    }

    static extractItems(jsonData, catalogType) {
        const catalogKey = catalogType.replace('-catalog', '');
        if (catalogType === 'side-dishes-catalog') {
            return jsonData.sideDishes?.items || [];
        } else if (jsonData[catalogKey]) {
            return jsonData[catalogKey].items || [];
        } else if (Array.isArray(jsonData)) {
            return jsonData;
        } else {
            console.warn(`Unexpected JSON structure for ${catalogType}:`, jsonData);
            return [];
        }
    }

    static loadFromLocalStorage(catalogName) {
        try {
            const localData = localStorage.getItem(catalogName);
            if (localData) {
                const parsedData = JSON.parse(localData);
                return parsedData.items || [];
            }
            return [];
        } catch (error) {
            console.error(`Error loading ${catalogName} from localStorage:`, error);
            return [];
        }
    }

    static saveCatalogData(catalogName, items) {
        if (this.isDevelopment()) {
            console.log(`🔧 Development mode: Saving ${catalogName} to localStorage (JSON files are read-only in browser)`);
        } else {
            console.log(`📱 Production mode: Saving ${catalogName} to localStorage/IndexedDB`);
        }
        
        // Always save to localStorage for both modes (since we can't write JSON files from browser)
        try {
            const dataToStore = { items: items };
            localStorage.setItem(catalogName, JSON.stringify(dataToStore));
            console.log(`✅ ${catalogName} saved successfully`);
        } catch (error) {
            console.error(`Error saving ${catalogName}:`, error);
        }
    }
}

// Make it globally available
window.DataManager = DataManager;

console.log('DataManager loaded. Current mode:', DataManager.isDevelopment() ? 'Development' : 'Production');
