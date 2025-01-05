let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let sortField = 'productId';
let sortOrder = 'asc';
let searchQuery = '';

function loadProducts(page = currentPage) {
    currentPage = page;
    const params = new URLSearchParams({
        page: page,
        limit: ITEMS_PER_PAGE,
        sort: sortField,
        order: sortOrder,
        search: searchQuery
    });
    
    fetch(`/admin/api/products?${params}`)
        .then(response => response.json())
        .then(data => {
            updateTable(data.products);
            updatePagination(data.totalPages, page);
            updateURL(page, sortField, sortOrder, searchQuery);
            updateSortIcons();
        })
        .catch(error => console.error('Error:', error));
}

function updateTable(products) {
    const tbody = document.querySelector('#product-table tbody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.productId}</td>
            <td>${product.name}</td>
            <td>${product.brand}</td>
            <td>$${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.sales}</td>
            <td>${new Date(product.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
            <td>
                <span class="badge ${product.status === 'Available' ? 'bg-success' : 'bg-danger'}">
                    ${product.status}
                </span>
            </td>
            <td>
                <div class="form-button-action">
                    <button type="button" class="btn btn-link btn-primary" data-id="${product._id}" onclick="editProduct(this)">
                        <i class="fa fa-edit">Edit</i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updatePagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-primary', 'mx-1', 'px-3');
        
        if (i === currentPage) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        }
        
        button.textContent = i;
        button.setAttribute('type', 'button');
        button.onclick = (e) => {
            e.preventDefault();
            loadProducts(i);
        };
        
        pagination.appendChild(button);
    }
}

function updateURL(page, sort, order, search) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    url.searchParams.set('sort', sort);
    url.searchParams.set('order', order);
    window.history.pushState({}, '', url);
}

function handleSort(field) {
    if (sortField === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortOrder = 'asc';
    }
    loadProducts(currentPage);
}

function updateSortIcons() {
    const headers = document.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
        const field = header.getAttribute('data-field');
        const icon = header.querySelector('.sort-icon');
        
        if (field === sortField) {
            icon.className = `sort-icon fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`;
            icon.style.opacity = '1';
        } else {
            icon.className = 'sort-icon fas fa-sort';
            icon.style.opacity = '0.3';
        }
    });
}

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    if (searchQuery === '') {
        const url = new URL(window.location);
        url.searchParams.delete('search');
        window.history.pushState({}, '', url.toString());
    }
    loadProducts(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    sortField = urlParams.get('sort') || 'productId';
    sortOrder = urlParams.get('order') || 'asc';
    searchQuery = urlParams.get('search') || '';
    
    const headers = document.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
        const field = header.getAttribute('data-field');
        header.style.cursor = 'pointer';
        header.innerHTML += ' <i class="sort-icon fas fa-sort"></i>';
        header.addEventListener('click', () => handleSort(field));
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchQuery) {
        searchInput.value = searchQuery;
    }
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Add form submit handler
    document.getElementById('addProductForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });

    updateSortIcons();
    loadProducts(currentPage);
});

function editProduct(button) {
    const productId = button.getAttribute('data-id');
    console.log(productId);
    
    fetch(`/admin/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('edit-name').value = product.name;
            document.getElementById('edit-description').value = product.description;
            document.getElementById('edit-brand').value = product.brand;
            document.getElementById('edit-material').value = product.material;
            document.getElementById('edit-price').value = product.price;
            document.getElementById('edit-stock').value = product.stock;
            document.getElementById('edit-sex').value = product.sex;
            document.getElementById('edit-status').value = product.status;
            
            // Update image preview section
            updateImagePreviews(product.image);
            
            // Store product ID for form submission
            document.getElementById('editProductForm').setAttribute('data-id', productId);
            
            // Show modal
            new bootstrap.Modal(document.getElementById('editProductModal')).show();
        });
}

function updateImagePreviews(images = []) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = images.map((url, index) => `
        <div class="image-preview-item mb-2">
            <img src="${url}" class="img-thumbnail" style="height: 100px;">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeImage(${index})">
                <i class="fa fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeImage(index) {
    const form = document.getElementById('editProductForm');
    const productId = form.getAttribute('data-id');
    
    fetch(`/admin/api/products/${productId}/images/${index}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateImagePreviews(data.images);
        }
    });
}

function addNewImage() {
    const imageUrl = document.getElementById('newImageUrl').value;
    if (!imageUrl) return;
    
    const form = document.getElementById('editProductForm');
    const productId = form.getAttribute('data-id');
    
    fetch(`/admin/api/products/${productId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateImagePreviews(data.images);
            document.getElementById('newImageUrl').value = '';
        }
    });
}

function saveProductChanges() {
    const form = document.getElementById('editProductForm');
    const productId = form.getAttribute('data-id');
    
    const formData = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-description').value,
        brand: document.getElementById('edit-brand').value,
        material: document.getElementById('edit-material').value,
        price: parseFloat(document.getElementById('edit-price').value),
        stock: parseInt(document.getElementById('edit-stock').value),
        sex: document.getElementById('edit-sex').value,
        status: document.getElementById('edit-status').value
    };

    fetch(`/admin/api/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            loadProducts(currentPage);
        }
    });
}

function handleAddProductSuccess(data) {
    if (data.success) {
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        
        // Show success message
        alert('Product added successfully');
        
        // Reset form
        document.getElementById('addProductForm').reset();
        
        // Refresh product list
        loadProducts(1); // Reset to first page after adding
    } else {
        throw new Error(data.message || 'Error adding product');
    }
}

function addProduct() {
    const form = document.getElementById('addProductForm');
    const formData = {
        name: form.elements['name'].value,
        description: form.elements['description'].value,
        brand: form.elements['brand'].value,
        material: form.elements['material'].value,
        price: parseFloat(form.elements['price'].value),
        stock: parseInt(form.elements['stock'].value),
        sex: form.elements['sex'].value,
        status: form.elements['status'].value,
        image: [form.elements['image'].value].filter(Boolean)
    };

    fetch('/admin/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(handleAddProductSuccess)
    .catch(error => {
        console.error('Error:', error);
        alert(error.message || 'Error adding product');
    });

    return false;
}