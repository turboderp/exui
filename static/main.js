import * as util from "./util.js";
import * as mainmenu from "./mainmenu.js";
import * as models from "./models.js";
import * as chat from "./chat.js";
import * as settings from "./settings.js";

var settingsPopup = new settings.SettingsPopup();

var mainMenu = new mainmenu.MainMenu();
mainMenu.add("models", new mainmenu.MainTab("/static/gfx/icon_model.png", "Models", new models.Models()));
mainMenu.add("chat", new mainmenu.MainTab("/static/gfx/icon_chat.png", "Chat", new chat.Chat()));
mainMenu.addExtra("settings", new mainmenu.MainTab("/static/gfx/icon_settings.png", "Settings", null, () => { settingsPopup.toggle(); }));
mainMenu.setPage("models");








