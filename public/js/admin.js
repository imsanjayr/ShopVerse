// Admin panel functionality

async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/status', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.admin) {
            window.location.href = '/admin-login';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Admin auth check error:', error);
        window.location.href = '/admin-login';
        return false;
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch('/api/admin/products', {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/admin-login';
            return;
        }

        const products = await response.json();
        const table = document.getElementById('products-table');

        const productsCount = document.getElementById('stat-products');
        if (productsCount) {
            productsCount.textContent = products.length;
        }

        if (table) {
            table.innerHTML = products.map(product => `
                <tr class="bg-white even:bg-slate-50 hover:bg-indigo-50 transition">
                    <td class="px-6 py-4 text-xs text-slate-500">#${product.id}</td>
                    <td class="px-6 py-4">
                        <img src="${product.image}" alt="${product.name}" class="w-14 h-14 object-cover rounded-xl">
                    </td>
                    <td class="px-6 py-4 font-semibold text-dark">${product.name}</td>
                    <td class="px-6 py-4 text-slate-500">${product.category}</td>
                    <td class="px-6 py-4 font-semibold text-primary">$${product.price.toFixed(2)}</td>
                    <td class="px-6 py-4 text-slate-500">${product.stock}</td>
                    <td class="px-6 py-4 text-sm space-x-3">
                        <button onclick="editProduct('${product.id}')" class="text-primary hover:underline">
                            Edit
                        </button>
                        <button onclick="deleteProduct('${product.id}')" class="text-red-500 hover:underline">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
    }
}

async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            credentials: 'include'
        });

        if (response.status === 401) {
            return;
        }

        const stats = await response.json();
        const usersEl = document.getElementById('stat-users');
        const productsEl = document.getElementById('stat-products');
        const ordersEl = document.getElementById('stat-orders');

        if (usersEl) usersEl.textContent = stats.users ?? '--';
        if (productsEl) productsEl.textContent = stats.products ?? '--';
        if (ordersEl) ordersEl.textContent = stats.orders ?? '--';
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;

        document.getElementById('product-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading product for edit:', error);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            loadAdminProducts();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred. Please try again.');
    }
}

async function createProduct(product) {
    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to create product');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert('An error occurred. Please try again.');
    }
}

async function updateProduct(productId, product) {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('An error occurred. Please try again.');
    }
}

// Make functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.createProduct = createProduct;
window.updateProduct = updateProduct;

