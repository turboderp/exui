
const themes = {
    Dark: "theme-dark",
    Darker: "theme-darker",
    Darkblue: "theme-darkblue",
    Light: "theme-light",
    Bold: "theme-bold",
}

export function getThemesList() {
    return Object.keys(themes);
}

export function setTheme(theme) {
    const root = document.documentElement;

    for (let t of getThemesList()) {
        if (t == theme) root.classList.add(themes[t]);
        else root.classList.remove(themes[t]);
    }
}
