import { Client, type Presence } from "discord-rpc";
import { clientID } from "../config";

import type Song from "@classes/song";
import { AlbumPrefs, ArtistPrefs, store } from "@util/config";

export let rpcClient: DiscordClient;

class DiscordClient {
	clientId: string;
	private client: Client;
	private ready = false;
	private activityCleared = false;
	actualPresence!: Presence;
	lastCall: number = Date.now() - 5000;

	constructor(clientID: string) {
		rpcClient = this;
		this.clientId = clientID;
		this.client = new Client({
			transport: "ipc",
		});

		this.client.on("ready", () => {
			this.ready = true;
			this.setActivity();
		});

		this.client.on(
			// @ts-ignore
			"disconnected",
			() => {
				this.client.destroy();
				rpcClient = this;
			},
		);

		this.client
			.login({ clientId: this.clientId })
			.catch((err: unknown) => console.error(err));
	}

	setActivity(data?: Presence) {
		const rpcData = data ? data : this.actualPresence;
		if (!this.ready) return;
		if (this.activityCleared) this.activityCleared = false;

		this.client.setActivity(rpcData).catch(() => this.client.destroy());
	}

	clearActivity() {
		if (!this.ready || this.activityCleared) return;

		this.client.clearActivity().catch(() => this.client.destroy());
		this.activityCleared = true;
	}

	destroyClient() {
		if (!this.ready) return;

		this.client.destroy();
	}
}

export const setActivity = (data: Song) => {
		if (!data?.startTime) return clearActivity();

		const presenceData: Presence = {
			largeImageKey: data.largeImage,
		};

		if (data.album) {
			switch (store.get("albumPrefs")) {
				case AlbumPrefs.withYear:
					presenceData.largeImageText = `${data.album.name} (${data.album.year})`;
					break;
				case AlbumPrefs.justName:
					presenceData.largeImageText = data.album.name;
					break;
			}
		}

		if (!data.duration) presenceData.startTimestamp = data.startTime;
		else
			presenceData.endTimestamp =
				data.startTime + data.duration + data.pausedTime;

		switch (store.get("artistPrefs")) {
			case ArtistPrefs.byName:
				presenceData.state = `by ${data.artist}`;
				break;
			case ArtistPrefs.justName:
				presenceData.state = `${data.artist}`;
		}

		presenceData.details = data.title;

		if (data.buttons && data.buttons.length !== 0 && store.get("showButtons"))
			presenceData.buttons = data.buttons;

		if (data.duration && presenceData.startTimestamp)
			// biome-ignore lint/performance/noDelete: <explanation>
			delete presenceData.startTimestamp;

		if (!rpcClient) {
			rpcClient = new DiscordClient(clientID);
			rpcClient.actualPresence = presenceData;
			return;
		}

		if (rpcClient && Date.now() - rpcClient.lastCall < 5000) return;
		if (rpcClient) rpcClient.lastCall = Date.now();

		rpcClient.setActivity(presenceData);
	},
	clearActivity = () => {
		if (!rpcClient) return;
		rpcClient.clearActivity();
	},
	destroyClient = () => {
		if (!rpcClient) return;
		rpcClient.destroyClient();
	};
