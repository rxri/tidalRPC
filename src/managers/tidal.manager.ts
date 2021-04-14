import Process from "@classes/process.class";
import Song from "@classes/song.class";
import { setActivity } from "@managers/discord.manager";
import tidalAPI from "@classes/tidalAPI.class";

export default class TidalManager {
	api: tidalAPI;
	currentSong: Song;
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
					if (!this.currentSong.title) return setActivity(this.currentSong);

					if (!this.currentSong.paused) {
						this.currentSong.pausedTime += 1;
						this.currentSong.paused = true;
						return setActivity(this.currentSong);
					}
				}
				break;

			case "playing": {
				const data = tidalStatus.windowTitle?.split(" - ");
				if (!data) return new Error("Can't get current song.");
				if (this.compareTitle(data)) {
					if (this.currentSong.paused) {
						this.currentSong.paused = false;
						return setActivity(this.currentSong);
					}

					return;
				}

				const getInfo = await this.api.searchSong(
					tidalStatus.windowTitle as string,
					1
				);
				if (getInfo.length === 0) throw new Error("No response from API.");

				if (getInfo[0].title !== data[0])
					throw new Error("Something bad happened.");

				this.currentSong.artist = await this.getAuthors(getInfo[0].artists);
				this.currentSong.title = getInfo[0].title;
				this.currentSong.duration = getInfo[0].duration;
				this.currentSong.startTime = 0;
				this.currentSong.pausedTime = 0;
				this.currentSong.startTime = Math.floor(new Date().getTime() / 1000);

				return setActivity(this.currentSong);
			}
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

	private compareTitle(data: string[]): boolean {
		if (
			data[1] === this.currentSong.artist ||
			data[0] === this.currentSong.title
		)
			return true;

		return false;
	}
}
