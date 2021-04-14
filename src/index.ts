import TidalManager from "@managers/tidal.manager";
import figlet from "figlet";

figlet("tidal-rpc", (err, data) => {
	console.log(data);
});

const res = new TidalManager();
res.rpcLoop();
setInterval(() => {
	res.rpcLoop();
}, 1000);
