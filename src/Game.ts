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

export type Step = {
  position: Position,
  award: number
}

export function computeSteps(
  instrs: Array<Runnable>,
  locations: Array<Location>,
  //exclusions: Array<Exclusion>,
  robot_velocity: number, // meters/second
  x_ratio: number, // pixels/meter
  y_ratio: number, // pixels/meter
  animation_rate: number, // steps/second
): Array<Step> {
  console.log(`robot velocity: ${robot_velocity}`);
  console.log(`x ratio: ${x_ratio}`);
  console.log(`y ratio: ${y_ratio}`);
  console.log(`anim rate: ${animation_rate}`);
  if (!(x_ratio > 0 && y_ratio > 0 && animation_rate > 0 && robot_velocity > 0)) {
    return [];
  }

  var cur_loc: Location;
  const steps: Array<Step> = [];
  const addSteps = {
    start: (s: Start) => {
      const loc = locations.find((l) => l.loc_id === s.loc_id);
      if (loc) {
        cur_loc = loc;
        steps.push({
          position: loc.position,
          award: 0
        })
      }
    },
    move: (m: Move) => {
      const loc = locations.find((l) => l.loc_id === m.dest_loc_id);
      if (loc) {
        const dx = loc.position.x - cur_loc.position.x;
        const dy = loc.position.y - cur_loc.position.y;
        // Find the number of steps in the path using real-world distance (just
        // straight-line paths not considering exclusions for now)
        const path_meters = Math.sqrt(
          Math.pow(Math.abs(dx) / x_ratio, 2) +
          Math.pow(Math.abs(dy) / y_ratio, 2)
        );
        const path_time_seconds = path_meters / robot_velocity;
        const step_count = path_time_seconds * animation_rate;
        const x_step = dx / step_count;
        const y_step = dy / step_count;
        for (var j = 0; j < step_count; j++) {
          steps.push({
            position: { x: cur_loc.position.x + x_step * j, y: cur_loc.position.y + y_step * j },
            award: 0,
          });
        }
        // add a step to take us to the final position, since we'll have not quite arrived there.
        steps.push({
          position: { x: loc.position.x, y: loc.position.y },
          award: 0,
        });
        cur_loc = loc;
      }
    },
    act: (a: Act) => {
      const act = cur_loc.actions.find((act) => act.action_id === a.action_id);
      if (act) {
        const step_count = act.duration * animation_rate;
        for (var j = 0; j < step_count; j++) {
          steps.push({
            position: { x: cur_loc.position.x, y: cur_loc.position.y },
            award: 0,
          });
        }
        steps.push({
          position: { x: cur_loc.position.x, y: cur_loc.position.y },
          award: act.reward,
        });
      }
    }
  };

  for (var i = 0; i < instrs.length; i++) {
    instrs[i].apply(addSteps);
  }

  return steps;
}
