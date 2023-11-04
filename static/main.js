import * as util from "./util.js";
import * as mainmenu from "./mainmenu.js";
import * as models from "./models.js";
import * as chat from "./chat.js";

var mainMenu = new mainmenu.MainMenu();
mainMenu.add("models", new mainmenu.MainTab("/static/gfx/icon_model.png", "Models", new models.Models()));
mainMenu.add("chat", new mainmenu.MainTab("/static/gfx/icon_chat.png", "Chat", new chat.Chat()));
mainMenu.setPage("models");




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





function setChatBlockActions(nd, block)
{

}














function showHideStats() {
    statsvisible = document.getElementById("cb-show-stats").checked;

    var divs = document.getElementsByClassName("meta");
    for(var i = 0; i < divs.length; i++) {
        if (statsvisible) divs[i].classList.remove("hidden");
        else divs[i].classList.add("hidden");
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






