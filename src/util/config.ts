import Store from "electron-store";

export const enum ArtistPrefs {
	justName,
	byName
}
export const enum AlbumPrefs {
	justName,
	withYear
}

export const store = new Store({
	defaults: {
		showPresence: true,
		showButtons: true,
		autoStart: true,
		artistPrefs: ArtistPrefs.justName,
		albumPrefs: AlbumPrefs.justName
	}
});
