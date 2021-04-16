interface requestHeaders {
	"x-tidal-token": string;
}

interface TidalStatus {
	status: "opened" | "closed" | "playing";
	windowTitle: string | null;
}
