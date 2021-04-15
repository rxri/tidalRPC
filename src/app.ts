import TidalManager from "@managers/tidal.manager";
import TrayManager from "@managers/tray.manager";
import debug from "debug";
import { destroyClient } from "@managers/discord.manager";
import { logger } from "./config";
import { textSync } from "figlet";

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

	async start() {
		debug.enable("tidalRPC:*");
		this._figlet();
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
