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

export type Runnable = 
  | { kind: "start", loc_id: string }
  | { kind: "move", dest_loc_id: string }
  | { kind: "act", action_id: string };

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
  const addSteps = (r: Runnable) => {
    if (r.kind === 'start') {
      const loc = locations.find((l) => l.loc_id === r.loc_id);
      if (loc) {
        cur_loc = loc;
        steps.push({
          position: loc.position,
          award: 0
        })
      }
    } else if (r.kind === 'move') {
      const loc = locations.find((l) => l.loc_id === r.dest_loc_id);
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
        for (var mi = 0; mi < step_count; mi++) {
          steps.push({
            position: { x: cur_loc.position.x + x_step * mi, y: cur_loc.position.y + y_step * mi },
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
    } else if (r.kind === 'act') {
      const act = cur_loc.actions.find((act) => act.action_id === r.action_id);
      if (act) {
        const step_count = act.duration * animation_rate;
        for (var ai = 0; ai < step_count; ai++) {
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
    addSteps(instrs[i]);
  }

  return steps;
}
