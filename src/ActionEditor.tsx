import React, { useState } from 'react';
import { GameAction, Resource } from "./Game";
import './ActionEditor.css';

type SetAction = (act: GameAction) => void;

const ActionEditor: React.FC<{ action: GameAction, setAction: SetAction }> = (props) => {
  const [name, setName] = useState<string>(props.action.name);
  const [reward, setReward] = useState<string>(props.action.reward === 0 ? "" : `${props.action.reward}`);
  const [produces, setProduces] = useState<Array<Resource>>(props.action.produces);
  const [consumes, setConsumes] = useState<Array<Resource>>(props.action.consumes);

  const handleNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
    const cur_action = props.action;
    props.setAction({...cur_action, name: name});
  };

  const handleRewardChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setReward(ev.target.value);
    if (!isNaN(ev.target.valueAsNumber)) {
      props.setAction({ name: name, produces: [], consumes: [], reward: ev.target.valueAsNumber });
    }
  };

  return (
    <div className='ActionEditor'>
      <input type='text' value={name} size={10} placeholder='Action ID' onChange={handleNameChange} />
      <input type='text' value={reward} size={6} placeholder='Reward' onChange={handleRewardChange} />
      <div className='ActionEditor-resources'>
        <div className='ActionEditor-resource'>
          <label>Produces:</label>
          <input type='text' value={name} size={10} placeholder='Game Piece' /><input type='text' value={name} size={3} placeholder='Qty' />
        </div>
        <div className='ActionEditor-resource'>
          <label>Consumes:</label>
          <input type='text' value={name} size={10} placeholder='Game Piece' /> 
          <input type='text' value={name} size={3} placeholder='Qty' />
        </div>
      </div>
      <button>X</button>
    </div>
  );
}

export default ActionEditor;