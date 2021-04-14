interface requestHeaders {
	"x-tidal-token": string;
}

interface presenceStructure {
	state?: string;
	details?: string;
	smallImageText?: string;
	smallImageKey?: string;
	startTimestamp?: number;
	endTimestamp?: number;
	largeImageText?: string;
	largeImageKey?: string;
}

interface currentSong {
	title: string | null;
	artist: string | null;
	startTime: number;
	duration: number;
	pausedTime: number;
	paused: boolean;
	quality: "master" | "hifi" | "normal";
}

interface TidalStatus {
	status: "opened" | "closed" | "playing";
	windowTitle: string | null;
}
