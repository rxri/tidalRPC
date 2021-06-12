import Store from "electron-store";

interface configType {
	showPresence: boolean;
	showAppName: boolean;
	showButtons: boolean;
	showAlbum: boolean;
	autoStart: boolean;
	tidalToken: string | null;
	noLoginPopup: boolean;
	countryUserCode: string | null;
}

export const store = new Store<configType>({
	defaults: {
		showPresence: true,
		showAppName: true,
		showButtons: true,
		showAlbum: true,
		autoStart: true,
		tidalToken: null,
		noLoginPopup: false,
		countryUserCode: null
	}
});
