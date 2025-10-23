// IMPORTANT: This is a minimal placeholder
// Copy the full content.js from the artifacts above for production use
// The full version includes:
// - Site-specific extractors for Amazon, Micro Center, Steam, Newegg, Best Buy
// - Screenshot capture functionality
// - Floating button creation
// - Email selection modal
// - Complete error handling

console.log('Wishlist Notifier content script loaded');
console.log('⚠️ Copy full content.js from artifacts for production use');
// Site-specific product extractors
const siteExtractors = {
    'www.amazon.com': {
        name: () => document.querySelector('#productTitle')?.textContent.trim() || 
                    document.querySelector('span.product-title-word-break')?.textContent.trim(),
        price: () => {
            const whole = document.querySelector('.a-price-whole')?.textContent.trim();
            const fraction = document.querySelector('.a-price-fraction')?.textContent.trim();
            return whole ? `$${whole}${fraction || ''}` : 'Price not available';
        },
        imageSelector: '#landingImage, #imgBlkFront, .a-dynamic-image',
        storeName: 'Amazon'
    },
    
    'www.microcenter.com': {
        name: () => document.querySelector('[data-name="product_name"]')?.textContent.trim() ||
                    document.querySelector('h1[itemprop="name"]')?.textContent.trim(),
        price: () => {
            const price = document.querySelector('[itemprop="price"]')?.textContent.trim() ||
                         document.querySelector('.price')?.textContent.trim();
            return price || 'Price not available';
        },
        imageSelector: '.product-image-gallery img, [itemprop="image"]',
        storeName: 'Micro Center'
    },
    
    'store.steampowered.com': {
        name: () => document.querySelector('.apphub_AppName')?.textContent.trim(),
        price: () => {
            const price = document.querySelector('.game_purchase_price')?.textContent.trim() ||
                         document.querySelector('.discount_final_price')?.textContent.trim();
            return price || 'Free to Play';
        },
        imageSelector: '.game_header_image_full',
        storeName: 'Steam'
    },
    
    'www.newegg.com': {
        name: () => document.querySelector('.product-title')?.textContent.trim() ||
                    document.querySelector('h1.product-title')?.textContent.trim(),
        price: () => {
            const price = document.querySelector('.price-current')?.textContent.trim();
            return price || 'Price not available';
        },
        imageSelector: '.product-view-img-original img',
        storeName: 'Newegg'
    },
    
    'www.bestbuy.com': {
        name: () => document.querySelector('.sku-title h1')?.textContent.trim() ||
                    document.querySelector('[itemprop="name"]')?.textContent.trim(),
        price: () => {
            const price = document.querySelector('.priceView-customer-price span')?.textContent.trim() ||
                         document.querySelector('[itemprop="price"]')?.textContent.trim();
            return price || 'Price not available';
        },
        imageSelector: '.primary-image, [class*="MediaGallery"] img',
        storeName: 'Best Buy'
    }
};

// Get current site's extractor
function getCurrentExtractor() {
    const hostname = window.location.hostname;
    return siteExtractors[hostname];
}

// Extract product information
function extractProductInfo() {
    const extractor = getCurrentExtractor();
    if (!extractor) return null;
    
    return {
        name: extractor.name(),
        price: extractor.price(),
        url: window.location.href,
        storeName: extractor.storeName,
        imageSelector: extractor.imageSelector
    };
}

// Capture screenshot of product image
async function captureProductImage(selector) {
    return new Promise((resolve) => {
        const img = document.querySelector(selector);
        if (!img) {
            resolve(null);
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Wait for image to load
        if (!img.complete) {
            img.onload = () => drawAndResolve();
        } else {
            drawAndResolve();
        }
        
        function drawAndResolve() {
            const maxWidth = 800;
            const maxHeight = 800;
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            
            // Scale down if too large
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            try {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (error) {
                console.error('Error capturing image:', error);
                resolve(null);
            }
        }
    });
}

// Send notification
async function sendNotification(recipientEmail) {
    const product = extractProductInfo();
    if (!product || !product.name) {
        return { success: false, error: 'Could not extract product information' };
    }
    
    // Get settings
    const data = await chrome.storage.sync.get(['senderName', 'backendUrl']);
    const backendUrl = data.backendUrl || 'http://localhost:8080';
    const senderName = data.senderName || '';
    
    // Capture screenshot
    const screenshot = await captureProductImage(product.imageSelector);
    
    try {
        const response = await fetch(`${backendUrl}/api/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientEmail: recipientEmail,
                productName: product.name,
                productPrice: product.price,
                productUrl: product.url,
                storeName: product.storeName,
                screenshot: screenshot,
                senderName: senderName
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send notification');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
}

// Create floating button
function createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('wishlist-notify-btn')) return;
    
    const extractor = getCurrentExtractor();
    if (!extractor) return;
    
    const button = document.createElement('button');
    button.id = 'wishlist-notify-btn';
    button.innerHTML = '💝 Send Hint';
    button.className = 'wishlist-notify-button';
    
    button.addEventListener('click', async () => {
        button.disabled = true;
        button.innerHTML = '⏳ Loading...';
        
        // Get recipient emails
        const data = await chrome.storage.sync.get(['emails']);
        const emails = data.emails || [];
        
        if (emails.length === 0) {
            showToast('Please add recipient emails in the extension settings', 'error');
            button.disabled = false;
            button.innerHTML = '💝 Send Hint';
            return;
        }
        
        // If multiple emails, show selection modal
        if (emails.length > 1) {
            showEmailSelectionModal(emails, button);
        } else {
            // Send to the only email
            await sendToRecipient(emails[0], button);
        }
    });
    
    document.body.appendChild(button);
}

// Show email selection modal
function showEmailSelectionModal(emails, button) {
    const modal = document.createElement('div');
    modal.className = 'wishlist-modal';
    modal.innerHTML = `
        <div class="wishlist-modal-content">
            <h3>Select Recipient</h3>
            <div class="wishlist-email-options">
                ${emails.map(email => `
                    <button class="wishlist-email-option" data-email="${email}">
                        ${email}
                    </button>
                `).join('')}
            </div>
            <button class="wishlist-modal-close">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle email selection
    modal.querySelectorAll('.wishlist-email-option').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email;
            modal.remove();
            await sendToRecipient(email, button);
        });
    });
    
    // Handle cancel
    modal.querySelector('.wishlist-modal-close').addEventListener('click', () => {
        modal.remove();
        button.disabled = false;
        button.innerHTML = '💝 Send Hint';
    });
}

// Send to specific recipient
async function sendToRecipient(email, button) {
    const result = await sendNotification(email);
    
    if (result.success) {
        showToast('Hint sent successfully! 💝', 'success');
        button.innerHTML = '✓ Sent!';
        setTimeout(() => {
            button.innerHTML = '💝 Send Hint';
        }, 3000);
    } else {
        showToast(`Failed to send: ${result.error}`, 'error');
        button.innerHTML = '💝 Send Hint';
    }
    
    button.disabled = false;
}

// Show toast notification
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `wishlist-toast wishlist-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize
if (getCurrentExtractor()) {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFloatingButton);
    } else {
        createFloatingButton();
    }
    
    // Also try again after a delay in case elements load later
    setTimeout(createFloatingButton, 2000);
}