export type GamePiece = {
  name: string;
};

export type Resource = {
  piece: GamePiece,
  count: number,
};

export type GameAction = {
  name: string;
  produces: Array<Resource>;
  consumes: Array<Resource>;
  reward: number
};