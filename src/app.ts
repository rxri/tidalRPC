import debug from "debug";
import { textSync } from "figlet";
import { getAuthStatus } from "node-mac-permissions";
import { platform } from "os";

import { destroyClient } from "@managers/discord.manager";
import TidalManager from "@managers/tidal.manager";
import TrayManager from "@managers/tray.manager";

import { logger } from "./config";

export default class App {
	private logger: debug.Debugger;
	private tidalManager: TidalManager;
	private trayManager: TrayManager;
	constructor() {
		this.logger = logger.extend("Application");
		this.tidalManager = new TidalManager();
		this.trayManager = new TrayManager();
	}

	private _figlet() {
		console.log(textSync("tidalRPC"));
	}

	private _init() {
		this.trayManager.start();
		this.logger.extend("rpcLoop")("Starting RPC Loop...");
		this.tidalManager.rpcLoop();
	}

	private async _checkPerms() {
		if (platform() !== "darwin") return;
		const screenPerms = await getAuthStatus("screen");
		if (screenPerms === ("denied" || "restricted")) {
			this.logger.extend("Permissions")(
				"This program doesn't have authorized perms for screen recording. Please fix that!"
			);
			process.exit(0);
		}
		this.logger.extend("Permissions")(
			"Screen recording permissions: Authorized."
		);
	}

	async start() {
		debug.enable("tidalRPC:*");
		this._figlet();
		await this._checkPerms();
		this._init();

		setInterval(() => {
			this.tidalManager.rpcLoop();
		}, 1000);
	}
}

process.on("beforeExit", () => {
	destroyClient();
	process.exit(0);
});
