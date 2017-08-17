import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import _filter from 'lodash/filter';
import IdeasLevel from './ideasLevel';

class Ideas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedIdeas: [''],
      isInitialState: true
    };
    this.onSeeSubIdeasClick = this.onSeeSubIdeasClick.bind(this);
  }
  onSeeSubIdeasClick(ideaId, level) {
    const updatedSelectedIdeas = this.state.selectedIdeas.slice();
    updatedSelectedIdeas[level] = ideaId;
    const len = updatedSelectedIdeas.length;
    if (len > 0 && updatedSelectedIdeas[len - 1] !== '') {
      updatedSelectedIdeas.push('');
    }
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
                  listedIdeas = _filter(thematics, (el) => {
                    return el.parentId === rootIdeaId;
                  });
                } else {
                  const parentIdeaId = this.state.selectedIdeas[index - 1];
                  listedIdeas = _filter(thematics, (el) => {
                    return el.parentId === parentIdeaId;
                  });
                }
                return (
                  <IdeasLevel
                    thematics={listedIdeas}
                    identifier={identifier}
                    level={index}
                    key={index}
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