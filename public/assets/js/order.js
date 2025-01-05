let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let sortField = 'createdAt';
let sortOrder = 'desc';
let statusFilter = '';

function loadOrders(page = currentPage) {
    currentPage = page;
    const params = new URLSearchParams({
        page: page,
        limit: ITEMS_PER_PAGE,
        sort: sortField,
        order: sortOrder,
        status: statusFilter
    });
    
    fetch(`/admin/api/orders?${params}`)
        .then(response => response.json())
        .then(data => {
            updateTable(data.orders);
            updatePagination(data.totalPages, page);
            updateURL(page, sortField, sortOrder, statusFilter);
            updateSortIcons();
        })
        .catch(error => console.error('Error:', error));
}

function updateTable(orders) {
    const tbody = document.querySelector('#order-table tbody');
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order._id}</td>
            <td>${order.receiver}</td>
            <td>$${order.totalPrice}</td>
            <td>
                <span class="badge 
                    ${order.status === 'pending' ? 'bg-warning' : 
                    order.status === 'shipped' ? 'bg-info' : 
                    'bg-success'}">
                    ${order.status}
                </span>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
            <td>
                <div class="form-button-action">
                    <button type="button" 
                            class="btn btn-link btn-info me-2"
                            onclick="viewOrder('${order._id}')">
                        <i class="fa fa-eye">View</i>
                    </button>
                    <button type="button"
                            class="btn btn-link btn-primary"
                            onclick="updateOrderStatus('${order._id}', '${order.status}')">
                        <i class="fa fa-edit">Update</i>
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
            loadOrders(i);
        };
        
        pagination.appendChild(button);
    }
}

function updateURL(page, sort, order, status) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    url.searchParams.set('sort', sort);
    url.searchParams.set('order', order);
    if (status) {
        url.searchParams.set('status', status);
    } else {
        url.searchParams.delete('status');
    }
    window.history.pushState({}, '', url);
}

function handleSort(field) {
    if (sortField === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortOrder = 'desc';
    }
    loadOrders(currentPage);
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

function handleStatusFilter(e) {
    statusFilter = e.target.value;
    loadOrders(1);
}

function viewOrder(orderId) {
    fetch(`/admin/api/orders/${orderId}`)
        .then(response => response.json())
        .then(order => {
            const modalContent = `
                <div class="order-details">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Order ID:</strong> ${order._id}</p>
                            <p><strong>Receiver:</strong> ${order.receiver}</p>
                            <p><strong>Phone:</strong> ${order.phone}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Status:</strong> 
                                <span class="badge ${
                                    order.status === 'pending' ? 'bg-warning' : 
                                    order.status === 'shipped' ? 'bg-info' : 
                                    'bg-success'}">${order.status}</span>
                            </p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                            <p><strong>Total Price:</strong> $${order.totalPrice}</p>
                        </div>
                    </div>
                    <div class="mb-3">
                        <p><strong>Delivery Address:</strong> ${order.address}</p>
                    </div>
                    <h6 class="mb-3">Order Items</h6>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.products.map(product => `
                                    <tr>
                                        <td>${product.name}</td>
                                        <td>$${product.price}</td>
                                        <td>${product.quantity}</td>
                                        <td>$${product.price * product.quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            document.getElementById('orderDetailContent').innerHTML = modalContent;
            new bootstrap.Modal(document.getElementById('orderDetailModal')).show();
        });
}

function updateOrderStatus(orderId, currentStatus) {
    const modal = document.getElementById('updateStatusModal');
    const statusSelect = document.getElementById('newStatus');
    statusSelect.value = currentStatus;
    
    // Store orderId for use in saveStatus
    modal.setAttribute('data-order-id', orderId);
    
    new bootstrap.Modal(modal).show();
}

function saveStatus() {
    const modal = document.getElementById('updateStatusModal');
    const orderId = modal.getAttribute('data-order-id');
    const newStatus = document.getElementById('newStatus').value;
    
    fetch(`/admin/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(modal).hide();
            loadOrders(currentPage);
        } else {
            alert('Failed to update order status');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating order status');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    sortField = urlParams.get('sort') || 'createdAt';
    sortOrder = urlParams.get('order') || 'desc';
    statusFilter = urlParams.get('status') || '';
    
    const headers = document.querySelectorAll('th[data-sortable]');
    headers.forEach(header => {
        const field = header.getAttribute('data-field');
        header.style.cursor = 'pointer';
        header.innerHTML += ' <i class="sort-icon fas fa-sort"></i>';
        header.addEventListener('click', () => handleSort(field));
    });
    
    const statusFilterSelect = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilterSelect.value = statusFilter;
    }
    statusFilterSelect.addEventListener('change', handleStatusFilter);
    
    updateSortIcons();
    loadOrders(currentPage);
});