# AlgoWorkout Landing Page

A professional, modern landing page for AlgoWorkout - an educational algorithmic trading platform.

## 🚀 Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern Aesthetics**: Gradient backgrounds, smooth animations, and glassmorphism effects
- **SEO Optimized**: Proper meta tags and semantic HTML structure
- **Clean Code**: Separated CSS, JavaScript, and HTML for easy maintenance
- **Smooth Scrolling**: Navigation links smoothly scroll to sections
- **Animated Elements**: Fade-in animations triggered on scroll

## 📁 Project Structure

```
startup/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles (organized by section)
├── js/
│   └── main.js         # JavaScript for interactions and animations
├── assets/
│   └── images/         # Image assets (currently empty)
└── README.md           # This file
```

## 🛠️ Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript**: Smooth scrolling and scroll animations
- **Google Fonts**: Outfit (main) and JetBrains Mono (code)

## 🎨 Design System

### Color Palette
- **Primary**: `#00ff88` (Vibrant green)
- **Secondary**: `#0088ff` (Electric blue)
- **Accent**: `#ff0088` (Hot pink)
- **Background Dark**: `#0a0e1a`
- **Background Darker**: `#060912`
- **Card Background**: `#111827`

### Typography
- **Main Font**: Outfit (300, 400, 600, 700, 800)
- **Code Font**: JetBrains Mono (400, 600)

## 🚀 Getting Started

### Local Development

Simply open `index.html` in your web browser:

```bash
# Navigate to the project directory
cd /Users/sabban/Desktop/startup

# Open in default browser (macOS)
open index.html

# Or use a local server for better development experience
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Using a Local Server (Recommended)

For the best development experience, use a local server:

**Option 1: Python**
```bash
python3 -m http.server 8000
```

**Option 2: npm's http-server**
```bash
npx http-server -p 8000
```

**Option 3: VS Code Live Server**
- Install the "Live Server" extension
- Right-click `index.html` and select "Open with Live Server"

## 📝 Customization

### Updating Colors
Edit the CSS variables in `css/styles.css`:
```css
:root {
    --primary: #00ff88;
    --secondary: #0088ff;
    /* ... other variables */
}
```

### Adding Sections
1. Add HTML content in `index.html`
2. Add corresponding styles in `css/styles.css`
3. Update navigation links if needed

### Modifying Animations
Edit the animation configurations in `js/main.js` and `css/styles.css`

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## ✨ Key Features Implemented

- ✅ Animated gradient background
- ✅ Smooth scroll navigation
- ✅ Intersection Observer scroll animations
- ✅ Responsive grid layouts
- ✅ Hover effects on cards
- ✅ SEO meta tags
- ✅ Organized, maintainable code structure

## 🔮 Future Enhancements

- [ ] Mobile hamburger menu
- [ ] Form validation for CTAs
- [ ] Dark/light mode toggle
- [ ] More interactive demos
- [ ] Performance optimizations
- [ ] A/B testing setup

## 📄 License

All rights reserved © 2026 AlgoWorkout

---

Made with ❤️ for traders who want to learn
