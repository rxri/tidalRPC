export default class Song {
	title: string | undefined;
	artist: string | undefined;
	startTime: number;
	duration: number;
	pausedTime: number;
	paused: boolean;
	quality: "HI_RES" | "LOSSLESS" | "NORMAL";

	constructor() {
		this.title = undefined;
		this.artist = undefined;
		this.startTime = 0;
		this.duration = 0;
		this.pausedTime = 0;
		this.paused = false;
		this.quality = "NORMAL";
	}
}
