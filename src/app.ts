import debug from "debug";
import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { textSync } from "figlet";
import { askForScreenCaptureAccess, getAuthStatus } from "node-mac-permissions";
import { platform } from "os";

import TidalManager from "@managers/tidalManager";

import { logger } from "./config";

export default class App {
	private logger: debug.Debugger;
	private tidalManager: TidalManager;
	constructor() {
		this.logger = logger.extend("Application");
		this.tidalManager = new TidalManager();
	}

	private _figlet() {
		console.log(textSync("tidalRPC"));
	}

	private _checkUpdates() {
		autoUpdater.checkForUpdatesAndNotify();
		autoUpdater.on("update-downloaded", () => {
			autoUpdater.quitAndInstall();
		});
	}

	private _init() {
		this.logger.extend("rpcLoop")("Starting RPC Loop...");
		this.tidalManager.rpcLoop();

		setInterval(() => {
			this.tidalManager.rpcLoop();
		}, 1000);
	}

	private async _checkPerms() {
		if (platform() !== "darwin") return this._init();
		const screenPerms = await getAuthStatus("screen");
		if (screenPerms !== ("denied" || "restricted")) {
			this.logger.extend("Permissions")(
				"Screen recording permissions: Authorized."
			);
			return this._init();
		}

		this.logger.extend("Permissions")(
			"This program doesn't have authorized perms for screen recording. Please fix that!"
		);

		const dialogVar = await dialog.showMessageBoxSync({
			title: "tidalRPC",
			message:
				'TidalRPC doesn\'t have screen recording permissions. Click "Open System Preferences" button to add them.',
			buttons: ["Open System Preferences", "Close program"],
			defaultId: 0,
			type: "error"
		});

		switch (dialogVar) {
			case 0:
				{
					askForScreenCaptureAccess();
					app.quit();
				}
				break;

			case 1:
				app.quit();
				break;
		}
	}

	async start() {
		if (platform() === "linux")
			return (
				this.logger("TidalRPC is not designed to run on Linux distros."),
				app.quit()
			);
		debug.enable("tidalRPC:*");
		this._figlet();
		this._checkUpdates();
		setTimeout(async () => await this._checkPerms(), 100);
	}
}
