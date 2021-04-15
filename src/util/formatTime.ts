export const formatTime = (time: number) => {
	const hrs = Math.floor(time / 3600);
	const mins = Math.floor((time % 3600) / 60);
	const secs = Math.floor(time % 60);

	let ret = "";
	if (hrs > 0) {
		ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
	}
	ret += "" + mins + ":" + (secs < 10 ? "0" : "");
	ret += "" + secs;
	return ret;
};
