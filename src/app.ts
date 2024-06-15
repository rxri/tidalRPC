import { app, dialog, systemPreferences } from "electron";

import TidalManager from "./managers/tidalManager.js";
import pkg from "electron-updater";
import debug from "debug";
import { logger } from "./config.js";

const { autoUpdater } = pkg;

export default class App {
	private logger: debug.Debugger;
	private tidalManager: TidalManager;
	constructor() {
		this.logger = logger.extend("Application");
		this.tidalManager = new TidalManager();
	}

	async start() {
		debug.enable("tidalRPC:*");
		this._consoleLog();
		this._checkUpdates();
		setTimeout(async () => await this._checkPerms(), 100);
		this._init();
	}

	private _consoleLog() {
		console.log(`TidalRPC v${app.getVersion()}`);
	}

	private _checkUpdates() {
		autoUpdater.autoDownload = false;
		autoUpdater.checkForUpdatesAndNotify().catch(err => {
			console.error(err);
		});
		autoUpdater.on("update-available", () => {
			autoUpdater.downloadUpdate().catch(err => {
				console.error(err);
			});
		});
		autoUpdater.on("update-downloaded", () => {
			autoUpdater.quitAndInstall();
		});
	}

	private _init() {
		this.logger.extend("rpcLoop")("Starting RPC Loop...");

		setInterval(() => {
			this.tidalManager.rpcLoop();
		}, 1000);
	}

	private async _checkPerms() {
		const screenPerms = await systemPreferences.getMediaAccessStatus("screen");
		if (screenPerms !== ("denied" || "restricted")) {
			return;
		}

		this.logger.extend("Permissions")(
			"This program doesn't have authorized perms for screen recording. TidalRPC needs to be authorized to record screen to get window title.",
		);

		const dialogVar = await dialog.showMessageBoxSync({
			title: "tidalRPC",
			message:
				"TidalRPC doesn't have screen recording permissions. Please add TidalRPC to Screen Recording permissions in 'System Preferences' or 'System Settings'.",
			buttons: ["Close program"],
			defaultId: 0,
			type: "error",
		});

		switch (dialogVar) {
			case 0:
				app.quit();
				break;
		}
	}
}
