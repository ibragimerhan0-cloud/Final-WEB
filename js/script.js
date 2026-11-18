"use strict";

$(document).ready(function () {
    const { validate, showFeedback, clearValidation, storage } = AuraForms;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) $.fx.off = true;

    // Short feedback sound for selected controls.
    function playSound() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 600;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        osc.onended = () => ctx.close();
    }

    document.getElementById("theme-toggle").addEventListener("change", playSound);

    // Let keyboard users move between navigation links with the arrow keys.
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    navLinks.forEach((link, index) => {
        link.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                navLinks[(index + 1) % navLinks.length].focus();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                navLinks[(index - 1 + navLinks.length) % navLinks.length].focus();
            }
        });
    });

    // Show the café's local time and today's opening status together.
    const clock = document.getElementById("aura-clock");
    if (clock) {
        const openingStatus = document.getElementById("aura-opening-status");
        const timeZone = "Asia/Almaty";
        const dateFormat = new Intl.DateTimeFormat("en-US", {
            timeZone,
            dateStyle: "medium",
            timeStyle: "short"
        });
        const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" });

        function updateClock() {
            const now = new Date();
            const hour = Number(hourFormat.format(now));
            clock.textContent = "Astana · " + dateFormat.format(now);
            openingStatus.textContent = hour >= 8 && hour < 22
                ? "Open now · Closes at 10:00 PM"
                : "Closed now · Opens at 8:00 AM";
        }

        updateClock();
        setInterval(updateClock, 15000);
    }

    // Newsletter signup is a local demo, like the account forms.
    const newsletter = document.getElementById("subscribe-overlay");
    if (newsletter) {
        const form = document.getElementById("subscribe-form");
        const feedback = document.getElementById("subscribe-feedback");

        document.getElementById("subscribe-open").addEventListener("click", () => {
            newsletter.showModal();
        });
        document.getElementById("subscribe-close").addEventListener("click", () => newsletter.close());

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const subscriber = validate(form, feedback, ["name", "email"]);
            if (!subscriber) return;
            try {
                const subscribers = storage.read("subscribers", []);
                if (subscribers.some((entry) => entry.email === subscriber.email)) {
                    showFeedback(feedback, "This email is already signed up on this device.", "error");
                    return;
                }
                storage.write("subscribers", [...subscribers, subscriber]);
                form.reset();
                showFeedback(feedback, "Thanks, " + subscriber.name + "! Your demo signup was saved.", "success");
            } catch {
                showFeedback(feedback, "Your newsletter signup could not be saved. Please try again.", "error");
            }
        });
    }

    // Render the café menu and persist filter, search and ratings in localStorage.
    const menuContainer = document.getElementById("dynamic-menu-container");
    if (menuContainer) {
        const savedRatings = storage.read("ratings", {});
        const ratings = new Map(
            Object.entries(savedRatings && typeof savedRatings === "object" ? savedRatings : {})
                .map(([id, value]) => [Number(id), Number(value)])
        );
        const menuItems = [
            {
                id: 1,
                name: "Salted Caramel Latte",
                category: "hot",
                price: "1500 ₸",
                desc: "Our signature homemade caramel sauce balanced with sea salt and fresh espresso.",
                img: "images/latte-art.jpg"
            },
            {
                id: 2,
                name: "V60 Pour Over",
                category: "hot",
                price: "1400 ₸",
                desc: "For those who appreciate the pure, delicate notes of single-origin coffee.",
                img: "images/gallery-v60.jpg"
            },
            {
                id: 3,
                name: "Matcha Green Tea",
                category: "hot",
                price: "1600 ₸",
                desc: "Premium ceremonial grade matcha directly from Japan, whisked to perfection.",
                img: "images/gallery-matcha.jpg"
            },
            {
                id: 4,
                name: "Iced Cold Brew",
                category: "cold",
                price: "1500 ₸",
                desc: "Steeped for 18 hours for a smooth, refreshing taste over ice.",
                img: "images/gallery-cold-brew.jpg"
            },
            {
                id: 5,
                name: "Classic Espresso",
                category: "hot",
                price: "900 ₸",
                desc: "A rich, concentrated double shot with velvety crema and bold chocolate notes.",
                img: "images/gallery-espresso.jpg"
            },
            {
                id: 6,
                name: "Soft Cappuccino",
                category: "hot",
                price: "1400 ₸",
                desc: "Equal parts double espresso, steamed milk, and airy microfoam.",
                img: "images/gallery-cappuccino.jpg"
            }
        ];

        function renderMenu(filterType) {
            const filtered = menuItems.filter((item) => filterType === "all" || item.category === filterType);
            menuContainer.replaceChildren();

            for (const item of filtered) {
                const rating = ratings.get(item.id) ?? 0;
                const stars = Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    return `<button class="star${value <= rating ? " active" : ""}" type="button"
                        data-value="${value}" aria-label="Rate ${item.name} ${value} out of 5"
                        aria-pressed="${value === rating}">★</button>`;
                }).join("");
                menuContainer.insertAdjacentHTML("beforeend", `
                    <div class="col-lg-6 col-md-6 menu-item" data-name="${item.name}">
                        <div class="card h-100 shadow-sm border-0 menu-card">
                            <img src="images/placeholder.svg" data-src="${item.img}" class="card-img-top card-img-custom lazy-image" alt="${item.name}">
                            <div class="card-body">
                                <h5 class="card-title fw-bold menu-search-text">${item.name}</h5>
                                <p class="small fw-bold text-muted mb-2">${item.category.toUpperCase()} • ${item.price}</p>
                                <p class="card-text text-muted menu-search-text">${item.desc}</p>
                                <div class="star-group" data-id="${item.id}">${stars}</div>
                                <small class="rating-text text-muted">${rating ? "Your rating: " + rating + " / 5" : "Choose a star to rate"}</small>
                            </div>
                        </div>
                    </div>
                `);
            }

            filterMenu();
            hideSuggestions();
        }

        menuContainer.addEventListener("click", (event) => {
            const star = event.target.closest(".star");
            if (!star) return;

            const group = star.parentElement;
            const rating = Number(star.dataset.value);
            ratings.set(Number(group.dataset.id), rating);
            try {
                storage.write("ratings", Object.fromEntries(ratings));
            } catch {
                // Ignore storage quota issues
            }
            for (const button of group.querySelectorAll(".star")) {
                const value = Number(button.dataset.value);
                button.classList.toggle("active", value <= rating);
                button.setAttribute("aria-pressed", String(value === rating));
            }
            group.nextElementSibling.textContent = "Your rating: " + rating + " / 5";
            showNotification("Your rating is " + rating + " / 5.");
            playSound();
        });

        const savedFilterRaw = storage.read("menuFilter", "all");
        const initialFilter = ["all", "hot", "cold"].includes(savedFilterRaw) ? savedFilterRaw : "all";
        const savedSearch = storage.read("menuSearch", "");
        if (typeof savedSearch === "string" && savedSearch) {
            $("#menu-search").val(savedSearch);
        }

        const filterBtns = document.querySelectorAll(".filter-btn");
        filterBtns.forEach(btn => {
            const isActive = btn.getAttribute("data-category") === initialFilter;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
            btn.addEventListener("click", () => {
                const category = btn.getAttribute("data-category");
                filterBtns.forEach((button) => {
                    button.classList.toggle("active", button === btn);
                    button.setAttribute("aria-pressed", String(button === btn));
                });
                try {
                    storage.write("menuFilter", category);
                } catch {
                    // Ignore storage errors
                }
                renderMenu(category);
                playSound();
            });
        });

        renderMenu(initialFilter);
    }

    const printBtn = document.getElementById("print-btn");
    if (printBtn) {
        printBtn.addEventListener("click", () => window.print());
    }

    // Toggle the answers in the FAQ.
    const faqButtons = document.querySelectorAll(".aura-question");
    faqButtons.forEach(button => {
        button.addEventListener("click", () => {
            const answer = document.getElementById(button.getAttribute("aria-controls"));
            const isHidden = answer.hidden;
            answer.hidden = !isHidden;
            button.querySelector(".faq-icon").textContent = isHidden ? "−" : "+";
            button.setAttribute("aria-expanded", String(isHidden));
            updateScrollProgress();
            playSound();
        });
    });

    // Real-time search through the currently selected menu category.
    function filterMenu() {
        const query = $("#menu-search").val().trim().toLowerCase();
        let count = 0;

        $(".menu-item").each(function () {
            const card = $(this);
            const text = card.find(".menu-search-text").map((_, field) => field.textContent).get().join(" ").toLowerCase();
            const matches = text.includes(query);
            card.toggle(matches);
            if (matches) count++;

            card.find(".menu-search-text").each(function () {
                highlightMatches($(this), query);
            });
        });

        $("#search-count").text(count + " drink(s) found");
        $("#no-results").prop("hidden", count > 0);
        loadLazyImages();
        updateScrollProgress();
    }

    $("#menu-search").on("input", function () {
        try {
            storage.write("menuSearch", $(this).val());
        } catch {
            // Ignore storage errors
        }
        filterMenu();
        updateSuggestions();
    });

    // Suggestions come from the names of the current category's drinks.
    function hideSuggestions() {
        $("#search-suggestions").hide();
        $("#menu-search").attr("aria-expanded", "false");
    }

    function updateSuggestions() {
        const query = $("#menu-search").val().trim().toLowerCase();
        const list = $("#search-suggestions").empty();

        if (query) {
            $(".menu-item").each(function () {
                const name = $(this).attr("data-name");
                if (name.toLowerCase().includes(query)) {
                    const button = $("<button>").attr("type", "button").text(name);
                    list.append($("<li>").append(button));
                }
            });
        }

        const hasSuggestions = list.children().length > 0;
        list.toggle(hasSuggestions);
        $("#menu-search").attr("aria-expanded", String(hasSuggestions));
    }

    $("#search-suggestions").on("click", "button", function () {
        const text = $(this).text();
        $("#menu-search").val(text).trigger("focus");
        try {
            storage.write("menuSearch", text);
        } catch {
            // Ignore storage errors
        }
        filterMenu();
        hideSuggestions();
    });

    $("#menu-search").on("focus", updateSuggestions).on("keydown", function (event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            updateSuggestions();
            $("#search-suggestions button").first().trigger("focus");
        } else if (event.key === "Escape") {
            hideSuggestions();
        }
    });

    $("#search-suggestions").on("keydown", "button", function (event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            $(this).parent().next().find("button").trigger("focus");
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            const previous = $(this).parent().prev().find("button");
            if (previous.length) previous.trigger("focus");
            else $("#menu-search").trigger("focus");
        } else if (event.key === "Escape") {
            $("#menu-search").trigger("focus");
            hideSuggestions();
        }
    });

    $(document).on("click focusin", function (event) {
        if (!$(event.target).closest("#menu-search-box").length) hideSuggestions();
    });

    // Wrap every match in <mark>; keep the original text for the next search.
    // Text nodes keep typed symbols such as <, &, [ and * safe and literal.
    function highlightMatches(element, query) {
        let original = element.data("original-text");
        if (original === undefined) {
            original = element.text();
            element.data("original-text", original);
        }
        element.empty();
        if (!query) {
            element.text(original);
            return;
        }

        const lowerText = original.toLowerCase();
        let start = 0;
        let position = lowerText.indexOf(query, start);
        while (position !== -1) {
            element.append(document.createTextNode(original.slice(start, position)));
            element.append($("<mark>").text(original.slice(position, position + query.length)));
            start = position + query.length;
            position = lowerText.indexOf(query, start);
        }
        element.append(document.createTextNode(original.slice(start)));
    }

    $("#faq-search").on("input", function () {
        const query = $(this).val().trim().toLowerCase();
        $(".faq-text").each(function () {
            highlightMatches($(this), query);
        });
        $(".aura-question").each(function () {
            const button = $(this);
            const answer = $("#" + button.attr("aria-controls"));
            const matches = query !== "" && (button.find("mark").length > 0 || answer.find("mark").length > 0);
            answer.prop("hidden", !matches);
            button.attr("aria-expanded", String(matches));
            button.find(".faq-icon").text(matches ? "−" : "+");
        });
        const count = $(".aura-faq mark").length;
        $("#faq-search-status").text(query ? count + " match(es) found" : "");
        updateScrollProgress();
    });

    // The bar shows how much of the scrollable page has been read.
    function updateScrollProgress() {
        const distance = $(document).height() - $(window).height();
        let percent = distance > 0 ? $(window).scrollTop() / distance * 100 : 0;
        percent = Math.max(0, Math.min(100, percent));
        $("#scroll-progress-bar").css("width", percent + "%");
    }

    // Shared by counters and lazy images.
    function isInViewport(element) {
        if (!element.is(":visible")) return false;
        const top = element.offset().top;
        const bottom = top + element.outerHeight();
        const windowTop = $(window).scrollTop();
        return top < windowTop + $(window).height() && bottom > windowTop;
    }

    // Start each number once, when it becomes visible.
    function animateCounters() {
        $(".counter").each(function () {
            const counter = $(this);
            if (counter.data("counted") || !isInViewport(counter)) return;
            counter.data("counted", true);
            const target = Number(counter.attr("data-target"));

            $({ value: 0 }).animate({ value: target }, {
                duration: 1500,
                step: function (value) {
                    counter.text(Math.floor(value));
                },
                complete: function () {
                    counter.text(target);
                }
            });
        });
    }

    // Show the phone field only when the visitor requests a callback.
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        const feedback = document.getElementById("contact-errors");
        const submitButton = document.getElementById("submit-message");
        const phoneField = document.getElementById("contact-phone-field");
        const phone = document.getElementById("phone");
        const controls = [...contactForm.elements].filter((element) => element.matches("input, select, textarea, button"));

        function updateContactMethod() {
            const wantsCallback = contactForm.elements.namedItem("contact-method").value === "phone";
            phoneField.hidden = !wantsCallback;
            phone.disabled = !wantsCallback;
        }

        contactForm.addEventListener("change", (event) => {
            if (event.target.name !== "contact-method") return;
            updateContactMethod();
            clearValidation(contactForm);
            showFeedback(feedback, "");
        });

        contactForm.addEventListener("reset", () => {
            clearValidation(contactForm);
            showFeedback(feedback, "");
            queueMicrotask(updateContactMethod);
        });

        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            if (submitButton.disabled) return;

            const fields = ["name", "email", "message"];
            if (!phoneField.hidden) fields.push("phone");
            const inquiry = validate(contactForm, feedback, fields);
            if (!inquiry) return;

            const inquiryType = contactForm.elements.namedItem("inquiry-type").selectedOptions[0].textContent;
            contactForm.setAttribute("aria-busy", "true");
            controls.forEach((control) => { control.disabled = true; });
            submitButton.innerHTML = '<span class="aura-spinner" aria-hidden="true"></span> Please wait…';
            showFeedback(feedback, "Processing your demo inquiry…");

            setTimeout(() => {
                contactForm.reset();
                controls.forEach((control) => { control.disabled = false; });
                contactForm.removeAttribute("aria-busy");
                submitButton.textContent = "Send Message";
                showFeedback(feedback, "Thanks, " + inquiry.name + "! Your demo request was for " +
                    inquiryType.toLowerCase() + ". This site does not send messages.", "success");
                showNotification("Demo form submitted.");
            }, 700);
        });

        updateContactMethod();
    }

    // Reuse one temporary toast for form, rating, theme and copy actions.
    function showNotification(message) {
        $("#aura-toast").stop(true, true).text(message)
            .fadeIn(200).delay(2400).fadeOut(400);
    }

    // Copy contact text; show a checkmark and a tooltip after success.
    $(".copy-btn").on("click", function () {
        const button = $(this);
        const text = $(button.attr("data-copy-target")).text();
        const tooltip = button.siblings(".copy-tooltip");
        const originalIcon = button.find(".copy-icon").html();
        button.prop("disabled", true);

        function copied() {
            button.find(".copy-icon").text("✓");
            tooltip.stop(true, true).fadeIn(150).delay(1800).fadeOut(200);
            showNotification("Copied to clipboard!");
            setTimeout(function () {
                button.find(".copy-icon").html(originalIcon);
                button.prop("disabled", false);
            }, 2200);
        }

        function copyFailed() {
            button.prop("disabled", false);
            showNotification("Copy was blocked. Please select and copy the text manually.");
        }

        // Fallback also allows copying when index.html is opened as a local file.
        function fallbackCopy() {
            const field = $("<textarea>").val(text).addClass("clipboard-helper").appendTo("body");
            field[0].select();
            try {
                if (document.execCommand("copy")) copied();
                else copyFailed();
            } catch (error) {
                copyFailed();
            }
            field.remove();
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(copied).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    });

    // Move data-src into src only when an image enters the viewport.
    function loadImage(image) {
        const source = image.attr("data-src");
        if (!source) return;
        image.one("load", updateScrollProgress);
        image.attr("src", source).removeAttr("data-src");
    }

    function loadLazyImages() {
        $("img[data-src]").each(function () {
            const image = $(this);
            if (isInViewport(image)) loadImage(image);
        });
    }

    // Bootstrap hides inactive slides. Load the next image when its slide appears.
    $("#coffeeCarousel").on("slide.bs.carousel", function (event) {
        if (isInViewport($(this))) {
            $(event.relatedTarget).find("img[data-src]").each(function () {
                loadImage($(this));
            });
        }
    }).on("slid.bs.carousel", loadLazyImages);

    $(window).on("scroll resize load", function () {
        updateScrollProgress();
        animateCounters();
        loadLazyImages();
    });
    updateScrollProgress();
    animateCounters();
    loadLazyImages();
});
