import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import ThematicPreview from '../common/thematicPreview';
import Loader from '../common/loader';
import { getConnectedUserId } from '../../utils/globalFunctions';
import { get, getContextual } from '../../utils/routeMap';

class Themes extends React.Component {
  render() {
    const { ideas, ideasLoading } = this.props.ideas;
    const { debateData } = this.props.debate;
    const slug = { slug: debateData.slug };
    const connectedUserId = getConnectedUserId();
    return (
      <section className="home-section themes-section">
        {ideasLoading && <Loader color="black" />}
        {ideas &&
          ideas.latestIdeas.length >= 2 &&
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.themesTitle" />
                </h1>
                <h5 className="dark-title-5 subtitle">
                  <Translate value="home.themesSubtitle" />
                </h5>
              </div>
              <div className="content-section">
                <Row className="no-margin">
                  {ideas.latestIdeas.map((idea, index) => {
                    return (
                      <Col
                        xs={12}
                        sm={24 / ideas.latestIdeas.length}
                        md={12 / ideas.latestIdeas.length}
                        className="theme no-padding"
                        key={index}
                      >
                        <ThematicPreview
                          imgUrl={idea.img ? idea.img.externalUrl : ''}
                          numPosts={idea.nbPosts}
                          numContributors={idea.nbContributors}
                          link={
                            connectedUserId
                              ? `${get('oldDebate', slug)}/idea/local:Idea/${idea.id}`
                              : `${getContextual('login', slug)}?next=${get('home', slug)}`
                          }
                          title={idea.title}
                          description={<p dangerouslySetInnerHTML={{ __html: idea.definition }} />}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </Grid>}
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    ideas: state.ideas
  };
};

export default connect(mapStateToProps)(Themes);