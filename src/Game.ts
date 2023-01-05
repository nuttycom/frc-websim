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

export interface Runnable {
  apply<A>(alg: RunAlg<A>): A;
}

export interface RunAlg<A> {
  start(start: Start): A
  move(move: Move): A
  act(act: Act): A
}

export class Start implements Runnable {
  loc_id: string;

  constructor(loc_id: string) {
    this.loc_id = loc_id;
  }

  apply<A>(alg: RunAlg<A>): A {
    return alg.start(this)
  }
}

export class Move implements Runnable {
  dest_loc_id: string;

  constructor(loc_id: string) {
    this.dest_loc_id = loc_id;
  }

  apply<A>(alg: RunAlg<A>): A {
    return alg.move(this)
  }
}

export class Act implements Runnable {
  action_id: string;

  constructor(action_id: string) {
    this.action_id = action_id;
  }

  apply<A>(alg: RunAlg<A>): A {
    return alg.act(this)
  }
}

