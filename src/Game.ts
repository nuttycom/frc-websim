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

export type ItemId = 'cone' | 'cube';

export type FieldElement<IdT> = {
  elem_id: IdT,
  loc_id: string,
  items: Map<ItemId, number>
};

type CNode = 'cone' | null;
type BNode = 'block' | null;
type HNode = 'cone' | 'block' | null;

export type Row = { a: CNode, b: BNode, c: CNode };
export type HybridRow = { a: HNode, b: HNode, c: HNode };

function empty_row(): Row {
  return ({ a: null, b: null, c: null });
}

function empty_hybrid_row(): Row {
  return ({ a: null, b: null, c: null });
}

export type Grid = {
  top: Row,
  mid: Row,
  low: HybridRow,
};

function empty_grid(): Grid {
  return ({top: empty_row(), mid: empty_row(), low: empty_hybrid_row()});
}

export type Station = {
  docked: number,
  engaged: number
};

function empty_station(): Station {
  return ({ docked: 0, engaged: 0 });
}

export type FieldState = {
  blue_grids: [Grid, Grid, Grid];
  blue_station: Station;
  red_grids: [Grid, Grid, Grid];
  red_station: Station;
};

function empty_field(): FieldState {
  return({
    blue_grids: [empty_grid(), empty_grid(), empty_grid()],
    blue_station: empty_station(),
    red_grids: [empty_grid(), empty_grid(), empty_grid()],
    red_station: empty_station(),
  });
}

export type Runnable = 
  | { kind: "start", loc_id: string }
  | { kind: "move", dest_loc_id: string }
  | { kind: "act", action_id: string };

export type Step = {
  position: Position,
  award: number
}

export function updateFieldState(fieldState: FieldState, loc: Location, action_id: string): FieldState {
  if (loc.loc_id === 'M') {
    fieldState.blue_station.engaged += 1;
  } else if (fieldState.blue_station.engaged > 0) {
    fieldState.blue_station.engaged -= 1;
  }

  return fieldState;
}

export function computeFieldAward(fieldState: FieldState, elapsed_seconds: number): number {
  if (elapsed_seconds > 15 && elapsed_seconds < 18 && fieldState.blue_station.engaged > 0) {
    fieldState.blue_station.engaged = 0;
    return 12;
  } else if (elapsed_seconds > 150 && elapsed_seconds < 153 && fieldState.blue_station.engaged > 0) {
    fieldState.blue_station.engaged = 0;
    return 10;
  } else {
    /// compute the 
    return 0;
  }
};

export function computeSteps(
  instrs: Array<Runnable>,
  locations: Array<Location>,
  //exclusions: Array<Exclusion>,
  robot_velocity: number, // meters/second
  x_ratio: number, // pixels/meter
  y_ratio: number, // pixels/meter
  animation_rate: number, // steps/second
): [Array<Step>, number, number] {
  console.log(`robot velocity: ${robot_velocity}`);
  console.log(`x ratio: ${x_ratio}`);
  console.log(`y ratio: ${y_ratio}`);
  console.log(`anim rate: ${animation_rate}`);
  if (!(x_ratio > 0 && y_ratio > 0 && animation_rate > 0 && robot_velocity > 0)) {
    return [[], 0, 0];
  }

  var field_state: FieldState = empty_field();
  var elapsed_seconds: number = 0;
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
        const step_seconds = path_time_seconds / step_count;
        const x_step = dx / step_count;
        const y_step = dy / step_count;
        for (var mi = 0; mi < step_count; mi++) {
          elapsed_seconds += step_seconds;
          steps.push({
            position: { x: cur_loc.position.x + x_step * mi, y: cur_loc.position.y + y_step * mi },
            award: computeFieldAward(field_state, elapsed_seconds),
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
        const step_seconds = act.duration / step_count;
        for (var ai = 0; ai < step_count; ai++) {
          elapsed_seconds += step_seconds;
          field_state = updateFieldState(field_state, cur_loc, r.action_id);
          steps.push({
            position: { x: cur_loc.position.x, y: cur_loc.position.y },
            award: computeFieldAward(field_state, elapsed_seconds),
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

  return [steps, scoreSteps(steps, field_state), elapsed_seconds];
}

function scoreSteps(steps: Array<Step>, field_state: FieldState): number {
  var total = 0;
  steps.forEach((s) => {
    total += s.award;
  });

  const top_state = [0, 1, 2].flatMap((i) => [
    field_state.blue_grids[i].top.a !== null,
    field_state.blue_grids[i].top.b !== null,
    field_state.blue_grids[i].top.c !== null,
  ]);

  const mid_state = [0, 1, 2].flatMap((i) => [
    field_state.blue_grids[i].top.a !== null,
    field_state.blue_grids[i].top.b !== null,
    field_state.blue_grids[i].top.c !== null,
  ]);

  const low_state = [0, 1, 2].flatMap((i) => [
    field_state.blue_grids[i].top.a !== null,
    field_state.blue_grids[i].top.b !== null,
    field_state.blue_grids[i].top.c !== null,
  ]);

  const score_links = (xs: Array<boolean>) => {
    var link_score = 0;
    var link_size = 0;
    for (var i = 0; i < 9; i++) {
      if (xs[i]) {
        link_size += 1;
        if (link_size === 3) {
          link_score += 1;
          link_size = 0;
        } 
      } else {
        link_size = 0;
      }
    }
    return link_score;
  };

  total += score_links(top_state);
  total += score_links(mid_state);
  total += score_links(low_state);
  
  return total;
}
