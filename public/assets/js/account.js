let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let sortField = 'username';
let sortOrder = 'asc';
let searchQuery = '';

function loadAccounts(page = currentPage) {
    currentPage = page;
    const params = new URLSearchParams({
        page: page,
        limit: ITEMS_PER_PAGE,
        sort: sortField,
        order: sortOrder,
        search: searchQuery
    });
    
    fetch(`/admin/api/accounts?${params}`)
        .then(response => response.json())
        .then(data => {
            updateTable(data.users);
            updatePagination(data.totalPages, page);
            updateURL(page, sortField, sortOrder, searchQuery);
            updateSortIcons();
        })
        .catch(error => console.error('Error:', error));
}

function updateTable(users) {
    const tbody = document.querySelector('#account-table tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                    ${user.status}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
            <td>
                <div class="form-button-action">
                    <button type="button" 
                            class="btn btn-link ${user.status === 'active' ? 'btn-primary btn-danger' : 'btn-success'}"
                            data-id="${user._id}" 
                            onclick="banAccount(this)">
                        <i class="fa ${user.status === 'active' ? 'fa-ban' : 'fa-check'}">
                            ${user.status === 'active' ? 'Ban' : 'Unban'}
                        </i>
                    </button>
                </div>
                <button type="button" 
                            class="btn btn-link btn-info me-2"
                            onclick='viewAccount(${JSON.stringify(user).replace(/'/g, "&#39;")})'>
                        <i class="fa fa-eye">View</i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updatePagination(totalPages, currentPage) {
    console.log(currentPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Clear the existing pagination buttons
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-primary', 'mx-1', 'px-3'); // Adds margin and padding for better spacing
        
        if (i === currentPage) {
            button.classList.remove('btn-outline-primary'); // Remove the outline style
            button.classList.add('btn-primary'); // Add solid color for active state
        }
        
        button.textContent = i;
        button.setAttribute('type', 'button'); // Ensures it behaves like a button
        button.onclick = (e) => {
            e.preventDefault();
            loadAccounts(i); // Call your custom function
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
    loadAccounts(currentPage);
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
        // Clear search state and URL
        const url = new URL(window.location);
        url.searchParams.delete('search');
        window.history.pushState({}, '', url.toString());
    }
    loadAccounts(1);
}

// Add debounce utility
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

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    sortField = urlParams.get('sort') || 'username';
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
    
    updateSortIcons();
    loadAccounts(currentPage);
});

function banAccount(element) {
    const accountId = element.getAttribute('data-id');
    
    if (!accountId) {
        alert('Account ID not found');
        return;
    }

    const confirmation = confirm('Are you sure you want to change this account status?');
    
    if (confirmation) {
        fetch(`/admin/manage-accounts/ban/${accountId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refresh the page to show updated status
                window.location.reload();
            } else {
                alert('Failed to update account status');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating account status');
        });
    }
}

function getAvatarPlaceholder(username) {
    if (!username) return '';
    const firstChar = username.charAt(0).toUpperCase();
    return `
        <div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
             style="width: 100px; height: 100px; background-color: #1572E8; color: white; font-size: 48px; line-height: 1; margin: 0 auto;">
            ${firstChar}
        </div>`;
}

function viewAccount(user) {
    console.log(user)
    const modalContent = `
        <div class="user-details">
            <div class="text-center mb-4">
                ${user.avatar ? 
                    `<img src="${user.avatar}" class="rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">` :
                    getAvatarPlaceholder(user.username)
                }
                <h4 class="mt-2">${user.username}</h4>
                <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                    ${user.status}
                </span>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Permission:</strong> ${user.permission || 'None'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                    <p><strong>Updated:</strong> ${new Date(user.updatedAt).toLocaleDateString()}</p>
                    <p><strong>Google Account:</strong> ${user.googleId ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('accountDetailContent').innerHTML = modalContent;
    new bootstrap.Modal(document.getElementById('accountDetailModal')).show();
}