// Checkout functionality

async function loadOrderSummary() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const cart = await response.json();

        if (cart.length === 0) {
            window.location.href = '/cart';
            return;
        }

        const summaryContainer = document.getElementById('order-summary');
        if (!summaryContainer) return;

        let subtotal = 0;
        cart.forEach(item => {
            if (item.product) {
                subtotal += item.product.price * item.quantity;
            }
        });

        const tax = subtotal * 0.1;
        const shipping = 10.00;
        const total = subtotal + tax + shipping;

        summaryContainer.innerHTML = `
            <div class="space-y-5">
                <div class="space-y-3 max-h-64 overflow-y-auto pr-2">
                    ${cart.map(item => {
                        if (!item.product) return '';
                        return `
                            <div class="flex items-center justify-between text-sm text-slate-600">
                                <div>
                                    <p class="font-semibold text-dark">${item.product.name}</p>
                                    <p class="text-xs text-slate-400">Qty ${item.quantity}</p>
                                </div>
                                <span class="font-semibold text-dark">$${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="bg-white/80 border border-white/60 rounded-2xl p-4 space-y-2 text-sm text-slate-600">
                    <div class="flex justify-between">
                        <span>Subtotal</span>
                        <span class="font-semibold text-dark">$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Tax</span>
                        <span class="font-semibold text-dark">$${tax.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Shipping</span>
                        <span class="font-semibold text-dark">$${shipping.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-dark">
                        <span>Total</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order summary:', error);
    }
}

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('checkout-email').value;

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, address, phone, email })
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (response.ok) {
            document.getElementById('checkout-sections').classList.add('hidden');
            document.getElementById('success-screen').classList.remove('hidden');
            updateCartBadge();
        } else {
            alert(data.error || 'Failed to place order');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('An error occurred. Please try again.');
    }
});

