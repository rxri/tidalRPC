import Store from "electron-store";

export enum ArtistPrefs {
	justName = 0,
	byName = 1,
}
export enum AlbumPrefs {
	justName = 0,
	withYear = 1,
}

export const store = new Store({
	defaults: {
		showPresence: true,
		showButtons: true,
		autoStart: true,
		artistPrefs: ArtistPrefs.justName,
		albumPrefs: AlbumPrefs.justName,
	},
});
