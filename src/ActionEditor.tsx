import React from 'react';
import { GameAction } from "./Game";
import './ActionEditor.css';

type SetAction = (act: GameAction | null) => void;

const ActionEditor: React.FC<{ action: GameAction, setAction: SetAction }> = (props) => {
  const pname = props.action.produces.length > 0 ? props.action.produces[0].piece_id : "";
  const cname = props.action.consumes.length > 0 ? props.action.consumes[0].piece_id : "";
  const rewardStr = isNaN(props.action.reward) ? "" : props.action.reward.toString();
  const durationStr = isNaN(props.action.duration) ? "" : props.action.duration.toString();
  const pqtyStr  = (props.action.produces.length === 0 || isNaN(props.action.produces[0].count)) ? "" : props.action.produces[0].count.toString();
  const cqtyStr  = (props.action.consumes.length === 0 || isNaN(props.action.consumes[0].count)) ? "" : props.action.consumes[0].count.toString();

  const handleNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const name = ev.target.value.trim();
    if (name !== "") {
      props.setAction({...props.action, action_id: name})
    }
  };

  const handleRewardChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const reward = parseInt(ev.target.value);
    props.setAction({...props.action, reward: reward});
  };

  const handleDurationChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(ev.target.value);
    props.setAction({...props.action, duration: duration});
  };

  const handleProducedPieceId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const pieceId = ev.target.value.trim();
    props.setAction({...props.action, produces: [{
      piece_id: pieceId,
      count: props.action.produces.length > 0 ? props.action.produces[0].count : 0
    }]});
  };

  const handleProducedPieceQty = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(ev.target.value);
    props.setAction({...props.action, produces: [{
      piece_id: pname,
      count: count,
    }]});
  };

  const handleConsumedPieceId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const pieceId = ev.target.value.trim();
    props.setAction({...props.action, consumes: [{
      piece_id: pieceId,
      count: props.action.consumes.length > 0 ? props.action.consumes[0].count : 0
    }]})
  };

  const handleConsumedPieceQty = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(ev.target.value);
    props.setAction({...props.action, consumes: [{
      piece_id: cname,
      count: count,
    }]});
  };

  const deleteAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    props.setAction(null);
  };

  return (
    <div className='ActionEditor'>
      <input type='text' value={props.action.action_id} size={10} placeholder='Action ID' onChange={handleNameChange} />
      <div className='ActionEditor-action_attrs'>
        <div>
          <label>Reward:</label>
          <input type='text' value={rewardStr} size={7} placeholder='Points' onChange={handleRewardChange} />
        </div>
        <div>
          <label>Duration:</label>
          <input type='text' value={durationStr} size={7} placeholder='Seconds' onChange={handleDurationChange} />
        </div>
      </div>
      <div className='ActionEditor-resources'>
        <div className='ActionEditor-resource'>
          <label>Produces:</label>
          <input type='text' value={pname} size={10} placeholder='Game Piece' onChange={handleProducedPieceId} />
          <input type='text' value={pqtyStr} size={3} placeholder='Qty' onChange={handleProducedPieceQty} />
        </div>
        <div className='ActionEditor-resource'>
          <label>Consumes:</label>
          <input type='text' value={cname} size={10} placeholder='Game Piece' onChange={handleConsumedPieceId} />
          <input type='text' value={cqtyStr} size={3} placeholder='Qty' onChange={handleConsumedPieceQty} />
        </div>
      </div>
      <button onClick={deleteAction}>X</button>
    </div>
  );
}

export default ActionEditor;