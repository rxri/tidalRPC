import { Client, Presence } from "discord-rpc";

import Song from "@classes/song.class";
import { clientID } from "../config";

let rpcClient: discordClient;

class discordClient {
	clientId: string;
	private client: Client;
	ready: boolean = false;
	actualPresence!: Presence;

	constructor(clientID: string) {
		this.clientId = clientID;
		this.client = new Client({
			transport: "ipc"
		});

		this.client.on("ready", () => {
			this.ready = true;
			this.setActivity();
		});

		this.client
			.login({ clientId: this.clientId })
			.catch(err => console.error(err));
	}

	setActivity(data?: Presence) {
		data = data ? data : this.actualPresence;
		if (!this.ready) return;

		this.client.setActivity(data).catch(() => this.client.destroy());
	}

	clearActivity() {
		if (!this.ready) return;

		this.client.clearActivity().catch(() => this.client.destroy());
	}
}

export function setActivity(data: Song) {
	const presenceData: presenceStructure = {
		largeImageKey: "logo",
		largeImageText: "Tidal"
	};

	if (!data) {
		return clearActivity();
	}

	if (!data.duration) presenceData.startTimestamp = data.startTime;
	else if (!data.paused)
		presenceData.endTimestamp =
			data.startTime + data.duration + data.pausedTime;

	presenceData.state = data.title;
	presenceData.details = data.artist;
	presenceData.smallImageKey = data.paused ? "pause" : "play";
	presenceData.smallImageText = data.paused ? "Paused" : "Playing";

	if (data.paused && presenceData.endTimestamp)
		delete presenceData.endTimestamp;

	if (data.duration && presenceData.startTimestamp)
		delete presenceData.startTimestamp;

	if (!rpcClient) {
		rpcClient = new discordClient(clientID);
		rpcClient.actualPresence = presenceData;
	} else rpcClient.setActivity(presenceData);
}

function clearActivity() {
	if (!rpcClient) return;
	rpcClient.clearActivity();
}
