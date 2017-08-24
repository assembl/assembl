import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import IdeasLevel from './ideasLevel';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    /*
    Definition of the selectedIdeas state variable:
    Each index of selectedIdeas corresponds to a level of ideas,
    and the value at this index is the id of the selected idea in this level.
    Empty string means no idea is selected in this level,
    which is always the case for the last element.
    */
    this.state = {
      selectedIdeas: [''],
      isInitialState: true
    };
    this.onSeeSubIdeasClick = this.onSeeSubIdeasClick.bind(this);
  }
  onSeeSubIdeasClick(ideaId, level) {
    const updatedSelectedIdeas = this.state.selectedIdeas.slice(0, level + 2);
    updatedSelectedIdeas[level] = ideaId;
    updatedSelectedIdeas[level + 1] = '';
    this.setState({ selectedIdeas: updatedSelectedIdeas });
    this.setState({ isInitialState: false });
  }
  render() {
    const { thematics, rootIdeaId, identifier } = this.props;
    const { selectedIdeas } = this.state;
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
              {selectedIdeas.map((selectedIdea, index) => {
                let listedIdeas = [];
                if (index === 0) {
                  listedIdeas = thematics.filter((idea) => {
                    return idea.parentId === rootIdeaId;
                  });
                } else {
                  const parentIdeaId = this.state.selectedIdeas[index - 1];
                  listedIdeas = thematics.filter((idea) => {
                    return idea.parentId === parentIdeaId;
                  });
                }
                return (
                  <IdeasLevel
                    thematics={listedIdeas}
                    identifier={identifier}
                    level={index}
                    key={listedIdeas.join(' ') + index}
                    selectedIdea={selectedIdea}
                    isInline={!this.state.isInitialState}
                    onSeeSubIdeasClick={this.onSeeSubIdeasClick}
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