import { Menu, Tray, app } from "electron";

import type Song from "../classes/song.js";
import type debug from "debug";
import { join } from "node:path";
import { logger } from "../config.js";
import { platform } from "node:os";
import { rpcClient } from "./discordManager.js";
import { AlbumPrefs, ArtistPrefs, store } from "../util/config.js";
import { trayManager } from "../index.js";

let trayIcon: string;
const __dirname = import.meta.dirname;

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
				enabled: false,
			},
			{
				label: `Playing: ${song?.artist} - ${song?.title}`,
				enabled: false,
				visible: !!song,
			},
			{
				type: "separator",
			},
			{
				label: "Settings",
				submenu: [
					{
						label: "Start at System Startup",
						type: "checkbox",
						checked: store.get("autoStart"),
						enabled: !!app.isPackaged,
						click: () => {
							store.set("autoStart", !store.get("autoStart"));
							store.get("autoStart") && app.isPackaged
								? app.setLoginItemSettings({
										openAtLogin: true,
										openAsHidden: true,
									})
								: app.setLoginItemSettings({ openAtLogin: false });
						},
					},
					{
						label: "Show Rich Presence",
						type: "checkbox",
						checked: store.get("showPresence"),
						click: () => {
							store.set("showPresence", !store.get("showPresence"));
							if (typeof rpcClient !== "undefined" && !store.get("showPresence")) rpcClient.clearActivity();
						},
					},
					{
						label: "Rich Presence settings",
						submenu: [
							{
								label: "Show buttons",
								type: "checkbox",
								checked: store.get("showButtons"),
								click: () => store.set("showButtons", !store.get("showButtons")),
							},
							{
								type: "separator",
							},
							{
								label: "Album format",
								enabled: false,
							},
							{
								label: song ? song.album.name : "[ALBUM NAME]",
								type: "radio",
								checked: store.get("albumPrefs") === AlbumPrefs.justName,
								click: () => store.set("albumPrefs", AlbumPrefs.justName),
							},
							{
								label: song ? `${song.album.name} (${song.album.year})` : "[ALBUM NAME] ([ALBUM YEAR])",
								type: "radio",
								checked: store.get("albumPrefs") === AlbumPrefs.withYear,
								click: () => store.set("albumPrefs", AlbumPrefs.withYear),
							},
							{
								type: "separator",
							},
							{
								label: "Song format",
								enabled: false,
							},
							{
								label: song ? song.title : "[SONG TITLE]",
								sublabel: song ? song.artist : "[SONG ARTIST]",
								type: "radio",
								checked: store.get("artistPrefs") === ArtistPrefs.justName,
								click: () => store.set("artistPrefs", ArtistPrefs.justName),
							},
							{
								label: song ? `${song.title}` : "[SONG TITLE]",
								sublabel: song ? `by ${song.artist}` : "by [SONG ARTIST]",
								type: "radio",
								checked: store.get("artistPrefs") === ArtistPrefs.byName,
								click: () => store.set("artistPrefs", ArtistPrefs.byName),
							},
						],
					},
				],
			},
			{
				label: "Exit",
				role: "quit",
			},
		]);
		this.systray.setContextMenu(menu);
	}
}

app.on("will-quit", () => trayManager?.systray.destroy());
