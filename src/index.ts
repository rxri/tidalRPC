import { app } from "electron";
import { platform } from "os";

import { destroyClient } from "@managers/discord.manager";
import TrayManager from "@managers/tray.manager";
import { store } from "@util/config";

import App from "./app";

export let trayManager: TrayManager;

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();

app.setAppUserModelId("ririxidev.TidalRPC");
app.whenReady().then(async () => {
	trayManager = new TrayManager();

	if (platform() === "darwin") app.dock.hide();
	if (
		app.isPackaged &&
		store.get("autoStart") &&
		!app.getLoginItemSettings().openAtLogin
	)
		app.setLoginItemSettings({
			openAtLogin: true,
			openAsHidden: true
		});

	const Application = new App();
	Application.start();
});

app.on("will-quit", () => destroyClient());
