import React, { useEffect, useCallback, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import robotPng from './robot.png';
import { Exclusion, Position, Location, Runnable, computeSteps, Step, GameAction, computePath } from './Game';
import LocationEditor from './LocationEditor';
import './Arena.css';
import RunEditor from './RunEditor';

const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const game_id = 'chargedup';
const save_version = 1;

const save_key = `websim-${game_id}-v${save_version}`;

const robot = new Image();
robot.src = robotPng;

type ArenaState = {
  save_version: number,
  mode: 'layout' | 'measure',
  labelIdx: number,
  locations: Array<Location>,
  exclusions: Array<Exclusion>,
  instrs: Array<Runnable>,

  robotVelocity: number,
  animationRate: number,
  measureWidth: number,
  realWidth: number,
  measureHeight: number,
  realHeight: number,
};

function grid_col_actions(piece_id: 'cone' | 'block'): Array<GameAction> {
  return [
    { "action_id": "place_high", "reward": 6, "duration": 2, "produces": [], "consumes": [{ "piece_id": piece_id, "count": 1 }] },
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

const preloadState: ArenaState = {
  "save_version": 1,
  "mode": "measure",
  "labelIdx": 17,
  "locations": [
    {
      "loc_id": "A",
      "position": { "x": 170, "y": 356 },
      "actions": grid_col_actions('cone'),
    },
    {
      "loc_id": "B",
      "position": { "x": 170, "y": 326 },
      "actions": grid_col_actions('block')
    },
    {
      "loc_id": "C",
      "position": { "x": 170, "y": 304 },
      "actions": grid_col_actions('cone'),
    },
    {
      "loc_id": "D",
      "position": { "x": 170, "y": 284 },
      "actions": grid_col_actions('cone')
    },
    {
      "loc_id": "E",
      "position": { "x": 170, "y": 264 },
      "actions": grid_col_actions('cone')
    },
    {
      "loc_id": "F",
      "position": { "x": 170, "y": 235 },
      "actions": grid_col_actions('block')
    },
    {
      "loc_id": "G",
      "position": { "x": 170, "y": 217 },
      "actions": grid_col_actions('cone')
    },
    {
      "loc_id": "H",
      "position": { "x": 170, "y": 194 },
      "actions": grid_col_actions('cone')
    },
    {
      "loc_id": "I",
      "position": { "x": 170, "y": 170 },
      "actions": grid_col_actions('block')
    },
    {
      "loc_id": "J",
      "position": { "x": 610, "y": 54 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "K",
      "position": { "x": 672, "y": 75 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "L",
      "position": { "x": 674, "y": 122 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "M",
      "position": { "x": 241, "y": 263 },
      "actions": [
        { "action_id": "pause", "reward": 0, "duration": 1, "produces": [], "consumes": [] }
      ],
    },
    {
      "loc_id": "N",
      "position": { "x": 345, "y": 190 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "O",
      "position": { "x": 348, "y": 236 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "P",
      "position": { "x": 345, "y": 285 },
      "actions": loading_zone_actions()
    },
    {
      "loc_id": "Q",
      "position": { "x": 349, "y": 336 },
      "actions": loading_zone_actions()
    }
  ],
  "exclusions": [],
  "instrs": [],
  "robotVelocity": 3,
  "animationRate": 30,
  "measureWidth": 580,
  "realWidth": 1654,
  "measureHeight": 326,
  "realHeight": 802
};

const Arena: React.FC = () => {
  const [mode, setMode] = useState<'layout' | 'measure'>('measure');
  const [labelIdx, setLabelIdx] = useState<number>(0);
  const [locations, setLocations] = useState<Array<Location>>([]);
  const [exclusions, setExclusions] = useState<Array<Exclusion>>([]);
  const [instrs, setInstrs] = useState<Array<Runnable>>([]);
  const [instrTimes, setInstrTimes] = useState<Array<number>>([]);

  const [robotVelocity, setRobotVelocity] = useState<number>(2);
  const [animationRate, setAnimationRate] = useState<number>(30);
  const [measureWidth, setMeasureWidth] = useState<number>(NaN);
  const [realWidth, setRealWidth] = useState<number>(10);
  const [measureHeight, setMeasureHeight] = useState<number>(NaN);
  const [realHeight, setRealHeight] = useState<number>(5);

  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragEnd, setDragEnd] = useState<Position | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [runLabel, setRunLabel] = useState<string>('Run');
  const [showLocEditor, setShowLocEditor] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [runSeconds, setRunSeconds] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animStartRef = useRef<Date>(new Date());
  const animStepsRef = useRef<Array<Step>>([]);

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (running) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setMouseDown(true);
    setDragStart({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (running) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (mouseDown) {
      setDragging(true);
      setDragEnd({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (running) return;
    const rect = event.currentTarget.getBoundingClientRect();

    const getDragArea = () => {
      if (dragging && dragStart && dragEnd) {
        const result = {
          width: Math.abs(dragStart.x - dragEnd.x),
          height: Math.abs(dragStart.y - dragEnd.y)
        };

        // guard against clicks that get misinterpreted as drags
        if (result.width > 20 || result.height > 20) {
          return result;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    const drag_area = getDragArea();
    if (drag_area !== null && dragStart && dragEnd) {
      if (mode === 'layout') {
        setExclusions((xs) => xs.concat([
          {
            top_left: {
              x: Math.min(dragStart.x, dragEnd.x),
              y: Math.min(dragStart.y, dragEnd.y)
            },
            width: drag_area.width,
            height: drag_area.height,
          }
        ]));
      } else if (mode === 'measure') {
        if (drag_area.width > drag_area.height) {
          setMeasureWidth(drag_area.width);
        } else {
          setMeasureHeight(drag_area.height);
        }
      }
      setDragging(false);
    } else {
      const loc = {
        loc_id: labels.charAt(labelIdx),
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        actions: []
      };
      setLabelIdx((i) => i + 1);
      setLocations((l) => l.concat(loc));
    }
    setMouseDown(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleModeSwich: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (running) return;
    if (event.target.checked) {
      setMode('layout');
    } else {
      setMode('measure');
    }
  };

  const handleVelocityChange: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (running) return;
    setRobotVelocity(parseFloat(event.target.value));
  };

  const handleAnimRateChange: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (running) return;
    setAnimationRate(parseInt(event.target.value));
  };

  const handleHeightChange: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (running) return;
    setRealHeight(parseFloat(event.target.value));
  };

  const handleWidthChange: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (running) return;
    setRealWidth(parseFloat(event.target.value));
  };

  const handleClearClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (running) return;
    setMode('measure');
    setLabelIdx(0);
    setLocations([]);
    setExclusions([]);
    setInstrs([]);

    setRobotVelocity(2);
    setAnimationRate(30);
    setMeasureWidth(NaN);
    setRealHeight(5);
    setMeasureHeight(NaN);
    setRealWidth(10);
  };

  const handleSaveClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const save_json = JSON.stringify({
      save_version: save_version,
      mode: mode,
      labelIdx: labelIdx,
      locations: locations,
      exclusions: exclusions,
      instrs: instrs,

      robotVelocity: robotVelocity,
      animationRate: animationRate,
      measureWidth: measureWidth,
      realWidth: realWidth,
      measureHeight: measureHeight,
      realHeight: realHeight
    });

    console.log(save_json);

    localStorage.setItem(save_key, save_json);
  };

  const loadArenaState = (saved: ArenaState) => {
    if (saved.save_version === save_version) {
      setMode(saved.mode);
      setLabelIdx(saved.labelIdx);
      setLocations(saved.locations);
      setExclusions(saved.exclusions);
      setInstrs(saved.instrs);

      setRobotVelocity(saved.robotVelocity);
      setAnimationRate(saved.animationRate);
      setMeasureWidth(saved.measureWidth);
      setRealHeight(saved.realHeight);
      setMeasureHeight(saved.measureHeight);
      setRealWidth(saved.realWidth);
    } else {
      console.log(`Save version ${saved.save_version} not recognized`);
    }
  };

  const handleResetClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    loadArenaState(preloadState);
  };

  const handleRestoreClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const save_json = localStorage.getItem(save_key);
    if (save_json) {
      const saved = JSON.parse(save_json) as ArenaState;
      loadArenaState(saved);
    } else {
      console.log(`Save format ${save_json} not recognized.`);
    }
  };

  const handleRunClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (running) {
      setRunning(false);
      setRunLabel('Run');
      animStepsRef.current = [];
    } else {
      console.log(`x ratio: ${measureWidth}/${realWidth / 100}`);
      console.log(`y ratio: ${measureHeight}/${realHeight / 100}`);
      animStartRef.current = new Date();
      const [steps, stepScore, stepSeconds] = computeSteps(
        instrs,
        locations,
        robotVelocity,
        measureWidth / (realWidth / 100),
        measureHeight / (realHeight / 100),
        animationRate
      );
      animStepsRef.current = steps;
      setScore(stepScore);
      setRunSeconds(stepSeconds);
      setRunning(true);
      setRunLabel('Stop');
    }
  };

  const handleToggleLocEditorClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setShowLocEditor((show) => !show);
  };

  const updateLocation = (loc: Location | null, i: number) => {
    if (running) return;
    setLocations((locs) => {
      if (loc !== null) {
        return locs.map((l, idx) => i === idx ? loc : l);
      } else {
        return locs.flatMap((l, idx) => i === idx ? [] : [l]);
      }
    })
  };

  const draw = useCallback(() => {
    const drawLocations = (ctx: CanvasRenderingContext2D) => {
      locations.forEach((loc) => {
        ctx.font = '20px Consolas';
        ctx.fillStyle = 'black';
        ctx.fillText(loc.loc_id, loc.position.x - 8, loc.position.y + 5);
      });
    };

    const drawExclusions = (ctx: CanvasRenderingContext2D) => {
      exclusions.forEach((exc) => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25';
        ctx.fillRect(exc.top_left.x, exc.top_left.y, exc.width, exc.height);
      });
    };

    const drawDragState = (ctx: CanvasRenderingContext2D) => {
      if (dragStart && dragEnd) {
        const width = Math.abs(dragStart.x - dragEnd.x);
        const height = Math.abs(dragStart.y - dragEnd.y);
        if (mode === 'layout') {
          const ul_x = Math.min(dragStart.x, dragEnd.x);
          const ul_y = Math.min(dragStart.y, dragEnd.y);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.25';
          ctx.fillRect(ul_x, ul_y, width, height);
        } else if (mode === 'measure') {
          ctx.beginPath();
          ctx.moveTo(dragStart.x, dragStart.y);
          if (width > height) {
            ctx.lineTo(dragEnd.x, dragStart.y);
          } else {
            ctx.lineTo(dragStart.x, dragEnd.y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const animateRobot = (ctx: CanvasRenderingContext2D) => {
      if (!running) return;

      const run_time = (new Date()).getTime() - animStartRef.current.getTime();
      const step_idx = Math.floor((run_time / 1000) * animationRate);
      if (step_idx < animStepsRef.current.length) {
        const step = animStepsRef.current[step_idx];
        ctx.drawImage(robot, step.position.x - 12, step.position.y - 12, 24, 24);
        window.requestAnimationFrame(draw);
      } else {
        setRunning(false);
        setRunLabel('Run');
      }
    };

    const canvas = canvasRef.current;
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawLocations(ctx);
        drawExclusions(ctx);
        drawDragState(ctx);
        animateRobot(ctx);
      }
    }
  }, [locations, mode, dragStart, dragEnd, exclusions, running, animationRate]);

  useEffect(() => {
    window.requestAnimationFrame(draw);
  }, [draw]);

  return (
    <div className='Arena'>
      <div className='Arena-wrapper'>
        <div className='Arena-internal'>
          <img src={arena} className='Arena-background' alt="Robot Arena" />
          <canvas
            width={800}
            height={400}
            ref={canvasRef}
            className='Arena-canvas'
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          ></canvas>
        </div>
      </div>
      <div className='Arena-switch_row'>
        <span className='Arena-switch_label'>Measure</span>
        <input type='checkbox' className='Arena-switch' onChange={handleModeSwich} />
        <span className='Arena-switch_label'>Layout</span>
      </div>
      <div className='Arena-measure_editor'>
        <div>
          <label htmlFor='robotVelocity'>Robot Velocity (m/s)</label>
          <input id='robotVelocity' type='text' placeholder='Meters/Second'
            value={robotVelocity ? robotVelocity.toString() : ''}
            onChange={handleVelocityChange} />
        </div>
        <div>
          <label htmlFor='animationRate'>Animation Rate</label>
          <input id='animationRate' type='text' placeholder='Steps/Second'
            value={animationRate ? animationRate.toString() : ''}
            onChange={handleAnimRateChange} />
        </div>
        {!isNaN(measureWidth) ?
          <div>
            <label htmlFor='measuredWidth'>Measured Width</label>
            <input id='measuredWidth' type='text' placeholder='cm'
              value={realWidth ? realWidth.toString() : ''}
              onChange={handleWidthChange} />
          </div> : <></>
        }
        {!isNaN(measureHeight) ?
          <div>
            <label htmlFor='measuredHeight'>Measured Height</label>
            <input id='measuredHeight' type='text' placeholder='cm'
              value={realHeight ? realHeight.toString() : ''}
              onChange={handleHeightChange} />
          </div> : <></>
        }
      </div>
      <div>
        <button onClick={handleClearClick}>Clear</button>
        <button onClick={handleRunClick} disabled={instrs.length === 0}>{runLabel}</button>
        <button onClick={handleResetClick}>Reset</button>
        <button onClick={handleSaveClick}>Save</button>
        <button onClick={handleRestoreClick} disabled={localStorage.getItem(save_key) === null}>Restore</button>
      </div>
      {(score > 0 || runSeconds > 0) ? <div><span>Last Run Score: {score} ({Math.floor(runSeconds)} seconds)</span></div> : <></>}
      <div className='Arena-locations'>
        <button onClick={handleToggleLocEditorClick}>Toggle Location Editor</button>
        <ul style={{ display: showLocEditor ? "block" : "none" }}>
          {locations.map((loc, i) =>
            <li key={`location-${i}`}>
              <LocationEditor location={loc} setLocation={(newLoc) => updateLocation(newLoc, i)} />
            </li>
          )}
        </ul>
      </div>
      <div className='Arena-run-instructions'>
        <RunEditor locations={locations} runInstructions={instrs} runTimes={instrTimes} setRunInstructions={
          (xs) => {
            setInstrs(xs);
            setInstrTimes(
              computePath(
                instrs,
                locations,
                robotVelocity,
                measureWidth / (realWidth / 100),
                measureHeight / (realHeight / 100),
              ).map((x) => x.run_seconds)
            );
          }
        } />
      </div>
    </div>
  )
}

export default Arena;