import React, { useEffect, useRef, useState, MouseEventHandler, ChangeEventHandler } from 'react';
import arena from './arena.png';
import './App.css';

type Exclusion = {
  top_left_x: number;
  top_left_y: number;
  width: number;
  height: number;
}

type ArenaLayout = {
  exclusions: Array<Exclusion>;
}

type Location = {
  label: string;
  x: number;
  y: number;
}

type ArenaLocations = {
  label_idx: number;
  locations: Array<Location>;
}

const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const Arena: React.FC = () => {
  const [mode, setMode] = useState<"layout" | "measure">("layout");
  const [locations, setLocations] = useState<ArenaLocations>({ label_idx: 0, locations: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const loc = { label: labels.charAt(locations.label_idx), x: event.clientX - rect.left, y: event.clientY - rect.top };
    setLocations((s) => ({ label_idx: s.label_idx + 1, locations: s.locations.concat(loc) }));
  };

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

  };

  const handleModeSwich: ChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setMode("measure");
    } else {
      setMode("layout");
    }
  };

  const handleClearClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setLocations((s) => ({ label_idx: 0, locations: [] }));
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
          ctx.font = "20px Consolas";
          ctx.fillStyle = "black";
          ctx.fillText(loc.label, loc.x - 8, loc.y + 5);
        });
      }
    }
  }, [locations]);

  return (
    <div className="arena">
      <div className='arenaWrapper'>
        <div className='arenaInternal'>
          <img src={arena} className='arenaBackground' alt="Robot Arena" />
          <canvas ref={canvasRef} className='arenaCanvas' onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}></canvas>
        </div>
      </div>
      <div>
        <div className='switch_row'>
          <span className='switch_label'>Layout</span>
          <input type="checkbox" className='switch' onChange={handleModeSwich} />
          <span className='switch_label'>Measure</span>
        </div>
      </div>
      <button onClick={handleClearClick}>Clear</button>
      <button>Run</button>
    </div>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Arena />
      </header>
    </div>
  );
}

export default App;
