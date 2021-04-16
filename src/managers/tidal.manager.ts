import { clearActivity, setActivity } from "@managers/discord.manager";

import Process from "@classes/process.class";
import Song from "@classes/song.class";
import { compareTitle } from "@util/compareTitle";
import tidalAPI from "@classes/tidalAPI.class";

export default class TidalManager {
	private api: tidalAPI;
	private currentSong: Song;
	constructor() {
		this.api = new tidalAPI();
		this.currentSong = new Song();
	}

	async rpcLoop() {
		const tidalStatus = await (await this.getProcess()).tidalStatus;
		if (!tidalStatus.windowTitle && tidalStatus.status === "closed") return;
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
					if (compareTitle(data, this.currentSong)) {
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

					this.currentSong.artist = await this.getAuthors(getInfo[0].artists);
					this.currentSong.title = getInfo[0].title;
					this.currentSong.duration = getInfo[0].duration;
					this.currentSong.quality = getInfo[0].audioQuality;
					this.currentSong.startTime = 0;
					this.currentSong.pausedTime = 0;
					this.currentSong.paused = false;
					this.currentSong.startTime = timeNow;
					this.currentSong.buttons = [];

					if (getInfo[0].url)
						this.currentSong.buttons?.push({
							label: "Listen along!",
							url: getInfo[0].url
						});

					if (getAlbumInfo)
						this.currentSong.buttons?.push({
							label: "View Album",
							url: getAlbumInfo.url
						});

					console.log(this.currentSong);

					return setActivity(this.currentSong);
				}
				break;
		}
	}

	private async getAuthors(
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

	private async getProcess(): Promise<Process> {
		const proc = new Process();
		await proc.getTidalTitle();

		return proc;
	}
}
