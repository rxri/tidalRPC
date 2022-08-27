interface TidalStatus {
	status: "opened" | "closed" | "playing";
	windowTitle: string | null;
}
