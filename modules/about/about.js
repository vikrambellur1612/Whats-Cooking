// About Module - Product Information and Developer Tools
class About {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing About module...');
        this.setupEventListeners();
        
        // Ensure global access
        window.about = this;
        console.log('About module initialized. Global instance:', window.about);
    }

    setupEventListeners() {
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
    }

    // Download all catalogs functionality
    async downloadAllCatalogs() {
        try {
            // Use the dashboard instance if available, otherwise implement locally
            if (window.dashboard && typeof window.dashboard.downloadAllCatalogs === 'function') {
                window.dashboard.downloadAllCatalogs();
            } else {
                // Fallback implementation
                await this.downloadAllCatalogsLocal();
            }
        } catch (error) {
            console.error('Error downloading catalogs:', error);
            this.showAlert('Failed to download catalogs. Please try again.', 'error');
        }
    }

    async downloadAllCatalogsLocal() {
        const catalogs = [
            { file: 'breakfast-catalog.json', name: 'Breakfast Dishes' },
            { file: 'mains-catalog.json', name: 'Main Dishes' },
            { file: 'side-dishes-catalog.json', name: 'Side Dishes' },
            { file: 'accompaniments-catalog.json', name: 'Accompaniments' }
        ];

        let downloadCount = 0;

        for (const catalog of catalogs) {
            try {
                const response = await fetch(`/data/${catalog.file}`);
                const data = await response.json();
                
                // Create downloadable JSON file
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Create temporary download link
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = catalog.file;
                downloadLink.style.display = 'none';
                
                // Trigger download
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up
                URL.revokeObjectURL(url);
                downloadCount++;
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error downloading ${catalog.file}:`, error);
            }
        }

        this.showAlert(
            `📥 Downloaded ${downloadCount} catalog files!

📁 Files saved to your Downloads folder:
${catalogs.map(c => `• ${c.file}`).join('\n')}

💡 These files contain the complete catalog data for backup or development purposes.`,
            'success'
        );
    }

    // Clear local storage functionality
    clearLocalStorage() {
        try {
            // Use the dashboard instance if available, otherwise implement locally
            if (window.dashboard && typeof window.dashboard.clearLocalStorage === 'function') {
                window.dashboard.clearLocalStorage();
            } else {
                // Fallback implementation
                this.clearLocalStorageLocal();
            }
        } catch (error) {
            console.error('Error clearing local storage:', error);
            this.showAlert('Failed to clear local storage. Please try again.', 'error');
        }
    }

    clearLocalStorageLocal() {
        const catalogs = ['breakfast-catalog', 'mains-catalog', 'side-dishes-catalog', 'accompaniments-catalog'];
        
        if (confirm('Are you sure you want to clear local storage cache? This will refresh the app to show only the dishes saved in the server files. Any dishes that were only saved locally (due to server errors) will be lost.')) {
            catalogs.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.showAlert('🗑️ Local storage cleared! Refreshing to show current server data...', 'info');
            
            // Automatically refresh after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    // Alert system (similar to dashboard)
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
        alert.innerHTML = message.replace(/\n/g, '<br>');
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '350px';
        alert.style.maxWidth = '500px';
        alert.style.padding = '20px';
        alert.style.borderRadius = '8px';
        alert.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        alert.style.fontWeight = '500';
        alert.style.lineHeight = '1.5';
        alert.style.whiteSpace = 'pre-line';
        
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
        
        // Auto remove after appropriate time
        const autoRemoveTime = message.length > 100 ? 8000 : 4000;
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, autoRemoveTime);
        
        // Add click to dismiss
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
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
}

// Note: Initialization is handled by main.js module loader
// No automatic DOMContentLoaded initialization needed
