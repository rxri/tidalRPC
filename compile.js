const { compile } = require("nexe");
const { copyFileSync, existsSync, mkdirSync } = require("fs");
const { platform } = require("os");

compile({
	name: "tidalRPC",
	rc: {
		CompanyName: "",
		ProductName: "TidalRPC",
		FileDescription: "Unofficial Discord RPC for Tidal Desktop.",
		OriginalFilename: "tidalRPC.exe",
		InternalName: "tidalRPC",
		LegalCopyright: "Copyright (c) ririxidev. 2021"
	},
	output: "./build/tidalRPC.exe",
	resources: [
		"./node_modules/extract-file-icon/build/Release/addon.node",
		"./node_modules/node-window-manager/build/Release/addon.node",
		"./node_modules/figlet/"
	]
});

if (!existsSync("./build/assets")) mkdirSync("./build/assets");
if (!existsSync("./build/node_modules/extract-file-icon/build/Release"))
	mkdirSync("./build/node_modules/extract-file-icon/build/Release");
if (!existsSync("./build/node_modules/node-window-manager/build/Release"))
	mkdirSync("./build/node_modules/node-window-manager/build/Release");
switch (platform()) {
	case "win32":
		{
			copyFileSync("./assets/windows.ico", "./build/assets/windows.ico");
		}
		break;

	case "darwin": {
		copyFileSync("./assets/macos.png", "./build/assets/macos.png");
	}
}

copyFileSync(
	"./node_modules/extract-file-icon/build/Release/addon.node",
	"./build/node_modules/extract-file-icon/build/Release/addon.node"
);
copyFileSync(
	"./node_modules/node-window-manager/build/Release/addon.node",
	"./build/node_modules/node-window-manager/build/Release/addon.node"
);
