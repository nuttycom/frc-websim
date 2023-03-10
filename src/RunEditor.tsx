import React, { useState } from "react";
import { Location, Runnable, Move } from "./Game";
import './RunEditor.css';

const RunEditor: React.FC<{
  locations: Array<Location>,
  moves: Array<Move>,
  addRunInstruction: (instr: Runnable) => void,
  deleteRunInstruction: (index: number) => void,

}> = (props) => {
  //const [instrs, setInstrs] = useState<Array<Runnable>>(props.runInstructions);
  const [runnableType, setRunnableType] = useState<string>('move');
  const [lastLocation, setLastLocation] = useState<Location | undefined>(undefined);

  // Effect Handlers

  const runnableTypeSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      setRunnableType(event.target.value)
    }
  };

  const setStart = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
      props.addRunInstruction({ kind: 'start', loc_id: event.target.value });
      setRunnableType('move');
    }
  };

  const addMove = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
      props.addRunInstruction({ kind: 'move', dest_loc_id: event.target.value });
      setRunnableType('move');
    }
  };

  const addAction = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      props.addRunInstruction({ kind: 'act', action_id: event.target.value });
      setRunnableType('move');
    }
  };

  const handleDeleteClick: ((delete_idx: number) => React.MouseEventHandler<HTMLButtonElement>) = (delete_idx: number) => {
    return (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      props.deleteRunInstruction(delete_idx)
    }
  }

  // Rendering Elements

  const runElems = () => {
    return props.moves.map((move, i) => {
      const renderRunnable = () => {
        const runnable = move.runnable;
        if (runnable.kind === 'start') {
          return (<span>Start at location "{move.end_loc.loc_id}"</span>);
        } else if (runnable.kind === 'move') {
          return (<>
            <button onClick={handleDeleteClick(i)}>X</button>
            <span>Move to location "{move.end_loc.loc_id}"</span>
            <span className='runSeconds'>({Math.round(move.run_seconds * 100) / 100} seconds)</span>
          </>);
        } else if (runnable.kind === 'act') {
          return (<>
            <button onClick={handleDeleteClick(i)}>X</button>
            <span>Take action "{runnable.action_id}"</span>
            <span className='runSeconds'>({Math.round(move.run_seconds * 100) / 100} seconds)</span>
          </>);
        }
      };

      return (
        <li key={`runnable-${i}`}>
          {renderRunnable()}
        </li>
      );
    });
  }

  const locationSelect = (className: string, onChange: React.ChangeEventHandler<HTMLSelectElement>) => {
    return (
      <select className={className} onChange={onChange}>
        <option value='placeholder'>(select one)</option>
        {props.locations.map((loc) => <option key={`${className}-opt-loc-${loc.loc_id}`} value={loc.loc_id}>Location {loc.loc_id}</option>)}
      </select>
    );
  };

  const actionSelect = () => {
    return (
      <select onChange={addAction}>
        <option value='placeholder'>(select one)</option>
        {(lastLocation ? lastLocation.actions : []).map((act) =>
          <option key={`opt-act-${act.action_id}`} value={act.action_id}>{act.action_id}</option>
        )}
      </select>
    );
  };

  const addRunnableControl = () => {
    if (props.moves.length === 0) {
      return (
        <li key='run-control'>
          <span>Start at</span> {locationSelect('start-select', setStart)}
        </li>
      );
    } else {
      return (
        <li key='run-control'>
          <span>Then</span>
          <select className='runnable-type-select' value={runnableType} onChange={runnableTypeSelected}>
            <option value={'move'}>Move</option>
            <option value={'act'}>Take Action</option>
          </select>
          {runnableType === 'move' ? locationSelect('move-select', addMove) : actionSelect()}
        </li>
      );
    }
  };

  if (props.locations.length > 1) {
    return (
      <div className="RunEditor">
        <ul className='RunEditor-actions'>
          {runElems()}
          {addRunnableControl()}
        </ul>
      </div>
    );
  } else {
    return <></>;
  }
}

export default RunEditor;