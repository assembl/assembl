import React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';
import IdeasLevelMobile from './ideasLevelMobile';
import { SMALL_SCREEN_WIDTH } from '../../../constants';

const PageTitle = () => (
  <div className="title-section">
    <div className="title-hyphen">&nbsp;</div>
    <h1 className="dark-title-1">
      <Translate value="debate.survey.themesTitle" />
    </h1>
  </div>
);

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    const { rootIdeaId } = this.props;
    this.state = { selectedIdeasId: [rootIdeaId], selectedIdeaIndex: 0, ideaLevel: 0, goBack: false };
    this.getIdeaChildren = this.getIdeaChildren.bind(this);
    this.setSelectedIdeas = this.setSelectedIdeas.bind(this);
    this.getIdeaParents = this.getIdeaParents.bind(this);
    this.goBackToParents = this.goBackToParents.bind(this);
  }

  setSelectedIdeas(selectedIdeaId, ideaLevel, ideaIndex) {
    const nbLevel = this.state.selectedIdeasId.length;
    const ideasArray = this.state.selectedIdeasId;
    this.setState({ selectedIdeaIndex: ideaIndex, ideaLevel: ideaLevel });
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

  getIdeaParents(ideaLevel) {
    const { ideas } = this.props;
    const { selectedIdeasId } = this.state;
    const ancestor = selectedIdeasId[ideaLevel];
    return ideas.filter(idea => ancestor === idea.ancestors[0]);
  }

  goBackToParents() {
    const { selectedIdeasId, ideaLevel } = this.state;
    const ideasArray = selectedIdeasId;
    ideasArray.pop();
    this.setState({
      selectedIdeasId: ideasArray,
      goBack: true,
      ideaLevel: ideaLevel - 1,
      selectedIdeaIndex: 0
    });
  }

  render() {
    const isMobile = window.innerWidth < SMALL_SCREEN_WIDTH;
    const { identifier } = this.props;
    return (
      <section className={classnames('themes-section', 'ideas-section', { 'mobile-ideas-section': isMobile })}>
        <Grid fluid className={classnames('background-grey', { 'no-padding': isMobile })}>
          <div className="max-container">
            {!isMobile && <PageTitle />}
            {isMobile && this.state.ideaLevel === 0 && <PageTitle />}
            {isMobile &&
              this.state.ideaLevel > 0 && (
                <div className="ideas-back-arrow" onClick={this.goBackToParents}>
                  <span className="assembl-icon-down-small color" />
                </div>
              )}
            <div className={classnames('content-section', { 'mobile-content-section': isMobile })}>
              {!isMobile
                ? this.state.selectedIdeasId.map((ideaId, index) => (
                  <IdeasLevel
                    key={`ideas-level-${index}`}
                    ideas={this.getIdeaChildren(ideaId)}
                    identifier={identifier}
                    setSelectedIdeas={this.setSelectedIdeas}
                    nbLevel={this.state.selectedIdeasId.length}
                    ideaLevel={index + 1}
                    selectedIdeasId={this.state.selectedIdeasId}
                    selectedIdeaIndex={this.state.selectedIdeaIndex}
                  />
                ))
                : this.state.selectedIdeasId.map((ideaId, index) => (
                  <IdeasLevelMobile
                    key={`ideas-level-${index}`}
                    ideas={this.state.goBack ? this.getIdeaParents(index) : this.getIdeaChildren(ideaId)}
                    identifier={identifier}
                    setSelectedIdeas={this.setSelectedIdeas}
                    ideaLevel={index + 1}
                    selectedIdeasId={this.state.selectedIdeasId}
                    nbLevel={this.state.selectedIdeasId.length}
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