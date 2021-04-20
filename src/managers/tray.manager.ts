import debug from "debug";
import { app, Menu, Tray } from "electron";
import { platform } from "os";
import { join } from "path";

import Song from "@classes/song.class";

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
	default:
		trayIcon = join(__dirname, "../assets/macos.png");
		break;
}

export default class TrayManager {
	systray: Tray;
	logger: debug.Debugger;
	constructor() {
		this.systray = new Tray(trayIcon);
		this.logger = logger.extend("TrayManager");

		this.systray.setToolTip("tidalRPC");
	}

	start() {
		this.systray.setContextMenu(
			Menu.buildFromTemplate([
				{
					label: "TidalRPC",
					enabled: false
				},
				{
					type: "separator"
				},
				{
					label: "Exit",
					role: "quit"
				}
			])
		);
	}

	update(song: Song) {
		this.systray.setContextMenu(
			Menu.buildFromTemplate([
				{
					label: "TidalRPC",
					enabled: false
				},
				{
					label: `Playing: ${song.artist} - ${song.title}`,
					enabled: false
				},
				{
					type: "separator"
				},
				{
					label: "Exit",
					role: "quit"
				}
			])
		);
	}
}

app.on("will-quit", () => trayManager?.systray.destroy());
