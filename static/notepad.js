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

    onEnter(getResponse = false, post = null) {
        fetch("/api/list_notepads")
        .then(response => response.json())
        .then(response => {
            globals.receiveGlobals(response);
            this.populateNotepadList(response, getResponse);
            if (post) post();
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

        this.editor = document.createElement("textarea");
        this.editor.className = "notepad-editor";
        this.editor.spellcheck = true;
        //this.editor.contentEditable = "true";
        //this.editor.useRichtext = true;
        //this.editor.addEventListener("paste", (event) => { this.paste(event); });
        this.editor.addEventListener("input", (event) => { this.input(event); });
        this.editor.addEventListener("blur", (event) => { this.blur(event); });
        this.editor.addEventListener("keydown", (event) => { this.keydown(event); });

        document.addEventListener("keydown", (event) => { this.keydownView(event); });

        this.divider = util.newDiv("notepad-view-divider", "notepad-view-divider");
        this.tokenView = util.newDiv("token-view", "token-view");
        this.tokenViewInner = util.newDiv("token-view-inner", "token-view-inner");
        this.controlBar = util.newDiv("notepad-bar", "notepad-bar");

        this.generateTokenButton = new controls.Button("⏵ Token", () => { this.generateToken() }, "notepad-generate-button", "ctrl + enter");
        this.generateButton = new controls.Button("⯮ Generate", () => { this.generate() }, "notepad-generate-button", "shift + enter");
        this.cancelButton = new controls.Button("⏹ Stop", () => { this.cancelGenerate() }, "notepad-generate-button", "escape");
        if (!notepadID || notepadID == "new" || !globals.g.loadedModelUUID) {
            this.generateTokenButton.setEnabled(false);
            this.generateButton.setEnabled(false);
            this.cancelButton.setEnabled(false);
        }
        this.cancelButton.setEnabled(false);
        this.cancelButton.setVisible(false);

        this.controlBar.appendChild(this.generateTokenButton.element);
        this.controlBar.appendChild(this.generateButton.element);
        this.controlBar.appendChild(this.cancelButton.element);

        this.editorView.appendChild(this.editor);
        this.editorView.appendChild(this.controlBar);
        this.editorView.appendChild(this.divider);
        this.editorView.appendChild(this.tokenView);
        this.tokenView.appendChild(this.tokenViewInner);

        this.isResizing = false;
        this.divider.addEventListener("mousedown", (event) => { this.isResizing = true; });
        document.addEventListener("mouseup", (event) => { this.isResizing = false; });
        document.addEventListener("mousemove", (event) => {
            if (!this.isResizing) return;
            //let r = this.editor.getBoundingClientRect();
            let r2 = this.element.getBoundingClientRect();
            let newHeight = event.clientY - 95;
            let newHeight2 = r2.height - newHeight - 165;
            //if (newHeight2 < 5) newHeight2 = 0;
            this.editor.style.height = "" + newHeight + "px";
            this.tokenView.style.height = "" + newHeight2 + "px";
        });

        this.divider.innerHTML = "<div>🯊 Tokens</div><div class='divider-bar'></div>";

        this.col = 1;
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

//    paste(event) {
//        event.preventDefault();
//        let text = (event.clipboardData || window.clipboardData).getData('text');
//        this.editor.insertText(false, text);
////        console.log("Paste: " + text);
////        let t = this.getText();
////        this.setText(t);
//    }

    setText(text) {
        this.editor.value = text;
        this.restoreCursor();
//        this.editor.innerHTML = "";
//        let lines = text.split('\n');
//        for (let i = 0; i < lines.length; i++) {
//            let div = document.createElement("div");
//            let t = lines[i];
//            if (t.startsWith(" ")) t = "\xa0" + t.slice(1);
//            t = t.replace(/( +) /g, function(match, p1) { return p1.replace(/ /g, "\xa0") + " "; });
//            div.innerText = t;
//            if (lines[i] == "") div.innerHTML += "<br>";
//            this.editor.appendChild(div);
//        }
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
        //let t = this.getTextFrom(this.editor).slice(0, -1);
        //return t;
        return this.editor.value;
    }

    saveCursor() {
        this.parent.selectionStart = this.editor.selectionStart;
        this.parent.selectionEnd = this.editor.selectionEnd;
        //console.log("save");
    }

    restoreCursor() {
        if (this.parent.selectionStart) {
            console.log("restore");
            this.editor.setSelectionRange(this.parent.selectionStart, this.parent.selectionEnd);
            this.editor.focus();
            this.parent.selectionStart = null;
            this.parent.selectionEnd = null;
        }
    }

    input(event) {
        if (!this.notepadID || this.notepadID == "new") {
            this.saveCursor();
            let packet = {};
            packet.text = this.getText();
            fetch("/api/new_notepad", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(response => {
                this.parent.lastNotepadUUID = response.notepad.notepad_uuid;
                this.parent.onEnter(false);
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
            //console.log(response);
            if (response.tokenized_text) this.updateTokens(response.tokenized_text);
        });
    }

    createTokenDiv(token, col) {
        let div = document.createElement("div");
        div.className = "notepad-token";
        div.classList.add("color-" + col);

        let div1 = document.createElement("span");
        div1.className = "notepad-token id";
        div1.innerText = "" + token.id;

        let div2 = document.createElement("span");
        div2.className = "notepad-token piece";
        div2.innerText = util.escape(token.piece).replace(" ", "␣");

        div.appendChild(div1);
        div.appendChild(div2);
        return div;
    }

    compareTokens(token1, token2) {
        return token1.piece == token2.piece && token1.id == token2.id;
    }

    updateTokens(tokens) {
        //this.tokenViewInner.innerHTML = "";
        let prevHeight = this.tokenView.style.height;

        let prevTokens = this.prevTokens ? this.prevTokens : [];
        let first = 0;
        let lastNew = tokens.length;
        let lastOld = prevTokens.length;

        while(first < lastNew && first < lastOld) {
            if (this.compareTokens(tokens[first], prevTokens[first])) { first++; continue; }
            if (this.compareTokens(tokens[lastNew - 1], prevTokens[lastOld - 1])) { lastNew--; lastOld--; continue; }
            break;
        }

        let firstNode = first;
        for (let i = 0; i < first; ++i) if (prevTokens[i].piece.includes("\n")) firstNode++;

        if (first < lastOld) {
            for (let i = first; i < lastOld; ++i) {
                this.tokenViewInner.children[firstNode].remove();
                if (prevTokens[i].piece.includes("\n"))
                    this.tokenViewInner.children[firstNode].remove();
                this.tokenView.style.height = prevHeight;
            }
        }

        if (first < lastNew) {
            let tail = firstNode < this.tokenViewInner.children.length ? this.tokenViewInner.children[firstNode] : null;
            for (let i = first; i < lastNew; ++i) {
                let token = tokens[i];
                this.tokenViewInner.insertBefore(this.createTokenDiv(token, this.col), tail);
                this.col++;
                if (this.col > 5) this.col = 1;
                if (token.piece.includes("\n")) {
                    let brdiv = document.createElement("div");
                    brdiv.className = "notepad-break";
                    this.tokenViewInner.insertBefore(brdiv, tail);
                }
                this.tokenView.style.height = prevHeight;
            }
        }

        this.prevTokens = tokens;
    }

    keydown(event) {
        if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();
            if (this.generateButton.enabled)
                this.generate();
        }
        if (event.key === "Enter" && event.ctrlKey) {
            event.preventDefault();
            if (this.generateTokenButton.enabled)
                this.generateToken();
        }
    }

    keydownView(event) {
        if (event.key === "Escape") {
            if (this.cancelButton.enabled) {
                this.cancelGenerate();
            }
        }
    }

    generateToken() {
        if (!globals.g.loadedModelUUID) return;

        let pos = this.editor.selectionStart;
        let end = this.editor.selectionEnd;
        let text = this.editor.value;

        if (pos == 0) return;

        this.generateButton.setEnabled(false, 200);
        this.generateTokenButton.setEnabled(false, 200);
        this.editor.disabled = true;

        if (end > pos) {
            this.editor.value = this.editor.value.slice(0, pos) + this.editor.value.slice(end);
        }

        let packet = {};
        packet.position = pos;
        packet.context = this.editor.value.slice(0, pos);
        packet.context_post = this.editor.value.slice(pos);

        fetch("/api/notepad_single_token", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(response => {
            if (response.text)
            {
//                console.log(pos, response.text.length);
                this.editor.value = packet.context + response.text + packet.context_post;
                this.editor.setSelectionRange(pos + response.text.length, pos + response.text.length);
                this.updateTokens(response.tokenized_text);
                this.editor.disabled = false;
                this.editor.focus();
            }
            this.generateButton.setEnabled(true);
            this.generateTokenButton.setEnabled(true);
            this.editor.disabled = false;
        });
    }

    generate() {
        if (!globals.g.loadedModelUUID) return;

        let pos = this.editor.selectionStart;
        let end = this.editor.selectionEnd;
        let text = this.editor.value;

        if (pos == 0) return;

        this.generateButton.setEnabled(false);
        this.generateButton.setVisible(false);
        this.cancelButton.setEnabled(true);
        this.cancelButton.setVisible(true);
        this.generateTokenButton.setEnabled(false);
        this.editor.disabled = true;

        if (end > pos) {
            this.editor.value = this.editor.value.slice(0, pos) + this.editor.value.slice(end);
        }

        this.receiveStreamPos = pos;

        let packet = {};
        packet.position = pos;
        packet.context = this.editor.value.slice(0, pos);
        packet.context_post = this.editor.value.slice(pos);

        let timeout = new Promise((resolve, reject) => {
            let id = setTimeout(() => {
                clearTimeout(id);
                reject('No response from server')
            }, 10000)
        });

        let fetchRequest = fetch("/api/notepad_generate", {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(packet)
        });

        const self = this;
        Promise.race([fetchRequest, timeout])
        .then(response => {
            if (response.ok) {
                return response.body;
            } else {
                throw new Error("Network response was not ok.");
            }
        })
        .then(stream => {
            let reader = stream.getReader();
            let decoder = new TextDecoder();
            let data = '';
            reader.read().then(function process({done, value}) {
                // console.log("Received chunk:", decoder.decode(value));
                if (done) {
                    //console.log("DONE");
                    self.generateButton.setEnabled(true);
                    self.generateButton.setVisible(true);
                    self.generateTokenButton.setEnabled(true);
                    self.cancelButton.setEnabled(false);
                    self.cancelButton.setVisible(false);
                    self.editor.disabled = false;
                    self.editor.focus();
                    return;
                }
                data += decoder.decode(value, {stream: true});
                let lines = data.split('\n');
                for (let i = 0; i < lines.length - 1; i++) {
                    let json = null;
                    try {
                        json = JSON.parse(lines[i]);
                    } catch(e) {
                        console.error("Invalid JSON:", lines[i]);
                        break;
                    }
                    if (json.result == "fail") {
                        console.error('Error:', json.error);
                        self.generateButton.setEnabled(true);
                        self.generateButton.setVisible(true);
                        self.generateTokenButton.setEnabled(true);
                        self.cancelButton.setEnabled(false);
                        self.cancelButton.setVisible(false);
                        self.editor.disabled = false;
                        self.editor.focus();
                        return;
                    } else {
                        self.receivedStreamResponse(json);
                    }
                }
                data = lines[lines.length - 1];
                reader.read().then(process);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            self.enableInput();
            self.focusInputField();
        })
    }

    receivedStreamResponse(response) {
        //console.log(response);

        if (response.result == "stream_chunk") {
            let chunk = response.text;
            let pos = this.receiveStreamPos;
            this.editor.value = this.editor.value.slice(0, pos) + chunk + this.editor.value.slice(pos);
            pos += chunk.length;
            this.editor.setSelectionRange(pos, pos);
            this.receiveStreamPos = pos;
        }

        if (response.result == "ok") {
            if (response.tokenized_text) {
                this.updateTokens(response.tokenized_text);
            }
        }

        if (response.result == "cancel") {
            if (response.tokenized_text) {
                this.updateTokens(response.tokenized_text);
            }
        }
    }

    cancelGenerate() {
        this.cancelButton.setEnabled(false);
        //console.log("cancel");
        fetch("/api/cancel_notepad_generate")
        .then(response => response.json())
        .then(response => {
        });
    }

}




