import React from 'react';
import { Translate, Localize } from 'react-redux-i18n';
import IdeaLink from './ideaLink';

class TopIdea extends React.Component {
  render() {
    const theme = this.props.theme;
    const keyTitle = this.props.keyTitle;
    return(
      <div className="top-idea theme-box">
        <h2 className="dark-title-2 center">
          <Translate value={keyTitle} />
        </h2>
        {theme.map((idea, index) => {
          return (<IdeaLink key={index} idea={idea} />)
        })}
      </div>
    );
  }
}

export default TopIdea;