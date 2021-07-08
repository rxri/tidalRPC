import { app } from "electron";
import { platform } from "os";

import { destroyClient } from "@managers/discordManager";
import TrayManager from "@managers/trayManager";
import { captureException, init } from "@sentry/node";
import { store } from "@util/config";

import App from "./app";

//* Initialize sentry.
init({
	dsn: "https://4816402ebe234764a873e6bbeca41cf8@o824560.ingest.sentry.io/5810883"
});

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
	)
		app.setLoginItemSettings({
			openAtLogin: true,
			openAsHidden: true
		});

	const Application = new App();
	Application.start();
});

app.on("will-quit", () => destroyClient());

process.on("SIGINT", async () => process.exit(0));

process.on("uncaughtException", err => {
	captureException(err);
	process.exit(1);
});

process.on("unhandledRejection", (err, _) => {
	captureException(err);
	process.exit(1);
});
