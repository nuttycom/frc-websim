import React from 'react';
import arena from './arena.png';
import './App.css';
import ArenaState from './Arena';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Arena robots={[]} />
      </header>
    </div>
  );
}

class Arena extends React.Component <ArenaState, {}> {
  render() {
    return (
      <div className='arenaWrapper'>
        <div className='arenaInternal'>
          <img src={arena} className='arenaBackground'/>
          <canvas className='arenaCanvas'></canvas>
        </div>
      </div>
    )
  }
}

export default App;
