const API_BASE_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('access_token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    let isLoginMode = true;

    const authForm = document.getElementById('auth-form');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const toggleModeLink = document.getElementById('toggle-mode');
    const toggleText = document.getElementById('toggle-text');
    const submitBtn = document.getElementById('submit-btn');
    const msgBox = document.getElementById('msg-box');

    // Groups
    const usernameGroup = document.getElementById('username-group');
    const emailGroup = document.getElementById('email-group');
    const loginIdentifierGroup = document.getElementById('login-identifier-group');

    // Inputs
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const loginIdentifierInput = document.getElementById('login-identifier');
    const passwordInput = document.getElementById('password');

    function showMessage(msg, isError = true) {
        msgBox.textContent = msg;
        msgBox.className = isError ? 'error-message' : 'success-message';
        msgBox.classList.remove('hidden');
    }

    function hideMessage() {
        msgBox.classList.add('hidden');
    }

    toggleModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        hideMessage();

        if (isLoginMode) {
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Sign in to your AI Career Coach';

            usernameGroup.classList.add('hidden');
            emailGroup.classList.add('hidden');
            loginIdentifierGroup.classList.remove('hidden');
            loginIdentifierInput.required = true;
            usernameInput.required = false;
            emailInput.required = false;

            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account?";
            toggleModeLink.textContent = 'Sign up';
        } else {
            formTitle.textContent = 'Create Account';
            formSubtitle.textContent = 'Start your career journey with AI';

            usernameGroup.classList.remove('hidden');
            emailGroup.classList.remove('hidden');
            loginIdentifierGroup.classList.add('hidden');
            loginIdentifierInput.required = false;
            usernameInput.required = true;
            emailInput.required = true;

            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleModeLink.textContent = 'Log in';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Please wait...';
        submitBtn.disabled = true;

        try {
            if (isLoginMode) {
                // Login Request
                const formData = new URLSearchParams();
                formData.append('username', loginIdentifierInput.value);
                formData.append('password', passwordInput.value);

                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('access_token', data.access_token);
                    window.location.href = 'dashboard.html';
                } else {
                    const errorData = await response.json();
                    showMessage(errorData.detail || 'Login failed');
                }
            } else {
                // Registration Request
                const requestBody = {
                    username: usernameInput.value,
                    email: emailInput.value,
                    password: passwordInput.value
                };

                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    showMessage('Account created successfully! Please log in.', false);
                    setTimeout(() => {
                        toggleModeLink.click();
                        loginIdentifierInput.value = requestBody.username;
                    }, 1500);
                } else {
                    const errorData = await response.json();
                    showMessage(errorData.detail || 'Registration failed');
                }
            }
        } catch (error) {
            showMessage('Network error. Is the backend running?');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
