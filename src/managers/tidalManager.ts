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
					if (!this.currentSong.title && !this.currentSong.artist)
						return setActivity(this.currentSong);

					if (!this.currentSong.paused) {
						this.currentSong.pausedTime += 1;
						this.currentSong.paused = true;
						return setActivity(this.currentSong);
					}

					this.currentSong.pausedTime += 1;
				}
				break;

			case "playing":
				{
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
							return setActivity(this.currentSong);
						}

						return true;
					}

					let getInfo = await this.api.searchSong(
						tidalStatus.windowTitle as string
					);

					if (getInfo.length === 0) return clearActivity();

					getInfo.find((song: { audioQuality: string; title: string }) => {
						if (song.audioQuality === "HI_RES" && song.title === data[0]) {
							return (getInfo = [song]);
						}

						if (song.title === data[0]) getInfo = [song];
					});

					const getAlbumInfo = await this.api.getAlbumById(getInfo[0].album.id),
						timeNow = Math.round(new Date().getTime() / 1000);

					this.currentSong.artist = await this._getAuthors(getInfo[0].artists);
					this.currentSong.title = getInfo[0].title;
					this.currentSong.album = {
						name: getAlbumInfo.title,
						year: new Date(getAlbumInfo.releaseDate).getUTCFullYear()
					};
					this.currentSong.duration = getInfo[0].duration;
					this.currentSong.quality = getInfo[0].audioQuality;
					this.currentSong.startTime = 0;
					this.currentSong.pausedTime = 0;
					this.currentSong.paused = false;
					this.currentSong.startTime = timeNow;
					this.currentSong.buttons = [];

					if (getInfo[0].url)
						this.currentSong.buttons?.push({
							label: "Listen Along!",
							url: getInfo[0].url
						});

					if (getAlbumInfo.url)
						this.currentSong.buttons?.push({
							label: "Visit Album",
							url: getAlbumInfo.url
						});

					console.log(this.currentSong);

					trayManager.update(this.currentSong);
					if (store.get("showPresence")) return setActivity(this.currentSong);
					else return clearActivity();
				}
				break;
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
