import * as util from "./util.js";
import * as mainmenu from "./mainmenu.js";
import * as globals from "./globals.js";
import * as controls from "./controls.js";
import * as overlay from "./overlay.js";
import * as notepadsettings from "./notepadsettings.js";
import * as roles from "./roles.js";

export class Notepad {
    constructor() {
        this.page = util.newDiv(null, "models");

        let layout = util.newVFlex("grow");
        this.page.appendChild(layout);

        let layout_l = util.newHFlex();
        this.notepadList = util.newDiv(null, "notepad-list");
        this.notepadView = util.newDiv(null, "notepad-view");
        let panel = util.newDiv(null, "notepad-list-controls");
        layout.appendChild(layout_l);
        layout_l.appendChild(this.notepadList);
        layout_l.appendChild(panel);
        layout.appendChild(this.notepadView);

        this.removeButton = new controls.LinkButton("✖ Delete notepad", "✖ Confirm", () => { this.deleteNotepad(this.lastNotepadUUID); });
        panel.appendChild(this.removeButton.element);

        this.lastNotepadUUID = null;

        this.items = new Map();
        this.labels = new Map();
        this.currentView = null;
    }

    onEnter(getResponse = false) {
        fetch("/api/list_notepads")
        .then(response => response.json())
        .then(response => {
            globals.receiveGlobals(response);
            this.populateNotepadList(response, getResponse);
        });
    }

    populateNotepadList(response, getResponse = false) {
        //console.log(response);

        this.notepadList.innerHTML = "";

        for (let notepad_uuid in response.notepads)
            if (response.notepads.hasOwnProperty(notepad_uuid))
                this.addNotepad(response.notepads[notepad_uuid], notepad_uuid);

        this.addNotepad("New notepad", "new");
        let m = this.lastNotepadUUID ? this.lastNotepadUUID : "new";
        this.setNotepad(m, getResponse);
    }

    addNotepad(name, notepadID) {

        let nd = util.newDiv("notepad_" + notepadID, "notepad-list-entry inactive");
        nd.addEventListener("click", () => {
            if (nd.classList.contains("inactive"))
                this.setNotepad(notepadID);
        });

        let label = new controls.EditableLabel(name, false, (new_name) => {
            this.currentView.setName(new_name, (response) => {
                if (notepadID == "new") {
                    this.lastNotepadUUID = response.notepad.notepad_uuid;
                    this.onEnter();
                } else {
                }
            });
        });

        let nd2 = util.newIcon(notepadID == "new" ? "notepad-new-icon" : "notepad-icon");
        //nd2.classList.add("hidden");

        nd.appendChild(nd2);
        nd.appendChild(label.element);
        this.notepadList.appendChild(nd);
        this.items.set(notepadID, nd);
        this.labels.set(notepadID, label);
    }

    setNotepad(notepadID, getResponse = false) {
        this.items.forEach((v, k) => {
            let div = this.items.get(k);
            if (k == notepadID) {
                div.classList.add("active");
                div.classList.remove("inactive");
            } else {
                div.classList.remove("active");
                div.classList.add("inactive");
            }
            let label = this.labels.get(k);
            label.setEditable(k == notepadID);
        });

        this.currentView = new NotepadView(notepadID, this);
        this.currentView.updateView(getResponse);
        this.notepadView.innerHTML = "";
        this.notepadView.appendChild(this.currentView.element);
        this.lastNotepadUUID = notepadID;

        this.removeButton.setEnabled(notepadID && notepadID != "new");
    }

    deleteNotepad(notepadID) {
        let packet = {};
        packet.notepad_uuid = this.currentView.notepadID;
        util.assert(packet.notepad_uuid == this.lastNotepadUUID);
        fetch("/api/delete_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(response => {
            this.lastNotepadUUID = util.getNextKey(this.items, notepadID);
            this.onEnter();
        });
    }
}

class NotepadView {
    constructor(notepadID, parent) {
        this.notepadID = notepadID;
        this.parent = parent;

        this.element = util.newVFlex();
        this.editorView = util.newDiv("notepad-view", "notepad-view");
        this.settingsView = util.newDiv(null, "notepad-settings");

        this.element.appendChild(this.editorView);
        this.element.appendChild(this.settingsView);

        this.editor = document.createElement("div");
        this.editor.className = "notepad-editor";
        this.editor.contentEditable = "true";
        this.editor.spellcheck = false;
        this.editor.useRichtext = true;
        this.editor.addEventListener("paste", (event) => { this.paste(event); });
        this.editor.addEventListener("input", (event) => { this.input(event); });
        this.editor.addEventListener("blur", (event) => { this.blur(event); });

        this.divider = util.newDiv("notepad-view-divider", "notepad-view-divider");
        this.tokenView = util.newDiv("token-view", "token-view");
        this.tokenViewInner = util.newDiv("token-view-inner", "token-view-inner");

        this.editorView.appendChild(this.editor);
        this.editorView.appendChild(this.divider);
        this.editorView.appendChild(this.tokenView);
        this.tokenView.appendChild(this.tokenViewInner);

        this.isResizing = false;
        this.divider.addEventListener("mousedown", (event) => { this.isResizing = true; });
        document.addEventListener("mouseup", (event) => { this.isResizing = false; });
        document.addEventListener("mousemove", (event) => {
            if (!this.isResizing) return;
            let r = this.editor.getBoundingClientRect();
            let r2 = this.element.getBoundingClientRect();
            let newHeight = event.clientY - r.top - 35;
            let newHeight2 = r2.height - newHeight - 70;
            if (newHeight2 < 5) newHeight2 = 0;
            this.editor.style.height = "" + newHeight + "px";
            this.tokenView.style.height = "" + newHeight2 + "px";
        });

        this.divider.innerHTML = "<div>🯊 Tokens</div><div class='divider-bar'></div>";

    }

    updateView(getResponse = false) {
        if (!this.notepadID || this.notepadID == "new") {
            fetch("/api/get_default_settings")
            .then(response => response.json())
            .then(response => {
                globals.receiveGlobals(response);
                this.notepadSettings = response.notepad_settings;
                this.name = "New notepad";
                this.setText("Once upon a time,");
                this.populate();
            });
        } else {
            let packet = {};
            packet.notepad_uuid = this.notepadID;
            fetch("/api/set_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                globals.receiveGlobals(response);
                this.notepadSettings = response.notepad.settings;
//                this.history = new Map();
//                for (const block of response.session.history)
//                    this.history.set(block.block_uuid, block);
                this.name = response.name;
                this.populate();
                this.setText(response.notepad.text);
                if (response.tokenized_text) {
                    this.updateTokens(response.tokenized_text);
                }
            });
        }
    }

    populate() {
        this.settings = new notepadsettings.NotepadSettings(this);
        this.settingsView.innerHTML = "";
        this.settingsView.appendChild(this.settings.element);

//        this.chatHistory.innerHTML = "";
//        for (let block of this.history.values()) this.setChatBlock(block);

//        this.scrollToBottom();
//        setTimeout(() => {
//            this.scrollToBottom();
//        }, 200);
    }

    setName(new_name, post = null) {
        let packet = {};
        packet.new_name = new_name;
        if (!this.notepadID || this.notepadID == "new") {
            fetch("/api/new_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                if (post) post(response);
            });
        } else {
            fetch("/api/rename_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                if (post) post(response);
            });
        }
    }

    paste(event) {
        event.preventDefault();
        let text = (event.clipboardData || window.clipboardData).getData('text');
        document.execCommand("insertText", false, text);
//        let t = this.getText();
//        this.setText(t);
    }

    setText(text) {
        this.editor.innerHTML = "";
        let lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let div = document.createElement("div");
            let t = lines[i];
            if (t.startsWith(" ")) t = "\xa0" + t.slice(1);
            t = t.replace(/( +) /g, function(match, p1) { return p1.replace(/ /g, "\xa0") + " "; });
            div.innerText = t;
            if (lines[i] == "") div.innerHTML += "<br>";
            this.editor.appendChild(div);
        }
    }

    getTextFrom(element) {
        let cs = element.childNodes;
        let text = "";
        for (var i = 0; i < cs.length; i++) {
            let c = cs[i];
            if (c.nodeType == Node.TEXT_NODE)
            {
                text += c.textContent.replace(/\xa0/g, " ");
                if (i == cs.length -1) text += "\n";
            }
            else if (c.tagName == "BR") text += "\n";
            else text += this.getTextFrom(c);
        }
        return text;
    }

    getText() {
        let t = this.getTextFrom(this.editor).slice(0, -1);
        return t;
    }

    input(event) {
        if (!this.notepadID || this.notepadID == "new") {
            let packet = {};
            packet.text = this.editor.innerText;
            fetch("/api/new_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                this.parent.lastNotepadUUID = response.notepad.notepad_uuid;
                this.parent.onEnter();
            });
            return;
        }
        if (this.sendTextTimeout) {
            clearTimeout(this.sendTextTimeout);
            this.sendTextTimeout = null;
        }
        this.sendTextTimeout = setTimeout(() => { this.sendText(); }, 1000);
    }

    blur() {
        if (this.sendTextTimeout) this.sendText();
    }

    sendText() {
        if (this.parent.lastNotepadUUID != this.notepadID) return;

        if (this.sendTextTimeout) {
            clearTimeout(this.sendTextTimeout);
            this.sendTextTimeout = null;
        }

        let packet = {};
        packet.text = this.getText();
        fetch("/api/set_notepad_text", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            if (response.tokenized_text) this.updateTokens(response.tokenized_text);
        });
    }

    updateTokens(tokens) {
        this.tokenViewInner.innerHTML = "";
        let prevHeight = this.tokenView.style.height;
        let col = 1;
        for (let i = 0; i < tokens.length; i++) {

            let token = tokens[i];
            let div = document.createElement("div");
            div.className = "notepad-token";
            div.classList.add("color-" + col);
            col++;
            if (col > 5) col = 1;

            let div1 = document.createElement("span");
            div1.className = "notepad-token id";
            div1.innerText = "" + token.id;

            let div2 = document.createElement("span");
            div2.className = "notepad-token piece";
            div2.innerText = util.escape(token.piece).replace(" ", "␣");

            div.appendChild(div1);
            div.appendChild(div2);

            this.tokenViewInner.appendChild(div);

            if (token.piece.includes("\n")) {
                div = document.createElement("div");
                div.className = "notepad-break";
                this.tokenViewInner.appendChild(div);
                col = 1;
            }

            this.tokenView.style.height = prevHeight;
        }
    }
}




