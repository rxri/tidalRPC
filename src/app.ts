import { app, dialog, systemPreferences } from "electron";
import { platform, version } from "os";

import TidalManager from "@managers/tidalManager";
import { arch } from "process";
import { autoUpdater } from "electron-updater";
import { blue } from "chalk";
import debug from "debug";
import { logger } from "./config";

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
		console.log(`TidalRPC v${version()}`);
		console.log(`App version: ${blue(`v${app.getVersion()}`)}`);
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
			this.logger.extend("Permissions")(
				"Screen recording permissions: Authorized."
			);
			return;
		}

		this.logger.extend("Permissions")(
			"This program doesn't have authorized perms for screen recording. Please fix that!"
		);

		const dialogVar = await dialog.showMessageBoxSync({
			title: "tidalRPC",
			message:
				"TidalRPC doesn't have screen recording permissions. Please add TidalRPC to Screen Recording permissions in 'System Preferences' or 'System Settings'.",
			buttons: ["Close program"],
			defaultId: 0,
			type: "error"
		});

		switch (dialogVar) {
			case 0:
				app.quit();
				break;
		}
	}
}
