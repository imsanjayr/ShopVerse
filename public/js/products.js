// Product catalog functionality

let allProducts = [];
let currentCategory = 'all';
let currentSearch = '';

async function loadProducts() {
    const container = document.getElementById('products-container');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    
    if (loading) loading.classList.remove('hidden');
    if (container) container.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');

    try {
        let url = '/api/products';
        const params = new URLSearchParams();
        
        if (currentCategory && currentCategory !== 'all') {
            params.append('category', currentCategory);
        }
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const products = await response.json();
        allProducts = products;

        if (loading) loading.classList.add('hidden');

        if (products.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        if (loading) loading.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="glass-card hover-card overflow-hidden flex flex-col">
            <div class="relative group">
                <img src="${product.image}" alt="${product.name}" class="w-full h-60 object-cover transition duration-500 group-hover:scale-105">
                <button onclick="addToCart('${product.id}')" class="absolute bottom-4 right-4 bg-white/90 text-dark px-4 py-2 rounded-full text-sm font-semibold shadow-md scale-press hidden group-hover:flex items-center gap-2">
                    <i class="fas fa-plus text-primary"></i> Cart
                </button>
            </div>
            <div class="p-5 flex flex-col flex-1">
                <p class="text-xs uppercase tracking-[0.4em] text-secondary mb-1">${product.category}</p>
                <h3 class="text-lg font-semibold text-dark mb-2 line-clamp-1">${product.name}</h3>
                <p class="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">${product.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-primary">$${product.price.toFixed(2)}</span>
                    <a href="/product?id=${product.id}" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition">
                        Details <i class="fas fa-arrow-right text-xs"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Category filter
document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = btn.dataset.category;
            loadProducts();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                loadProducts();
            }, 300);
        });
    }
});

// Product details page
async function loadProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

        const container = document.getElementById('product-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card overflow-hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 p-8">
                    <div class="relative group">
                        <img src="${product.image}" alt="${product.name}" class="w-full rounded-3xl object-cover transition duration-500 group-hover:scale-105">
                        <span class="absolute top-4 left-4 bg-white/80 px-4 py-1 rounded-full text-xs font-semibold text-slate-700">${product.category}</span>
                    </div>
                    <div class="space-y-5">
                        <h1 class="text-4xl font-display font-semibold text-dark">${product.name}</h1>
                        <p class="text-slate-500 text-lg">${product.description}</p>
                        <div class="flex items-center gap-4">
                            <span class="text-4xl font-bold text-primary">$${product.price.toFixed(2)}</span>
                            <span class="text-sm text-slate-500">Stock: ${product.stock}</span>
                        </div>
                        <div class="flex items-center gap-3 text-sm text-slate-500">
                            <i class="fas fa-shield-alt text-primary"></i>
                            Secure checkout · Free returns within 30 days
                        </div>
                        <button onclick="addToCart('${product.id}')" class="w-full px-6 py-3 bg-primary text-white rounded-2xl hover:bg-indigo-700 transition font-semibold scale-press">
                            <i class="fas fa-shopping-cart mr-2"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Load related products
        loadRelatedProducts(product.category, product.id);
    } catch (error) {
        console.error('Error loading product details:', error);
    }
}

async function loadRelatedProducts(category, excludeId) {
    try {
        const response = await fetch(`/api/products?category=${category}`);
        const products = await response.json();
        const related = products.filter(p => p.id !== excludeId).slice(0, 4);

        const container = document.getElementById('related-products');
        if (!container) return;

        if (related.length === 0) {
            container.innerHTML = '<p class="text-gray-600">No related products found.</p>';
            return;
        }

        container.innerHTML = related.map(product => `
            <div class="glass-card hover-card overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-semibold text-dark mb-2">${product.name}</h3>
                    <p class="text-primary font-bold mb-2">$${product.price.toFixed(2)}</p>
                    <a href="/product?id=${product.id}" class="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        View Details <i class="fas fa-arrow-right text-xs"></i>
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.status === 401) {
            alert('Please login to add items to cart');
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        if (response.ok) {
            showToast('Product added to cart');
            updateCartBadge();
        } else {
            showToast(data.error || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed top-6 right-6 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg z-50 ${
        type === 'success' ? 'bg-primary text-white' : 'bg-red-500 text-white'
    }`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition', 'duration-300', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Make functions available globally
window.loadProductDetails = loadProductDetails;
window.addToCart = addToCart;

