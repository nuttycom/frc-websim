import React, { useState } from "react";
import { Location, Runnable } from "./Game";
import './RunEditor.css';

type SetRunInstructions = (instructions: Array<Runnable>) => void;

const RunEditor: React.FC<{
  locations: Array<Location>,
  runInstructions: Array<Runnable>,
  runTimes: Array<number>,
  setRunInstructions: SetRunInstructions
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
      props.setRunInstructions(props.runInstructions.concat({ kind: 'start', loc_id: event.target.value }));
      setRunnableType('move');
    }
  };

  const addMove = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
      props.setRunInstructions(props.runInstructions.concat({ kind: 'move', dest_loc_id: event.target.value }));
      setRunnableType('move');
    }
  };

  const addAction = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      props.setRunInstructions(props.runInstructions.concat({ kind: 'act', action_id: event.target.value }));
      setRunnableType('move');
    }
  };

  // Rendering Elements

  const runElems = () => {
    return props.runInstructions.map((instr, i) => {
      const instrSeconds = props.runTimes[i] ? <>({Math.round(props.runTimes[i] * 100) / 100} seconds)</> : <></>;
      const renderRunnable = (r: Runnable, idx: number) => {
        if (r.kind === 'start') {
          return (<span>Start at location "{r.loc_id}"</span>);
        } else if (r.kind === 'move') {
          return (<span>Move to location "{r.dest_loc_id}" {instrSeconds}</span>);
        } else if (r.kind === 'act') {
          return (<span>Take action "{r.action_id}" {instrSeconds}</span>);
        }
      };

      return (
        <li key={`runnable-${i}`}>
          {renderRunnable(instr, i)}
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
    if (props.runInstructions.length === 0) {
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