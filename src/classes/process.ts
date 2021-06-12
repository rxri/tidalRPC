import { Window, windowManager } from "node-window-manager";

export default class Process {
	private titleRegex: RegExp;
	tidalStatus: TidalStatus;
	constructor() {
		this.titleRegex = /(.+) - (?!\\{)(.+)/;
		this.tidalStatus = { status: "closed", windowTitle: null };
	}

	async getTidalTitle(): Promise<string | void> {
		const data = await this._getProcessList();

		if (!data) return (this.tidalStatus.status = "closed");

		data.map(async window => {
			const windowTitle = window.getTitle();

			if (
				(this.titleRegex.test(windowTitle) || windowTitle === "TIDAL") &&
				!(
					windowTitle.includes("MSCTFIME UI") ||
					windowTitle.includes("Default IME") ||
					windowTitle.includes("MediaPlayer SMTC window")
				)
			)
				return (
					(this.tidalStatus.status = "opened"),
					(this.tidalStatus.windowTitle = windowTitle)
				);
		});

		if (
			this.tidalStatus.windowTitle &&
			this.titleRegex.test(this.tidalStatus.windowTitle)
		)
			return (this.tidalStatus.status = "playing");
	}

	private async _getProcessList(): Promise<Window[] | null> {
		const data = await windowManager
			.getWindows()
			.filter(window => window.path.includes("TIDAL"));

		if (data.length === 0) return null;

		return data;
	}
}
