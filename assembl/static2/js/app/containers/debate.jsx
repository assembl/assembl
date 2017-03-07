import React from 'react';
import Thread from '../components/debate/thread';
import Survey from '../components/debate/survey';

class Debate extends React.Component {
  render() {
    return (
      <div className="debate">
        <Survey />
        <Thread />
      </div>
    );
  }
}

export default Debate;