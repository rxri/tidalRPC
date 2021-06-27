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
	private isResultPending: boolean;
	constructor() {
		this.baseURL = "https://api.tidal.com/v1";
		this.webToken = "CzET4vdadNUFQ5JU";
		this.headers = {
			"x-tidal-token": this.webToken
		};
		this.axios = axios.create({ baseURL: this.baseURL, headers: this.headers });
		this.loginManager = new LoginManager();
		this.results = [];
		this.isResultPending = false;
	}

	async searchSong(query: string, limit = 50) {
		if (this.isResultPending) return;
		if (!query) throw new Error("SearchSong: No query specified.");

		if (!store.get("authorization.accessToken")) {
			this.isResultPending = true;
			const res = await this.axios({
				method: "GET",
				url: "/search/tracks",
				params: {
					query,
					limit,
					offset: 0,
					countryCode: "US"
				},
				timeout: 120000
			});

			if (res.data.items.length === 0) return [];

			this.isResultPending = false;
			return res.data.items;
		}

		try {
			this.isResultPending = true;
			await this.loginManager.refreshToken();
			await this.loginManager.checkAuthorizationToken();
			const res = await this.axios({
				method: "GET",
				baseURL: "https://listen.tidal.com/v1",
				url: "/search/top-hits",
				headers: {
					authorization: store.get("authorization.accessToken") as string
				},
				params: {
					query,
					limit,
					offset: 0,
					types: "TRACKS",
					countryCode: !store.get("authorization.countryUserCode")
						? "US"
						: store.get("authorization.countryUserCode"),
					deviceType: "BROWSER"
				},
				timeout: 120000
			});

			if (res.data.tracks.items.length === 0) this.results = [];

			this.results = res.data.tracks.items;
		} catch (err) {
			console.log(err);
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
						try {
							const res = await this.loginManager.loginToTidal();
							store.set("authorization.accessToken", res.authorizationToken);
							store.set("authorization.refreshToken", res.refreshToken);
							store.set(
								"authorization.refreshDate",
								~~(new Date().getTime() / 1000)
							);
							store.set("noLoginPopup", true);

							const rs = await this.axios({
								method: "GET",
								baseURL: "https://listen.tidal.com/v1",
								url: "/search/top-hits",
								headers: {
									authorization: store.get(
										"authorization.accessToken"
									) as string
								},
								params: {
									query,
									limit,
									offset: 0,
									types: "TRACKS",
									countryCode: !store.get("authorization.countryUserCode")
										? "US"
										: store.get("authorization.countryUserCode"),
									deviceType: "BROWSER"
								},
								timeout: 120000
							});

							if (rs.data.tracks.items.length === 0) this.results = [];

							this.results = rs.data.tracks.items;
						} catch (err) {
							console.log(err);
							store.set("authorization.accessToken", null);
							store.set("authorization.refreshToken", null);
							store.set("authorization.refreshDate", null);
							store.set("authorization.countryUserCode", null);
							const res = await this.axios({
								method: "GET",
								url: "/search/tracks",
								params: {
									query,
									limit,
									offset: 0,
									countryCode: "US"
								},
								timeout: 120000
							});

							if (res.data.items.length === 0) this.results = [];

							this.results = res.data.items;
						}
					}
					break;

				case 1:
					{
						store.set("authorization.accessToken", null);
						store.set("authorization.refreshToken", null);
						store.set("authorization.refreshDate", null);
						store.set("authorization.countryUserCode", null);
						const res = await this.axios({
							method: "GET",
							url: "/search/tracks",
							params: {
								query,
								limit,
								offset: 0,
								countryCode: "US"
							},
							timeout: 120000
						});

						if (res.data.items.length === 0) this.results = [];

						this.results = res.data.items;
					}
					break;
			}
		}

		this.isResultPending = false;
		return this.results;
	}

	async getAlbumById(id: number) {
		if (!id) throw new Error("getAlbumById: No query specified.");

		const res = await this.axios({
			method: "GET",
			url: `/albums/${id}`,
			params: {
				offset: 0,
				countryCode: !store.get("authorization.countryUserCode")
					? "US"
					: store.get("authorization.countryUserCode")
			},
			timeout: 120000
		});

		if (res.status === 404) return [];

		return res.data;
	}
}
