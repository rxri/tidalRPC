import Process from "@classes/process";
import Song from "@classes/song";
import TidalAPI from "@classes/tidalAPI";
import { clearActivity, setActivity } from "@managers/discordManager";
import { compareTitle } from "@util/compareTitle";
import { store } from "@util/config";

import { trayManager } from "../";

export default class TidalManager {
	private api: TidalAPI;
	private currentSong: Song;
	constructor() {
		this.api = new TidalAPI();
		this.currentSong = new Song();
	}

	async rpcLoop() {
		const tidalStatus = await (await this._getTidalProcess()).tidalStatus;
		if (!tidalStatus.windowTitle && tidalStatus.status === "closed")
			return clearActivity(), this._clearCurrentSong();
		switch (tidalStatus.status) {
			case "opened":
				{
					if (!this.currentSong.title && !this.currentSong.artist) {
						if (!store.get("showPresence")) return clearActivity();
						return setActivity(this.currentSong);
					}

					if (!this.currentSong.paused) {
						this.currentSong.pausedTime += 1;
						this.currentSong.paused = true;
						if (!store.get("showPresence")) return clearActivity();
						return setActivity(this.currentSong);
					}

					this.currentSong.pausedTime += 1;
				}
				break;

			case "playing": {
				const data = tidalStatus.windowTitle?.split(" - ");
				if (!data) return new Error("Can't get current song.");
				if (
					compareTitle(data, this.currentSong) &&
					this.currentSong.startTime +
						this.currentSong.duration +
						this.currentSong.pausedTime -
						Math.round(new Date().getTime() / 1000) >
						0
				) {
					if (this.currentSong.paused) {
						this.currentSong.paused = false;
						if (!store.get("showPresence")) return clearActivity();
						return setActivity(this.currentSong);
					}

					return true;
				}

				const authors = data[1].split(", ");

				let songsInfo = await this.api.searchSong(
					`${data[0].toLowerCase()} ${authors[0].toLowerCase()}`
				);

				if (!songsInfo || songsInfo.length === 0)
					return clearActivity(), this._clearCurrentSong();

				songsInfo.find((song: { audioQuality: string; title: string }) => {
					if (song.audioQuality === "HI_RES" && song.title === data[0]) {
						return (songsInfo = song);
					}

					if (song.title === data[0]) songsInfo = song;
				});

				const getAlbumInfo = await this.api.getAlbumById(songsInfo.album.id),
					timeNow = ~~(new Date().getTime() / 1000);

				this.currentSong.artist = await this._getAuthors(songsInfo.artists);
				this.currentSong.title = songsInfo.title;
				this.currentSong.album = {
					name: getAlbumInfo.title,
					year: new Date(getAlbumInfo.releaseDate).getUTCFullYear()
				};
				this.currentSong.duration = songsInfo.duration;
				this.currentSong.quality = songsInfo.audioQuality;
				this.currentSong.startTime = 0;
				this.currentSong.pausedTime = 0;
				this.currentSong.paused = false;
				this.currentSong.startTime = timeNow;
				this.currentSong.buttons = [];

				if (songsInfo.id)
					this.currentSong.buttons?.push({
						label: "Listen Along",
						url: `tidal://track/${songsInfo.id}`
					});

				if (getAlbumInfo.url)
					this.currentSong.buttons?.push({
						label: "Visit Album",
						url: getAlbumInfo.url
					});

				console.log(this.currentSong);

				trayManager.update(this.currentSong);
				if (!store.get("showPresence")) return clearActivity();
				return setActivity(this.currentSong);
			}
		}
	}

	private _clearCurrentSong() {
		this.currentSong.title = undefined;
		this.currentSong.artist = undefined;
		this.currentSong.album = undefined;
		this.currentSong.startTime = 0;
		this.currentSong.duration = 0;
		this.currentSong.pausedTime = 0;
		this.currentSong.paused = false;
		this.currentSong.quality = "NORMAL";

		trayManager.update();
	}

	private async _getAuthors(
		res: [{ id: number; name: string; type: "string"; picture: string | null }]
	) {
		let authorString;
		if (res.length > 1) {
			const authorsArray = Array.from(res);
			authorString = authorsArray
				.slice(0, authorsArray.length)
				.map(a => a.name)
				.join(", ");
		} else authorString = res[0].name;

		return authorString;
	}

	private async _getTidalProcess(): Promise<Process> {
		const proc = new Process();
		await proc.getTidalTitle();

		return proc;
	}
}
