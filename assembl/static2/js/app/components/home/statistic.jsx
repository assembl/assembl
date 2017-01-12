import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Glyphicon } from 'react-bootstrap';

class Statistic extends React.Component {
  render() {
    return (
      <div className="statistic">
        <div className="black-icon"><Glyphicon glyph="comment" /></div>
        <div className="stat">983 <Translate value="home.contribution" /></div>
        <div className="black-icon"><Glyphicon glyph="user" /></div>
        <div className="stat">321 <Translate value="home.participant" /></div>
        <div className="black-icon"><Glyphicon glyph="log-in" /></div>
        <div className="stat">2931 <Translate value="home.visit" /></div>
        <div className="black-icon"><Glyphicon glyph="eye-open" /></div>
        <div className="stat">276 <Translate value="home.viewedPages" /></div>
      </div>
    );
  }
}

export default Statistic;