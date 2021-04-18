import axios, { AxiosInstance } from "axios";

export default class tidalAPI {
	private baseURL: string;
	private webToken: string;
	private headers: requestHeaders;
	private axios: AxiosInstance;
	constructor() {
		this.baseURL = "https://api.tidal.com/v1";
		this.webToken = "CzET4vdadNUFQ5JU";
		this.headers = {
			"x-tidal-token": this.webToken
		};
		this.axios = axios.create({ baseURL: this.baseURL, headers: this.headers });
	}

	async searchSong(query: string, limit = 25) {
		if (!query) throw new Error("SearchSong: No query specified.");

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

	async getAlbumById(id: number) {
		if (!id) throw new Error("getAlbumById: No query specified.");

		const res = await this.axios({
			method: "GET",
			url: `/albums/${id}`,
			params: {
				offset: 0,
				countryCode: "US"
			}
		});

		if (res.status === 404) return [];

		return res.data;
	}
}
