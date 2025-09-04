#!/usr/bin/env node

/**
 * CSV to Catalog JSON Converter
 * Converts food catalog CSV data to respective JSON catalog files
 * Usage: node csv-to-catalog.js <csv-file-path>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = './data';
const CATALOG_FILES = {
    breakfast: 'breakfast-catalog.json',
    mains: 'mains-catalog.json',
    sides: 'side-dishes-catalog.json',
    accompaniments: 'accompaniments-catalog.json'
};

class CSVToCatalogConverter {
    constructor() {
        this.catalogs = {
            breakfast: { breakfast: { items: [] } },
            mains: { mains: { items: [] } },
            sides: { sideDishes: { items: [] } },
            accompaniments: { accompaniments: { items: [] } }
        };
    }

    /**
     * Parse CSV content into array of objects
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const items = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`Line ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
                continue;
            }

            const item = {};
            headers.forEach((header, index) => {
                item[header] = values[index] ? values[index].trim() : '';
            });

            // Skip empty lines or items without required fields
            if (!item.category || !item.id || !item.name) {
                console.warn(`Line ${i + 1}: Missing required fields (category, id, name). Skipping.`);
                continue;
            }

            items.push(item);
        }

        return items;
    }

    /**
     * Parse a single CSV line handling quoted values and commas
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }

    /**
     * Convert CSV item to catalog item format
     */
    convertToItem(csvItem) {
        const item = {
            id: csvItem.id,
            name: csvItem.name,
            description: csvItem.description || '',
            type: csvItem.type || csvItem.category,
            cuisine: csvItem.cuisine || 'Indian',
            mealTypes: this.parseMealTypes(csvItem.mealTypes),
            nutrition: {
                calories: parseInt(csvItem.calories) || 0,
                protein: parseFloat(csvItem.protein) || 0,
                carbs: parseFloat(csvItem.carbs) || 0,
                fat: parseFloat(csvItem.fat) || 0
            },
            dateAdded: new Date().toISOString()
        };

        // Add notes if present
        if (csvItem.notes && csvItem.notes.trim()) {
            item.notes = csvItem.notes.trim();
        }

        return item;
    }

    /**
     * Parse meal types from string
     */
    parseMealTypes(mealTypesStr) {
        if (!mealTypesStr) return ['vegetarian'];
        
        return mealTypesStr.split('|')
            .map(type => type.trim().toLowerCase())
            .filter(type => type);
    }

    /**
     * Process CSV items and organize by category
     */
    processItems(csvItems) {
        const stats = {
            processed: 0,
            skipped: 0,
            categories: {
                breakfast: 0,
                mains: 0,
                sides: 0,
                accompaniments: 0
            }
        };

        csvItems.forEach((csvItem, index) => {
            try {
                let category = csvItem.category.toLowerCase().trim();
                
                // Map category names for compatibility
                if (category === 'side-dishes') {
                    category = 'sides';
                }
                
                if (!this.catalogs[category]) {
                    console.warn(`Line ${index + 2}: Unknown category '${csvItem.category}'. Skipping.`);
                    stats.skipped++;
                    return;
                }

                const item = this.convertToItem(csvItem);
                
                // Add to appropriate catalog
                if (category === 'sides') {
                    this.catalogs.sides.sideDishes.items.push(item);
                } else {
                    this.catalogs[category][category].items.push(item);
                }

                stats.categories[category]++;
                stats.processed++;
                
            } catch (error) {
                console.error(`Line ${index + 2}: Error processing item - ${error.message}`);
                stats.skipped++;
            }
        });

        return stats;
    }

    /**
     * Backup existing catalog files
     */
    backupExistingCatalogs() {
        const backupDir = path.join(DATA_DIR, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        Object.entries(CATALOG_FILES).forEach(([category, filename]) => {
            const filePath = path.join(DATA_DIR, filename);
            if (fs.existsSync(filePath)) {
                const backupPath = path.join(backupDir, `${timestamp}-${filename}`);
                fs.copyFileSync(filePath, backupPath);
                console.log(`✅ Backed up ${filename} to ${backupPath}`);
            }
        });
    }

    /**
     * Write catalog data to JSON files
     */
    writeCatalogFiles() {
        Object.entries(CATALOG_FILES).forEach(([category, filename]) => {
            const filePath = path.join(DATA_DIR, filename);
            const catalogData = this.catalogs[category];
            
            try {
                fs.writeFileSync(filePath, JSON.stringify(catalogData, null, 2));
                console.log(`✅ Written ${catalogData[category === 'sides' ? 'sideDishes' : category].items.length} items to ${filename}`);
            } catch (error) {
                console.error(`❌ Error writing ${filename}: ${error.message}`);
            }
        });
    }

    /**
     * Validate catalog structure
     */
    validateCatalogs() {
        let isValid = true;
        const errors = [];

        Object.entries(this.catalogs).forEach(([category, catalog]) => {
            const key = category === 'sides' ? 'sideDishes' : category;
            
            if (!catalog[key] || !Array.isArray(catalog[key].items)) {
                errors.push(`Invalid structure for ${category} catalog`);
                isValid = false;
                return;
            }

            catalog[key].items.forEach((item, index) => {
                if (!item.id || !item.name) {
                    errors.push(`${category} item ${index + 1}: Missing required fields`);
                    isValid = false;
                }
            });
        });

        if (!isValid) {
            console.error('❌ Validation errors found:');
            errors.forEach(error => console.error(`   ${error}`));
        }

        return isValid;
    }

    /**
     * Main conversion process
     */
    async convert(csvFilePath) {
        try {
            console.log('🚀 Starting CSV to Catalog conversion...');
            
            // Check if CSV file exists
            if (!fs.existsSync(csvFilePath)) {
                throw new Error(`CSV file not found: ${csvFilePath}`);
            }

            // Read and parse CSV
            console.log('📖 Reading CSV file...');
            const csvContent = fs.readFileSync(csvFilePath, 'utf8');
            const csvItems = this.parseCSV(csvContent);
            console.log(`📊 Found ${csvItems.length} items in CSV`);

            // Backup existing catalogs
            console.log('💾 Backing up existing catalogs...');
            this.backupExistingCatalogs();

            // Process items
            console.log('⚙️ Processing items...');
            const stats = this.processItems(csvItems);

            // Validate catalogs
            console.log('🔍 Validating catalog structure...');
            if (!this.validateCatalogs()) {
                throw new Error('Catalog validation failed');
            }

            // Write catalog files
            console.log('💾 Writing catalog files...');
            this.writeCatalogFiles();

            // Print summary
            console.log('\n🎉 Conversion completed successfully!');
            console.log('\n📈 Summary:');
            console.log(`   Total items processed: ${stats.processed}`);
            console.log(`   Items skipped: ${stats.skipped}`);
            console.log('\n📊 Items by category:');
            Object.entries(stats.categories).forEach(([category, count]) => {
                if (count > 0) {
                    console.log(`   ${category}: ${count} items`);
                }
            });

            return true;

        } catch (error) {
            console.error(`❌ Conversion failed: ${error.message}`);
            return false;
        }
    }
}

// Main execution
if (require.main === module) {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
        console.error('❌ Usage: node csv-to-catalog.js <csv-file-path>');
        console.log('\n📝 CSV Format:');
        console.log('   category,id,name,description,type,cuisine,mealTypes,calories,protein,carbs,fat,notes');
        console.log('\n📂 Categories: breakfast, mains, sides, accompaniments');
        console.log('📱 Meal Types: vegetarian, vegan, non-vegetarian (use | to separate multiple)');
        console.log('\n💡 Example CSV template available at: templates/food-catalog-template.csv');
        process.exit(1);
    }

    const converter = new CSVToCatalogConverter();
    converter.convert(csvFilePath).then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = CSVToCatalogConverter;
