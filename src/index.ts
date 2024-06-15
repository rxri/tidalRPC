import App from "./app";
import TrayManager from "@managers/trayManager";
import { app } from "electron";
import { destroyClient } from "@managers/discordManager";
import { platform } from "node:os";
import { store } from "@util/config";

export let trayManager: TrayManager;

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();

app.setAppUserModelId("ririxidev.TidalRPC");
app.whenReady().then(async () => {
	trayManager = new TrayManager();
	trayManager.update();

	if (platform() === "darwin") app.dock.hide();
	if (
		app.isPackaged &&
		store.get("autoStart") &&
		!app.getLoginItemSettings().openAtLogin
	) {
		app.setLoginItemSettings({
			openAtLogin: true,
			openAsHidden: true,
		});
	}

	const Application = new App();
	Application.start();
});

app.on("will-quit", () => destroyClient());

process.on("SIGINT", async () => process.exit(0));

process.on("uncaughtException", (err) => {
	console.error(err);
	process.exit(1);
});

process.on("unhandledRejection", (err, _) => {
	console.error(err);
	process.exit(1);
});
