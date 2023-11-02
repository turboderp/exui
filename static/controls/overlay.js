
class PageOverlay {
    constructor() {
        this.keyboardDisabled = false;
        document.addEventListener("keydown", (e) => {
            if (this.keyboardDisabled) e.preventDefault();
        });

        this.overlayElement = document.createElement("div");
        this.overlayElement.style.cssText = "position: fixed;" +
                                            "top: 0;" +
                                            "left: 0;" +
                                            "width: 100vw;" +
                                            "height: 100vh;" +
                                            "background-color: rgba(0, 0, 0, 0.5);" +
                                            "pointer-events: auto;" +
                                            "z-index: 1000;" +
                                            "display: none;" +
                                            "justify-content: center;" +
                                            "align-items: center;";
        document.body.appendChild(this.overlayElement);

        this.items = new Map();
    }

    add(mode, control) {
        this.items.set(mode, control);
        this.overlayElement.appendChild(control.element);
        return control;
    }

    setMode(mode = null) {
        if (!mode) {
            this.keyboardDisabled = false;
            this.overlayElement.style.display = "none";
            this.items.forEach((v, k) => { v.setVisible(false); });
        } else {
            this.keyboardDisabled = true;
            this.overlayElement.style.display = "flex";
            this.items.forEach((v, k) => { v.setVisible(mode === k); });
        }
    }
}

class Overlay {
    setVisible(visible) {
        this.element.style.display = visible ? "flex" : "none";
    }

    createOverlayElement() {
        this.element = document.createElement("div");
        this.element.style.cssText = "background-color: var(--background-color-view);" +
                                     "padding: 20px;" +
                                     "padding-bottom: 40px;" +
                                     "box-shadow: 0 14px 18px rgba(0, 0, 0, 0.3);" +
                                     "border-radius: 8px;" +
                                     "display: flex;" +
                                     "flex-direction: column;" +
                                     "z-index: 1001;" +
                                     "opacity: 100%;" +
                                     "justify-content: center;" +
                                     "align-items: center;";
    }
}

class BusyOverlay extends Overlay {
    constructor() {
        super();
        super.createOverlayElement();
        this.element.innerHTML = "<p class='p-header'>Please wait</p>" +
                                 "<div class='spinner'><div></div><div></div><div></div><div></div></div>";
    }
}

class LoadingOverlay extends Overlay {
    constructor() {
        super();
        super.createOverlayElement();
        this.element.innerHTML = "<p class='p-header'>Loading</p>";

        this.box = document.createElement("div");
        this.box.style.cssText = "box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3);" +
                                 "width: 320px;" +
                                 "background-color: var(--progress-color-back);" +
                                 "border: 1px solid var(--progress-color);" +
                                 "padding: 2px;" +
                                 "border-radius: 0px;";
        this.element.appendChild(this.box);

        this.bar = document.createElement("div");
        this.bar.style.cssText = "height: 10px;" +
                                 "width: 0%;" +
                                 "background-color: var(--progress-color);" +
                                 "border-radius: 0px;" +
                                 "text-align: center;" +
                                 "line-height: 30px;";
        this.box.appendChild(this.bar);
    }

    setProgress(a, b) {
        let percentage = 100 * (a / b);
        this.bar.style.width = percentage + '%';
    }
}

var pageOverlay = new PageOverlay();
var busyOverlay = pageOverlay.add("busy", new BusyOverlay());
var loadingOverlay = pageOverlay.add("loading", new LoadingOverlay());
