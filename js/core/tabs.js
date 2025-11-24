// ============================================================
// TAB SWITCHING + UNDERLINE ANIMATION
// ============================================================

function buildTabs() {

    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const underline = document.getElementById("tab-underline");
    const tabBar = document.querySelector(".tab-bar");

    function activate(name) {
        tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));

        contents.forEach(c => {
            if (c.id === "tab-" + name) {
                c.classList.add("activeTab");
                void c.offsetWidth;
            } else c.classList.remove("activeTab");
        });

        const active = document.querySelector(".tab.active");
        if (active) {
            const r = active.getBoundingClientRect();
            const pr = tabBar.getBoundingClientRect();

            underline.style.width = r.width + "px";
            underline.style.left  = (r.left - pr.left) + "px";

            const offset = (r.left - pr.left) - (tabBar.clientWidth/2 - r.width/2);
            tabBar.scrollBy({ left: offset, behavior: "smooth" });
        }
    }

    tabs.forEach(t =>
        t.addEventListener("click", () => activate(t.dataset.tab))
    );

    tabBar.addEventListener("scroll", () => {
        tabBar.classList.toggle("scrolling-left",  tabBar.scrollLeft > 5);
        tabBar.classList.toggle(
            "scrolling-right",
            tabBar.scrollLeft + tabBar.clientWidth < tabBar.scrollWidth - 5
        );
    });

    activate("modes");
}
