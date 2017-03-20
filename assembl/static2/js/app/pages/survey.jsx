import React from 'react';
import Header from '../components/debate/survey/header';
import Questions from '../components/debate/survey/questions';
import Proposals from '../components/debate/survey/proposals';

class Survey extends React.Component {
  render() {
    return (
      <div className="survey">
        <Header />
        <Questions />
        <Proposals />
      </div>
    );
  }
}

export default Survey;