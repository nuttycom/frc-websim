import React from "react";
import { GameAction, Location } from "./Game";
import ActionEditor from "./ActionEditor";
import './LocationEditor.css';

type SetLocation = (loc: Location | null) => void;

const LocationEditor: React.FC<{ location: Location, setLocation: SetLocation }> = (props) => {
  const addGameAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const newAction: GameAction = { action_id: "", produces: [], consumes: [], reward: 0 };
    props.setLocation({...props.location, actions: props.location.actions.concat(newAction)})
  };

  const updateAction = (act: GameAction | null, i: number) => {
    const actions = (act === null)
      ? props.location.actions.filter((act, idx) => idx !== i)
      : props.location.actions.map((act0, idx) => i === idx ? act : act0);
    props.setLocation({...props.location, actions: actions });
  };

  const deleteLocation = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    props.setLocation(null);
  };

  const actionElems: Array<JSX.Element> = props.location.actions.map((act, i) => {
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