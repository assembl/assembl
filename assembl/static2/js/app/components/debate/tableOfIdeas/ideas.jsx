import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    const { rootIdeaId } = this.props;
    this.state = { selectedIdeasId: [rootIdeaId], selectedIdeaIndex: 0 };
    this.getIdeaChildren = this.getIdeaChildren.bind(this);
    this.setSelectedIdeas = this.setSelectedIdeas.bind(this);
  }

  setSelectedIdeas(selectedIdeaId, ideaLevel, ideaIndex) {
    const nbLevel = this.state.selectedIdeasId.length;
    const ideasArray = this.state.selectedIdeasId;
    this.setState({ selectedIdeaIndex: ideaIndex });
    if (ideasArray.indexOf(selectedIdeaId) <= -1 && ideaLevel === nbLevel) {
      ideasArray.push(selectedIdeaId);
      this.setState({
        selectedIdeasId: ideasArray
      });
    } else if (ideaLevel < nbLevel) {
      const nbToRemove = this.state.selectedIdeasId.length - ideaLevel;
      ideasArray.splice(ideaLevel, nbToRemove, selectedIdeaId);
      this.setState({
        selectedIdeasId: ideasArray
      });
    }
  }

  getIdeaChildren(selectedIdeaId) {
    const { ideas } = this.props;
    return ideas.filter(idea => idea.parentId === selectedIdeaId);
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
              {this.state.selectedIdeasId.map((ideaId, index) => (
                <IdeasLevel
                  ideas={this.getIdeaChildren(ideaId)}
                  identifier={identifier}
                  setSelectedIdeas={this.setSelectedIdeas}
                  nbLevel={this.state.selectedIdeasId.length}
                  ideaLevel={index + 1}
                  key={index}
                  selectedIdeasId={this.state.selectedIdeasId}
                  selectedIdeaIndex={this.state.selectedIdeaIndex}
                />
              ))}
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Ideas;