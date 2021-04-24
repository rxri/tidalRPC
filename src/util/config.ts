import Store from "electron-store";

interface configType {
	showPresence: boolean;
	showAppName: boolean;
	showButtons: boolean;
}

export const store = new Store<configType>({
	defaults: {
		showPresence: true,
		showAppName: true,
		showButtons: true
	}
});
