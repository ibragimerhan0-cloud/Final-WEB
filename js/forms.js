"use strict";

const AuraForms = (() => {
    const validators = {
        name(value) {
            return value.trim() ? "" : "Enter your name.";
        },
        email(value) {
            if (!value.trim()) return "Enter your email address.";
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
                ? "" : "Enter a valid email address, such as name@example.com.";
        },
        phone(value) {
            if (!value.trim()) return "Enter your phone number.";
            return /^\+?[\d\s]+$/.test(value.trim()) && /^\+?\d{10,15}$/.test(value.replace(/\s/g, ""))
                ? "" : "Enter 10 to 15 digits. You can use spaces and an initial +.";
        },
        password(value) {
            if (!value) return "Enter your password.";
            return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)
                ? "" : "Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.";
        },
        message(value) {
            return value.trim() ? "" : "Enter your message.";
        }
    };

    function showFeedback(element, message, tone) {
        element.textContent = message;
        element.classList.toggle("aura-error", tone === "error");
        element.classList.toggle("aura-success", tone === "success");
    }

    function clearValidation(form) {
        for (const field of form.querySelectorAll('[aria-invalid="true"]')) {
            field.removeAttribute("aria-invalid");
            field.removeAttribute("aria-errormessage");
            field.classList.remove("aura-invalid");
        }
    }

    function validate(form, feedback, fields) {
        clearValidation(form);
        const values = {};
        const errors = [];
        let firstInvalid;

        for (const name of fields) {
            const field = form.elements.namedItem(name);
            const error = validators[name](field.value);
            if (error) {
                field.setAttribute("aria-invalid", "true");
                if (feedback.id) field.setAttribute("aria-errormessage", feedback.id);
                field.classList.add("aura-invalid");
                errors.push(error);
                firstInvalid ??= field;
            }
            values[name] = name === "password" ? field.value : field.value.trim();
            if (name === "email") values[name] = values[name].toLowerCase();
        }

        showFeedback(feedback, errors.join(" "), "error");
        if (firstInvalid) {
            firstInvalid.focus();
            return null;
        }
        return values;
    }

    const storage = {
        read(key, fallback) {
            const raw = localStorage.getItem("aura." + key);
            if (raw === null) return fallback;
            try {
                return JSON.parse(raw) ?? fallback;
            } catch {
                return fallback;
            }
        },
        write(key, value) {
            localStorage.setItem("aura." + key, JSON.stringify(value));
        },
        remove(key) {
            localStorage.removeItem("aura." + key);
        }
    };

    return { validate, showFeedback, clearValidation, storage };
})();
