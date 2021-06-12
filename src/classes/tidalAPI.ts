import axios, { AxiosInstance } from "axios";
import { dialog } from "electron";

import { LoginManager } from "@managers/loginManager";
import { store } from "@util/config";

export default class TidalAPI {
	private baseURL: string;
	private webToken: string;
	private headers: requestHeaders;
	private axios: AxiosInstance;
	private loginManager;
	private results: string[];
	constructor() {
		this.baseURL = "https://api.tidal.com/v1";
		this.webToken = "CzET4vdadNUFQ5JU";
		this.headers = {
			"x-tidal-token": this.webToken
		};
		this.axios = axios.create({ baseURL: this.baseURL, headers: this.headers });
		this.loginManager = new LoginManager();
		this.results = [];
	}

	async searchSong(query: string, limit = 50) {
		if (!query) throw new Error("SearchSong: No query specified.");

		if (!store.get("tidalToken")) {
			const res = await this.axios({
				method: "GET",
				url: "/search/tracks",
				params: {
					query,
					limit,
					offset: 0,
					countryCode: "US"
				}
			});

			if (res.data.items.length === 0) return [];

			return res.data.items;
		}

		await this.loginManager
			.checkAuthorizationToken(store.get("tidalToken") as string)
			.then(
				async () => {
					const rs = await this.axios({
						method: "GET",
						baseURL: "https://listen.tidal.com/v1",
						url: "/search/top-hits",
						headers: {
							authorization: store.get("tidalToken") as string
						},
						params: {
							query,
							limit,
							offset: 0,
							types: "TRACKS",
							countryCode: !store.get("countryUserCode")
								? "US"
								: store.get("countryUserCode"),
							deviceType: "BROWSER"
						}
					});

					if (rs.data.tracks.items.length === 0) this.results = [];

					this.results = rs.data.tracks.items;
				},
				async err => {
					const dialogVar = await dialog.showMessageBoxSync({
						title: "tidalRPC",
						message:
							"There was issue with login to your account. Do you want to re-login?",
						buttons: ["Yes!", "No (don't show again)"],
						defaultId: 0,
						type: "error"
					});

					switch (dialogVar) {
						case 0:
							{
								await this.loginManager.loginToTidal().then(async res => {
									store.set("tidalToken", res);
									store.set("noLoginPopup", true);
								});

								const rs = await this.axios({
									method: "GET",
									baseURL: "https://listen.tidal.com/v1",
									url: "/search/top-hits",
									headers: {
										authorization: store.get("tidalToken") as string
									},
									params: {
										query,
										limit,
										offset: 0,
										types: "TRACKS",
										countryCode: !store.get("countryUserCode")
											? "US"
											: store.get("countryUserCode"),
										deviceType: "BROWSER"
									}
								});

								if (rs.data.tracks.items.length === 0) this.results = [];

								this.results = rs.data.tracks.items;
							}
							break;

						case 1:
							{
								store.delete("tidalToken");
								const res = await this.axios({
									method: "GET",
									url: "/search/tracks",
									params: {
										query,
										limit,
										offset: 0,
										countryCode: "US"
									}
								});

								if (res.data.items.length === 0) this.results = [];

								this.results = res.data.items;
							}
							break;
					}
				}
			);

		return this.results;
	}

	async getAlbumById(id: number) {
		if (!id) throw new Error("getAlbumById: No query specified.");

		const res = await this.axios({
			method: "GET",
			url: `/albums/${id}`,
			params: {
				offset: 0,
				countryCode: !store.get("countryUserCode")
					? "US"
					: store.get("countryUserCode")
			}
		});

		if (res.status === 404) return [];

		return res.data;
	}
}
