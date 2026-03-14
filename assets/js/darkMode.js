const toggleDarkMode = (changeTweetsTheme) => {
    const switchTheme = () => {
        const rootElem = document.querySelector("html[data-color-scheme]");
        const gecko = document.getElementById("gecko");
        const priceChartElements = document.querySelectorAll(".gecko-price-chart");
        let dataTheme = rootElem.getAttribute("data-color-scheme");
        let newTheme = dataTheme === "light" ? "dark" : "light";
        rootElem.setAttribute("data-color-scheme", newTheme);
        localStorage.setItem("color-scheme", newTheme);
        if (gecko) {
            gecko.setAttribute("dark-mode", newTheme === "dark" ? "true" : "false");
        }
        if (priceChartElements.length) {
            priceChartElements.forEach((chart) => {
                chart.setAttribute("dark-mode", newTheme === "dark" ? "true" : "false");
            });
        }
        changeTweetsTheme();
    };

    const toggleBtns = document.querySelectorAll(".gh-dark-mode-toggle-btn");
    toggleBtns.forEach((btn) => {
        btn.addEventListener("click", switchTheme);
    });
};

export { toggleDarkMode };
