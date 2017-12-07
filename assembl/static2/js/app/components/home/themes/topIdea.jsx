import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import IdeaLink from './ideaLink';

class TopIdea extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const keyValue = this.props.keyValue;
    const translateKey = `home.${keyValue}`;
    const topIdeas = ideas[keyValue];
    const isUserConnected = false;

    return (
      <div className={isUserConnected ? 'top-idea theme-box' : 'hidden'}>
        <h2 className="dark-title-2 center">
          <Translate value={translateKey} />
        </h2>
        {topIdeas.map((idea, index) => <IdeaLink key={index} idea={idea} />)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ideas: state.ideas
});

export default connect(mapStateToProps)(TopIdea);