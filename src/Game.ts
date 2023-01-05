export type Resource = {
  piece_id: string,
  count: number,
};

export type GameAction = {
  action_id: string;
  produces: Array<Resource>;
  consumes: Array<Resource>;
  reward: number
};

export type Position = {
  x: number;
  y: number;
}

export type Exclusion = {
  top_left: Position;
  width: number;
  height: number;
}

export type Location = {
  loc_id: string;
  position: Position;
  actions: Array<GameAction>;
};

class Move {
  dest_loc_id: string;

  constructor(loc_id: string) {
    this.dest_loc_id = loc_id;
  }
}

class Act {
  action_id: string;

  constructor(action_id: string) {
    this.action_id = action_id;
  }
}