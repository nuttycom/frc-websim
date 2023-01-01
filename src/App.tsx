import React, { useEffect, useRef, useState, MouseEventHandler } from 'react';
import arena from './arena.png';
import './App.css';

//type Exclusion = {
//  top_left_x: number;
//  top_left_y: number;
//  width: number;
//  height: number;
//}
//
//type ArenaLayout = {
//  exclusions: Array<Exclusion>;
//}
//
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
  const [locations, setLocations] = useState<ArenaLocations>({ label_idx: 0, locations: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const loc = { label: labels.charAt(locations.label_idx), x: event.clientX - rect.left, y: event.clientY - rect.top };
    console.log(`Clicked ${locations.locations.length} times, latest click at x: ${loc.x}, y: ${loc.y}`);
    setLocations((s) => ({label_idx: s.label_idx + 1, locations: s.locations.concat(loc)}));
  };

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

  };

  const handleClearClick: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setLocations((s) => ({label_idx: 0, locations: []}));
  };

  //const draw = (ctx: CanvasRenderingContext2D) => {
  //};

  useEffect(() => {
    const canvas = canvasRef.current;
    console.log("In useEffect");
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      canvas.width = 800; 
      canvas.height = 400; 
      console.log("Have a canvas");
      if (ctx != null) {
        console.log(`In draw with ${locations.locations.length} locations.`);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        locations.locations.forEach((loc) => {
          console.log(`Writing "${loc.label}" to the canvas at ${loc.x}, ${loc.y}`);
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
          <img src={arena} className='arenaBackground' alt="Robot Arena"/>
          <canvas ref={canvasRef} className='arenaCanvas' onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}></canvas>
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
