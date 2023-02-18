import React, { useEffect, useCallback, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import robotPng from './robot.png';
import { Exclusion, Position, Location } from './Game';
import './Arena.css';

const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const robot = new Image();
robot.src = robotPng;

const Arena: React.FC = () => {
  const [mode, setMode] = useState<'layout' | 'measure'>('measure');
  const [labelIdx, setLabelIdx] = useState<number>(0);
  const [locations, setLocations] = useState<Array<Location>>([]);
  const [exclusions, setExclusions] = useState<Array<Exclusion>>([]);

  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragEnd, setDragEnd] = useState<Position | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMouseDown(true);
    setDragStart({ x: event.clientX - rect.left, y: event.clientY - rect.top, heading: null });
  };

  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (mouseDown) {
      setDragging(true);
      setDragEnd({ x: event.clientX - rect.left, y: event.clientY - rect.top, heading: null })
    }
  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
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
              y: Math.min(dragStart.y, dragEnd.y),
              heading: null
            },
            width: drag_area.width,
            height: drag_area.height,
          }
        ]));
      }
      setDragging(false);
    } else {
      const loc = {
        loc_id: labels.charAt(labelIdx),
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top, heading: null },
        actions: []
      };
      setLabelIdx((i) => i + 1);
      setLocations((l) => l.concat(loc));
    }
    setMouseDown(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleClearClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setMode('measure');
    setLabelIdx(0);
    setLocations([]);
    setExclusions([]);
  };

  const headingChangeHandler: (location_idx: number) => ChangeEventHandler = (location_idx) => {
    return ((event: React.ChangeEvent<HTMLInputElement>) => {
      let new_heading = parseFloat(event.target.value);
      if (!isNaN(new_heading) || event.target.value === "") {
        setLocations(locations.map((loc, i) => i === location_idx ? {
          loc_id: loc.loc_id,
          position: {
            x: loc.position.x,
            y: loc.position.y,
            heading: isNaN(new_heading) ? null : new_heading
          }
        } : loc ))
      }
    });
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

    const canvas = canvasRef.current;
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawLocations(ctx);
        drawExclusions(ctx);
        drawDragState(ctx);
      }
    }
  }, [locations, mode, dragStart, dragEnd, exclusions]);

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
      <div>
        <button onClick={handleClearClick}>Clear</button>
      </div>
      <div className='Arena-locations'>
        <ul>
          {locations.map((loc, i) =>
            <li key={`location-${loc.loc_id}`}>
              <span>{loc.loc_id}: x: {loc.position.x}, y: {loc.position.y}, heading: <input 
                id={`location-heading-${i}`}
                type='text'
                value={loc.position.heading !== null ? loc.position.heading : ""}
                onChange={headingChangeHandler(i)}
                ></input>
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Arena;