import React, { useState, useEffect } from "react";
import { Location, Runnable, RunAlg, Act, Move, Start } from "./Game";
import './RunEditor.css';

type SetRunInstructions = (instructions: Array<Runnable>) => void;

class RenderRunnable implements RunAlg<JSX.Element> {
  start(start: Start): JSX.Element {
    return (<span>Start at location "{start.loc_id}"</span>);
  }
  move(move: Move): JSX.Element {
    return (<span>Move to location "{move.dest_loc_id}"</span>);
  }
  act(act: Act): JSX.Element {
    return (<span>Take action "{act.action_id}"</span>);
  }
}

const RunEditor: React.FC<{ locations: Array<Location>, runInstructions: Array<Runnable>, setRunInstructions: SetRunInstructions }> = (props) => {
  const [instrs, setInstrs] = useState<Array<Runnable>>(props.runInstructions);
  const [runnableType, setRunnableType] = useState<string>('placeholder');
  const [lastLocation, setLastLocation] = useState<Location | undefined>(undefined);
  
  // Effect Handlers

  const runnableTypeSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      setRunnableType(event.target.value)
    }
  };

  const setStart = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      console.log(`Setting last location to loc ${event.target.value}`);
      setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
      console.log(`Location is ${JSON.stringify(lastLocation)}`);
      setInstrs((is) => is.concat([new Start(event.target.value)]));
    }
  };

  const addMove = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value !== 'placeholder') {
      console.log(`Setting last location to loc ${event.target.value}`);
      setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
      console.log(`Location is ${JSON.stringify(lastLocation)}`);
      setInstrs((is) => is.concat([new Move(event.target.value)]));
    }
  };

  const addAction = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInstrs((is) => is.concat([new Act(event.target.value)]));
  };

  useEffect(() => {
    props.setRunInstructions(instrs);
  }, [props, instrs])

  // Rendering Elements

  const runElems: Array<JSX.Element> = instrs.map((instr, i) => {
    const renderer = new RenderRunnable();
    return (
      <li key={`runnable-${i}`}>
        {instr.apply(renderer)}
      </li>
    );
  });

  const locationSelect = (className: string, onChange: React.ChangeEventHandler<HTMLSelectElement>) => {
    return (
      <select className={className} onChange={onChange}>
        <option value='placeholder'>(select one)</option>
        {props.locations.map((loc) => <option key={`opt-loc-${loc.loc_id}`} value={loc.loc_id}>Location {loc.loc_id}</option>)}
      </select>
    );
  };

  const actionSelect = () => {
    return (
      <select onChange={addAction}>
        {lastLocation ?
          lastLocation.actions.map(
            (act) => <option key={`opt-act-${act.action_id}`} value={act.action_id}>{act.action_id}</option>
          ) : []
        }
      </select>
    );
  };

  const addRunnableControl = () => {
    if (instrs.length === 0) {
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
            <option value={'placeholder'}>(select one)</option>
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
          {runElems}
          {addRunnableControl()}
        </ul>
      </div>
    );
  } else {
    return <></>;
  }
}

export default RunEditor;