document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");

    const registerButton = registerForm.querySelector("button");
    const loginButton = loginForm.querySelector("button");

    const emailField = document.getElementById("register-email");
    const passwordField = document.getElementById("register-password");
    const confirmPasswordField = document.getElementById("confirm-password");
    const loginEmailField = document.getElementById("login-email");
    const loginPasswordField = document.getElementById("login-password");

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 8 && !/\s/.test(password);
    }

    function enableOrDisableRegisterButton() {
        const isValidEmail = validateEmail(emailField.value.trim());
        const isValidPassword = validatePassword(passwordField.value);
        const passwordsMatch = passwordField.value === confirmPasswordField.value;

        registerButton.disabled = !(isValidEmail && isValidPassword && passwordsMatch);
    }

    function enableOrDisableLoginButton() {
        const isValidEmail = validateEmail(loginEmailField.value.trim());
        const isValidPassword = validatePassword(loginPasswordField.value);

        loginButton.disabled = !(isValidEmail && isValidPassword);
    }

    // Event listeners for register fields
    emailField.addEventListener("input", enableOrDisableRegisterButton);
    passwordField.addEventListener("input", enableOrDisableRegisterButton);
    confirmPasswordField.addEventListener("input", enableOrDisableRegisterButton);

    // Event listeners for login fields
    loginEmailField.addEventListener("input", enableOrDisableLoginButton);
    loginPasswordField.addEventListener("input", enableOrDisableLoginButton);

    // Initially disable buttons
    registerButton.disabled = true;
    loginButton.disabled = true;
});
