const { compile } = require("nexe");

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
