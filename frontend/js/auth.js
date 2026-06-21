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

    const forgotPasswordLink = document.getElementById('forgot-password-link');

    function showMessage(msg, isError = true) {
        msgBox.textContent = msg;
        msgBox.className = isError ? 'error-message' : 'success-message';
        msgBox.classList.remove('hidden');
    }

    function hideMessage() {
        msgBox.classList.add('hidden');
    }

    const resetPasswordSection = document.getElementById('reset-password-section');
    const resetForm = document.getElementById('reset-form');
    const backToLoginLink = document.getElementById('back-to-login');

    function showMessage(msg, isError = true) {
        msgBox.textContent = msg;
        msgBox.className = isError ? 'error-message' : 'success-message';
        msgBox.classList.remove('hidden');
    }

    function hideMessage() {
        msgBox.classList.add('hidden');
    }

    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        hideMessage();

        const email = prompt('Enter your email address:');
        if (!email) return;

        try {
            const response = await fetch(`${API_BASE_URL}/password-reset-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Password reset token: ${data.reset_token}\n\nUse this token to reset your password. In production, this would be sent via email.`);
                resetPasswordSection.classList.remove('hidden');
                authForm.classList.add('hidden');
                forgotPasswordLink.parentElement.classList.add('hidden');
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Failed to request password reset');
            }
        } catch (error) {
            showMessage('Network error. Is the backend running?');
        }
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetPasswordSection.classList.add('hidden');
        authForm.classList.remove('hidden');
        forgotPasswordLink.parentElement.classList.remove('hidden');
        hideMessage();
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const token = document.getElementById('reset-token').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword })
            });

            if (response.ok) {
                showMessage('Password reset successfully! You can now log in.', false);
                setTimeout(() => {
                    backToLoginLink.click();
                }, 2000);
            } else {
                const errorData = await response.json();
                showMessage(errorData.detail || 'Failed to reset password');
            }
        } catch (error) {
            showMessage('Network error. Is the backend running?');
        }
    });

    toggleModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        hideMessage();
        resetPasswordSection.classList.add('hidden'); // Hide reset section when toggling
        authForm.classList.remove('hidden');
        forgotPasswordLink.parentElement.classList.remove('hidden');

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
