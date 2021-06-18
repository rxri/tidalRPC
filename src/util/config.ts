import Store from "electron-store";

interface configType {
	showPresence: boolean;
	showAppName: boolean;
	showButtons: boolean;
	showAlbum: boolean;
	autoStart: boolean;
	authorization: {
		accessToken: string | null;
		refreshToken: string | null;
		countryUserCode: string | null;
		refreshDate: number | null;
	};
	noLoginPopup: boolean;
}

export const store = new Store<configType>({
	defaults: {
		showPresence: true,
		showAppName: true,
		showButtons: true,
		showAlbum: true,
		autoStart: true,
		authorization: {
			accessToken: null,
			refreshToken: null,
			countryUserCode: null,
			refreshDate: null
		},
		noLoginPopup: false
	}
});
