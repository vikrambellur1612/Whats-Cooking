// Clear localStorage helper script
console.log('Clearing all catalog data from localStorage...');

// List of storage keys to clear
const catalogKeys = [
    'mains-catalog',
    'breakfast-catalog', 
    'side-dishes-catalog',
    'accompaniments-catalog',
    'meals-catalog'
];

catalogKeys.forEach(key => {
    if (localStorage.getItem(key)) {
        console.log(`Clearing ${key}:`, localStorage.getItem(key));
        localStorage.removeItem(key);
        console.log(`✅ ${key} cleared`);
    } else {
        console.log(`ℹ️ ${key} was already empty`);
    }
});

console.log('✨ All catalog localStorage cleared! Refresh the page to load clean data from JSON files.');
