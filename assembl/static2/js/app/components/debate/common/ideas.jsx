import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    const { rootIdeaId } = this.props;
    this.state = { levelsToDisplay: [rootIdeaId], selectedIdeaId: rootIdeaId };
    this.listIdeasToDisplay = this.listIdeasToDisplay.bind(this);
    this.setSelectedIdeas = this.setSelectedIdeas.bind(this);
  }
  setSelectedIdeas(selectedIdeaId, ideaLevel) {
    const currentLevel = this.state.levelsToDisplay.length;
    const arr = this.state.levelsToDisplay;
    if (arr.indexOf(selectedIdeaId) <= -1 && ideaLevel === currentLevel) {
      arr.push(selectedIdeaId);
      this.setState({
        levelsToDisplay: arr
      });
    } else if (ideaLevel < currentLevel) {
      const nbToRemove = this.state.levelsToDisplay.length - ideaLevel;
      arr.splice(ideaLevel, nbToRemove, selectedIdeaId);
      this.setState({
        levelsToDisplay: arr
      });
    }
    this.setState({ selectedIdeaId: selectedIdeaId });
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
              {this.state.levelsToDisplay.map((ideaId, index) => {
                return (
                  <IdeasLevel
                    ideas={this.listIdeasToDisplay(ideaId)}
                    identifier={identifier}
                    key={index}
                    setSelectedIdeas={this.setSelectedIdeas}
                    currentLevel={this.state.levelsToDisplay.length}
                    ideaLevel={index + 1}
                    selectedIdeaId={this.state.selectedIdeaId}
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