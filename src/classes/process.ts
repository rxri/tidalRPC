import { type Window, windowManager } from "node-window-manager";
import type { TidalStatus } from "../interfaces/tidalStatus.js";

export default class Process {
	private titleRegex: RegExp;
	tidalStatus: TidalStatus;
	constructor() {
		this.titleRegex = /(.+) - (?!\\{)(.+)/;
		this.tidalStatus = { status: "closed", windowTitle: null };
	}

	async getTidalTitle(): Promise<string | undefined> {
		const data = await this._getProcessList();

		if (!data) {
			this.tidalStatus.status = "closed";
			return;
		}

		data.map(async window => {
			const windowTitle = window.getTitle();

			if (
				(this.titleRegex.test(windowTitle) || windowTitle === "TIDAL") &&
				!(
					windowTitle.includes("MSCTFIME UI") ||
					windowTitle.includes("Default IME") ||
					windowTitle.includes("MediaPlayer SMTC window")
				)
			) {
				this.tidalStatus.status = "opened";
				this.tidalStatus.windowTitle = windowTitle;
				return;
			}
		});

		if (this.tidalStatus.windowTitle && this.titleRegex.test(this.tidalStatus.windowTitle)) {
			this.tidalStatus.status = "playing";
			return;
		}
	}

	private async _getProcessList(): Promise<Window[] | null> {
		try {
			const runningProcesses = windowManager.getWindows();
			const findTIDAL = runningProcesses.filter((window: { path: string | string[] }) => {
				return window.path.includes("TIDAL");
			});

			if (findTIDAL.length === 0) return null;

			return findTIDAL;
		} catch (err) {
			console.log(err);
			return null;
		}
	}
}
