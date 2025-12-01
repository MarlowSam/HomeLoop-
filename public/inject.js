// inject.js - Header and Footer Injector for HomeLoop

/**
 * Injects header and footer into the page
 * Usage: Include this script at the end of your HTML body
 * Make sure header.html, footer.html, header.css, and footer.css are in the correct paths
 */

// Configuration
const CONFIG = {
  headerPath: 'header.html',
  footerPath: 'footer.html',
  headerCSSPath: 'header.css',
  footerCSSPath: 'footer.css',
  headerPlaceholderId: 'header-placeholder',
  footerPlaceholderId: 'footer-placeholder',
  fontAwesomeCSS: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
};

/**
 * Load CSS file dynamically
 */
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Load HTML file and inject into element
 */
function loadHTML(url, elementId) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = html;
      } else {
        console.warn(`Element with id "${elementId}" not found`);
      }
    })
    .catch(error => {
      console.error(`Error loading ${url}:`, error);
    });
}

/**
 * Initialize header and footer injection
 */
async function initializeComponents() {
  try {
    // Load Font Awesome and CSS files first
    await Promise.all([
      loadCSS(CONFIG.fontAwesomeCSS),
      loadCSS(CONFIG.headerCSSPath),
      loadCSS(CONFIG.footerCSSPath)
    ]);

    // Then load HTML components
    await Promise.all([
      loadHTML(CONFIG.headerPath, CONFIG.headerPlaceholderId),
      loadHTML(CONFIG.footerPath, CONFIG.footerPlaceholderId)
    ]);

    console.log('Header and Footer loaded successfully');
  } catch (error) {
    console.error('Error initializing components:', error);
  }
}

/**
 * Alternative method: Auto-inject at specific positions
 * Automatically creates placeholder divs if they don't exist
 */
function autoInject() {
  // Create header placeholder at the beginning of body if not exists
  if (!document.getElementById(CONFIG.headerPlaceholderId)) {
    const headerDiv = document.createElement('div');
    headerDiv.id = CONFIG.headerPlaceholderId;
    document.body.insertBefore(headerDiv, document.body.firstChild);
  }

  // Create footer placeholder at the end of body if not exists
  if (!document.getElementById(CONFIG.footerPlaceholderId)) {
    const footerDiv = document.createElement('div');
    footerDiv.id = CONFIG.footerPlaceholderId;
    document.body.appendChild(footerDiv);
  }

  // Initialize components
  initializeComponents();
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInject);
} else {
  autoInject();
}

// Export for manual usage
window.HomeLoopInjector = {
  init: initializeComponents,
  loadHeader: () => loadHTML(CONFIG.headerPath, CONFIG.headerPlaceholderId),
  loadFooter: () => loadHTML(CONFIG.footerPath, CONFIG.footerPlaceholderId),
  config: CONFIG
};