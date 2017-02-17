import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import MapStateToProps from '../../../store/mapStateToProps';
import IdeaLink from './ideaLink';

class TopIdea extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const keyValue = this.props.keyValue;
    const translateKey = `home.${keyValue}`;
    const topIdeas = ideas[keyValue];
    return (
      <div className="top-idea theme-box">
        <h2 className="dark-title-2 center">
          <Translate value={translateKey} />
        </h2>
        {topIdeas.map((idea, index) => {
          return (<IdeaLink key={index} idea={idea} />);
        })}
      </div>
    );
  }
}

export default connect(MapStateToProps)(TopIdea);