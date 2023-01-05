import React, { useState, useEffect } from "react";
import { Location, Runnable, RunAlg, Act, Move, Start} from "./Game";
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
  const [runnableType, setRunnableType] = useState<string>('move');
  const [lastLocation, setLastLocation] = useState<Location | undefined>(undefined);

  const runnableTypeSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRunnableType(event.target.value)
  };

  const locationSelect = (className: string, onChange: React.ChangeEventHandler<HTMLSelectElement>) => {
    return(<select className={className} onChange={onChange}>
        {props.locations.map((loc) => <option value={loc.loc_id}>Location {loc.loc_id}</option>)}
    </select>)
  };

  const setStart = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInstrs((is) => is.concat([new Start(event.target.value)]));
    setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
  };

  const addMove = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInstrs((is) => is.concat([new Move(event.target.value)]));
    setLastLocation(props.locations.find((loc) => loc.loc_id === event.target.value))
  };

  const addAction = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInstrs((is) => is.concat([new Act(event.target.value)]));
  };

  const actionSelect = () => {
    return(<select onChange={addAction}>
      {lastLocation ? lastLocation.actions.map((act) => <option value={act.action_id}>{act.action_id}</option>)
                    : [] }
    </select>)
  };

  const runElems: Array<JSX.Element> = instrs.map((instr, i) => {
    const renderer = new RenderRunnable();
    return (<li key={`runnable-${i}`}>
      {instr.apply(renderer)}
    </li>)
  });

  const addRunnableControl = () => {
    if (instrs.length === 0) {
      return (<li>Start at {locationSelect('start-select', setStart)}</li>);
    } else {
      return (
        <li>
          <select value={runnableType} onChange={runnableTypeSelected}>
            <option value={'move'}>Move</option>
            <option value={'act'}>Take Action</option>
          </select>
          {runnableType === 'move' ? locationSelect('move-select', addMove): actionSelect()}
        </li>
      );
    }
  };

  useEffect(() => {
    props.setRunInstructions(instrs);
  }, [props, instrs])

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