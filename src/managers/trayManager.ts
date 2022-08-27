import { Menu, Tray, app } from "electron";

import Song from "@classes/song";
import debug from "debug";
import { join } from "path";
import { logger } from "../config";
import { platform } from "os";
import { rpcClient } from "@managers/discordManager";
import { store } from "@util/config";
import { trayManager } from "../";

let trayIcon: string;

switch (platform()) {
	case "darwin":
		trayIcon = join(__dirname, "../assets/macos.png");
		break;
	case "win32":
		trayIcon = join(__dirname, "../assets/windows.ico");
		break;
}

export default class TrayManager {
	systray: Tray;
	logger: debug.Debugger;
	constructor() {
		this.systray = new Tray(trayIcon);
		this.logger = logger.extend("TrayManager");
	}

	update(song?: Song) {
		const menu = Menu.buildFromTemplate([
			{
				label: `TidalRPC ${app.getVersion()}`,
				enabled: false
			},
			{
				label: `Playing: ${song?.artist} - ${song?.title}`,
				enabled: false,
				visible: song ? true : false
			},
			{
				type: "separator"
			},
			{
				label: "Settings",
				submenu: [
					{
						label: "Start at System Startup",
						type: "checkbox",
						checked: store.get("autoStart"),
						enabled: app.isPackaged ? true : false,
						click: () => {
							store.set("autoStart", !store.get("autoStart"));
							store.get("autoStart") && app.isPackaged
								? app.setLoginItemSettings({
										openAtLogin: true,
										openAsHidden: true
								  })
								: app.setLoginItemSettings({ openAtLogin: false });
						}
					},
					{
						label: "Show Rich Presence",
						type: "checkbox",
						checked: store.get("showPresence"),
						click: () => {
							store.set("showPresence", !store.get("showPresence"));
							if (
								typeof rpcClient !== "undefined" &&
								!store.get("showPresence")
							)
								rpcClient.clearActivity();
						}
					},
					{
						label: "Rich Presence settings",
						submenu: [
							{
								label: "Show Buttons in Rich Presence",
								type: "checkbox",
								checked: store.get("showButtons"),
								click: () => store.set("showButtons", !store.get("showButtons"))
							}
						]
					}
				]
			},
			{
				label: "Exit",
				role: "quit"
			}
		]);
		this.systray.setContextMenu(menu);
	}
}

app.on("will-quit", () => trayManager?.systray.destroy());
