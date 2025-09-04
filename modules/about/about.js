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

        // CSV functionality buttons
        const exportCSVBtn = document.getElementById('exportToCsvBtn');
        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => {
                this.exportAllToCSV();
            });
        }

        const downloadTemplateBtn = document.getElementById('downloadCsvTemplateBtn');
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => {
                this.downloadCSVTemplate();
            });
        }

        const importCSVBtn = document.getElementById('importFromCsvBtn');
        if (importCSVBtn) {
            importCSVBtn.addEventListener('click', () => {
                this.importFromCSV();
            });
        }

        // File input change listener
        const csvFileInput = document.getElementById('csvFileInput');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (event) => {
                const importBtn = document.getElementById('importFromCsvBtn');
                if (importBtn) {
                    importBtn.disabled = !event.target.files || event.target.files.length === 0;
                }
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

    // CSV Export functionality
    async exportAllToCSV() {
        try {
            this.showAlert('📊 Exporting all catalogs to CSV...', 'info');
            
            const catalogs = [
                { file: 'breakfast-catalog.json', category: 'breakfast' },
                { file: 'mains-catalog.json', category: 'mains' },
                { file: 'side-dishes-catalog.json', category: 'side-dishes' },
                { file: 'accompaniments-catalog.json', category: 'accompaniments' }
            ];

            const allItems = [];
            let loadedCount = 0;

            for (const catalog of catalogs) {
                try {
                    const response = await fetch(`/data/${catalog.file}`);
                    const data = await response.json();
                    
                    // Handle nested JSON structure: {category: {items: [...]}}
                    let items = [];
                    if (catalog.category === 'side-dishes') {
                        // Special case: side-dishes uses 'sideDishes' as the key
                        if (data.sideDishes && Array.isArray(data.sideDishes.items)) {
                            items = data.sideDishes.items;
                        }
                    } else if (data[catalog.category] && Array.isArray(data[catalog.category].items)) {
                        items = data[catalog.category].items;
                    } else if (Array.isArray(data)) {
                        items = data;
                    } else {
                        console.warn(`Unexpected data structure in ${catalog.file}:`, data);
                        continue;
                    }
                    
                    items.forEach(item => {
                        // Handle nested nutrition object
                        const nutrition = item.nutrition || {};
                        allItems.push({
                            category: catalog.category,
                            id: item.id || '',
                            name: item.name || '',
                            description: item.description || '',
                            type: item.type || '',
                            cuisine: item.cuisine || '',
                            mealTypes: Array.isArray(item.mealTypes) ? item.mealTypes.join('|') : '',
                            calories: String(nutrition.calories || item.calories || ''),
                            protein: String(nutrition.protein || item.protein || ''),
                            carbs: String(nutrition.carbs || item.carbs || ''),
                            fat: String(nutrition.fat || item.fat || ''),
                            notes: item.notes || ''
                        });
                    });
                    
                    loadedCount++;
                } catch (error) {
                    console.error(`Error loading ${catalog.file}:`, error);
                }
            }

            if (allItems.length === 0) {
                this.showAlert('❌ No catalog items found to export!', 'warning');
                return;
            }

            // Generate CSV content
            const headers = ['category', 'id', 'name', 'description', 'type', 'cuisine', 'mealTypes', 'calories', 'protein', 'carbs', 'fat', 'notes'];
            let csvContent = headers.join(',') + '\n';

            allItems.forEach(item => {
                const row = headers.map(header => {
                    let value = String(item[header] || ''); // Ensure value is a string
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = '"' + value.replace(/"/g, '""') + '"';
                    }
                    return value;
                });
                csvContent += row.join(',') + '\n';
            });

            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'food-catalog-export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showAlert(`✅ Successfully exported ${allItems.length} items to CSV!\n\nFile saved as: food-catalog-export.csv\nLoaded from ${loadedCount} catalog files`, 'success');

        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.showAlert('❌ Failed to export catalogs to CSV. Please try again.', 'error');
        }
    }

    // Download CSV Template
    downloadCSVTemplate() {
        const headers = ['category', 'id', 'name', 'description', 'type', 'cuisine', 'mealTypes', 'calories', 'protein', 'carbs', 'fat', 'notes'];
        const sampleData = [
            ['breakfast', 'bf001', 'Sample Dosa', 'Crispy rice crepe with spicy chutney', 'breakfast', 'South Indian', 'vegetarian', '320', '8', '58', '7', 'Served with sambar and chutney'],
            ['mains', 'mn001', 'Sample Curry', 'Spicy vegetable curry with aromatic spices', 'vegetarian', 'Indian', 'lunch|dinner', '280', '12', '35', '8', 'Best served with rice or roti'],
            ['side-dishes', 'sd001', 'Sample Sabji', 'Traditional vegetable side dish', 'vegetarian', 'Indian', 'lunch|dinner', '150', '5', '20', '6', 'Pairs well with dal and rice'],
            ['accompaniments', 'ac001', 'Sample Chutney', 'Fresh coconut chutney with herbs', 'condiment', 'South Indian', 'breakfast|lunch|dinner', '80', '2', '8', '6', 'Perfect with dosa and idli']
        ];
        
        let csvContent = headers.join(',') + '\n';
        sampleData.forEach(row => {
            const formattedRow = row.map(cell => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    return '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell;
            });
            csvContent += formattedRow.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'food-catalog-template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showAlert('📄 CSV template downloaded!\n\nFile: food-catalog-template.csv\n\n📝 Instructions:\n1. Fill in your catalog data\n2. Use | to separate multiple meal types\n3. Categories: breakfast, mains, side-dishes, accompaniments\n4. Import the completed file using the Import CSV tool', 'success');
    }

    // Import CSV functionality
    importFromCSV() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput ? fileInput.files[0] : null;
        
        if (!file) {
            this.showAlert('❌ Please select a CSV file first!', 'warning');
            return;
        }

        this.processSelectedCSVFile(file);
    }

    async processSelectedCSVFile(file) {
        try {
            this.showAlert('📊 Processing CSV import...', 'info');
            
            const text = await file.text();
            const result = await this.processCSVImport(text);
            
            if (result.success) {
                this.showAlert(`✅ CSV Import Successful!\n\n📊 Processing Summary:\n• Total rows: ${result.totalRows}\n• Valid items: ${result.validItems}\n• Skipped rows: ${result.skippedRows}\n\n${result.summary}\n\n💡 Note: This is a preview. Use the Node.js script (csv-to-catalog.js) for actual file updates.`, 'success');
                
                // Update status div
                const statusDiv = document.getElementById('importStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="import-success">
                            <h5>✅ Import Preview Complete</h5>
                            <p><strong>Valid items:</strong> ${result.validItems}</p>
                            <p><strong>Total processed:</strong> ${result.totalRows}</p>
                        </div>
                    `;
                }
                
            } else {
                this.showAlert(`❌ CSV Import Failed!\n\n${result.error}`, 'error');
                
                // Update status div
                const statusDiv = document.getElementById('importStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="import-error">
                            <h5>❌ Import Failed</h5>
                            <p>${result.error}</p>
                        </div>
                    `;
                }
            }

        } catch (error) {
            console.error('Error importing CSV:', error);
            this.showAlert('❌ Failed to process CSV file. Please check the file format.', 'error');
            
            // Update status div
            const statusDiv = document.getElementById('importStatus');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="import-error">
                        <h5>❌ Processing Error</h5>
                        <p>Failed to read or process the CSV file.</p>
                    </div>
                `;
            }
        }
    }

    async processCSVImport(csvText) {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 2) {
            return { success: false, error: 'CSV file appears to be empty or has no data rows.' };
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['category', 'name'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            return { success: false, error: `Missing required headers: ${missingHeaders.join(', ')}` };
        }

        const catalogData = {
            breakfast: [],
            mains: [],
            'side-dishes': [],
            accompaniments: []
        };

        let validItems = 0;
        let skippedRows = 0;
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVRow(lines[i]);
                if (values.length !== headers.length) {
                    skippedRows++;
                    errors.push(`Row ${i + 1}: Column count mismatch`);
                    continue;
                }

                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });

                if (!item.category || !item.name) {
                    skippedRows++;
                    errors.push(`Row ${i + 1}: Missing category or name`);
                    continue;
                }

                const category = item.category.toLowerCase();
                if (!catalogData[category]) {
                    skippedRows++;
                    errors.push(`Row ${i + 1}: Invalid category '${item.category}'`);
                    continue;
                }

                // Process the item
                const processedItem = {
                    id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: item.name,
                    description: item.description || '',
                    type: item.type || 'traditional',
                    cuisine: item.cuisine || '',
                    mealTypes: item.mealTypes ? item.mealTypes.split('|').map(t => t.trim()) : [],
                    calories: item.calories ? parseInt(item.calories) || 0 : 0,
                    protein: item.protein ? parseInt(item.protein) || 0 : 0,
                    carbs: item.carbs ? parseInt(item.carbs) || 0 : 0,
                    fat: item.fat ? parseInt(item.fat) || 0 : 0,
                    notes: item.notes || ''
                };

                catalogData[category].push(processedItem);
                validItems++;

            } catch (error) {
                skippedRows++;
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        const summary = Object.entries(catalogData)
            .filter(([, items]) => items.length > 0)
            .map(([category, items]) => `• ${category}: ${items.length} items`)
            .join('\n');

        return {
            success: true,
            totalRows: lines.length - 1,
            validItems,
            skippedRows,
            summary: summary || '• No valid items processed',
            data: catalogData,
            errors: errors.slice(0, 10) // Limit error display
        };
    }

    parseCSVRow(row) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < row.length) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        values.push(current);
        return values.map(v => v.trim());
    }
}

// Note: Initialization is handled by main.js module loader
// No automatic DOMContentLoaded initialization needed
