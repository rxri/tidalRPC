import Store from "electron-store";

export const store = new Store({
	defaults: {
		showPresence: true,
		showButtons: true,
		autoStart: true
	}
});
