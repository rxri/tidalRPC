import Song from "@classes/song.class";

export const compareTitle = (data: string[], currentSong: Song): boolean => {
	if (data[1] === currentSong.artist || data[0] === currentSong.title)
		return true;

	return false;
};
