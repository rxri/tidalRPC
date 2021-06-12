import Song from "@classes/song";

export const compareTitle = (data: string[], currentSong: Song): boolean => {
	const [title, artist] = data;
	if (artist === currentSong.artist && title === currentSong.title) return true;

	return false;
};
