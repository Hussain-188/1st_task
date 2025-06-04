// Application State
let posts = [];
let currentEditingPost = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const postsTableBody = document.getElementById('postsTableBody');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        showDashboard();
        loadUserInfo();
        loadPosts();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('savePostBtn').addEventListener('click', handleSavePost);
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!validateForm('register', email, password)) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loading = submitBtn.querySelector('.loading');
    loading.style.display = 'inline-block';

    try {
        let response = await fetch('https://reqres.in/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok && response.status === 401) {
            response = await fetch('https://reqres.in/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'reqres-free-v1'
                },
                body: JSON.stringify({ email, password })
            });
        }

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            if (data.error && data.error.includes('defined')) {
                showError('registerEmailError', 'Please use eve.holt@reqres.in for testing');
            } else {
                showError('registerEmailError', data.error || 'Registration failed');
            }
        }
    } catch (error) {
        showError('registerEmailError', 'Network error. Please try again.');
        console.error('Registration error:', error);
    } finally {
        loading.style.display = 'none';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!validateForm('login', email, password)) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loading = submitBtn.querySelector('.loading');
    loading.style.display = 'inline-block';

    try {
        let response = await fetch('https://reqres.in/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok && response.status === 401) {
            response = await fetch('https://reqres.in/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'reqres-free-v1'
                },
                body: JSON.stringify({ email, password })
            });
        }

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            showDashboard();
            loadUserInfo();
            loadPosts();
        } else {
            if (data.error && data.error.includes('defined')) {
                showError('loginEmailError', 'Please use eve.holt@reqres.in for testing');
            } else {
                showError('loginEmailError', data.error || 'Login failed');
            }
        }
    } catch (error) {
        showError('loginEmailError', 'Network error. Please try again.');
        console.error('Login error:', error);
    } finally {
        loading.style.display = 'none';
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('authToken');
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
    clearErrors();
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
}

async function loadUserInfo() {
    try {
        let response = await fetch('https://reqres.in/api/users/2');

        if (!response.ok && response.status === 401) {
            response = await fetch('https://reqres.in/api/users/2', {
                headers: { 'x-api-key': 'reqres-free-v1' }
            });
        }

        const data = await response.json();

        if (response.ok && data.data) {
            document.getElementById('userName').textContent = `${data.data.first_name} ${data.data.last_name}`;
            document.getElementById('userAvatar').src = data.data.avatar;
        } else {
            document.getElementById('userName').textContent = 'Test User';
            document.getElementById('userAvatar').src = 'https://via.placeholder.com/50x50/667eea/ffffff?text=U';
        }
    } catch (error) {
        document.getElementById('userName').textContent = 'Test User';
        document.getElementById('userAvatar').src = 'https://via.placeholder.com/50x50/667eea/ffffff?text=U';
    }
}

async function loadPosts() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        posts = await response.json();
        renderPosts();
    } catch (error) {
        postsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load posts</td></tr>';
    }
}

function renderPosts() {
    postsTableBody.innerHTML = posts.map(post => `
        <tr>
            <td>${post.id}</td>
            <td>${truncateText(post.title, 50)}</td>
            <td>${truncateText(post.body, 80)}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewPost(${post.id})" title="View"><i class="bi bi-eye"></i></button>
                <button class="btn-action btn-edit" onclick="editPost(${post.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn-action btn-delete" onclick="deletePost(${post.id})" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function viewPost(id) {
    const post = posts.find(p => p.id === id);
    if (post) {
        document.getElementById('viewPostTitle').textContent = post.title;
        document.getElementById('viewPostBody').textContent = post.body;
        new bootstrap.Modal(document.getElementById('viewPostModal')).show();
    }
}

function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (post) {
        currentEditingPost = post;
        document.getElementById('editPostTitle').value = post.title;
        document.getElementById('editPostBody').value = post.body;
        new bootstrap.Modal(document.getElementById('editPostModal')).show();
    }
}

function handleSavePost() {
    const title = document.getElementById('editPostTitle').value;
    const body = document.getElementById('editPostBody').value;

    if (title.trim() && body.trim() && currentEditingPost) {
        const index = posts.findIndex(p => p.id === currentEditingPost.id);
        if (index !== -1) {
            posts[index].title = title;
            posts[index].body = body;
            renderPosts();
        }

        bootstrap.Modal.getInstance(document.getElementById('editPostModal')).hide();
        currentEditingPost = null;
    }
}

function deletePost(id) {
    if (confirm('Are you sure you want to delete this post?')) {
        posts = posts.filter(p => p.id !== id);
        renderPosts();
    }
}

function validateForm(type, email, password) {
    clearErrors();
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showError(`${type}EmailError`, 'Email is required');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showError(`${type}EmailError`, 'Please enter a valid email');
        isValid = false;
    }

    if (!password) {
        showError(`${type}PasswordError`, 'Password is required');
        isValid = false;
    } else if (password.length < 4) {
        showError(`${type}PasswordError`, 'Password must be at least 4 characters');
        isValid = false;
    }

    return isValid;
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
