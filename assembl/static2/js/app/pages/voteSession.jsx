import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import VoteSessionQuery from '../graphql/VoteSession.graphql';
import Header from '../components/common/header';
import Section from '../components/common/section';
import { getPhaseId } from '../utils/timeline';

const VoteSession = () => (
  <div className="votesession-page">
    <Header
      title="Phase de vote à la majorité"
      subtitle="Après 6 semaines, nous arrivons à une nouvelle phase: le vote."
      additionalHeaderClasses="left"
    />
    <Grid fluid>
      <Section title="Instructions" translate>
        {/* TODO: add translation */}
        <Row>
          <Col mdOffset={3} md={8} smOffset={1} sm={10}>
            <div>Instructions of the vote session</div>
          </Col>
        </Row>
      </Section>
    </Grid>
  </div>
);

const mapStateToProps = state => ({
  debate: state.debate,
  lang: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(VoteSessionQuery, {
    options: ({ debate }) => ({
      variables: { discussionPhaseId: getPhaseId(debate.debateData.timeline, 'voteSession') }
    }),
    props: ({ data, ownProps }) => {
      const defaultHeaderImage = ownProps.debate.debateData.headerBackgroundUrl || '';
      if (data.loading) {
        return {
          loading: true
        };
      }
      if (data.error) {
        return {
          hasErrors: true
        };
      }
      const { headerImage } = data.voteSession;
      return {
        headerImageUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage
      };
    }
  })
)(VoteSession);