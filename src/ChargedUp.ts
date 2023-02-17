import { ArenaLayout, Game, GameAction, Location, Step } from './Game';

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
  return ({ top: empty_row(), mid: empty_row(), low: empty_hybrid_row() });
}

export type Station = {
  docked: number,
  engaged: number
};

function empty_station(): Station {
  return ({ docked: 0, engaged: 0 });
}

export type CUFieldState = {
  elapsed_seconds: number, 
  blue_grids: [Grid, Grid, Grid],
  blue_station: Station,
  red_grids: [Grid, Grid, Grid],
  red_station: Station,
  endauto_scored: boolean,
  endgame_scored: boolean
};

export default class ChargedUp implements Game<CUFieldState> {
  gameId = 'chargedup';
  
  emptyField(): CUFieldState {
    return ({
      elapsed_seconds: 0, 
      blue_grids: [empty_grid(), empty_grid(), empty_grid()],
      blue_station: empty_station(),
      red_grids: [empty_grid(), empty_grid(), empty_grid()],
      red_station: empty_station(),
      endauto_scored: true,
      endgame_scored: true
    });
  }

  stepFieldState(fieldState: CUFieldState, step_seconds: number, loc: Location | null): CUFieldState {
    fieldState.elapsed_seconds += step_seconds;
    if (loc && loc.loc_id === 'M') {
      if (fieldState.blue_station.engaged === 0) {
        fieldState.blue_station.engaged += 1;
      }
    } else if (fieldState.blue_station.engaged > 0) {
      fieldState.blue_station.engaged -= 1;
    }

    return fieldState;
  }

  computeFieldAward(fs: CUFieldState): number {
    if (fs.elapsed_seconds > 15 && fs.elapsed_seconds < 18 && !fs.endauto_scored) {
      fs.endauto_scored = true;
      return 12;
    } else if (fs.elapsed_seconds > 150 && fs.elapsed_seconds < 153 && !fs.endgame_scored) {
      fs.endgame_scored = true;
      return 10;
    } else {
      return 0;
    }
  }

  scoreSteps(field_state: CUFieldState, steps: Array<Step>): number {
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
}

function grid_col_actions(piece_id: 'cone' | 'block'): Array<GameAction> {
  return [
    { "action_id": "place_high", "reward": 5, "duration": 2, "produces": [], "consumes": [{ "piece_id": piece_id, "count": 1 }] },
    { "action_id": "place_mid", "reward": 4, "duration": 2, "produces": [], "consumes": [{ "piece_id": piece_id, "count": 1 }] },
    { "action_id": "place_low", "reward": 3, "duration": 1, "produces": [], "consumes": [{ "piece_id": piece_id, "count": 1 }] }
  ];
};

function loading_zone_actions(): Array<GameAction> {
  return [
    { "action_id": "take_cone", "reward": 0, "duration": 2, "produces": [{ "piece_id": "block", "count": 1 }], "consumes": [] },
    { "action_id": "take_block", "reward": 0, "duration": 2, "produces": [{ "piece_id": "cone", "count": 1 }], "consumes": [] }
  ];
};

export const preloadState: ArenaLayout = {
  "locations": [],
  "exclusions": [],
  "instrs": [],
  "measureWidth": 580,
  "realWidth": 1654,
  "measureHeight": 326,
  "realHeight": 802
};
