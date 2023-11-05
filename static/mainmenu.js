import * as util from "./util.js";

export class MainMenu {
    constructor() {
        let layout = util.newVFlex("grow");
        document.body.appendChild(layout);

        this.tabs = util.newDiv(null, "mainmenu-main");
        this.tabsTop = util.newDiv(null, "mainmenu");
        this.tabsSpacer = util.newDiv(null, "mainmenu-spacer");
        this.tabsBot = util.newDiv(null, "mainmenu");
        this.tabs.appendChild(this.tabsTop);
        this.tabs.appendChild(this.tabsSpacer);
        this.tabs.appendChild(this.tabsBot);

        this.pages = util.newDiv(null, "mainmenu-page");
        layout.appendChild(this.tabs);
        layout.appendChild(this.pages);

        this.items = new Map();
    }

    add(tab, control) {
        //console.log(tab, control);
        this.items.set(tab, control);
        this.tabsTop.appendChild(control.tab);
        if (control.page) this.pages.appendChild(control.page);

        control.tab.addEventListener("click", () => {
            this.setPage(tab);
        });

        return control;
    }

    addExtra(tab, control) {
        //console.log(tab, control);
        this.items.set(tab, control);
        this.tabsBot.appendChild(control.tab);

        return control;
    }

    setPage(tab) {
        this.items.forEach((v, k) => { v.setActive(tab === k); });
        this.items.get(tab).child.onEnter();
    }
}

export class MainTab {
    constructor(graphic, text, child, clickFunc = null) {
        this.tab = document.createElement("div");
        this.tab.className = "mainmenu-button inactive";
        this.tab.innerHTML = "<img src='" + graphic + "' width='100%' draggable='False'>" +
                             "<p>" + text + "</p>";

        if (child) {
            this.child = child;
            this.page = child.page;
        }

        if (clickFunc) {
            this.tab.addEventListener("click", () => { clickFunc() });
        }
    }

    setActive(active) {
        if (active) {
            this.tab.classList.add("active");
            this.tab.classList.remove("inactive");
        } else {
            this.tab.classList.remove("active");
            this.tab.classList.add("inactive");
        }
        if (this.page) this.page.style.display = active ? "flex" : "none";
    }
}


