import SysTray, { Conf } from "systray2";

import debug from "debug";
import { logger } from "../config";
import { platform } from "os";

export default class TrayManager {
	options: Conf;
	systray: SysTray;
	logger: debug.Debugger;
	constructor() {
		this.options = {
			menu: {
				icon:
					platform() === "win32"
						? "./assets/windows.ico"
						: "./assets/macos.png",
				title: "TidalRPC",
				tooltip: "Unofficial Discord RPC for Tidal Desktop",
				items: [
					{
						title: "TidalRPC",
						tooltip: "Unofficial Discord RPC for Tidal Desktop",
						enabled: false
					},
					SysTray.separator,
					{
						title: "Exit",
						tooltip: "Exit program",
						enabled: true,
						// @ts-ignore
						click: () => {
							this.systray.kill(true);
						}
					}
				]
			},
			debug: false,
			copyDir: false
		};
		this.systray = new SysTray(this.options);
		this.logger = logger.extend("TrayManager");
	}

	start() {
		this.systray.onClick(action => {
			// @ts-ignore
			if (action.item?.click != null) {
				// @ts-ignore
				action.item?.click();
				this.logger("Closing tidalRPC...");
			}
		});
	}
}
