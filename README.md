# Logstag - Database Monitoring Platform

A modern, responsive landing page for Logstag, a comprehensive database monitoring platform that provides real-time insights, powerful analytics, and proactive alerts for multiple database engines.

## Features

- **Real-time Monitoring**: Monitor database performance metrics in real-time with customizable dashboards
- **Intelligent Analytics**: Advanced analytics and machine learning algorithms to identify performance bottlenecks
- **Multi-Engine Support**: Support for PostgreSQL, MySQL, MongoDB, Redis, and more
- **Smart Alerts**: Proactive alerting system with customizable thresholds
- **Query Analysis**: Deep dive into slow queries and execution plans
- **Security & Compliance**: Enterprise-grade security with encryption and audit logs

## Technologies Used

- **HTML5**: Semantic markup and modern structure
- **CSS3**: Responsive design with Flexbox and Grid
- **JavaScript**: Interactive features and smooth animations
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter and Space Grotesk typography

## Project Structure

```
logstag-web/
├── assets/                 # Images, icons, and other static assets
│   ├── logo.svg
│   ├── dashboard.png
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
├── index.html             # Main HTML file
├── styles.css             # CSS styles
├── script.js              # JavaScript functionality
├── README.md              # Project documentation
└── .gitignore             # Git ignore file
```

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Prerequisites

1. A GitHub account
2. Git installed on your local machine

### Deployment Steps

1. **Create a new repository on GitHub**
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it `logstag-web` (or any name you prefer)
   - Make it public (required for free GitHub Pages)

2. **Initialize Git and push to GitHub**
   ```bash
   # Initialize git repository
   git init
   
   # Add all files
   git add .
   
   # Commit changes
   git commit -m "Initial commit: Logstag landing page"
   
   # Add remote origin (replace with your repository URL)
   git remote add origin https://github.com/YOUR_USERNAME/logstag-web.git
   
   # Push to GitHub
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"
   - The deployment will start automatically

4. **Access your deployed site**
   - Your site will be available at: `https://YOUR_USERNAME.github.io/logstag-web`
   - The deployment process takes a few minutes to complete

### Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds and deploys the site when you push to the main branch
- Updates the site whenever you make changes
- Provides a live URL for your deployed site

## Local Development

To run the project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/logstag-web.git
   cd logstag-web
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

## Customization

### Updating Content
- Edit `index.html` to modify the content and structure
- Update `styles.css` to change the appearance and styling
- Modify `script.js` to add or change interactive features

### Adding New Sections
1. Add HTML structure in `index.html`
2. Add corresponding CSS styles in `styles.css`
3. Add JavaScript functionality in `script.js` if needed

### Changing Colors and Branding
- Update CSS custom properties in `styles.css`
- Replace logo files in the `assets/` folder
- Modify the color scheme by updating the CSS variables

## Browser Support

This project supports all modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

The site is optimized for performance with:
- Optimized images and assets
- Efficient CSS and JavaScript
- Responsive design for all devices
- Fast loading times

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or support, please contact us through the contact form on the website.

---

**Note**: Make sure to replace `YOUR_USERNAME` with your actual GitHub username in the deployment instructions.
