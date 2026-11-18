"use strict";

(() => {
    const root = document.documentElement;

    function applyTheme(theme) {
        root.dataset.bsTheme = theme;
    }

    // Apply the saved theme before the page paints.
    try {
        applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
    } catch {
        applyTheme("light");
    }

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("theme-toggle");
        toggle.checked = root.dataset.bsTheme === "dark";
        toggle.addEventListener("change", () => {
            const theme = toggle.checked ? "dark" : "light";
            applyTheme(theme);
            try {
                localStorage.setItem("theme", theme);
            } catch {
                const notice = document.getElementById("aura-toast");
                notice.textContent = "This browser could not save your theme.";
                notice.style.display = "block";
                setTimeout(() => { notice.style.display = ""; }, 3200);
            }
        });

        window.addEventListener("storage", (event) => {
            if (event.key !== "theme" && event.key !== null) return;
            const theme = event.newValue === "dark" ? "dark" : "light";
            applyTheme(theme);
            toggle.checked = theme === "dark";
        });
    });
})();
