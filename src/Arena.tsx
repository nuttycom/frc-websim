import React, { useEffect, useCallback, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import robotPng from './robot.png';
import { Exclusion, Position, Location, Runnable, computeSteps, Step } from './Game';
import LocationEditor from './LocationEditor';
import './Arena.css';
import RunEditor from './RunEditor';

export const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const robot = new Image();
robot.src = robotPng;

const Arena: React.FC = () => {
  const [robotVelocity, setRobotVelocity] = useState<number>(1);
  const [animationRate, setAnimationRate] = useState<number>(30);
  const [mode, setMode] = useState<'layout' | 'measure'>('measure');
  const [measureWidth, setMeasureWidth] = useState<number>(NaN);
  const [realWidth, setRealWidth] = useState<number>(10);
  const [measureHeight, setMeasureHeight] = useState<number>(NaN);
  const [realHeight, setRealHeight] = useState<number>(5);
  const [labelIdx, setLabelIdx] = useState<number>(0);
  const [locations, setLocations] = useState<Array<Location>>([]);
  const [exclusions, setExclusions] = useState<Array<Exclusion>>([]);
  const [instrs, setInstrs] = useState<Array<Runnable>>([]);

  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragEnd, setDragEnd] = useState<Position | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [runLabel, setRunLabel] = useState<string>('Run');

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

    if (dragging && dragStart && dragEnd) {
      if (mode === 'layout') {
        setExclusions((xs) => xs.concat([
          {
            top_left: {
              x: Math.min(dragStart.x, dragEnd.x),
              y: Math.min(dragStart.y, dragEnd.y)
            },
            width: Math.abs(dragStart.x - dragEnd.x),
            height: Math.abs(dragStart.y - dragEnd.y)
          }
        ]));
      } else if (mode === 'measure') {
        const width = Math.abs(dragStart.x - dragEnd.x);
        const height = Math.abs(dragStart.y - dragEnd.y);
        if (width > height) {
          setMeasureWidth(width);
        } else {
          setMeasureHeight(height);
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
    setLabelIdx(0);
    setLocations([]);
    setExclusions([]);
    setInstrs([]);
  };

  const handleRunClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (running) {
      setRunning(false);
      setRunLabel('Run');
      animStepsRef.current = [];
    } else {
      console.log(`x ratio: ${measureWidth}/${realWidth}`);
      console.log(`y ratio: ${measureHeight}/${realHeight}`);
      animStartRef.current = new Date();
      animStepsRef.current = computeSteps(
        instrs,
        locations,
        robotVelocity,
        measureWidth / realWidth,
        measureHeight / realHeight,
        animationRate
      );
      setRunning(true);
      setRunLabel('Stop');
    }
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
          <label htmlFor='robotVelocity'>Robot Velocity</label>
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
            <input id='measuredWidth' type='text' placeholder='Meters'
              value={realWidth ? realWidth.toString() : ''}
              onChange={handleWidthChange} />
          </div> : <></>
        }
        {!isNaN(measureHeight) ?
          <div>
            <label htmlFor='measuredHeight'>Measured Height</label>
            <input id='measuredHeight' type='text' placeholder='Meters'
              value={realHeight ? realHeight.toString() : ''}
              onChange={handleHeightChange} />
          </div> : <></>
        }
      </div>
      <div>
        <button onClick={handleClearClick}>Clear</button>
        <button onClick={handleRunClick} disabled={instrs.length === 0}>{runLabel}</button>
      </div>
      <div className='Arena-locations'>
        <ul>
          {locations.map((loc, i) =>
            <li key={`location-${i}`}>
              <LocationEditor location={loc} setLocation={(newLoc) => updateLocation(newLoc, i)} />
            </li>
          )}
        </ul>
      </div>
      <div className='Arena-run-instructions'>
        <RunEditor locations={locations} runInstructions={instrs} setRunInstructions={(xs) => setInstrs(xs)} />
      </div>
    </div>
  )
}

export default Arena;