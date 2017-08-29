import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    const { rootIdeaId } = this.props;
    this.state = { levelsToDisplay: [rootIdeaId] };
    this.listIdeasToDisplay = this.listIdeasToDisplay.bind(this);
    this.setLevelsToDisplay = this.setLevelsToDisplay.bind(this);
  }
  setLevelsToDisplay(selectedIdeaId) {
    const arr = this.state.levelsToDisplay;
    if (arr.indexOf(selectedIdeaId) <= -1) {
      arr.push(selectedIdeaId);
      this.setState({
        levelsToDisplay: arr
      });
    }
  }
  listIdeasToDisplay(selectedIdeaId) {
    const { ideas } = this.props;
    const listedIdeas = [];
    ideas.forEach((idea) => {
      if (idea.parentId === selectedIdeaId) {
        listedIdeas.push(idea);
      }
    });
    return listedIdeas;
  }
  render() {
    const { identifier } = this.props;
    return (
      <section className="themes-section ideas-section">
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="debate.survey.themesTitle" />
              </h1>
            </div>
            <div className="content-section">
              {this.state.levelsToDisplay.map((selectedIdeaId, index) => {
                return (
                  <IdeasLevel
                    ideas={this.listIdeasToDisplay(selectedIdeaId)}
                    identifier={identifier}
                    key={index}
                    setLevelsToDisplay={this.setLevelsToDisplay}
                    level={this.state.levelsToDisplay.length}
                  />
                );
              })}
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Ideas;