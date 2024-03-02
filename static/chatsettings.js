
import * as util from "./util.js";
import * as mainmenu from "./mainmenu.js";
import * as globals from "./globals.js";
import * as controls from "./controls.js";
import * as overlay from "./overlay.js";

export class SessionSettings {
    constructor(parent) {
        this.element = util.newHFlex();
        this.parent = parent;
        this.settings = this.parent.chatSettings;
        //console.log(this.settings);
        this.populate();
    }

    populate() {
        this.element.innerHTML = "";

        this.sss_promptFormat = new controls.CollapsibleSection(null, "Prompt format");
        this.sss_roles = new controls.CollapsibleSection(null, "Roles");
        this.sss_systemPrompt = new controls.CollapsibleSection(null, "System prompt");
        this.sss_genParams = new controls.CollapsibleSection(null, "Generation parameters");
        this.sss_sampling = new controls.CollapsibleSection(null, "Sampling");
        this.sss_stopConditions = new controls.CollapsibleSection(null, "Stop conditions");
        this.element.appendChild(this.sss_promptFormat.element);
        this.element.appendChild(this.sss_roles.element);
        this.element.appendChild(this.sss_systemPrompt.element);
        this.element.appendChild(this.sss_genParams.element);
        this.element.appendChild(this.sss_sampling.element);
        this.element.appendChild(this.sss_stopConditions.element);

        // Prompt format

        this.sss_i_promptFormat = new controls.LabelCombobox("sss-item-left", "Format", "sss-item-right sss-item-combobox", globals.g.promptFormats, this.settings, "prompt_format", () => { this.updateView(true); } );
        this.sss_promptFormat.inner.appendChild(this.sss_i_promptFormat.element);

        // Roles

        this.sss_i_roles = [];
        this.sss_i_roles[0] = new controls.LabelTextbox("sss-item-left", "User",   "sss-item-mid sss-item-textbox", "", this.settings.roles, 0, (v) => { return v.trim() != ""; }, () => { this.updateView(true); }, null);
        this.sss_i_roles[1] = new controls.LabelTextbox("sss-item-left", "Bot #1", "sss-item-mid sss-item-textbox", "", this.settings.roles, 1, (v) => { return v.trim() != ""; }, () => { this.updateView(true); }, null);
        for (let i = 2; i < 8; i++)
            this.sss_i_roles[i] = new controls.LabelTextboxButton("sss-item-left", "Bot #" + i, "sss-item-mid sss-item-textbox", "", this.settings.roles, i, (v) => { return v.trim() != ""; }, () => { this.updateView(true); }, null, "✕ Remove", () => { this.removeRole(i); });

        this.sss_i_addRole = new controls.LinkButton("+ Add...", null, () => { this.addRole(); }, "sss-item-link");

        for (let i = 0; i < 8; i++) this.sss_roles.inner.appendChild(this.sss_i_roles[i].element);
        this.sss_roles.inner.appendChild(this.sss_i_addRole.element);

        // System prompt

        this.sss_i_systemPrompt = new controls.LargeTextbox("sss-item-big-textbox", "Prompt...", this.settings, "system_prompt", null, () => { this.updateView(true); });
        this.sss_systemPrompt.inner.appendChild(this.sss_i_systemPrompt.element);

        // Generation params

        this.sss_i_maxTokens   = new controls.SettingsSlider("sss-item-left", "Max tokens",    "sss-item-mid", "sss-item-right sss-item-textbox-r", 0, 16, 2048, null,                             this.settings, "maxtokens",    () => { this.updateView(true); });
        this.sss_i_chunkTokens = new controls.SettingsSlider("sss-item-left", "Chunk tokens",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 0, 16, 2048, null,                             this.settings, "chunktokens",  () => { this.updateView(true); });
        this.sss_genParams.inner.appendChild(this.sss_i_maxTokens.element);
        this.sss_genParams.inner.appendChild(this.sss_i_chunkTokens.element);

        // Sampling

        this.sss_i_temperature      = new controls.SettingsSlider("sss-item-left", "Temperature",   "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    5, null,                             this.settings, "temperature",  () => { this.updateView(true); });
        this.sss_i_topK             = new controls.SettingsSlider("sss-item-left", "Top K",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 0,     0, 1000, { "0": "off" },                   this.settings, "top_k",        () => { this.updateView(true); });
        this.sss_i_topP             = new controls.SettingsSlider("sss-item-left", "Top P",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "top_p",        () => { this.updateView(true); });
        this.sss_i_minP             = new controls.SettingsSlider("sss-item-left", "Min P",         "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "min_p",        () => { this.updateView(true); });
        this.sss_i_quadSampling     = new controls.SettingsSlider("sss-item-left", "Quad. smooth",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    2, { "0.00": "off" },                this.settings, "quad_sampling",() => { this.updateView(true); });
        this.sss_i_tfs              = new controls.SettingsSlider("sss-item-left", "TFS",           "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "tfs",          () => { this.updateView(true); });
        this.sss_i_typical          = new controls.SettingsSlider("sss-item-left", "Typical",       "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     0,    1, { "0.00": "off", "1.00": "off" }, this.settings, "typical",      () => { this.updateView(true); });
        this.sss_i_skew             = new controls.SettingsSlider("sss-item-left", "Skew",          "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,    -5,    5, { "0.00": "off" },                this.settings, "skew",         () => { this.updateView(true); });
        this.sss_i_repPenalty       = new controls.SettingsSlider("sss-item-left", "Rep. penalty",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,     1,    3, { "1.00": "off" },                this.settings, "repp",         () => { this.updateView(true); });
        this.sss_i_repRange         = new controls.SettingsSlider("sss-item-left", "Rep. range",    "sss-item-mid", "sss-item-right sss-item-textbox-r", 0,     0, 4096, { "0": "off" },                   this.settings, "repr",         () => { this.updateView(true); });

        this.sss_i_mirostat         = new controls.CheckboxLabel("sss-item-right clickable", "Mirostat", this.settings, "mirostat", () => { this.updateView(true); });
        this.sss_i_mirostat_tau     = new controls.SettingsSlider("sss-item-left", "Mirostat tau",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,  0.01,   10, null,                             this.settings, "mirostat_tau", () => { this.updateView(true); });
        this.sss_i_mirostat_eta     = new controls.SettingsSlider("sss-item-left", "Mirostat eta",  "sss-item-mid", "sss-item-right sss-item-textbox-r", 2,  0.01,    5, null,                             this.settings, "mirostat_eta", () => { this.updateView(true); });

        this.sss_i_temperature_last = new controls.CheckboxLabel("sss-item-right clickable", "Temperature last", this.settings, "temperature_last", () => { this.updateView(true); });

        this.sss_sampling.inner.appendChild(this.sss_i_temperature.element);
        this.sss_sampling.inner.appendChild(this.sss_i_topK.element);
        this.sss_sampling.inner.appendChild(this.sss_i_topP.element);
        this.sss_sampling.inner.appendChild(this.sss_i_minP.element);
        this.sss_sampling.inner.appendChild(this.sss_i_quadSampling.element);
        this.sss_sampling.inner.appendChild(this.sss_i_tfs.element);
        this.sss_sampling.inner.appendChild(this.sss_i_typical.element);
        this.sss_sampling.inner.appendChild(this.sss_i_skew.element);
        this.sss_sampling.inner.appendChild(this.sss_i_repPenalty.element);
        this.sss_sampling.inner.appendChild(this.sss_i_repRange.element);

        this.sss_sampling.inner.appendChild(this.sss_i_mirostat.element);
        this.sss_sampling.inner.appendChild(this.sss_i_mirostat_tau.element);
        this.sss_sampling.inner.appendChild(this.sss_i_mirostat_eta.element);

        this.sss_sampling.inner.appendChild(this.sss_i_temperature_last.element);

        // Stop conditions

        this.sss_i_stopNewline = new controls.CheckboxLabel("sss-item-right clickable", "Stop on newline", this.settings, "stop_newline", () => { this.updateView(true); });
        this.sss_stopConditions.inner.appendChild(this.sss_i_stopNewline.element);

        // .

        this.updateView();
    }

    removeRole(role) {
        for (let i = role; i < 7; i++)
            this.settings.roles[i] = this.settings.roles[i + 1];
        this.settings.roles[7] = "";
        this.updateView();
    }

    addRole() {
        let numroles = 1;
        for (let i = 1; i < 8; i++) if (this.settings.roles[i].trim() != "") numroles = i + 1;
        if (numroles < 8)
        {
            this.settings.roles[numroles] = "Assistant " + numroles;
            this.updateView();
        }
    }

    updateView(send = false) {

        // Roles list

        let roles = [];
        let numroles = 1;
        for (let i = 0; i < 8; i++) roles.push(this.settings.roles[i].trim());
        if (roles[0] == "") roles[0] = "User";
        for (let i = 1; i < 8; i++) if (roles[i] != "" && i + 1 > numroles) numroles = i + 1;
        for (let i = 2; i < numroles; i++) if (roles[i] == "") roles[i] = "Assistant " + i;
        for (let i = 0; i < 8; i++) this.settings.roles[i] = roles[i];

        for (let i = 0; i < 8; i++) {
            this.sss_i_roles[i].refresh();
            this.sss_i_roles[i].setVisible(i < numroles);
        }

        this.sss_i_addRole.setVisible(numroles < 8);

        // Settings visibility

        let hasRoles = this.settings.prompt_format == "Chat-RP";
        this.sss_roles.setVisible(hasRoles);
        this.sss_stopConditions.setVisible(hasRoles);

        let opt = globals.g.promptFormatsOptions[this.settings.prompt_format];
        let hasSysPrompt = opt.supports_system_prompt;
        this.sss_systemPrompt.setVisible(hasSysPrompt);

        let mirostat = this.settings.mirostat;
        this.sss_i_mirostat_tau.setVisible(mirostat);
        this.sss_i_mirostat_eta.setVisible(mirostat);

        // Send

        if (send) this.send();
        //console.log(this.settings);
    }

    send(post = null) {
        let packet = {};
        packet.settings = this.settings;
        if (!this.parent.sessionID || this.parent.sessionID == "new") {
            fetch("/api/new_session", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                this.parent.parent.lastSessionUUID = response.session.session_uuid;
                this.parent.parent.onEnter();
                if (post) post();
            });
        } else {
            fetch("/api/update_settings", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                if (post) post();
            });
        }
    }
}
