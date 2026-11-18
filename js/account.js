"use strict";

(() => {
    const { validate, showFeedback, storage } = AuraForms;
    const storageError = "This browser could not access your saved account. Check your browser settings and try again.";

    function accounts() {
        const saved = storage.read("accounts", []);
        return Array.isArray(saved) ? saved : [];
    }

    const signupForm = document.getElementById("signup-form");
    signupForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const feedback = document.getElementById("signup-feedback");
        const user = validate(signupForm, feedback, ["name", "email", "phone", "password"]);
        if (!user) return;
        try {
            const users = accounts();
            if (users.some((account) => account?.email === user.email)) {
                showFeedback(feedback, "An account already uses this email. Log in or try another email.", "error");
                signupForm.elements.namedItem("email").focus();
                return;
            }

            // The assignment simulates authentication entirely on this device.
            users.push(user);
            storage.write("accounts", users);
            location.assign("login.html?created=1");
        } catch {
            showFeedback(feedback, storageError, "error");
        }
    });

    const loginForm = document.getElementById("login-form");
    if (loginForm && new URLSearchParams(location.search).get("created") === "1") {
        document.getElementById("login-notice").hidden = false;
        history.replaceState(null, "", location.pathname);
    }

    loginForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        document.getElementById("login-notice").hidden = true;
        const feedback = document.getElementById("login-feedback");
        const credentials = validate(loginForm, feedback, ["email", "password"]);
        if (!credentials) return;
        try {
            const user = accounts().find((account) => account?.email === credentials.email);
            if (!user || user.password !== credentials.password) {
                showFeedback(feedback, "Email or password is incorrect. Check your details and try again.", "error");
                return;
            }
            storage.write("session", user.email);
            location.assign("profile.html");
        } catch {
            showFeedback(feedback, storageError, "error");
        }
    });

    const profile = document.getElementById("profile-account");
    if (!profile) return;

    const guest = document.getElementById("profile-guest");
    const feedback = document.getElementById("profile-feedback");

    function displayProfile() {
        let user;
        try {
            const email = storage.read("session", null);
            if (email) user = accounts().find((account) => account?.email === email);
            showFeedback(feedback, "");
        } catch {
            showFeedback(feedback, storageError, "error");
        }

        for (const field of ["name", "email", "phone"]) {
            document.getElementById("profile-" + field).textContent = user?.[field] ?? "";
        }
        profile.hidden = !user;
        guest.hidden = Boolean(user);
    }

    document.getElementById("logout-button").addEventListener("click", () => {
        try {
            storage.remove("session");
            location.replace("login.html");
        } catch {
            showFeedback(feedback, storageError, "error");
        }
    });

    window.addEventListener("pageshow", displayProfile);
    window.addEventListener("storage", (event) => {
        if (event.key === null || event.key === "aura.session" || event.key === "aura.accounts") displayProfile();
    });
    displayProfile();
})();
