import axios, { AxiosInstance } from "axios";
import { app, BrowserWindow } from "electron";
import { platform } from "os";

import { store } from "@util/config";

export class LoginManager {
	private window: BrowserWindow;
	private axios: AxiosInstance;
	authorizationToken: null | string;
	constructor() {
		this.window = new BrowserWindow({ show: false });
		this.authorizationToken = null;
		this.axios = axios.create({ baseURL: "https://login.tidal.com/oauth2" });
	}

	async loginToTidal() {
		this.window.show();
		if (platform() === "darwin") app.dock.show();
		return new Promise<string | null>(async (resolve, reject) => {
			this.window.webContents.session.clearStorageData();
			await this.window.loadURL("https://listen.tidal.com");

			setTimeout(async () => {
				await this.window.webContents.executeJavaScript(
					`document.querySelector('[datatest="no-user--signup"]').click()`
				);
			}, 2400);

			this.window.webContents.session.webRequest.onSendHeaders(
				{ urls: ["https://login.tidal.com/*"] },
				details => {
					if (
						details.url !== "https://login.tidal.com/oauth2/me" &&
						details.method !== "GET"
					)
						return;
					return (this.authorizationToken =
						details.requestHeaders["authorization"]);
				}
			);

			this.window.webContents.session.webRequest.onCompleted(
				{ urls: ["https://login.tidal.com/*"] },
				async details => {
					if (details.url !== "https://login.tidal.com/oauth2/me") return;
					if (details.method !== "GET") return;

					setTimeout(() => this.window.close(), 2000);
					if (platform() === "darwin") app.dock.hide();
				}
			);

			this.window.on("close", async () => {
				this.window = new BrowserWindow({ show: false });
				if (this.authorizationToken) resolve(this.authorizationToken);
				else setTimeout(() => reject(new Error("NO_TOKEN")), 1000);
			});
		});
	}

	async checkAuthorizationToken(token: string) {
		if (!token) throw new Error("checkAuthorizationToken: No token specified.");

		return new Promise<boolean | Error>(async (resolve, reject) => {
			const res = await this.axios({
				method: "GET",
				url: "/me",
				headers: {
					authorization: token
				}
			});

			if (res.data.userId && res.status === 200) {
				if (!store.get("countryUserCode"))
					store.set("countryUserCode", res.data.countryCode);

				return resolve(true);
			}
			return reject(new Error("NOT_LOGGED_IN"));
		});
	}
}
