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
  actions: Array<GameAction>;
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

export function computePath(
  instrs: Array<Runnable>,
  locations: Array<Location>,
  //exclusions: Array<Exclusion>,
  robot_velocity: number, // meters/second
  x_ratio: number, // pixels/meter
  y_ratio: number, // pixels/meter
): Array<Move> {
  console.log(`robot velocity: ${robot_velocity}`);
  console.log(`x ratio: ${x_ratio}`);
  console.log(`y ratio: ${y_ratio}`);
  if (!(x_ratio > 0 && y_ratio > 0 && robot_velocity > 0)) {
    return [];
  }

  function addMove(acc: Array<Move>, r: Runnable): Array<Move> {
    if (r.kind === 'start') {
      const loc = locations.find((l) => l.loc_id === r.loc_id)!;
      return acc.concat({
        runnable: r,
        end_loc: loc,
        end_position: loc.position,
        run_seconds: 0
      });
    } else if (r.kind === 'move') {
      const cur_loc = acc[acc.length - 1].end_loc;
      const loc = locations.find((l) => l.loc_id === r.dest_loc_id)!;
      const dx = loc.position.x - cur_loc.position.x;
      const dy = loc.position.y - cur_loc.position.y;
      // Find the number of steps in the path using real-world distance (just
      // straight-line paths not considering exclusions for now)
      const path_meters = Math.sqrt(
        Math.pow(Math.abs(dx) / x_ratio, 2) +
        Math.pow(Math.abs(dy) / y_ratio, 2)
      );
      // add a step to take us to the final position, since we'll have not quite arrived there.
      return acc.concat({
        runnable: r,
        end_loc: loc,
        end_position: { x: loc.position.x, y: loc.position.y, heading: null },
        run_seconds: path_meters / robot_velocity,
      });
    } else if (r.kind === 'act') {
      const cur_loc = acc[acc.length - 1].end_loc;
      const act = cur_loc.actions.find((act) => act.action_id === r.action_id)!;
      return acc.concat({
        runnable: r,
        end_loc: cur_loc,
        end_position: { x: cur_loc!.position.x, y: cur_loc!.position.y, heading: null },
        run_seconds: act.duration,
      });
    } else {
      return acc;
    }
  };

  return instrs.reduce<Array<Move>>(addMove, []);
}
