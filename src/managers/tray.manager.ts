import debug from "debug";
import { app, Menu, Tray } from "electron";
import { platform } from "os";
import { join } from "path";

import Song from "@classes/song.class";
import { store } from "@util/config";

import { trayManager } from "../";
import { logger } from "../config";

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

		this.systray.setContextMenu(
			Menu.buildFromTemplate([
				{
					label: `TidalRPC ${app.getVersion()}`,
					enabled: false
				},
				{
					type: "separator"
				},
				{
					label: "Settings",
					submenu: [
						{
							label: "Show Rich Presence",
							type: "checkbox",
							checked: store.get("showPresence"),
							click: () => {
								store.set("showPresence", !store.get("showPresence"));
							}
						},
						{
							label: "Show AppName in Rich Presence",
							type: "checkbox",
							checked: store.get("showAppName"),
							click: () => {
								store.set("showAppName", !store.get("showAppName"));
							}
						},
						{
							label: "Show Buttons in Rich Presence",
							type: "checkbox",
							checked: store.get("showButtons"),
							click: () => {
								store.set("showButtons", !store.get("showButtons"));
							}
						}
					]
				},
				{
					label: "Exit",
					role: "quit"
				}
			])
		);

		this.systray.setToolTip("tidalRPC");
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
						label: "Show Rich Presence",
						type: "checkbox",
						checked: store.get("showPresence"),
						click: () => {
							store.set("showPresence", !store.get("showPresence"));
						}
					},
					{
						label: "Show AppName in Rich Presence",
						type: "checkbox",
						checked: store.get("showAppName"),
						click: () => {
							store.set("showAppName", !store.get("showAppName"));
						}
					},
					{
						label: "Show Buttons in Rich Presence",
						type: "checkbox",
						checked: store.get("showButtons"),
						click: () => {
							store.set("showButtons", !store.get("showButtons"));
						}
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
