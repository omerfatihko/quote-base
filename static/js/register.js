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

    const togglePasswordVisibility = (inputId, toggleId) => {
        const passwordField = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);

        toggleIcon.addEventListener("click", () => {
            const isPasswordVisible = passwordField.type === "text";
            passwordField.type = isPasswordVisible ? "password" : "text";
            toggleIcon.src = isPasswordVisible
                ? "../static/images/eye-closed.png"
                : "../static/images/eye-open.png";
            toggleIcon.alt = isPasswordVisible ? "Show password" : "Hide password";
        });
    };

    // add toggle functionality to each password field
    togglePasswordVisibility("register-password", "toggle-register-password");
    togglePasswordVisibility("confirm-password", "toggle-confirm-password");
    togglePasswordVisibility("login-password", "toggle-login-password");

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

    // Event listener for registration action
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const email = emailField.value.trim();
        const password = passwordField.value.trim();
        const confirmPassword = confirmPasswordField.value.trim();

        // Validate passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Create a payload object
        const payload = {email, password};

        try {
            // Send a POST request to the Flask backend
            const response = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            // Handle the response
            if (response.ok) {
                const data = await response.json();
                console.log("Response from server:", data);
                alert(data.message); // alert("Registration successful!");

                // Redirect or render the main page
                window.location.href = "/home";
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    });

    // Event listener for login action
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Collect form data
        const email = loginEmailField.value.trim();
        const password = loginPasswordField.value.trim();

        // Create a payload object
        const payload = {email, password};

        try {
            // Send a POST request to the Flask backend
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            // Handle the response
            if (response.ok) {
                const data = await response.json();
                console.log("Response from server:", data);
                alert(data.message);

                // Redirect or render the main page
                window.location.href = "/home";
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    });
});
