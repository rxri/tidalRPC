import { app } from "electron";
import { platform } from "os";

import { destroyClient } from "@managers/discord.manager";
import TrayManager from "@managers/tray.manager";

import App from "./app";

export let trayManager: TrayManager;

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();

app.setAppUserModelId("ririxidev.TidalRPC");
app.whenReady().then(async () => {
	trayManager = new TrayManager();
	trayManager.start();

	if (platform() === "darwin") app.dock.hide();

	const Application = new App();
	Application.start();
});

app.on("will-quit", () => destroyClient());
