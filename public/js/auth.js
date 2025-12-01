// Authentication utilities

async function checkAuth() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        const data = await response.json();
        
        updateNavbar(data.user);
        return data.user;
    } catch (error) {
        console.error('Auth check error:', error);
        updateNavbar(null);
        return null;
    }
}

function updateNavbar(user) {
    const authLinks = document.getElementById('auth-links');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
    
    if (!authLinks && !mobileAuthLinks) return;

    if (user) {
        const desktopLinks = `
            <a href="/orders" class="text-sm font-semibold text-slate-600 hover:text-primary transition">My Orders</a>
            <button onclick="logout()" class="text-sm font-semibold text-slate-600 hover:text-primary transition">Logout</button>
        `;
        const mobileLinks = `
            <a href="/orders" class="block py-2 text-slate-600 hover:text-primary">My Orders</a>
            <button onclick="logout()" class="block py-2 text-left w-full text-slate-600 hover:text-primary">Logout</button>
        `;
        
        if (authLinks) authLinks.innerHTML = desktopLinks;
        if (mobileAuthLinks) mobileAuthLinks.innerHTML = mobileLinks;
    } else {
        const desktopLinks = `
            <a href="/login" class="text-sm font-semibold text-slate-600 hover:text-primary transition">Login</a>
            <a href="/register" class="text-sm font-semibold text-slate-600 hover:text-primary transition">Register</a>
        `;
        const mobileLinks = `
            <a href="/login" class="block py-2 text-slate-600 hover:text-primary">Login</a>
            <a href="/register" class="block py-2 text-slate-600 hover:text-primary">Register</a>
        `;
        
        if (authLinks) authLinks.innerHTML = desktopLinks;
        if (mobileAuthLinks) mobileAuthLinks.innerHTML = mobileLinks;
    }
}

async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function updateCartBadge() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            // User not logged in, hide badge
            const badge = document.getElementById('cart-badge');
            if (badge) badge.classList.add('hidden');
            return;
        }
        
        const cart = await response.json();
        const badge = document.getElementById('cart-badge');
        
        if (badge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (error) {
        // Silently fail if cart can't be loaded
        const badge = document.getElementById('cart-badge');
        if (badge) badge.classList.add('hidden');
    }
}

