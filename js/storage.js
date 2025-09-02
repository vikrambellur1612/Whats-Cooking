// Client-side Storage Utility for PWA Data Persistence
class DataStorage {
    constructor() {
        this.storageKey = 'whats-cooking-data';
        this.defaultData = {
            'breakfast-catalog': [],
            'mains-catalog': [],
            'side-dishes-catalog': [],
            'accompaniments-catalog': []
        };
    }

    // Get all data from localStorage
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.defaultData;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return this.defaultData;
        }
    }

    // Get data for a specific catalog
    getCatalogData(catalogName) {
        const allData = this.getAllData();
        return allData[catalogName] || [];
    }

    // Save data for a specific catalog
    saveCatalogData(catalogName, items) {
        try {
            const allData = this.getAllData();
            allData[catalogName] = items;
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            
            // Dispatch custom event for data sync
            window.dispatchEvent(new CustomEvent('catalogDataChanged', {
                detail: { catalogName, items }
            }));
            
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Initialize data with default JSON files if localStorage is empty
    async initializeFromJsonFiles() {
        const allData = this.getAllData();
        let hasUpdates = false;

        // Define the catalogs and their corresponding JSON files
        const catalogs = [
            { name: 'breakfast-catalog', jsonFile: '/data/breakfast-catalog.json' },
            { name: 'mains-catalog', jsonFile: '/data/mains-catalog.json' },
            { name: 'side-dishes-catalog', jsonFile: '/data/side-dishes-catalog.json' },
            { name: 'accompaniments-catalog', jsonFile: '/data/accompaniments-catalog.json' }
        ];

        for (const catalog of catalogs) {
            // Only load from JSON if no data exists in localStorage
            if (!allData[catalog.name] || allData[catalog.name].length === 0) {
                try {
                    const response = await fetch(catalog.jsonFile);
                    if (response.ok) {
                        const jsonData = await response.json();
                        const items = this.extractItemsFromJson(jsonData);
                        if (items && items.length > 0) {
                            allData[catalog.name] = items;
                            hasUpdates = true;
                            console.log(`Initialized ${catalog.name} with ${items.length} items from JSON`);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading ${catalog.jsonFile}:`, error);
                }
            }
        }

        // Save updated data if there were any updates
        if (hasUpdates) {
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
        }

        return allData;
    }

    // Extract items from various JSON structures
    extractItemsFromJson(jsonData) {
        // Handle different JSON structures
        if (jsonData.breakfast && jsonData.breakfast.items) {
            return jsonData.breakfast.items;
        } else if (jsonData.mains && jsonData.mains.items) {
            return jsonData.mains.items;
        } else if (jsonData['side-dishes'] && jsonData['side-dishes'].items) {
            return jsonData['side-dishes'].items;
        } else if (jsonData.accompaniments && jsonData.accompaniments.items) {
            return jsonData.accompaniments.items;
        } else if (Array.isArray(jsonData)) {
            return jsonData;
        } else if (jsonData.items && Array.isArray(jsonData.items)) {
            return jsonData.items;
        }
        
        return [];
    }

    // Clear all data (for debugging or reset)
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        console.log('All catalog data cleared from localStorage');
    }

    // Export data as JSON (for backup)
    exportData() {
        const allData = this.getAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `whats-cooking-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Get storage size information
    getStorageInfo() {
        const data = localStorage.getItem(this.storageKey);
        const sizeInBytes = data ? new Blob([data]).size : 0;
        const sizeInKB = Math.round(sizeInBytes / 1024 * 100) / 100;
        
        const allData = this.getAllData();
        const totalItems = Object.values(allData).reduce((sum, items) => sum + items.length, 0);
        
        return {
            sizeInBytes,
            sizeInKB,
            totalItems,
            catalogs: Object.keys(allData).map(key => ({
                name: key,
                itemCount: allData[key].length
            }))
        };
    }
}

// Create global instance
window.dataStorage = new DataStorage();

// Initialize data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.dataStorage.initializeFromJsonFiles();
    console.log('Data storage initialized');
    
    // Initialize modal utilities
    initializeModalUtilities();
    
    // Debug function for developers
    window.clearCatalogData = () => window.dataStorage.clearAllData();
    window.exportCatalogData = () => window.dataStorage.exportData();
    window.getCatalogInfo = () => console.table(window.dataStorage.getStorageInfo());
});

// Modal Utilities
function initializeModalUtilities() {
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                const closeBtn = activeModal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        }
    });
    
    // Close modal when clicking on backdrop
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
            const closeBtn = e.target.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    });
}
