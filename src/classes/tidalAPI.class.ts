import axios, { AxiosInstance } from "axios";

export default class tidalAPI {
	baseURL: string;
	webToken: string;
	headers: requestHeaders;
	axios: AxiosInstance;
	constructor() {
		this.baseURL = "https://api.tidal.com/v1";
		this.webToken = "CzET4vdadNUFQ5JU"; // from another repo for testing purposes
		this.headers = {
			"x-tidal-token": this.webToken
		};
		this.axios = axios.create({ baseURL: this.baseURL, headers: this.headers });
	}

	async searchSong(query: string, limit = 25) {
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

		if (!query) throw new Error("SearchSong: No query specified.");

		if (res.data.items.length === 0)
			throw new Error("Can't find anything for this query.");

		return res.data.items;
	}
}
