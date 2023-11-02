
createUIElements();

document.addEventListener('DOMContentLoaded', () => {

    const textarea = document.getElementById('session-input');
    textarea.addEventListener('input', autoGrow);

    textarea.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitInput();
        }
    });

    function autoGrow() {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
});

let textbox_initial = "";

let statsvisible = false;
let smoothscroll = true;

function toggleSmoothScroll() {
    smoothscroll = !smoothscroll;
}

function newDiv(className = null, id = null, html = null, parent = null, editFunc = null) {

    let nd = document.createElement('div');
    if (className) nd.className = className;
    if (id) nd.id = id;
    if (html) nd.innerHTML = html;
    if (parent) parent.appendChild(nd);
    if (editFunc) makeDivEditable(nd, editFunc);

    return nd;
}

function makeDivEditable(nd, editFunc) {

    nd.classList.add("editable");
    nd.addEventListener('click', function() { makeEditable(nd, editFunc) });

}

function getTextWithLineBreaks(node) {
    let text = "";
    for (let child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent.trim();
        } else if (child.tagName === "BR") {
            text += "\n";
        }
    }
    return text;
}

function addTextboxEvents(ctb, onValueChange, multiline = false, onExit = null)
{
    ctb.addEventListener("focus",  function() {
        textbox_initial = this.value;
    });

    ctb.addEventListener("focusout", function() {
        if (textbox_initial !== this.value) {
            //console.log(this.id, this.value);
            onValueChange(this.id, this.value);
        }
        if (onExit) {
            onExit(this.id);
        }
    });

    ctb.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            this.value = textbox_initial;
            this.blur();
            event.preventDefault();
        }
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            this.blur();
        }
        if (event.key == "Enter" && !multiline)
        {
            this.blur();
            event.preventDefault();
        }
    });
}

function makeEditable(div, onValueChange, onExit, in_text = null, multiline = false) {

    let dstyle = window.getComputedStyle(div);

    let text = in_text;

    if (!in_text) {
        text = getTextWithLineBreaks(div);
    }

    let rect = div.getBoundingClientRect();
    let computedStyle = window.getComputedStyle(div);

    let textarea = document.createElement("textarea");

    textbox_initial = text;

    addTextboxEvents(textarea, onValueChange, multiline, onExit);

    textarea.style.top = `${rect.top}px`;
    textarea.style.left = `${rect.left}px`;
    textarea.style.width = `${rect.width}px`;
    textarea.style.height = `${rect.height}px`;
    textarea.style.border = "0px";
    textarea.style.outline = computedStyle.outline;
    textarea.style.padding = computedStyle.padding;
    textarea.style.margin = computedStyle.margin;
    textarea.style.resize = computedStyle.resize;
    textarea.style.fontFamily = computedStyle.fontFamily;
    textarea.style.fontSize = computedStyle.fontSize;
    textarea.style.fontWeight = computedStyle.fontWeight;
    textarea.style.color = computedStyle.color;
    textarea.style.backgroundColor = computedStyle.backgroundColor;
    textarea.style.borderRadius = computedStyle.borderRadius;
    textarea.style.boxSizing = 'border-box';
    textarea.style.verticalAlign = computedStyle.verticalAlign;
    textarea.style.lineHeight = computedStyle.lineHeight;
    textarea.style.textAlign = computedStyle.textAlign;
    textarea.style.padding = computedStyle.padding;
    textarea.style.minHeight = `${rect.height}px`;
    textarea.rows = 1;

    textarea.value = text;

    textarea.addEventListener('blur', function () {

        div.innerHTML = textarea.value;
        div.style.display = "";
        textarea.parentNode.removeChild(textarea);

    });

    div.parentNode.insertBefore(textarea, div.nextSibling);
    div.style.display = "none";

    textarea.focus();
}

function newButton(html = null, parent = null, style = null, clickFunc = null, enabled = true) {

    let nd = newDiv("textbutton", null, html, parent);
    if (style) nd.classList.add(style);
    if (enabled) nd.classList.add("enabled");
    else nd.classList.add("disabled");
    nd.addEventListener('click', clickFunc);
    return nd;
}

function createMainMenuButton(id, text, graphic, tabName, enterFunc) {

    let menu = document.getElementById('mainmenu');

    let html = "<img src='" + graphic + "' width='100%' draggable='False'>";
    html += "<p>" + text + "</p>";

    var nd = newDiv("mainmenu-button inactive", id, html, menu);
    nd.dataset.tabName = tabName;
    document.getElementById(tabName).classList.add('hidden');


    nd.addEventListener('click', function() {
        let menu = document.getElementById('mainmenu');
        for (let i = 0; i < menu.children.length; i++) {
            let c = menu.children[i];
            if (c.nodeName === 'DIV') {
                var page = c.dataset.tabName;
                if (c == nd) {
                    c.classList.add("active");
                    c.classList.remove("inactive");
                    document.getElementById(page).classList.remove('hidden');
                } else {
                    c.classList.add("inactive");
                    c.classList.remove("active");
                    document.getElementById(page).classList.add('hidden');
                }
            }
        }

        enterFunc();
    });

    return nd;
}

function addIcon(div, icon_id, size = 24) {

    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttributeNS(null, "width", size);
    svg.setAttributeNS(null, "height", size);
    svg.style.top = "8px";

    var use = document.createElementNS(ns, "use");
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#" + icon_id);
    svg.appendChild(use);
    div.style.position = "relative";
    div.appendChild(svg);

    return svg;
}

function addModel(name, modelID) {

    let model_list = document.getElementById('model-list');

    var nd = newDiv("model-list-entry inactive", "model_" + modelID, null, model_list);

    if (modelID == "new") {
        addIcon(nd, "model-plus-icon");
    } else if (modelID == loadedModelUUID) {
        let svg = addIcon(nd, "model-loaded-icon");
        svg.classList.add("active");
    } else {
        addIcon(nd, "model-icon");
    }
    var ndi = newDiv(null, null, "<p>" + name + "</p>", nd);
    nd.dataset.modelID = modelID;

    nd.addEventListener('click', function() {
        model_list = document.getElementById('model-list');
        for (let i = 0; i < model_list.children.length; i++) {
            let c = model_list.children[i];
            if (c.nodeName === 'DIV') {
                if (c == nd) {
                    c.classList.add("active");
                    c.classList.remove("inactive");
                } else {
                    c.classList.add("inactive");
                    c.classList.remove("active");
                }
            }
        }
        showModel(nd.dataset.modelID);
    });
}

function populateModelList(model_names) {

    model_list = document.getElementById('model-list');
    model_list.innerHTML = "";

    for (let model_uuid in model_names) {
        if (model_names.hasOwnProperty(model_uuid)) {
//            console.log("----");
//            console.log(model_uuid, model_names[model_uuid]);
            addModel(model_names[model_uuid], model_uuid);
        }
    }

    addModel("New model", "new");

    let def = document.getElementById(currentModelUUID ? "model_" + currentModelUUID : "model_new");

    //console.log(def);
    //console.log(currentModelUUID);

    def.click();
}

function enterModelPage() {

    fetch("/api/list_models")
    .then(response => response.json())
    .then(json => {
        //console.log(json);

        if (json.current_model) loadedModelUUID = json.current_model;
        if (!currentModelUUID && json.current_model) currentModelUUID = json.current_model;
        populateModelList(json.models);
    });


}

function addModelItem(left, right, style = null)
{
    let model_view = document.getElementById('model-view');

    var nd = newDiv("model-view-item", null, null, model_view);
    var ndl = newDiv("model-view-item-left", null, left, nd);
    var ndr = newDiv("model-view-item-right" + (style ? (" " + style) : ""), null, right, nd);

    return ndr;
}

function addModelItem_textbox(left, id = null, text = null, editFunc = null, default_text = null, extra_style = null, append = null, prepend = null)
{
    let model_view = document.getElementById('model-view');

    var ndr;
    if (!append && !prepend)
        ndr = addModelItem(left, null);
    else
        ndr = append ? append : prepend;

    var tb = document.createElement('input');
    tb.className = "textbox";
    tb.type = 'text';
    if (text) tb.value = text;
    if (id) tb.id = id;
    if (default_text) tb.placeholder = default_text;
    if (extra_style) tb.classList.add(extra_style);

    if (editFunc) {

        tb.addEventListener("focus",  function() {
            textbox_initial = this.value;
        });

        tb.addEventListener("focusout", function() {
            if (textbox_initial !== this.value) {
                editFunc();
            }
        });

        tb.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                this.value = textbox_initial;
                this.blur();
                event.preventDefault();
            }
            if (event.key === "Enter" && !event.shiftKey) {
                this.blur();
            }
//            if (event.key == "Enter" && !multiline)
//            {
//                this.blur();
//                event.preventDefault();
//            }
        });
    }
    if (prepend)
        ndr.prepend(tb);
    else
        ndr.appendChild(tb);
    return ndr;
}

function addModelItem_checkbox(left, id = null, text = null, state = null, editFunc = null, extra_style = null)
{
    let model_view = document.getElementById('model-view');

    //console.log("state", state);

    var ndr = addModelItem(left, null);
    var ndri = document.createElement('div');
    ndri.className = "checkbox";
    if (extra_style) ndri.classList.add(extra_style);

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    //cb.className = "checkbox";
    cb.checked = state;
    if (id) cb.id = id;

    var label = document.createElement('label');
    if (id) label.htmlFor = id;
    //label.className = "checkbox"
    label.appendChild(document.createTextNode(text));

    if (editFunc) cb.addEventListener("change", function(event) { editFunc() } );

    ndri.appendChild(cb);
    ndri.appendChild(label);
    ndr.appendChild(ndri);

    return ndr;
}

function addModelItem_combo(left, id = null, options = null, selected = null, editFunc = null, extra_style = null ) {

    let model_view = document.getElementById('model-view');

    var ndr = addModelItem(left, null);
    var cb = document.createElement('select');
    cb.className = "combobox";
    if (id) cb.id = id;
    if (extra_style) cb.classList.add(extra_style);

    for (let i = 0; i < options.length; i++) cb.add(new Option(options[i], options[i]));
    cb.value = selected;

    if (editFunc) cb.addEventListener("change", function(event) { editFunc() } );

    ndr.appendChild(cb);
    return ndr;
}

function showModel_(model_info) {

    //console.log(model_info);

    let focus = saveFocus();

    let model_view = document.getElementById('model-view');
    model_view.innerHTML = "";

    // Name

    var model_name = model_info.name;
    var nd = newDiv("vflex", null, "", model_view);
    newDiv("model-view-text heading", "div-model-name", model_name, nd, sendCurrentModelView);

    if (model_info.model_uuid != "new")
        newButton("✖ Remove", nd, "small", removeCurrentModel);

    let def = document.getElementById("model_" + model_info.model_uuid);
    def.children[1].innerHTML = "<p>" + model_name + "</p>";

    newDiv("model-view-text divider", null, "", model_view);
    newDiv("model-view-text spacer", null, "", model_view);

    // Directory

    var model_dir = model_info["model_directory"] || null;
    nd = addModelItem_textbox("Model path", "tb-model-view-directory", model_dir, sendCurrentModelView, "~/models/my_model/", "wide");
    if (!model_dir || model_dir == "") return;

    newDiv("model-view-text spacer", null, "", model_view);

    if (model_info["config_status"] != "ok") {
        nd = addModelItem("", model_info["config_status_error"], "error");
        return;
    }

    // Stats

    var stats = model_info["stats"];

    addModelItem("Layers", stats["num_hidden_layers"]);

    addModelItem("Dimension", stats["hidden_size"] + " (" + stats["intermediate_size"] + ")");

    var heads_q = stats["num_attention_heads"];
    var heads_kv = stats["num_key_value_heads"];
    var head_dim = stats["head_dim"];
    if (heads_q == heads_kv) {
        addModelItem("Heads", heads_q + ", dim: " + head_dim);
    } else {
        addModelItem("Heads", "Q: " + heads_q + ", K/V: " + heads_kv + " (GQA), dim: " + head_dim);
    }

    addModelItem("Vocab size", stats["vocab_size"]);

    // Context

//    newDiv("model-view-text spacer", null, "", model_view);
//    newDiv("model-view-text divider", null, "", model_view);
    newDiv("model-view-text spacer", null, "", model_view);

    nd = addModelItem_textbox("Context length", "tb-model-seq-len", "" + model_info.seq_len, sendCurrentModelView, null, "shortright");
    newDiv("model-view-text extra", null, "(native: " + model_info.default_seq_len + ")", nd);

    addModelItem_textbox("RoPE scale", "tb-model-rope-scale", model_info.rope_scale.toFixed(2), sendCurrentModelView, null, "shortright");
    addModelItem_textbox("RoPE alpha", "tb-model-rope-alpha", model_info.rope_alpha.toFixed(2), sendCurrentModelView, null, "shortright");

    addModelItem_combo("Cache mode", "cb-model-cache-mode", [ "FP16", "FP8" ], model_info.cache_mode, sendCurrentModelView, "short");

    addModelItem_textbox("Chunk size", "tb-model-chunk-size", "" + model_info.chunk_size, sendCurrentModelView, null, "shortright");
    nd = addModelItem_checkbox("GPU split", "cb-model-gpu-split-auto", "Auto", model_info.gpu_split_auto, sendCurrentModelView, "short");
    if (!model_info.gpu_split_auto) addModelItem_textbox("GPU split", "tb-model-gpu-split", "" + model_info.gpu_split, sendCurrentModelView, null, "shortright", null, nd);

    // Draft model

    newDiv("model-view-text spacer", null, "", model_view);
    newDiv("model-view-text divider", null, "", model_view);
    newDiv("model-view-text spacer", null, "", model_view);

    addModelItem_checkbox("Speculative decoding", "cb-model-spec-dec", "Enabled", model_info.draft_enabled, sendCurrentModelView, "short");

    if (model_info.draft_enabled) {

        var draft_model_dir = model_info["draft_model_directory"] || null;
        addModelItem_textbox("Draft model path", "tb-model-view-draft-directory", draft_model_dir, sendCurrentModelView, "~/models/my_model/", "wide");
        if (!draft_model_dir || draft_model_dir == "") return;

        if (model_info["draft_config_status"] != "ok") {
            nd = addModelItem("", model_info["draft_config_status_error"], "error");
            return;
        }

        newDiv("model-view-text spacer", null, "", model_view);

        // Draft model stats

        var stats = model_info["draft_stats"];

        addModelItem("Layers", stats["num_hidden_layers"]);

        addModelItem("Dimension", stats["hidden_size"] + " (" + stats["intermediate_size"] + ")");

        var heads_q = stats["num_attention_heads"];
        var heads_kv = stats["num_key_value_heads"];
        var head_dim = stats["head_dim"];
        if (heads_q == heads_kv) {
            addModelItem("Heads", heads_q + ", dim: " + head_dim);
        } else {
            addModelItem("Heads", "Q: " + heads_q + ", K/V: " + heads_kv + " (GQA), dim: " + head_dim);
        }

        addModelItem("Vocab size", stats["vocab_size"]);

        // Draft options

        newDiv("model-view-text spacer", null, "", model_view);

        if (draft_model_dir && draft_model_dir != "") {

            nd = addModelItem_checkbox("RoPE alpha", "cb-model-draft-rope-alpha-auto", "Auto", model_info.draft_rope_alpha_auto, sendCurrentModelView, "short");
            if (!model_info.draft_rope_alpha_auto) addModelItem_textbox("RoPE alpha", "tb-model-draft-rope-alpha", (model_info.draft_rope_alpha || 1.0).toFixed(2), sendCurrentModelView, null, "shortright", null, nd);

        }
    }

    // Load

    newDiv("model-view-text spacer", null, "", model_view);
    newDiv("model-view-text divider", null, "", model_view);
    newDiv("model-view-text spacer", null, "", model_view);
    newDiv("model-view-text spacer", null, "", model_view);

    nd = newDiv("vflex", null, "", model_view);
    button_load = newButton("⏵ Load model", nd, null, loadCurrentModel, (model_info.model_uuid != loadedModelUUID));
    button_unload = newButton("⏹ Unload model", nd, null, unloadCurrentModel, (model_info.model_uuid == loadedModelUUID));

    newDiv("model-view-text spacer", null, "", model_view);

    // Error while loading

    if (model_info.model_uuid == failedModelUUID) {

        newDiv("model-view-text divider", null, "", model_view);
        newDiv("model-view-text spacer", null, "", model_view);
        newDiv("model-view-text spacer", null, "", model_view);

        addModelItem("Error", failedModelError, "error");
    }

    // Restore focus

    restoreFocus(focus);
}

function showModel(modelID) {

    if (modelID == "new")
        currentModelUUID = null;
    else
        currentModelUUID = modelID;

    let packet = {};
    packet.model_uuid = modelID;

    if (modelID == "new") {

        let model_info = {};
        model_info.model_uuid = "new";
        model_info.name = "New model";
        showModel_(model_info);

     } else {

        // console.log(packet);

        fetch("/api/get_model_info", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(json => {
            //console.log(json);
            showModel_(json.model_info);
        });
     }
}

function createUIElements() {

    let def = createMainMenuButton("mainmenu-model", "Model", "/static/gfx/icon_model.png", "model-page", enterModelPage );
    createMainMenuButton("mainmenu-chat", "Chat", "/static/gfx/icon_chat.png", "chat-page", enterChatPage );

    def.click();
}


function send(api, packet, ok_func = null, fail_func = null) {

    fetch(api, { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
    .then(response => response.json())
    .then(json => {
        if (json.hasOwnProperty("result")) {
            if (ok_func && json.result == "ok") ok_func(json);
            if (fail_func && json.result == "fail") fail_func();
        }
        else {
            //console.log(json);
            throw new Error("Bad response from server.");
        }
    })
    .catch(error => {
        alert("Error: " + error);
        console.error('Error:', error);
    });
}

function getTextBoxValue(id) {
    let d = document.getElementById(id);
    if (!d) return d;
    //console.log(id, d.value);
    return d.value;
}

function getDivValue(id) {
    let d = document.getElementById(id);
    if (!d) return d;
    return d.innerHTML;
}

function getComboBoxValue(id) {
    let d = document.getElementById(id);
    if (!d) return d;
    return d.value;
}

function getCheckboxValue(id) {
    let d = document.getElementById(id);
    if (!d) return d;
    return d.checked;
}

function newModel(json) {

    let uuid = json.new_model_uuid;
    if (uuid)
    {
        //console.log("new model", uuid);

        let model_list = document.getElementById('model-list');
        let model_new = document.getElementById('model_new');
        model_new.id = "model_" + uuid;
        model_new.innerHTML = "";
        addIcon(model_new, "model-icon")
        newDiv(null, null, "<p></p>", model_new);
        model_new.dataset.modelID = uuid;

        addModel("New model", "new");
        showModel(uuid);

    } else {

        showModel(currentModelUUID);

    }
}

function numerical(text, int, min, max) {
    let num = 0;
    if (int) num = parseInt(text, 10);
    else num = parseFloat(text);
    if (isNaN(num)) return num;
    if (num < min) return min;
    if (num > max) return max;
    return num;
}

function sendCurrentModelView() {

    let packet = {};
    packet.model_uuid = currentModelUUID;
    packet.name = getDivValue("div-model-name");
    if (packet.name == null || packet.name == "") packet.name = "Unnamed model";
    packet.model_directory = getTextBoxValue("tb-model-view-directory");

    let seq_len = numerical(getTextBoxValue("tb-model-seq-len"), true, 16, 1024*1024);
    let rope_scale = numerical(getTextBoxValue("tb-model-rope-scale"), false, 0.01, 1024);
    let rope_alpha = numerical(getTextBoxValue("tb-model-rope-alpha"), false, 0.01, 1024);
    if (!isNaN(seq_len)) packet.seq_len = seq_len;
    if (!isNaN(rope_scale)) packet.rope_scale = rope_scale;
    if (!isNaN(rope_alpha)) packet.rope_alpha = rope_alpha;

    let cache_mode = getComboBoxValue("cb-model-cache-mode");
    let chunk_size = numerical(getTextBoxValue("tb-model-chunk-size"), true, 128, 65536);
    let gpu_split_auto = getCheckboxValue("cb-model-gpu-split-auto");
    let gpu_split = getTextBoxValue("tb-model-gpu-split");
    if (cache_mode) packet.cache_mode = cache_mode;
    if (chunk_size) packet.chunk_size = chunk_size;
    if (gpu_split_auto != null) packet.gpu_split_auto = gpu_split_auto;
    if (gpu_split != null) packet.gpu_split = gpu_split;

    let draft_enabled = getCheckboxValue("cb-model-spec-dec");

    packet.draft_enabled = draft_enabled;
    if (draft_enabled) {
        packet.draft_model_directory = getTextBoxValue("tb-model-view-draft-directory");
        let draft_rope_alpha = numerical(getTextBoxValue("tb-model-draft-rope-alpha"), false, 0.01, 1024);
        let draft_rope_alpha_auto = getCheckboxValue("cb-model-draft-rope-alpha-auto");
        if (draft_rope_alpha_auto != null) packet.draft_rope_alpha_auto = draft_rope_alpha_auto;
        if (!isNaN(rope_alpha)) packet.draft_rope_alpha = draft_rope_alpha;
    }

    //console.log(gpu_split_auto);

    console.log(packet);
    send("/api/update_model", packet, newModel);
}

function removeCurrentModel() {

    let packet = {};
    packet.model_uuid = currentModelUUID;
    currentModelUUID = null;
    send("/api/remove_model", packet, enterModelPage);
}

function unloadCurrentModel() {

    pageOverlay.setMode("busy");
    fetch("/api/unload_model")
    .then(response => response.json())
    .then(json => {
        if (json.result == "ok") {
            loadedModelUUID = null;
            failedModelUUID = null;
        }
        pageOverlay.setMode();
        enterModelPage();
    });
}

function loadCurrentModel() {

    loadingOverlay.setProgress(0, 1);
    pageOverlay.setMode("loading");

    let packet = {};
    packet.model_uuid = currentModelUUID;

    let timeout = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('No response from server')
        }, 10000)
    });

    let fetchRequest = fetch("/api/load_model", {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(packet)
    });

    Promise.race([fetchRequest, timeout])
    .then(response => {
        if (response.ok) {
            return response.body;
        } else {
            //appendErrorMessage("Network response was not ok");
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
                pageOverlay.setMode();
                enterModelPage();
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
                if (json.result == "ok") {
                    loadedModelUUID = packet.model_uuid;
                    failedModelUUID = null;
                } else if (json.result == "progress") {
                    loadingOverlay.setProgress(json.module, json.num_modules);
                    //console.log(json);
                } else {
                    loadedModelUUID = null;
                    failedModelUUID = packet.model_uuid;
                    failedModelError = json.error;
                    console.log(json);
                }
            }
            data = lines[lines.length - 1];
            reader.read().then(process);
        });
    })
    .catch(error => {
        loadedModelUUID = null;
        failedModelUUID = packet.model_uuid;
        failedModelError = "" + error;
        console.error('Error:', error);
        pageOverlay.setMode();
        enterModelPage();
    });
}

function enterChatPage(subsFunc = null) {

    fetch("/api/list_sessions")
    .then(response => response.json())
    .then(json => {
        //console.log(json);
        if (!currentSessionUUID && json.current_session) currentSessionUUID = json.current_session;
        populateSessionList(json.sessions);
        if (subsFunc) subsFunc();
    });
}

function populateSessionList(session_names) {

    session_list = document.getElementById('session-list');
    session_list.innerHTML = "";

    for (let session_uuid in session_names) {
        if (session_names.hasOwnProperty(session_uuid)) {
            addSession(session_names[session_uuid], session_uuid);
        }
    }

    addSession("New session", "new");

    let def = document.getElementById(currentSessionUUID ? "session_" + currentSessionUUID : "session_new");
    def.click();
}

function addSession(name, sessionID) {

    let session_list = document.getElementById('session-list');

    var nd = newDiv("session-list-entry inactive", "session_" + sessionID, null, session_list);

    if (sessionID == "new") {
        addIcon(nd, "session-new-icon");
//    } else if (sessionID == loadedSessionUUID) {
//        let svg = addIcon(nd, "model-loaded-icon");
//        svg.classList.add("active");
    } else {
        addIcon(nd, "session-icon");
    }
    var ndi = newDiv(null, null, "<p>" + name + "</p>", nd);
    nd.dataset.sessionID = sessionID;

    nd.addEventListener('click', function(event) {
        let session_list = document.getElementById('session-list');
        let refresh = false;
        for (let i = 0; i < session_list.children.length; i++) {
            let c = session_list.children[i];
            if (c.nodeName === 'DIV') {
                if (c == nd) {
                    if (c.classList.contains("active")) {
                        renameSession(c.dataset.sessionID);
                    } else {
                        refresh = true;
                        c.classList.add("active");
                        c.classList.remove("inactive");
                    }
                } else {
                    c.classList.add("inactive");
                    c.classList.remove("active");
                }
            }
        }
        if (refresh) showSession(nd.dataset.sessionID);
    });
}

let lockEdit = false;
function renameSession(sessionID) {

    if (lockEdit) return;
    lockEdit = true;
    let div = document.getElementById("session_" + sessionID);
    div = div.children[1].children[0];
    let prev = div.innerHTML;
    makeEditable(div, function(id, val) {
        if (val.trim() != "")
        {
            if (sessionID == "new")
            {
                fetch("/api/get_default_settings")
                .then(response => response.json())
                .then(json => {
                    let packet = {};
                    packet.settings = json.settings;
                    packet.new_name = val;
                    fetch("/api/new_session", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
                    .then(response => response.json())
                    .then(json => {
                        currentSessionUUID = json.session.session_uuid;
                        enterChatPage(function() { } );
                    });
                });
            } else {
                let packet = {};
                packet.session_uuid = sessionID;
                packet.new_name = val;
                send("/api/rename_session", packet);
            }
        } else {
            div.innerHTML = prev;
        }
    }, function() {
        lockEdit = false;
    });
}

function showSession(sessionID) {

    //console.log("sessionID:", sessionID)

    if (sessionID != "new") {

        currentSessionUUID = sessionID;

        let packet = {};
        packet.session_uuid = sessionID;

        // console.log(packet);

        fetch("/api/set_session", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
        .then(response => response.json())
        .then(json => {
            //console.log(json);
            showSession_(json);
        });

     } else {

        currentSessionUUID = null;
        showSession_(null);

     }
}

function showSession_(json) {

//    console.log("xxxxxxxxxxx", json);

    let session_view = document.getElementById("session-view-history");
    session_view.innerHTML = "";

    let settings = null;
    if (json) {
        settings = json.session.settings;
        currentSettings = settings;
        prompt_formats = json.prompt_formats;
    }

    if (json)
    {
        let history = json.session.history;
        for (let i = 0; i < history.length; i++) {
            setChatBlock(history[i]);
        }
    }

    if (settings) {
        populateSessionSettings(settings, prompt_formats);
    } else {
        fetch("/api/get_default_settings")
        .then(response => response.json())
        .then(json => {
            populateSessionSettings(json.settings, json.prompt_formats);
        });
    }

    document.getElementById('session-input').value = "";
    document.getElementById('session-input').focus();
    scrollToBottom();
}

function setChatBlock(block, busy_anim = false) {

    let uuid = block.block_uuid;
    let nd = document.getElementById('chat_block_' + uuid);

    if (!nd)
    {
        let session_view = document.getElementById("session-view-history");
        nd = document.createElement('div');
        nd.id = 'chat_block_' + uuid;
        nd.className = "session-block";
        session_view.appendChild(nd);

        let ndl = newDiv("vflex", null, null, nd, null);
        let nda = newDiv("avatar-img", null, null, ndl, null);
        let ndt = newDiv("session-block-text", null, null, ndl, null);
        nda.setAttribute("data-label", "avatar-img");
        ndt.setAttribute("data-label", "text");
    }

    setChatBlockAvatarImg(nd, block);
    setChatBlockText(nd, block, busy_anim);
    setChatBlockActions(nd, block);
    setChatBlockMeta(nd, block);

    if (block.author == "user")
        nd.classList.add("user");
}

function setChatBlockMeta(nd, block)
{
    let textdiv = nd.querySelector('.session-block-text');
    if (Object.keys(block).includes("meta") && block.meta) {
        if (block.meta.overflow > 0) {
            let p = document.createElement('p');
            p.classList.add("error");
            p.innerHTML = "‼ Response exceeded " + block.meta.overflow + " tokens and was cut short.";
            textdiv.appendChild(p);
        }

        let p = document.createElement('p');
        p.classList.add("meta");
        if (!statsvisible) p.classList.add("hidden");

        let ptps = block.meta.prompt_speed.toFixed(2)
        if (block.meta.prompt_speed > 50000) ptps = "∞";

        let html = "prompt: " + block.meta.prompt_tokens.toFixed(0) + " tokens, " + ptps + " tokens/s";
        html += " ⁄ ";
        html += "response: " + block.meta.gen_tokens.toFixed(0) + " tokens, " + block.meta.gen_speed.toFixed(2) + " tokens/s";
        p.innerHTML = html;
        textdiv.appendChild(p);

    }
}

function setChatBlockActions(nd, block)
{
    let uuid = block.block_uuid;

    let actdiv = document.createElement('div');
    actdiv.classList.add("block-actions");
    actdiv.classList.add("no-select");

    let span = document.createElement("span");
    span.classList.add("action");
    span.innerHTML = "✕ Delete";
    actdiv.appendChild(span);
    span.addEventListener('click', function() {
        let packet = {};
        packet.block_uuid = uuid;
        send("/api/delete_block", packet, function() {
            let d = document.getElementById('chat_block_' + uuid);
            d.remove();
            document.getElementById('session-input').focus();
        });
    });

    span = document.createElement("span");
    span.classList.add("action");
    span.innerHTML = "🖉 Edit";
    actdiv.appendChild(span);
    span.addEventListener('click', function() {
        //console.log(nd.dataset.rawtext);
        actdiv.parentNode.classList.add("hidden_h");
        let textdiv = nd.querySelector('.session-block-text');
        makeEditable(textdiv, function(id, val) {
            // console.log("edit");
            let new_block = { ...block };
            new_block.text = val.trim();
            new_block.meta = null;
            let packet = {};
            packet.block = new_block;
            send("/api/edit_block", packet, function() {
                new_block = block;
                new_block.text = val;
                new_block.meta = null;
                setChatBlockText(nd, new_block);
                setChatBlockMeta(nd, new_block);
                setChatBlockAvatarImg(nd, new_block);
                actdiv.parentNode.classList.remove("hidden_h");
                document.getElementById('session-input').focus();
            });
        }, function(id) {
            // console.log("not edit");
            setChatBlockText(nd, block);
            setChatBlockMeta(nd, block);
            actdiv.parentNode.classList.remove("hidden_h");
            document.getElementById('session-input').focus();
        }, in_text = nd.dataset.rawtext, multiline = true);
    });

    //↻

    nd.appendChild(actdiv);
}

function getRoleID(block)
{
    if (!currentSettings) return -1;
    let t = block.text.toUpperCase();
    for (let i = 0; i < 8; i++)
    {
        if (t.startsWith(currentSettings.roles[i].toUpperCase() + ":")) return i;
    }
    return -1;
}

function setChatBlockAvatarImg(nd, block)
{
    let graphic = fallbackAvatar;
    if (currentSettings.prompt_format == "Chat-RP")
    {
        let ri = getRoleID(block);
        if (ri != -1) graphic = roleAvatars[ri];
    } else {
        if (block.author == "user") graphic = instructAvatars[0];
        if (block.author == "assistant") graphic = instructAvatars[1];
    }

    let nda = nd.querySelector('div[data-label="avatar-img"]');
    nda.innerHTML = "<img src='" + graphic + "' width='64px' draggable='False'>";
}

function setChatBlockText(nd, block, busy_anim = false)
{
    let nda = nd.querySelector('div[data-label="text"]');
    let name = null;
    let col = fallbackColor;
    let text = block.text.trimEnd();

    if (currentSettings.prompt_format == "Chat-RP")
    {
        let ri = getRoleID(block);
        if (ri != -1) {
            col = roleColors[ri];
            name = currentSettings.roles[ri];
            text = text.slice(name.length + 1).trimStart();
        }
    } else {
        if (block.author == "user") { col = instructColors[0]; name = "User"; }
        if (block.author == "assistant") { col = instructColors[1]; name = "Assistant"; }
    }

    let html = "";
    if (name) html += "<div class='name' style='color: " + col + "'>" + name + "</div>"

    if (busy_anim) {
//        html += "<div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>"
    }

    html += marked.parse(text);

    nda.innerHTML = html;
    nd.dataset.rawtext = block.text.trimEnd();
    //nd.dataset.rawblock = JSON.stringify(block);
}

function addSessionSettingsSection(heading, id = null) {

    let div = document.createElement('div');
    div.className = "sss-block";
    if (id) div.id = id;

    let div_head = document.createElement('div');
    div_head.className = "sss-block-header no-select";
    div_head.innerHTML = "<span class='arrow'>⯆</span>" + heading;
    div.appendChild(div_head);

    div_head.addEventListener('click', function() {
        let c = this.nextElementSibling;
        let a = this.children[0];
        if (c.classList.contains("shown")) {
            a.innerHTML = "⯈";
            c.classList.remove("shown");
        } else {
            a.innerHTML = "⯆";
            c.classList.add("shown");
        }
    });

    let div_contents = document.createElement('div');
    div_contents.className = "sss-block-contents shown";
    div.appendChild(div_contents);

    let nd = document.getElementById("session-settings");
    nd.appendChild(div);
    return div_contents;
}

function addSessionSettings_combo(parent, left, id = null, options = null, selected = null, editFunc = null) {

    let div = document.createElement('div');
    div.className = "sss-item-split";

    let h = document.createElement('div');
    h.className = "sss-item-left";
    h.innerHTML = left;

    let cb = document.createElement('select');
    cb.className = "sss-item-right sss-item-combobox";
    if (id) cb.id = id;

    for (let i = 0; i < options.length; i++) cb.add(new Option(options[i], options[i]));
    cb.value = selected;

    if (editFunc) cb.addEventListener("change", function(event) { editFunc(event) } );

    div.appendChild(h);
    div.appendChild(cb);
    parent.appendChild(div);
    return cb;
}

function addSessionSettings_sep(parent) {

    let div = document.createElement('div');
    div.className = "sss-item-sep";
    parent.appendChild(div);
}

function addSessionSettings_textbox(parent, left, id = null, value = null, editFunc = null, rows = 1, right = null, rightFunc = null) {

    let div = document.createElement('div');
    div.className = "sss-item-split";

    let h = document.createElement('div');
    h.className = "sss-item-left";
    h.innerHTML = left;

    let tb = document.createElement('input');
    tb.type= "text";
    if (right) tb.className = "sss-item-mid sss-item-textbox";
    else tb.className = "sss-item-right sss-item-textbox";
    tb.rows = rows;
    tb.value = value;
    tb.spellcheck = false;
    if (id) tb.id = id;
    if (editFunc) tb.addEventListener("change", function(event) { editFunc(event) } );

    let r = null;
    if (right) {
        r = document.createElement('div');
        r.className = "sss-item-right";
        r.innerHTML = right;
        if (rightFunc) {
            r.classList.add("clickable");
            r.addEventListener("click", function(event) { rightFunc(event) } );
        }
    }

    div.appendChild(h);
    div.appendChild(tb);
    if (right) div.appendChild(r);
    parent.appendChild(div);
    return tb;
}

function addSessionSettings_bigTextbox(parent, id = null, value = null, editFunc = null) {

    let tb = document.createElement('textarea');
    tb.className = "sss-item-big-textbox";
    tb.rows = 6;
    tb.value = value;
    if (id) tb.id = id;
    if (editFunc) tb.addEventListener("change", function(event) { editFunc(event) } );

    parent.appendChild(tb);
    return tb;
}


function addSessionSettings_link(parent, text, id = null, rightFunc = null) {

    let div = document.createElement('div');
    div.className = "sss-item-split";

    let r = document.createElement('div');
    r.className = "sss-item-left";
    r.innerHTML = text;
    if (id != null) r.id = id;
    if (rightFunc) {
        r.classList.add("clickable");
        r.addEventListener("click", function(event) { rightFunc(event) } );
    }

    div.appendChild(r);
    parent.appendChild(div);
}


function addSessionSettings_slider(parent, id, left, minimum, maximum, is_float, editFunc, special = null) {

    let div = document.createElement('div');
    div.className = "sss-item-split";

    let h = document.createElement('div');
    h.className = "sss-item-left";
    h.innerHTML = left;

    let slider = document.createElement('input');
    slider.type= "range";
    slider.className = "sss-item-mid";
    slider.min = minimum * (is_float ? 100 : 1);
    slider.max = maximum * (is_float ? 100 : 1);
    slider.value = slider.min;

    if (id) slider.id = id;

    let tb = document.createElement('input');
    tb.type= "text";
    tb.className = "sss-item-right sss-item-textbox-r";
    tb.rows = 1;
    tb.value = is_float ? "0.0" : "0";
    tb.spellcheck = false;
    if (id) tb.id = id + "_tb";

    if (is_float) slider.dataset.is_float = "f";
    else slider.dataset.is_float = "i";

    slider.addEventListener("input", function(event) {
        let v = parseFloat(slider.value);
        let t = "";
        if (is_float) {
            t = (v / 100.0).toFixed(2);
        } else {
            t = v.toFixed(0);
        }
        let st = "";
        if (special) {
            if (Object.keys(special).includes(t))
                st = special[t];
        }
        if (st != "") { tb.value = st; tb.classList.add("special"); }
        else { tb.value = t; tb.classList.remove("special"); }
    });

    slider.addEventListener("change", function(event) {
        if (editFunc) editFunc(event);
    });

    let originalValue = "";

    tb.addEventListener("focus", function(event) {
        originalValue = tb.value;
    });

    tb.addEventListener("blur", function(event) {
        let nvalue = parseFloat(tb.value);
        if (isNaN(nvalue)) {
            tb.value = originalValue;
            return;
        }
        if (nvalue < minimum) nvalue = minimum;
        if (nvalue > maximum) nvalue = maximum;
        if (is_float) nvalue *= 100;
        slider.value = "" + nvalue;
        slider.dispatchEvent(new Event('input'));
        slider.dispatchEvent(new Event('change'));
    });

    div.appendChild(h);
    div.appendChild(slider);
    div.appendChild(tb);
    parent.appendChild(div);
    return slider;

}

function setSlider(id, value) {

    let slider = document.getElementById(id);
    slider.value = "" + slider.dataset.is_float == "f" ? value * 100 : value;
    slider.dispatchEvent(new Event('input'));
}

function readSlider(id) {

    let slider = document.getElementById(id);
    let v = parseFloat(slider.value);
    if (slider.dataset.is_float == "f") v /= 100.0;
    return v;
}


function addSessionSettings_checkbox(parent, id, left, state, editFunc) {

    let div = document.createElement('div');
    div.className = "sss-item-split";

    let ndri = document.createElement('div');
    ndri.className = "checkbox";

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = state;
    if (id) cb.id = id;

    var label = document.createElement('label');
    if (id) label.htmlFor = id;
    label.appendChild(document.createTextNode(left));

    if (editFunc) cb.addEventListener("change", function(event) { editFunc() } );

    ndri.appendChild(cb);
    ndri.appendChild(label);
    div.appendChild(ndri);
    parent.appendChild(div);
}

function populateSessionSettings(settings, prompt_formats) {

    //console.log("xxxx", prompt_formats);

    let nd = document.getElementById("session-settings");
    nd.innerHTML = "";
    let div = null;

    div = addSessionSettingsSection("Prompt format", "sss-prompt-format");
    addSessionSettings_combo(div, "Format", "sss-prompt-format-format", prompt_formats, "", updateSessionSettings);

    div = addSessionSettingsSection("Roles", "sss-roles");
    addSessionSettings_textbox(div, "User", "sss-role-0", "", updateSessionSettings, 1, "<p></p>", null);
    addSessionSettings_textbox(div, "Bot #1", "sss-role-1", "", updateSessionSettings, 1, "<p></p>", null );
    for (let i = 2; i < 8; i++) {
        addSessionSettings_textbox(div, "Bot #" + i, "sss-role-" + i, "", updateSessionSettings, 1, "✕ Remove", function(event) {
            //console.log(i);
            for (let j = i; j < 8; j++) {
                document.getElementById("sss-role-" + j).value = (j == 7 ? "" : document.getElementById("sss-role-" + (j + 1)).value);
            }
            updateSessionSettings();
        });
    }
    addSessionSettings_link(div, "+ Add...", "sss-role-add", function(event) {
        for (let j = 1; j < 8; j++) {
            tb = document.getElementById("sss-role-" + j);
            if (tb.value == "") {
                tb.value = "Assistant " + j;
                break;
            }
        }
        updateSessionSettings();
    });

    div = addSessionSettingsSection("System prompt", "sss-system-prompt");
    addSessionSettings_bigTextbox(div, "system-prompt", "", updateSessionSettings);

    div = addSessionSettingsSection("Generation parameters", "sss-generation-params");
    addSessionSettings_slider(div, "sss-slider-maxtokens", "Max tokens", 16, 2048, false, updateSessionSettings);
    addSessionSettings_slider(div, "sss-slider-chunktokens", "Chunk tokens", 16, 2048, false, updateSessionSettings);

    div = addSessionSettingsSection("Sampling", "sss-sampling");
    addSessionSettings_slider(div, "sss-slider-temperature", "Temperature", 0, 3, true, updateSessionSettings);
    addSessionSettings_slider(div, "sss-slider-topk", "Top K", 0, 1000, false, updateSessionSettings, { "0": "off" } );
    addSessionSettings_slider(div, "sss-slider-topp", "Top P", 0, 1, true, updateSessionSettings, { "0.00": "off", "1.00": "off" });
    addSessionSettings_slider(div, "sss-slider-typical", "Typical", 0, 1, true, updateSessionSettings, { "0.00": "off", "1.00": "off" });
    addSessionSettings_slider(div, "sss-slider-repp", "Rep. penalty", 1, 3, true, updateSessionSettings, { "1.00": "off" });
    addSessionSettings_slider(div, "sss-slider-repr", "Rep. range", 0, 4096, false, updateSessionSettings);

    div = addSessionSettingsSection("Stop conditions", "sss-stop-conditions");
    addSessionSettings_checkbox(div, "sss-checkbox-stopnewline", "Stop on newline", false, updateSessionSettings);

    if (settings) {
        setSessionSettings(settings);
        updateSessionSettings(null, false);
    }

    // Session controls

    nd = document.getElementById("session-list-controls");
    nd.innerHTML = "";

    if (currentSessionUUID) {

        let ndb = document.createElement("div");
        let ndbi = document.createElement("span");
        ndbi.innerHTML = "✖ Delete session";
        ndbi.classList.add("linkbutton");
        ndbi.addEventListener('click', function() {
            if (ndbi.classList.contains("danger")) {
                let packet = {};
                packet.session_uuid = currentSessionUUID;
                currentSessionUUID = null;
                send("/api/delete_session", packet, function() {
                    enterChatPage( function() {
                        document.getElementById('session-input').focus();
                    });
                });
            } else {
                let saveHTML = ndbi.innerHTML;
                ndbi.innerHTML = "✖ Confirm";
                ndbi.classList.add("danger");
                setTimeout(function() {
                    ndbi.classList.remove("danger");
                    ndbi.innerHTML = saveHTML;
                }, 2000);
            }
        });

        nd.appendChild(ndb);
        ndb.appendChild(ndbi);
    }

    //nd.appendChild(document.createElement("p"));

    createSessionControlCheckbox(nd, "cb-show-stats", "Show generation stats", statsvisible, showHideStats);
    createSessionControlCheckbox(nd, "cb-smooth-scroll", "Smooth scrolling", smoothscroll, toggleSmoothScroll);
}

function showHideStats() {
    statsvisible = document.getElementById("cb-show-stats").checked;

    var divs = document.getElementsByClassName("meta");
    for(var i = 0; i < divs.length; i++) {
        if (statsvisible) divs[i].classList.remove("hidden");
        else divs[i].classList.add("hidden");
    }
}

function createSessionControlCheckbox(parent, id, text, state, editFunc = null) {

    let div = document.createElement('div');

    let ndri = document.createElement('div');
    ndri.className = "checkbox-sc";

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = state;
    if (id) cb.id = id;

    var label = document.createElement('label');
    if (id) label.htmlFor = id;
    label.appendChild(document.createTextNode(text));

    if (editFunc) cb.addEventListener("change", function(event) { editFunc() } );

    ndri.appendChild(cb);
    ndri.appendChild(label);
    div.appendChild(ndri);
    parent.appendChild(div);
}

function setSessionSettings(settings) {
    //console.log(settings);

    document.getElementById("sss-prompt-format-format").value = settings.prompt_format;
    for (let i = 0; i < 8; i++) document.getElementById("sss-role-" + i).value = settings.roles[i];
    document.getElementById("system-prompt").value = settings.system_prompt;
    setSlider("sss-slider-maxtokens", settings.maxtokens);
    setSlider("sss-slider-chunktokens", settings.chunktokens);
    document.getElementById("sss-checkbox-stopnewline").checked = settings.stop_newline ?? false;

    setSlider("sss-slider-temperature", settings.temperature ?? 0.8);
    setSlider("sss-slider-topk", settings.top_k ?? 50);
    setSlider("sss-slider-topp", settings.top_p ?? 0.8);
    setSlider("sss-slider-typical", settings.typical ?? 0.0);
    setSlider("sss-slider-repp", settings.repp ?? 1.15);
    setSlider("sss-slider-repr", settings.repr ?? 1024);
}

function updateSessionSettings(event, send_updates = true) {

    let focus = saveFocus();
    let settings = {};

    settings.prompt_format = document.getElementById("sss-prompt-format-format").value;

    // Roles

    if (settings.prompt_format == "Chat-RP") {
        document.getElementById("sss-roles").style.display = "";
        document.getElementById("sss-stop-conditions").style.display = "";
    } else {
        document.getElementById("sss-roles").style.display = "none";
        document.getElementById("sss-stop-conditions").style.display = "none";
    }

    let roles = [];
    let numroles = 1;
    for (let i = 0; i < 8; i++) roles.push(document.getElementById("sss-role-" + i).value.trim());
    //console.log(roles);

    if (roles[0] == "") roles[0] = "User";
    for (let i = 1; i < 8; i++) if (roles[i] != "" && i + 1 > numroles) numroles = i + 1;
    for (let i = 2; i < numroles; i++) if (roles[i] == "") roles[i] = "Assistant " + i;

    for (let i = 0; i < 8; i++) {
        document.getElementById("sss-role-" + i).parentNode.style.display = (i < numroles) ? "" : "none";
    }

    document.getElementById("sss-role-add").style.display = (numroles < 8 ? "" : "none");

    settings.roles = roles;

    // System prompt

    settings.system_prompt = document.getElementById("system-prompt").value.trim();

    // Generation params

    settings.maxtokens = readSlider("sss-slider-maxtokens");
    settings.chunktokens = readSlider("sss-slider-chunktokens");
    settings.stop_newline = document.getElementById("sss-checkbox-stopnewline").checked;

    // Sampling

    settings.temperature = readSlider("sss-slider-temperature");
    settings.top_k = readSlider("sss-slider-topk");
    settings.top_p = readSlider("sss-slider-topp");
    settings.typical = readSlider("sss-slider-typical");
    settings.repp = readSlider("sss-slider-repp");
    settings.repr = readSlider("sss-slider-repr");

    // Update history if prompt format changes

    let updateHistory = false;
    if (!currentSettings || currentSettings.prompt_format != settings.prompt_format)
        updateHistory = true;

    // Update

    currentSettings = settings;

    // Send to server

    let packet = {};
    packet.settings = settings;

    if (send_updates) {
        if (currentSessionUUID) {
            send("/api/update_settings", packet, function() { if (updateHistory) showSession(currentSessionUUID); } );
        } else {
            fetch("/api/new_session", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(json => {
                currentSessionUUID = json.session.session_uuid;
                enterChatPage(function() { restoreFocus(focus); } );
            });
        }
    }
}

function saveFocus() {

    let focus = {};
    focus.focusedDiv = document.activeElement;
    focus.focusedID = null;
    focus.selectionStart = -1;
    focus.selectionEnd = -1;

    if (focus.focusedDiv) {
        focus.focusedID = focus.focusedDiv.id;
        if (focus.focusedDiv.tagName === 'INPUT' && focus.focusedDiv.type === 'text') {
            focus.selectionStart = focus.focusedDiv.selectionStart;
            focus.selectionEnd = focus.focusedDiv.selectionEnd;
        }
    }

//    console.log(focus);
    return focus;
}

function restoreFocus(focus) {

//    console.log("restore:", focus);

    if (focus.focusedID && focus.focusedID != "")
    {
        let focusedElement = document.getElementById(focus.focusedID);
        if (focusedElement) {
            focusedElement.focus();
            if (focus.selectionStart != -1)
            {
                focusedElement.selectionStart = focus.selectionStart;
                focusedElement.selectionEnd = focus.selectionEnd;
            }
        }
    }
}

function submitInput() {

    const textarea = document.getElementById('session-input');
    input = textarea.value.trim();
    textarea.value = "";
    scrollToBottom();

    if (currentSessionUUID) {
        submitInput_(input);
    } else {
        fetch("/api/get_default_settings")
        .then(response => response.json())
        .then(json => {
            let packet = {};
            packet.settings = json.settings;
            fetch("/api/new_session", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
            .then(response => response.json())
            .then(json => {
                currentSessionUUID = json.session.session_uuid;
                enterChatPage(function() { submitInput_(input) } );
            });
        });
    }
}

function submitInput_(input) {
    if (input == "") {
        getResponse();
    } else if (loadedModelUUID) {
        supplyUserInput(input, getResponse);
    } else {
        supplyUserInput(input);
    }
}

function supplyUserInput(input, responseFunc = null) {

    let packet = {};
    packet.user_input_text = input;

    fetch("/api/user_input", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(packet) })
    .then(response => response.json())
    .then(json => {
        setChatBlock(json.new_block);
        if (responseFunc) responseFunc();
    });
}

function getResponse() {

    let packet = {};

    let timeout = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('No response from server')
        }, 10000)
    });

    let fetchRequest = fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(packet)
    });

    Promise.race([fetchRequest, timeout])
    .then(response => {
        if (response.ok) {
            return response.body;
        } else {
            //appendErrorMessage("Network response was not ok");
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
                    return;
                } else {
                    receivedStreamResponse(json);
                }
            }
            data = lines[lines.length - 1];
            reader.read().then(process);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function receivedStreamResponse(json) {

//    sticky = isNearBottom();
    sticky = true;

    if (json.result == "begin_block") {
        setChatBlock(json.block, true);
        currentStreamingBlock = json.block;
    }

    if (json.result == "prompt_eval") {
        let uuid = currentStreamingBlock.block_uuid;
        let nd = document.getElementById('chat_block_' + uuid);
        nd.children[0].children[1].innerHTML += "<div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
    }

    if (json.result == "stream_to_block") {
        currentStreamingBlock.text += json.text;
        let nd = document.getElementById('chat_block_' + json.block_uuid);
        setChatBlockText(nd, currentStreamingBlock);
    }

    if (json.result == "ok") {
        let nd = document.getElementById('chat_block_' + json.new_block.block_uuid);
        setChatBlockText(nd, json.new_block);
        setChatBlockMeta(nd, json.new_block);
    }

    if (sticky) scrollToBottom();
}

function isNearBottom() {

    const element = document.getElementById('session-view-history');
    const threshold = 10;
    const position = element.scrollTop + element.offsetHeight;
    const height = element.scrollHeight;

    console.log(element.scrollTop, element.offsetHeight, element.scrollTop + element.offsetHeight, element.scrollHeight);

    return height - position < threshold;

}

function scrollToBottom() {

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const element = document.getElementById('session-view-history');
            smoothscroll = document.getElementById("cb-smooth-scroll").checked;
            let behavior = smoothscroll ? 'smooth' : 'auto';
            element.scroll({ top: element.scrollHeight, behavior: behavior });
            element.scroll({ top: element.scrollHeight, behavior: behavior });
        });
    });
}