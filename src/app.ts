import { blue } from "chalk";
import debug from "debug";
import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { textSync } from "figlet";
import { askForScreenCaptureAccess, getAuthStatus } from "node-mac-permissions";
import { platform, version } from "os";
import { arch } from "process";

import { LoginManager } from "@managers/loginManager";
import TidalManager from "@managers/tidalManager";
import { store } from "@util/config";

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
		if (platform() === "linux") {
			return (
				this.logger("TidalRPC is not designed to run on Linux."), app.quit()
			);
		}
		this._consoleLog();
		this._checkUpdates();
		setTimeout(async () => await this._checkPerms(), 100);
	}

	private _consoleLog() {
		console.log(textSync("tidalRPC"));
		console.log(`App version: ${blue(`v${app.getVersion()}`)}`);
		console.log(`Kernel Version: ${blue(version())}`);
		console.log(`userData path: ${blue(app.getPath("userData"))}`);
	}

	private _checkUpdates() {
		autoUpdater.autoDownload = false;
		autoUpdater.checkForUpdatesAndNotify();
		if (arch === "arm64") return;
		autoUpdater.on("update-available", () => {
			autoUpdater.downloadUpdate();
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

	private async _askForLogin() {
		if (store.get("noLoginPopup")) return this._init();
		const loginManager = new LoginManager(),
			dialogVar = await dialog.showMessageBoxSync({
				title: "tidalRPC",
				message:
					"You can use your own Tidal account to get better results for your song! Do you want to login?",
				buttons: ["Yes!", "No (don't show again)"],
				defaultId: 0,
				type: "info"
			});

		switch (dialogVar) {
			case 0:
				{
					try {
						const res = await loginManager.loginToTidal();
						store.set("authorization.accessToken", res.authorizationToken);
						store.set("authorization.refreshToken", res.refreshToken);
						store.set(
							"authorization.refreshDate",
							~~(new Date().getTime() / 1000)
						);
						store.set("noLoginPopup", true);
					} catch (err) {
						const dialogVar = await dialog.showMessageBoxSync({
							title: "tidalRPC",
							message:
								"There was issue with login to your account. Do you want to try again?",
							buttons: ["Yes!", "No (don't show again)"],
							defaultId: 0,
							type: "error"
						});

						switch (dialogVar) {
							case 0:
								{
									try {
										const res = await loginManager.loginToTidal();
										store.set(
											"authorization.accessToken",
											res.authorizationToken
										);
										store.set("authorization.refreshToken", res.refreshToken);
										store.set(
											"authorization.refreshDate",
											~~(new Date().getTime() / 1000)
										);
										store.set("noLoginPopup", true);
									} catch (err) {
										store.set("noLoginPopup", true);
									}
								}
								break;

							case 1:
								{
									store.set("noLoginPopup", true);
								}
								break;
						}
					}
				}
				break;

			case 1:
				{
					store.set("noLoginPopup", true);
				}
				break;
		}

		return this._init();
	}

	private async _checkPerms() {
		if (platform() !== "darwin") return this._askForLogin();
		const screenPerms = await getAuthStatus("screen");
		if (screenPerms !== ("denied" || "restricted")) {
			this.logger.extend("Permissions")(
				"Screen recording permissions: Authorized."
			);
			return this._askForLogin();
		}

		this.logger.extend("Permissions")(
			"This program doesn't have authorized perms for screen recording. Please fix that!"
		);

		const dialogVar = await dialog.showMessageBoxSync({
			title: "tidalRPC",
			message:
				"TidalRPC doesn't have screen recording permissions. Click 'Open System Preferences' button to add them.",
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
}
