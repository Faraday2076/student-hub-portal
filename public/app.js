let currentAuthMode = 'login'; // Track state: 'login' or 'register'

document.addEventListener('DOMContentLoaded', () => {
    const cachedRole = sessionStorage.getItem('userRole');
    const loginView = document.getElementById('login-view');
    const lobbyView = document.getElementById('lobby-view');
    
    // Check main dashboard visibility states
    if (loginView && lobbyView) {
        if (cachedRole) {
            loginView.classList.add('hidden');
            lobbyView.classList.remove('hidden');
            document.getElementById('logout-btn').classList.remove('hidden');
            
            const tag = document.getElementById('portal-tag');
            tag.classList.remove('hidden');
            tag.textContent = cachedRole === 'admin' ? '🛡️ ADMIN MODE' : '🎓 STUDENT PORTAL';
            tag.className = cachedRole === 'admin' 
                ? 'text-xs bg-emerald-700 text-white px-2.5 py-1 rounded-full ml-2 font-bold tracking-wide shadow-sm' 
                : 'text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full ml-2 font-bold tracking-wide shadow-sm';
        } else {
            loginView.classList.remove('hidden');
            lobbyView.classList.add('hidden');
            document.getElementById('logout-btn').classList.add('hidden');
            document.getElementById('portal-tag').classList.add('hidden');
        }
    }

    // Auth Switcher Mechanics
    const switchBtn = document.getElementById('toggle-auth-mode');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            const errorBox = document.getElementById('login-error');
            const successBox = document.getElementById('register-success');
            errorBox.classList.add('hidden');
            successBox.classList.add('hidden');

            if (currentAuthMode === 'login') {
                currentAuthMode = 'register';
                document.getElementById('auth-title').textContent = 'Create Account';
                document.getElementById('auth-subtitle').textContent = 'Register a new profile into the system schemas';
                document.getElementById('auth-icon').textContent = '✨';
                document.getElementById('auth-submit-btn').textContent = 'Register Account';
                document.getElementById('auth-submit-btn').className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all cursor-pointer text-sm tracking-wide mt-3 hover:-translate-y-0.5";
                document.getElementById('role-selection-box').classList.remove('hidden');
                document.getElementById('toggle-prompt-text').textContent = 'Already have an account?';
                switchBtn.textContent = 'Sign In';
            } else {
                currentAuthMode = 'login';
                document.getElementById('auth-title').textContent = 'Welcome Back';
                document.getElementById('auth-subtitle').textContent = 'Sign in to access your secure workspace dashboard';
                document.getElementById('auth-icon').textContent = '🚀';
                document.getElementById('auth-submit-btn').textContent = 'Enter Portal';
                document.getElementById('auth-submit-btn').className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all cursor-pointer text-sm tracking-wide mt-3 hover:-translate-y-0.5";
                document.getElementById('role-selection-box').classList.add('hidden');
                document.getElementById('toggle-prompt-text').textContent = 'New to the platform?';
                switchBtn.textContent = 'Create Account';
            }
        });
    }

    // Internships Content Controller Subroutines
    const companyContainer = document.getElementById('companies-container');
    if (companyContainer) {
        if (!cachedRole) {
            alert("Unauthorized workspace entry detected.");
            window.location.href = '/index.html';
            return;
        }
        const adminBox = document.getElementById('admin-form-box');
        const studentBox = document.getElementById('student-info-box');
        if (cachedRole === 'admin') {
            if (adminBox) adminBox.classList.remove('hidden');
            if (studentBox) studentBox.classList.add('hidden');
        } else {
            if (adminBox) adminBox.classList.add('hidden');
            if (studentBox) studentBox.classList.remove('hidden');
        }
        loadPlacements(cachedRole);
    }
});

// --- AUTH DATA FORM MANAGER ---
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value;
        const roleInput = document.getElementById('user-role').value;
        
        const errorBox = document.getElementById('login-error');
        const successBox = document.getElementById('register-success');
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');

        // ROUTE ROUTINE BASED ON APP MODE STATE
        if (currentAuthMode === 'login') {
            // Target Login Endpoints
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput })
            })
            .then(res => {
                if (!res.ok) throw new Error("Invalid username or password credentials.");
                return res.json();
            })
            .then(authData => {
                sessionStorage.setItem('userRole', authData.role);
                sessionStorage.setItem('username', authData.username);
                window.location.reload();
            })
            .catch(err => {
                errorBox.textContent = err.message;
                errorBox.classList.remove('hidden');
            });
        } else {
            // Target Registration Endpoints
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput, role: roleInput })
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to create user account.");
                return data;
            })
            .then(() => {
                successBox.textContent = "Account successfully registered! Switch to Sign In to enter the portal.";
                successBox.classList.remove('hidden');
                authForm.reset();
            })
            .catch(err => {
                errorBox.textContent = err.message;
                errorBox.classList.remove('hidden');
            });
        }
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}

function loadPlacements(role) {
    fetch('/api/companies')
        .then(res => res.json())
        .then(companyArray => {
            const container = document.getElementById('companies-container');
            if (!container) return;
            container.innerHTML = '';
            
            if (companyArray.length === 0) {
                container.innerHTML = `<p class="text-gray-500 text-center py-8">No corporate placements registered yet.</p>`;
                return;
            }

            companyArray.forEach(comp => {
                const deleteButton = role === 'admin' 
                    ? `<button onclick="executeDelete(${comp.id})" class="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer font-bold text-xs">🗑️ Delete</button>` 
                    : '';

                container.innerHTML += `
                    <div class="bg-white border rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm border-gray-100 p-2">
                        <div class="md:w-1/3 h-40 md:h-auto bg-gray-50">
                            <img src="${comp.image}" class="w-full h-full object-cover">
                        </div>
                        <div class="p-5 md:w-2/3 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-start">
                                    <h3 class="font-bold text-xl text-gray-900">${comp.name}</h3>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">📍 ${comp.location}</span>
                                        ${deleteButton}
                                    </div>
                                </div>
                                <p class="text-sm text-gray-700 mt-2 font-medium bg-gray-50 p-2.5 rounded border-l-4 border-blue-900">🎯 Focus: ${comp.field}</p>
                            </div>
                            <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <p class="text-gray-600">📧 <span class="font-semibold text-blue-900 ml-1">${comp.contact}</span></p>
                                <p class="text-gray-600">📞 <span class="font-semibold text-gray-800 ml-1">${comp.phone}</span></p>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
}

function executeDelete(id) {
    if (confirm("Delete this registry record from system schemas?")) {
        fetch(`/api/companies/${id}`, { method: 'DELETE' })
        .then(() => {
            const cachedRole = sessionStorage.getItem('userRole');
            loadPlacements(cachedRole);
        });
    }
}