# ನಾಳೆ ಅಡುಗೆ ಏನು? - Karnataka Cuisine PWA 🍽️

A Progressive Web App showcasing authentic Karnataka cuisine with breakfast and meal options. Built with vanilla JavaScript, HTML, and CSS following modern PWA standards.

## 🌟 Features

### Core Functionality
- **Food Catalog Browser** - Visual cards showing Karnataka dishes with nutritional information
- **Search & Filter** - Real-time search and category filtering (breakfast/meals, veg/non-veg)
- **CRUD Operations** - Add, edit, and delete custom dishes
- **Statistics Dashboard** - Analytics and insights about your food catalog
- **PWA Compliance** - Installable app with offline functionality

### Technical Features  
- **Modular Architecture** - Each feature has dedicated HTML, CSS, and JS files
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Service Worker** - Offline caching and background sync
- **Web App Manifest** - Native app-like installation experience
- **Modern UI/UX** - Beautiful gradient design with smooth animations

## 📱 PWA Capabilities

- **Installable** - Add to home screen on mobile/desktop
- **Offline Support** - Works without internet connection
- **App Icons** - Complete icon set for all device sizes
- **Standalone Mode** - Runs like a native app when installed
- **Background Sync** - Updates data when connection is restored

## 🍽️ Food Catalog

### Four Main Sections

**🌅 Breakfast Items (8+ dishes):**
- Mysore Masala Dosa
- Set Dosa  
- Rava Idli
- Medu Vada
- Upma
- Benne Dosa (Davangere style)
- Neer Dosa
- Akki Roti
- And more...

**🍽️ Main Dishes (8+ dishes):**
- Bisi Bele Bath
- Ragi Mudde
- Vangi Bath
- Coconut Rice
- Lemon Rice
- Tomato Rice
- Jolada Rotti
- Vegetable Pulao
- And more...

**🥘 Side Dishes (15+ dishes):**
*Karnataka Style:*
- Sambar, Rasam, Gojju
- Majjige Huli, Tovve
- Badnekayi Yennegai, Beans Palya

*Andhra Style:*
- Andhra Chicken Curry
- Gongura Mutton
- Andhra Dal

*North Indian Style:*
- Paneer Butter Masala
- Dal Makhani, Aloo Gobi
- Bhindi Masala

**🥗 Accompaniments (12+ items):**
- Kosambari (Karnataka salad)
- Cucumber Raita, Boondi Raita
- Mixed Vegetable Raita
- Carrot Kosambari, Beetroot Palya
- Mint Chutney, Coconut Chutney
- Tomato Onion Salad
- Pickled Onions, Papad
- Yogurt Rice

### Nutritional Information
Each dish includes:
- Calories per serving
- Protein content (g)
- Carbohydrates (g)  
- Fat content (g)
- Dietary type (Vegetarian/Non-Vegetarian)
- Applicable meal times

## 🏗️ Project Structure

```
project-root/
├── index.html              # Main application entry
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   ├── main.css           # Global styles
│   └── components.css     # Shared components
├── js/
│   ├── main.js            # Main app controller
│   └── navigation.js      # Navigation system
├── modules/
│   ├── food-catalog/      # Food catalog module
│   │   ├── food-catalog.html
│   │   ├── food-catalog.css
│   │   └── food-catalog.js
│   └── statistics/        # Statistics module
│       ├── statistics.html
│       ├── statistics.css
│       └── statistics.js
├── data/
│   ├── breakfast-catalog.json
│   └── meals-catalog.json
└── assets/
    └── icons/             # PWA icons (8 sizes)
        ├── icon-72x72.png
        ├── icon-96x96.png
        ├── icon-128x128.png
        ├── icon-144x144.png
        ├── icon-152x152.png
        ├── icon-192x192.png
        ├── icon-384x384.png
        └── icon-512x512.png
```

## 🚀 Getting Started

### Local Development

1. **Clone/Download** the project files
2. **Start HTTP Server:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open Browser:** Navigate to `http://localhost:8000`
4. **Install PWA:** Look for the install prompt in your browser

### Testing PWA Features

1. **Installation Test:**
   - Chrome: Look for install button in address bar
   - Safari: Add to Home Screen option
   - Edge: App available option

2. **Offline Test:**
   - Load the app online first
   - Disconnect internet
   - Refresh - app should still work

3. **Mobile Test:**
   - Open on mobile browser
   - Install to home screen
   - Test touch interactions

## 💻 Development

### Adding New Dishes

The app supports adding custom dishes through the UI:

1. Click "Add New Dish" button
2. Fill out the form with dish details
3. Include nutritional information (optional)
4. Save - dish will be stored in localStorage

### Modifying Existing Data

Edit the JSON files in `/data/` directory:
- `breakfast-catalog.json` - Breakfast items
- `meals-catalog.json` - Meal items

Each dish follows this structure:
```json
{
  "id": "unique_id",
  "name": "Dish Name",
  "description": "Description of the dish",
  "type": "vegetarian|non-vegetarian",
  "category": "breakfast|meal", 
  "nutrition": {
    "calories": 250,
    "protein": 8,
    "carbs": 45,
    "fat": 5
  },
  "applicableFor": ["Breakfast", "Lunch", "Dinner"],
  "region": "Karnataka"
}
```

### Adding New Modules

Follow the modular architecture:

1. Create module directory: `modules/module-name/`
2. Add three files:
   - `module-name.html` - Template
   - `module-name.css` - Styles  
   - `module-name.js` - Logic
3. Update `js/main.js` to handle the new module
4. Add navigation button in `index.html`

## 🎨 Design System

### Color Palette
- **Primary:** #667eea (Purple-blue)
- **Secondary:** #764ba2 (Purple)
- **Success:** #4CAF50 (Green)
- **Warning:** #f39c12 (Orange)
- **Error:** #e74c3c (Red)
- **Text:** #2c3e50 (Dark gray)

### Typography
- **Font:** 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Gradient Text:** Used for headings and important elements
- **Responsive:** Scales appropriately on different devices

### Layout Principles
- **CSS Grid:** Responsive card layouts
- **Flexbox:** Component alignment  
- **15px Border Radius:** Modern rounded corners
- **Subtle Shadows:** Depth and elevation
- **Smooth Transitions:** 0.3s ease transitions

## 📊 Statistics Dashboard

The statistics module provides:

- **Overview Cards:** Total dishes, breakfast/meal counts
- **Category Breakdown:** Lists of dishes by type
- **Nutrition Analysis:** Average nutritional values
- **Popular Dishes:** Highlighted regional specialties
- **Export Functionality:** Download statistics as JSON

## 🔧 Technical Specifications

### PWA Requirements
- ✅ Web App Manifest
- ✅ Service Worker with caching
- ✅ HTTPS ready (for production)
- ✅ Responsive meta viewport
- ✅ Complete icon set
- ✅ Offline functionality

### Browser Compatibility
- ✅ Chrome 67+ (Full PWA support)
- ✅ Firefox 79+ (Full PWA support)
- ✅ Safari 14+ (Limited PWA support)
- ✅ Edge 79+ (Full PWA support)

### Performance
- **Lighthouse Score:** Optimized for PWA requirements
- **First Load:** Fast loading with cached resources
- **Bundle Size:** Lightweight vanilla JS approach
- **Image Optimization:** Progressive loading and caching

## 🚢 Deployment

### Netlify Deployment (Recommended)

1. **Connect GitHub Repository:**
   - Push code to: https://github.com/vikrambellur1612/Whats-Cooking
   - Connect to Netlify

2. **Build Settings:**
   - Build command: `(none)` (static site)
   - Publish directory: `./` (root)

3. **Environment:**
   - Add `_redirects` file for SPA routing if needed
   - Configure HTTPS (automatic with Netlify)

### Manual Deployment

1. **Upload Files:** Copy all files to web server
2. **HTTPS Required:** PWA features require HTTPS
3. **Headers:** Ensure proper MIME types for manifest.json
4. **Caching:** Configure server caching for static assets

## 🧪 Testing Checklist

### Functionality Testing
- [ ] Search works correctly
- [ ] Filters apply properly  
- [ ] Add/Edit/Delete operations
- [ ] Statistics calculations
- [ ] Navigation between modules

### PWA Testing
- [ ] Manifest loads correctly
- [ ] Service worker registers
- [ ] App installs on mobile/desktop
- [ ] Offline functionality works
- [ ] Icons display properly

### Cross-Platform Testing  
- [ ] Mobile browsers (Chrome, Safari, Firefox)
- [ ] Desktop browsers (Chrome, Firefox, Edge, Safari)
- [ ] Different screen sizes and orientations
- [ ] Touch interactions on mobile

## 📝 License

This project is built for educational purposes showcasing Karnataka cuisine and modern web development practices.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow the modular architecture
4. Test PWA functionality
5. Submit pull request

## 📞 Support

For questions or issues:
- Check browser console for errors
- Verify HTTPS in production
- Test PWA requirements with Lighthouse
- Review service worker registration

---

**Built with ❤️ for Karnataka cuisine lovers and modern web development enthusiasts!**

🥞 Enjoy exploring authentic Karnataka dishes! 🍛
