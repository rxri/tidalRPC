import axios, { AxiosInstance } from "axios";
import { app, BrowserWindow } from "electron";
import { platform } from "os";
import { stringify } from "qs";

import { store } from "@util/config";

export class LoginManager {
	private window: BrowserWindow;
	private axios: AxiosInstance;
	token: {
		authorizationToken: string | null;
		refreshToken: string | null;
	};
	constructor() {
		this.window = new BrowserWindow({ show: false });
		this.token = { authorizationToken: null, refreshToken: null };
		this.axios = axios.create({ baseURL: "https://login.tidal.com/oauth2" });
	}

	async loginToTidal() {
		this.window.show();
		if (platform() === "darwin") app.dock.show();
		return new Promise<{
			authorizationToken: string;
			refreshToken: string;
		}>(async (resolve, reject) => {
			this.window.webContents.session.clearStorageData();
			await this.window.loadURL("https://listen.tidal.com");

			setTimeout(async () => {
				try {
					await this.window.webContents.executeJavaScript(
						`document.querySelector('[datatest="no-user--signup"]').click()`
					);
				} catch (err) {
					console.log("User probably already clicked this button."); //* User already clicked this button so we catch it.
				}
			}, 2400);

			this.window.webContents.debugger.attach("1.3");
			this.window.webContents.debugger.on(
				"message",
				async (_, method, params) => {
					if (method === "Network.responseReceived") {
						if (params.response.url !== "https://login.tidal.com/oauth2/token")
							return;
						const res = await this.window.webContents.debugger.sendCommand(
								"Network.getResponseBody",
								{
									requestId: params.requestId
								}
							),
							responseBody = JSON.parse(res.body);

						delete responseBody.user; //* We don't really need it so why 🤷‍♀️
						this.token.authorizationToken = `Bearer ${responseBody.access_token}`;
						this.token.refreshToken = responseBody.refresh_token;
						await setTimeout(() => this.window.close(), 2000);
						if (platform() === "darwin") app.dock.hide();
					}
				}
			);

			this.window.webContents.debugger.sendCommand("Network.enable");

			this.window.on("close", async () => {
				this.window = new BrowserWindow({ show: false });
				if (this.token.authorizationToken && this.token.refreshToken) {
					resolve({
						authorizationToken: this.token.authorizationToken,
						refreshToken: this.token.refreshToken
					});
				} else setTimeout(() => reject(new Error("NO_TOKEN")), 1000);
			});
		});
	}

	async checkAuthorizationToken() {
		if (!store.get("authorization.accessToken"))
			throw new Error("checkAuthorizationToken: No authorizationToken.");

		if (
			(store.get("authorization.checkDate") as number) &&
			~~(new Date().getTime() / 1000) -
				(store.get("authorization.checkDate") as number) <
				600
		)
			return true;

		return new Promise<boolean>(async (resolve, reject) => {
			try {
				const res = await this.axios({
					method: "GET",
					url: "/me",
					headers: {
						authorization: store.get("authorization.accessToken")
					}
				});

				if (!store.get("authorization.countryUserCode"))
					store.set("authorization.countryUserCode", res.data.countryCode);

				store.set("authorization.checkDate", ~~(new Date().getTime() / 1000));
				return resolve(true);
			} catch (err) {
				console.log(err);
				return reject(new Error("NOT_LOGGED_IN"));
			}
		});
	}

	async refreshToken() {
		if (!store.get("authorization.refreshToken"))
			throw new Error("refreshToken: No refreshToken.");

		if (
			~~(new Date().getTime() / 1000) -
				(store.get("authorization.refreshDate") as number) <
			86400
		)
			return true;

		return new Promise<boolean>(async (resolve, reject) => {
			const data = stringify({
				client_id: "CzET4vdadNUFQ5JU",
				client_unique_key: "ff42115e-8f59-42fa-9a81-fc99398f974a",
				grant_type: "refresh_token",
				refresh_token: store.get("authorization.refreshToken"),
				scope: "r_usr+w_usr"
			});

			try {
				const res = await this.axios({
					method: "POST",
					url: "/token",
					headers: { "content-type": "application/x-www-form-urlencoded" },
					data
				});

				store.set(
					"authorization.accessToken",
					`Bearer ${res.data.access_token}`
				);
				store.set("authorization.refreshDate", ~~(new Date().getTime() / 1000));
				return resolve(true);
			} catch (err) {
				console.log(err);
				return reject(new Error("CANT_REFRESH_TOKEN"));
			}
		});
	}
}
