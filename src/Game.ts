export type Resource = {
  piece_id: string,
  count: number,
};

export type GameAction = {
  action_id: string;
  produces: Array<Resource>;
  consumes: Array<Resource>;
  reward: number;
  duration: number;
};

export type Position = {
  x: number;
  y: number;
  heading: number | null;
}

export type Exclusion = {
  top_left: Position;
  width: number;
  height: number;
}

export type Location = {
  loc_id: string;
  position: Position;
};

export type ArenaLayout = {
  locations: Array<Location>,
  exclusions: Array<Exclusion>,
  instrs: Array<Runnable>,

  measureWidth: number,
  realWidth: number,
  measureHeight: number,
  realHeight: number,
};

export type Runnable =
  | { kind: "start", loc_id: string }
  | { kind: "move", dest_loc_id: string }
  | { kind: "act", action_id: string };

export type Step = {
  position: Position,
  award: number
}

export type Move = {
  runnable: Runnable, 
  end_loc: Location,
  end_position: Position, 
  run_seconds: number
};

export interface FieldState {
  elapsed_seconds: number;
}

export interface Game<FS> {
  gameId: string;
  emptyField(): FS;
  stepFieldState(field_state: FS, step_seconds: number, end_loc: Location | null): FS;
  computeFieldAward(fs: FS): number;
  scoreSteps(field_state: FS, steps: Array<Step>): number;
}