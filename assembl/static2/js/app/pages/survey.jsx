import React from 'react';
import Questions from '../components/debate/survey/questions';
import Proposals from '../components/debate/survey/proposals';

class Survey extends React.Component {
  render() {
    return (
      <div className="debate-section">
        <Questions />
        <Proposals />
      </div>
    );
  }
}

export default Survey;