import React, { useEffect, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import { Exclusion, Position, Location, Runnable } from './Game';
import LocationEditor from './LocationEditor';
import './Arena.css';
import RunEditor from './RunEditor';

export type ArenaLocations = {
  label_idx: number;
  locations: Array<Location>;
};

export const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const Arena: React.FC = () => {
  const [mode, setMode] = useState<'layout' | 'measure'>('layout');
  const [locations, setLocations] = useState<ArenaLocations>({ label_idx: 0, locations: [] });
  const [exclusions, setExclusions] = useState<Array<Exclusion>>([]);
  const [instrs, setInstrs] = useState<Array<Runnable>>([]);

  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragEnd, setDragEnd] = useState<Position | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMouseDown(true);
    setDragStart({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (mouseDown) {
      setDragging(true);
      setDragEnd({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (dragging && dragStart && dragEnd) {
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
      setDragging(false);
    } else {
      const loc = {
        loc_id: labels.charAt(locations.label_idx),
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        actions: []
      };
      setLocations((s) => ({ label_idx: s.label_idx + 1, locations: s.locations.concat(loc) }));
    }
    setMouseDown(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleModeSwich: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setMode('measure');
    } else {
      setMode('layout');
    }
  };

  const handleClearClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setLocations({ label_idx: 0, locations: [] });
    setExclusions([])
  };

  const updateLocation = (loc: Location, i: number) => {
    setLocations((aloc) => {
      aloc.locations[i] = loc;
      return aloc;
    })
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 400;
      if (ctx != null) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        locations.locations.forEach((loc) => {
          ctx.font = '20px Consolas';
          ctx.fillStyle = 'black';
          ctx.fillText(loc.loc_id, loc.position.x - 8, loc.position.y + 5);
        });

        exclusions.forEach((exc) => {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.25';
          ctx.fillRect(exc.top_left.x, exc.top_left.y, exc.width, exc.height);
        });

        if (mode === 'layout' && dragStart && dragEnd) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.25';
          const ul_x = Math.min(dragStart.x, dragEnd.x);
          const ul_y = Math.min(dragStart.y, dragEnd.y);
          const width = Math.abs(dragStart.x - dragEnd.x);
          const height = Math.abs(dragStart.y - dragEnd.y);
          ctx.fillRect(ul_x, ul_y, width, height);
        }
      }
    }
  }, [locations, mode, dragStart, dragEnd, exclusions]);

  return (
    <div className='Arena'>
      <div className='Arena-wrapper'>
        <div className='Arena-internal'>
          <img src={arena} className='Arena-background' alt="Robot Arena" />
          <canvas
            ref={canvasRef}
            className='Arena-canvas'
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          ></canvas>
        </div>
      </div>
      <div>
        <div className='Arena-switch_row'>
          <span className='Arena-switch_label'>Layout</span>
          <input type='checkbox' className='Arena-switch' onChange={handleModeSwich} />
          <span className='Arena-switch_label'>Measure</span>
        </div>
      </div>
      <div>
        <button onClick={handleClearClick}>Clear</button>
        <button>Run</button>
      </div>
      <div className='Arena-locations'>
        <ul>
          {locations.locations.map((loc, i) => {
            return (<li key={`location-${i}`}><LocationEditor location={loc} setLocation={(newLoc) => updateLocation(newLoc, i)} /></li>)
          })}
        </ul>
      </div>
      <div className='Arena-run-instructions'>
        <RunEditor locations={locations.locations} runInstructions={instrs} setRunInstructions={(xs) => setInstrs(xs)}/>
      </div>
    </div>
  )
}

export default Arena;