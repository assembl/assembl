// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';
import IdeasLevelMobile from './ideasLevelMobile';
import { SMALL_SCREEN_WIDTH } from '../../../constants';

type Props = {
  rootIdeaId: string,
  ideas: Array<Idea>,
  identifier: string,
  phaseId: string
};

type State = {
  selectedIdeasId: Array<string>,
  selectedIdeaIndex: number,
  ideaLevel: number,
  goBack: boolean
};

const PageTitle = () => (
  <div className="title-section">
    <div className="title-hyphen">&nbsp;</div>
    <h1 className="dark-title-1">
      <Translate value="debate.survey.themesTitle" />
    </h1>
  </div>
);

class Ideas extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { rootIdeaId } = this.props;
    this.state = { selectedIdeasId: [rootIdeaId], selectedIdeaIndex: 0, ideaLevel: 0, goBack: false };
  }

  setSelectedIdeas = (selectedIdeaId: string, ideaLevel: number, ideaIndex: number) => {
    const { selectedIdeasId } = this.state;
    const nbLevel = selectedIdeasId.length;
    const ideasArray = selectedIdeasId;
    this.setState({ selectedIdeaIndex: ideaIndex, ideaLevel: ideaLevel });
    if (ideasArray.indexOf(selectedIdeaId) <= -1 && ideaLevel === nbLevel) {
      ideasArray.push(selectedIdeaId);
      this.setState({
        selectedIdeasId: ideasArray
      });
    } else if (ideaLevel < nbLevel) {
      const nbToRemove = selectedIdeasId.length - ideaLevel;
      ideasArray.splice(ideaLevel, nbToRemove, selectedIdeaId);
      this.setState({
        selectedIdeasId: ideasArray
      });
    }
  };

  getIdeaChildren = (selectedIdeaId: string) => {
    const { ideas } = this.props;
    return ideas.filter(idea => idea.parentId === selectedIdeaId);
  };

  getIdeaParents = (ideaLevel: number) => {
    const { ideas } = this.props;
    const { selectedIdeasId } = this.state;
    const ancestor = selectedIdeasId[ideaLevel];
    return ideas.filter(idea => ancestor === idea.ancestors[0]);
  };

  goBackToParents = () => {
    const { selectedIdeasId, ideaLevel } = this.state;
    const ideasArray = selectedIdeasId;
    ideasArray.pop();
    this.setState({
      selectedIdeasId: ideasArray,
      goBack: true,
      ideaLevel: ideaLevel - 1,
      selectedIdeaIndex: 0
    });
    const slider = document.getElementById(`slider-${ideaLevel}`);
    if (slider) slider.scrollLeft = 0;
  };

  render() {
    const isMobile = window.innerWidth < SMALL_SCREEN_WIDTH;
    const { identifier, phaseId } = this.props;
    const { ideaLevel, selectedIdeasId, selectedIdeaIndex, goBack } = this.state;
    return (
      <section className={classnames('themes-section', 'ideas-section', { 'mobile-ideas-section': isMobile })}>
        <Grid fluid className={classnames('background-grey', { 'no-padding': isMobile })}>
          <div className="max-container">
            {!isMobile && <PageTitle />}
            {isMobile && ideaLevel === 0 && <PageTitle />}
            {isMobile &&
              ideaLevel > 0 && (
                <div className="ideas-back-arrow" onClick={this.goBackToParents}>
                  <span className="assembl-icon-down-small color" />
                </div>
              )}
            <div className={classnames('content-section', { 'mobile-content-section': isMobile })}>
              {!isMobile
                ? selectedIdeasId.map((ideaId, index) => (
                  <IdeasLevel
                    key={`ideas-level-${index}`}
                    ideas={this.getIdeaChildren(ideaId)}
                    identifier={identifier}
                    phaseId={phaseId}
                    setSelectedIdeas={this.setSelectedIdeas}
                    nbLevel={selectedIdeasId.length}
                    ideaLevel={index + 1}
                    selectedIdeasId={selectedIdeasId}
                    selectedIdeaIndex={selectedIdeaIndex}
                  />
                ))
                : selectedIdeasId.map((ideaId, index) => (
                  <IdeasLevelMobile
                    key={`ideas-level-${index}`}
                    ideas={goBack ? this.getIdeaParents(index) : this.getIdeaChildren(ideaId)}
                    identifier={identifier}
                    phaseId={phaseId}
                    setSelectedIdeas={this.setSelectedIdeas}
                    ideaLevel={index + 1}
                    selectedIdeasId={selectedIdeasId}
                    nbLevel={selectedIdeasId.length}
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