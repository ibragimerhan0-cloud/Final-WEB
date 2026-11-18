"use strict";

(() => {
    const endpoint = "https://api.sampleapis.com/coffee/hot";
    const results = document.getElementById("guide-results");
    const status = document.getElementById("guide-status");
    const retry = document.getElementById("guide-retry");

    const classics = [
        {
            title: "Espresso",
            image: "images/gallery-espresso.jpg",
            ingredients: ["Finely ground coffee", "Water"]
        },
        {
            title: "Cappuccino",
            image: "images/gallery-cappuccino.jpg",
            ingredients: ["Espresso", "Steamed milk", "Milk foam"]
        },
        {
            title: "Latte",
            image: "images/latte-art.jpg",
            ingredients: ["Espresso", "Steamed milk"]
        }
    ];

    function renderDrinks(drinks) {
        results.replaceChildren();
        for (const drink of drinks) {
            const column = document.createElement("div");
            column.className = "col-sm-6 col-xl-4";

            const card = document.createElement("article");
            card.className = "card h-100 overflow-hidden";
            const image = document.createElement("img");
            image.className = "card-img-top guide-photo";
            image.src = drink.image;
            image.alt = drink.title;
            image.loading = "lazy";

            const body = document.createElement("div");
            body.className = "card-body";
            const name = document.createElement("h3");
            name.className = "h5";
            name.textContent = drink.title;
            const ingredients = document.createElement("p");
            ingredients.className = "small mb-0";
            ingredients.textContent = "Ingredients: " + drink.ingredients.join(", ");

            body.append(name, ingredients);
            card.append(image, body);
            column.append(card);
            results.append(column);
        }
    }

    async function loadGuide() {
        status.classList.remove("aura-error");
        status.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading coffee guide…';
        results.setAttribute("aria-busy", "true");
        retry.hidden = true;

        try {
            const response = await fetch(endpoint, { signal: AbortSignal.timeout(7000) });
            if (!response.ok) throw new Error("Coffee API returned " + response.status);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Unexpected coffee guide data.");

            // Pair the live ingredient lists with the project's own photos.
            const drinks = classics.flatMap((classic) => {
                const match = data.find((drink) =>
                    typeof drink?.title === "string" && drink.title.trim().toLowerCase() === classic.title.toLowerCase()
                );
                if (!Array.isArray(match?.ingredients)) return [];
                const ingredients = match.ingredients.filter((value) => typeof value === "string" && value.trim());
                return ingredients.length ? [{ ...classic, ingredients }] : [];
            });
            if (drinks.length === 0) throw new Error("The API did not return the featured drinks.");

            renderDrinks(drinks);
            status.textContent = "Ingredients loaded from SampleAPIs.";
        } catch {
            renderDrinks(classics);
            status.classList.add("aura-error");
            status.textContent = "The live guide is unavailable. Showing our quick guide instead.";
            retry.hidden = false;
        } finally {
            results.removeAttribute("aria-busy");
        }
    }

    retry.addEventListener("click", loadGuide);
    loadGuide();
})();
