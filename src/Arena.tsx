import React, { useEffect, useCallback, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import robotPng from './robot.png';
import { Exclusion, Position, Location, Runnable, computeSteps, Step, computePath, ArenaLayout } from './Game';
import LocationEditor from './LocationEditor';
import './Arena.css';
import RunEditor from './RunEditor';
import ChargedUp, { preloadState } from './ChargedUp';

const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const game = new ChargedUp();
const save_version = 2;

const save_key = `websim-${game.gameId}-v${save_version}`;

const robot = new Image();
robot.src = robotPng;

type ArenaState = {
  save_version: number,
  mode: 'layout' | 'measure',
  labelIdx: number,
  layout: ArenaLayout,

  robotVelocity: number,
  animationRate: number,
};

const Arena: React.FC = () => {
  const [mode, setMode] = useState<'layout' | 'measure'>('measure');
  const [labelIdx, setLabelIdx] = useState<number>(0);
  const [locations, setLocations] = useState<Array<Location>>([]);
  const [exclusions, setExclusions] = useState<Array<Exclusion>>([]);
  const [instrs, setInstrs] = useState<Array<Runnable>>([]);

  const [robotVelocity, setRobotVelocity] = useState<string>("2");
  const [robotVelocityValid, setRobotVelocityValid] = useState<boolean>(true);
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
    setRobotVelocity(event.target.value);
    console.log(`vel: ${parseFloat(event.target.value)}`);
    setRobotVelocityValid(!isNaN(parseFloat(event.target.value)));
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

    setRobotVelocity("3");
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
      layout: {
        locations: locations,
        exclusions: exclusions,
        instrs: instrs,

        measureWidth: measureWidth,
        realWidth: realWidth,
        measureHeight: measureHeight,
        realHeight: realHeight
      },
      robotVelocity: robotVelocity,
      animationRate: animationRate,
    });

    console.log(save_json);

    localStorage.setItem(save_key, save_json);
  };

  const loadArenaState = (saved: ArenaState) => {
    if (saved.save_version === save_version) {
      setMode(saved.mode);
      setLabelIdx(saved.labelIdx);
      setLocations(saved.layout.locations);
      setExclusions(saved.layout.exclusions);
      setInstrs(saved.layout.instrs);

      setRobotVelocity(saved.robotVelocity.toString());
      setAnimationRate(saved.animationRate);
      setMeasureWidth(saved.layout.measureWidth);
      setRealHeight(saved.layout.realHeight);
      setMeasureHeight(saved.layout.measureHeight);
      setRealWidth(saved.layout.realWidth);
    } else {
      console.log(`Save version ${saved.save_version} not recognized`);
    }
  };

  const handleResetClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    loadArenaState({
      save_version: save_version,
      mode: 'layout',
      labelIdx: preloadState.locations.length,
      layout: preloadState,
      robotVelocity: 3,
      animationRate: 30
    });
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
    } else if (!isNaN(parseFloat(robotVelocity))) {
      console.log(`x ratio: ${measureWidth}/${realWidth / 100}`);
      console.log(`y ratio: ${measureHeight}/${realHeight / 100}`);
      animStartRef.current = new Date();
      const [steps, stepScore, stepSeconds] = computeSteps(
        game,
        instrs,
        locations,
        parseFloat(robotVelocity),
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

  const computeMoves = () => {
    if (!isNaN(parseFloat(robotVelocity))) {
      console.log(`Recomputing path...`);
      return computePath(
        instrs,
        locations,
        parseFloat(robotVelocity),
        measureWidth / (realWidth / 100),
        measureHeight / (realHeight / 100),
      );
    } else {
      return [];
    }
  };

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
          <input id='robotVelocity'
            className={robotVelocityValid ? 'robotVelocity' : 'robotVelocity-err'}
            type='text'
            placeholder='Meters/Second'
            value={robotVelocity}
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
            <input id='measuredWidth' type='text' placeholder='(cm)'
              value={realWidth ? realWidth.toString() : ''}
              onChange={handleWidthChange} />
          </div> : <></>
        }
        {!isNaN(measureHeight) ?
          <div>
            <label htmlFor='measuredHeight'>Measured Height</label>
            <input id='measuredHeight' type='text' placeholder='(cm)'
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
        <RunEditor locations={locations} moves={computeMoves()} addRunInstruction={
          (instr) => {
            setInstrs((xs) => xs.concat(instr));
          }
        } deleteRunInstruction={
          (delete_idx) => {
            setInstrs((xs) => {
              var deleted = xs[delete_idx];
              var to_delete_end = delete_idx + 1;
              if (deleted.kind === 'move') {
                for (var i = delete_idx + 1; i < xs.length; i++) {
                  if (xs[i].kind === 'act') {
                    to_delete_end = i + 1;
                  }
                }
              }
              return xs.filter((v, i) => i < delete_idx || i >= to_delete_end);
            });
          }
        } />
      </div>
    </div>
  )
}

export default Arena;