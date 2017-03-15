import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import gql from 'graphql-tag';
import { Grid, Row, Col } from 'react-bootstrap';
import Loader from '../common/loader';
import ThematicPreview from '../common/thematicPreview';

class Survey extends React.Component {
  render() {
    const { ideas, loading } = this.props.data;
    return (
      <section className="themes-section">
        {loading && <Loader color="black" />}
        {ideas &&
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="debate.survey.themesTitle" />
                </h1>
              </div>
              <div className="content-section">
                <Row className="no-margin">
                  {ideas.map((idea, index) => {
                    return(
                      <div key={`thematic-${index}`} >
                        {idea.title &&
                          <Col xs={12} sm={6} md={3} className="no-padding">
                            <ThematicPreview bkgImgUrl={'/data/Discussion/6/documents/'+(421+index)+'/data'} nbPosts={idea.numPosts} nbContributors="12" link="" title={idea.title} description={idea.description} />
                          </Col>
                        }
                      </div>
                    )
                  })}
                </Row>
              </div>
            </div>
          </Grid>
        }
      </section>
    );
  }
}

Survey.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    error: React.PropTypes.object,
    thematics: React.PropTypes.object,
  }).isRequired,
};

const ThematicQuery = gql`
  query ThematicQuery($lang: String!) {
   ideas {
     ... on Thematic {
       id,
       title(lang: $lang),
       description,
       numPosts
     }
   }
  }
`;

const SurveyWithData = graphql(ThematicQuery, {
  options: ({ i18n }) => ({
    variables: {
      lang: i18n.locale
    }
  }),
})(Survey);

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(SurveyWithData);