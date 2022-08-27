export default class Song {
	title: string | undefined;
	artist: string | undefined;
	album: { name: string; year: number } | undefined;
	duration: number;
	startTime: number;
	pausedTime: number;
	largeImage: string | undefined;
	buttons?: { label: string; url: string }[];

	constructor() {
		this.title = undefined;
		this.artist = undefined;
		this.duration = 0;
		this.startTime = 0;
		this.pausedTime = 0;
		this.largeImage = undefined;
	}
}
