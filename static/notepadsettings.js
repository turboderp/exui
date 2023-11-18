
import * as util from "./util.js";
import * as mainmenu from "./mainmenu.js";
import * as globals from "./globals.js";
import * as controls from "./controls.js";
import * as overlay from "./overlay.js";

export class NotepadSettings {
    constructor(parent) {
        this.element = util.newHFlex();
        this.parent = parent;
        this.settings = this.parent.notepadSettings;
        //console.log(this.settings);
        this.populate();
    }

    populate() {
        this.element.innerHTML = "";

        this.sss_genParams = new controls.CollapsibleSection(null, "Generation parameters");
        this.sss_sampling = new controls.CollapsibleSection(null, "Sampling");
        this.element.appendChild(this.sss_genParams.element);
        this.element.appendChild(this.sss_sampling.element);

        // Generation params

        this.sss_i_maxTokens   = new controls.SettingsSlider("sss-item-left", "Max tokens",    "sss-item-mid", "sss-item-right sss-item-textbox-r", 0, 16, 2048, null,                             this.settings, "maxtokens",    () => { this.updateView(true); });
        this.sss_i_chunkTokens = new controls.SettingsSlider("sss-item-left", "Chunk tokens",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 0, 16, 2048, null,                             this.settings, "chunktokens",  () => { this.updateView(true); });
        this.sss_stopConditions = new controls.CollapsibleSection(null, "Stop conditions");
        this.sss_genParams.inner.appendChild(this.sss_i_maxTokens.element);
        this.sss_genParams.inner.appendChild(this.sss_i_chunkTokens.element);
        this.element.appendChild(this.sss_stopConditions.element);

        // Sampling

        this.sss_i_temperature  = new controls.SettingsSlider("sss-item-left", "Temperature",   "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    3, null,                             this.settings, "temperature",  () => { this.updateView(true); });
        this.sss_i_topK         = new controls.SettingsSlider("sss-item-left", "Top K",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 0,     0, 1000, { "0": "off" },                   this.settings, "top_k",        () => { this.updateView(true); });
        this.sss_i_topP         = new controls.SettingsSlider("sss-item-left", "Top P",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "top_p",        () => { this.updateView(true); });
        this.sss_i_minP         = new controls.SettingsSlider("sss-item-left", "Min P",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "min_p",        () => { this.updateView(true); });
        this.sss_i_tfs          = new controls.SettingsSlider("sss-item-left", "TFS",           "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "tfs",          () => { this.updateView(true); });
        this.sss_i_typical      = new controls.SettingsSlider("sss-item-left", "Typical",       "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "typical",      () => { this.updateView(true); });
        this.sss_i_repPenalty   = new controls.SettingsSlider("sss-item-left", "Rep. penalty",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     1,    3, { "1.00": "off" },                this.settings, "repp",         () => { this.updateView(true); });
        this.sss_i_repRange     = new controls.SettingsSlider("sss-item-left", "Rep. range",    "sss-item-mid", "sss-item-right sss-item-textbox-r", 0,     0, 4096, { "0": "off" },                   this.settings, "repr",         () => { this.updateView(true); });

        this.sss_i_mirostat     = new controls.CheckboxLabel("sss-item-right clickable", "Mirostat", this.settings, "mirostat", () => { this.updateView(true); });
        this.sss_i_mirostat_tau = new controls.SettingsSlider("sss-item-left", "Mirostat tau",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,  0.01,   10, null,                             this.settings, "mirostat_tau", () => { this.updateView(true); });
        this.sss_i_mirostat_eta = new controls.SettingsSlider("sss-item-left", "Mirostat eta",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,  0.01,    5, null,                             this.settings, "mirostat_eta", () => { this.updateView(true); });

        this.sss_sampling.inner.appendChild(this.sss_i_temperature.element);
        this.sss_sampling.inner.appendChild(this.sss_i_topK.element);
        this.sss_sampling.inner.appendChild(this.sss_i_topP.element);
        this.sss_sampling.inner.appendChild(this.sss_i_minP.element);
        this.sss_sampling.inner.appendChild(this.sss_i_tfs.element);
        this.sss_sampling.inner.appendChild(this.sss_i_typical.element);
        this.sss_sampling.inner.appendChild(this.sss_i_repPenalty.element);
        this.sss_sampling.inner.appendChild(this.sss_i_repRange.element);

        this.sss_sampling.inner.appendChild(this.sss_i_mirostat.element);
        this.sss_sampling.inner.appendChild(this.sss_i_mirostat_tau.element);
        this.sss_sampling.inner.appendChild(this.sss_i_mirostat_eta.element);

        // Stop conditions

        this.populate_stop_conditions();

        this.updateView();
    }

    populate_stop_conditions() {
        this.sss_stopConditions.inner.innerHTML = "";
        this.sss_i_stopconditions = [];

        for (let i = 0; i < this.settings.stop_conditions.length; i++) {
            this.sss_i_stopconditions[i] = new controls.CheckboxTextboxButton(
                "stop_condition_" + i,
                "sss-item-left",
                "Incl.",
                "sss-item-mid sss-item-textbox",
                "",
                this.settings,
                "stop_conditions",
                i,
                "text",
                "inclusive",
                (v) => { return v != ""; },
                () => { this.updateView(true); },
                "✕ Remove",
                () => {
                    this.settings.stop_conditions.splice(i, 1);
                    this.populate_stop_conditions();
                    this.updateView(true);
                }
            );
        }

        for (let i = 0; i < this.settings.stop_conditions.length; i++)
            this.sss_stopConditions.inner.appendChild(this.sss_i_stopconditions[i].element);

        if (this.settings.stop_conditions.length < 10) {
            this.sss_i_addStopCondition = new controls.LinkButton("+ Add...", null, () => {
                this.settings.stop_conditions.push({text: "", inclusive: false});
                this.populate_stop_conditions();
                this.updateView(true);
            }, "sss-item-link");
            this.sss_stopConditions.inner.appendChild(this.sss_i_addStopCondition.element);
        }
    }

    updateView(send = false) {

        // Settings visibility

        let mirostat = this.settings.mirostat;
        this.sss_i_mirostat_tau.setVisible(mirostat);
        this.sss_i_mirostat_eta.setVisible(mirostat);

        // Send

        if (send) this.send();
        //console.log(this.settings);
    }

    send(post = null) {
        //console.log(this.settings);

        let packet = {};
        packet.settings = this.settings;
        if (!this.parent.notepadID || this.parent.notepadID == "new") {
            fetch("/api/new_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                this.parent.parent.lastNotepadUUID = response.notepad.notepad_uuid;
                this.parent.parent.onEnter();
                if (post) post(response);
            });
        } else {
            fetch("/api/update_notepad_settings", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                if (post) post(response);
            });
        }
    }



}
