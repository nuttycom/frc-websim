import React, { useState } from "react";
import { GameAction, Location } from "./Game";
import ActionEditor from "./ActionEditor";
import './LocationEditor.css';

type SetLocation = (loc: Location | null) => void;

const LocationEditor: React.FC<{ location: Location, setLocation: SetLocation }> = (props) => {
  const [actions, setActions] = useState<Array<GameAction>>([]);

  const addGameAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const newAction: GameAction = { action_id: "", produces: [], consumes: [], reward: 0 };
    setActions((xs) => xs.concat(newAction))
  };

  const updateAction = (act: GameAction | null, i: number) => {
    setActions((cur) => {
      if (act === null) {
        return cur.filter((act, idx) => idx !== i);
      } else {
        cur[i] = act;
        return cur;
      }
    })
  };

  const deleteLocation = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    props.setLocation(null);
  };


  const actionElems: Array<JSX.Element> = actions.map((act, i) => {
    return (
      <li key={`${props.location.loc_id}-actions-${i}`}>
        <ActionEditor action={act} setAction={(newAct) => updateAction(newAct, i)} /> 
      </li>
    );
  });

  return (
    <div className="LocationEditor">
      <span className='LocationEditor-loc_id'>Location {props.location.loc_id} <button onClick={deleteLocation}>X</button></span>
      <ul className='LocationEditor-actions'>
        <li>
          <button className="LocationEditor-addGameActionButton" onClick={addGameAction} type="button">
            Add Game Action At Location
          </button>
        </li>
        {actionElems}
      </ul>
    </div>
  );
}

export default LocationEditor;