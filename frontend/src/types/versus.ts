export type RoomPlayer = {
  socketId: string;
  username: string;
  score: number;
};

export type RoomState = {
  code: string;
  hostId: string;
  folderId: string | null;
  started: boolean;
  currentIndex: number;
  players: RoomPlayer[];
};