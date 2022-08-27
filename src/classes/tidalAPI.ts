import axios, { AxiosInstance, HeadersDefaults } from "axios";

export default class TidalAPI {
	private baseURL: string;
	private webToken: string;
	private axios: AxiosInstance;
	private isResultPending: boolean;
	constructor() {
		this.baseURL = "https://api.tidal.com/v1";
		this.webToken = "CzET4vdadNUFQ5JU";
		this.axios = axios.create({
			baseURL: this.baseURL,
			headers: {
				"x-tidal-token": this.webToken
			}
		});
		this.isResultPending = false;
	}

	async searchSong(query: string, limit = 50) {
		if (this.isResultPending) return;
		if (!query) return console.error("SearchSong: No query specified.");

		this.isResultPending = true;
		try {
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

			if (res.data.items.length === 0) {
				this.isResultPending = false;
				return [];
			}

			this.isResultPending = false;
			return res.data.items;
		} catch (err) {
			console.error(err);
			this.isResultPending = false;
			return [];
		}
	}

	async getAlbumById(id: number) {
		if (!id) return console.error("getAlbumById: No query specified.");

		try {
			const res = await this.axios({
				method: "GET",
				url: `/albums/${id}`,
				params: {
					offset: 0,
					countryCode: "US"
				},
				timeout: 15000
			});

			if (res.status === 404) return [];

			return res.data;
		} catch (err) {
			console.error(err);
			return [];
		}
	}
}
