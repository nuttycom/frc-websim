import React, { useState, useEffect } from 'react';
import { GameAction } from "./Game";
import './ActionEditor.css';

type SetAction = (act: GameAction | null) => void;

const ActionEditor: React.FC<{ action: GameAction, setAction: SetAction }> = (props) => {
  const [name, setName] = useState<string>(props.action.action_id);
  const [reward, setReward] = useState<string>(props.action.reward === 0 ? "" : props.action.reward.toString());
  const [pname, setPname] = useState<string>(props.action.produces[0] ? props.action.produces[0].piece_id : "")
  const [pqty, setPQty] = useState<string>(props.action.produces[0] ? props.action.produces[0].count.toString() : "")
  const [cname, setCname] = useState<string>(props.action.consumes[0] ? props.action.consumes[0].piece_id : "")
  const [cqty, setCQty] = useState<string>(props.action.consumes[0] ? props.action.consumes[0].count.toString() : "")

  const handleNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
  };

  const handleRewardChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setReward(ev.target.value);
  };

  const handleProducedPieceId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setPname(ev.target.value);
  };

  const handleProducedPieceQty = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setPQty(ev.target.value);
  };

  const handleConsumedPieceId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setCname(ev.target.value);
  };

  const handleConsumedPieceQty = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setCQty(ev.target.value);
  };

  const deleteAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    props.setAction(null);
  };

  useEffect(() => {
    const nReward = parseInt(reward);
    const nProduced = parseInt(pqty);
    const nConsumed = parseInt(cqty);
    if (name.trim() !== "") {
      const action = {
        action_id: name,
        produces: pname.trim() === "" ? [] : [{
          piece_id: pname.trim(),
          count: isNaN(nProduced) ? 0 : nProduced
        }],
        consumes: cname.trim() === "" ? [] : [{
          piece_id: cname.trim(),
          count: isNaN(nConsumed) ? 0 : nConsumed
        }],
        reward: isNaN(nReward) ? 0 : nReward
      };
      console.log(`Calling setAction with ${action}`);

      props.setAction(action);
    }
  }, [props, name, reward, pname, pqty, cname, cqty]);

  return (
    <div className='ActionEditor'>
      <input type='text' value={name} size={10} placeholder='Action ID' onChange={handleNameChange} />
      <input type='text' value={reward} size={6} placeholder='Reward' onChange={handleRewardChange} />
      <div className='ActionEditor-resources'>
        <div className='ActionEditor-resource'>
          <label>Produces:</label>
          <input type='text' value={pname} size={10} placeholder='Game Piece' onChange={handleProducedPieceId} />
          <input type='text' value={pqty} size={3} placeholder='Qty' onChange={handleProducedPieceQty} />
        </div>
        <div className='ActionEditor-resource'>
          <label>Consumes:</label>
          <input type='text' value={cname} size={10} placeholder='Game Piece' onChange={handleConsumedPieceId} />
          <input type='text' value={cqty} size={3} placeholder='Qty' onChange={handleConsumedPieceQty} />
        </div>
      </div>
      <button onClick={deleteAction}>X</button>
    </div>
  );
}

export default ActionEditor;