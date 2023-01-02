import React, { useState } from "react";
import { GameAction } from "./Game";
import ActionEditor from "./ActionEditor";
import { Location } from "./Arena";
import './LocationEditor.css';

type SetLocation = (loc: Location) => void;

const LocationEditor: React.FC<{ location: Location, setLocation: SetLocation }> = (props) => {
  const [actions, setActions] = useState<Array<GameAction>>([]);

  const addGameAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const newAction: GameAction = { name: "", produces: [], consumes: [], reward: 0 };
    setActions((xs) => xs.concat(newAction))
  };

  const updateAction = (act: GameAction, i: number) => {
    setActions((cur) => {
      cur[i] = act;
      return cur;
    })
  };

  const actionElems: Array<JSX.Element> = actions.map((act, i) => {
    return (<li key={i}><ActionEditor action={act} setAction={(newAct) => updateAction(newAct, i)} /> </li>)
  });

  return (
    <div className="LocationEditor">
      <span className='loc_id'>Location {props.location.label}</span> 
      <ul>
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