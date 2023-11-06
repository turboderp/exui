import * as util from "./util.js";
import * as controls from "./controls.js";
import * as globals from "./globals.js";
import * as theme from "./theme.js";

export class SettingsPopup {
    constructor() {
        this.element = util.newDiv(null, "settings-float");
        this.element.classList.add("hidden");
        document.body.appendChild(this.element);

        this.populated = false;
        this.loadSettings();
    }

    toggle() {
        if (this.element.classList.contains("hidden")) {
            this.element.classList.remove("hidden");
        } else {
            this.element.classList.add("hidden");
        }
    }

    loadSettings() {
        fetch("/api/get_settings")
        .then(response => response.json())
        .then(response => {
            this.settings = response.settings;
            this.populate();
            this.applyGlobals();
        });
    }

    populate() {
        if (this.populated) return;

        this.s_smoothScrolling = new controls.CheckboxLabel("checkbox-sc noselect", "Smooth scrolling", this.settings, "smooth_scrolling", () => { this.saveSettings(); });
        this.s_showStats = new controls.CheckboxLabel("checkbox-sc noselect", "Display stats", this.settings, "show_stats", () => { this.saveSettings(); });
        this.s_theme = new controls.LabelCombobox("sss-item-left", "Theme", "sss-item-right sss-item-combobox", theme.getThemesList(), this.settings, "theme", () => { this.saveSettings(); });
        this.element.appendChild(this.s_smoothScrolling.element);
        this.element.appendChild(this.s_showStats.element);
        this.element.appendChild(this.s_theme.element);

        this.refresh();
    }

    refresh() {
        this.s_theme.refresh();
        this.s_smoothScrolling.refresh();
        this.s_showStats.refresh();
    }

    saveSettings() {
        this.applyGlobals();

        let packet = {}
        packet.settings = this.settings;
        fetch("/api/set_settings", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(response => {
        });
    }

    applyGlobals() {
        // console.log(this.settings);
        globals.g.smoothScrolling = this.settings.smooth_scrolling;

        let r = document.querySelector(':root');
        r.style.setProperty("--show-stats", this.settings.show_stats ? "flex" : "none");

        theme.setTheme(this.settings.theme);
    }

}