// Shopping cart functionality

async function loadCart() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const cart = await response.json();
        const container = document.getElementById('cart-container');
        const emptyCart = document.getElementById('empty-cart');

        if (cart.length === 0) {
            if (container) container.innerHTML = '';
            if (emptyCart) emptyCart.classList.remove('hidden');
            return;
        }

        if (emptyCart) emptyCart.classList.add('hidden');

        if (container) {
            let subtotal = 0;
            cart.forEach(item => {
                if (item.product) {
                    subtotal += item.product.price * item.quantity;
                }
            });

            const tax = subtotal * 0.1;
            const total = subtotal + tax;
            const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

            container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
                    <div class="space-y-4">
                        ${cart.map(item => {
                            if (!item.product) return '';
                            const itemTotal = item.product.price * item.quantity;
                            return `
                                <div class="glass-card p-5 flex flex-col md:flex-row gap-5 items-center md:items-stretch fade-in" id="cart-item-${item.productId}">
                                    <img src="${item.product.image}" alt="${item.product.name}" class="w-full md:w-32 h-32 object-cover rounded-2xl">
                                    <div class="flex-1 w-full">
                                        <div class="flex items-center justify-between mb-2">
                                            <h3 class="text-lg font-semibold text-dark">${item.product.name}</h3>
                                            <button onclick="animateRemove('${item.productId}')" class="text-red-500 hover:text-red-600 transition">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <p class="text-slate-500 text-sm mb-3">$${item.product.price.toFixed(2)} per item</p>
                                        <div class="flex items-center justify-between">
                                            <div class="inline-flex items-center gap-3 bg-white/80 border border-white/60 rounded-full px-4 py-2">
                                                <button onclick="changeQuantity('${item.productId}', -1)" class="text-primary text-lg font-bold">-</button>
                                                <span data-qty="${item.productId}" class="text-dark font-semibold min-w-[24px] text-center">${item.quantity}</span>
                                                <button onclick="changeQuantity('${item.productId}', 1)" class="text-primary text-lg font-bold">+</button>
                                            </div>
                                            <p class="text-xl font-bold text-dark">$${itemTotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div>
                        <div class="glass-card p-6 sticky top-24">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <p class="text-sm uppercase tracking-[0.3em] text-secondary">Summary</p>
                                    <h2 class="text-2xl font-semibold text-dark">Order details</h2>
                                </div>
                                <span class="px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">${itemCount} items</span>
                            </div>
                            <div class="space-y-3 text-sm text-slate-600 mb-4">
                                <div class="flex justify-between">
                                    <span>Subtotal</span>
                                    <span class="font-semibold text-dark">$${subtotal.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Tax (10%)</span>
                                    <span class="font-semibold text-dark">$${tax.toFixed(2)}</span>
                                </div>
                                <div class="border-t border-slate-100 pt-3 flex justify-between text-base font-semibold text-dark">
                                    <span>Total</span>
                                    <span>$${total.toFixed(2)}</span>
                                </div>
                            </div>
                            <a href="/checkout" class="block w-full text-center px-6 py-3 bg-primary text-white rounded-full hover:bg-indigo-700 transition font-semibold">
                                Proceed to Checkout
                            </a>
                            <a href="/" class="block w-full text-center mt-3 px-6 py-3 border border-primary/20 text-primary rounded-full hover:bg-primary/5 transition">
                                Continue Shopping
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

async function updateQuantity(productId, quantity) {
    if (quantity < 1) {
        removeItem(productId);
        return;
    }

    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });

        if (response.ok) {
            loadCart();
            updateCartBadge();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function removeItem(productId) {
    try {
        const response = await fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            loadCart();
            updateCartBadge();
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

function changeQuantity(productId, delta) {
    const qtyElement = document.querySelector(`[data-qty="${productId}"]`);
    if (!qtyElement) return;
    const current = parseInt(qtyElement.textContent, 10) || 1;
    const newQuantity = Math.max(1, current + delta);
    updateQuantity(productId, newQuantity);
}

function animateRemove(productId) {
    const card = document.getElementById(`cart-item-${productId}`);
    if (card) {
        card.classList.add('opacity-0', 'scale-95', 'transition', 'duration-200');
        setTimeout(() => removeItem(productId), 180);
    } else {
        removeItem(productId);
    }
}

// Make functions available globally
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.changeQuantity = changeQuantity;
window.animateRemove = animateRemove;

