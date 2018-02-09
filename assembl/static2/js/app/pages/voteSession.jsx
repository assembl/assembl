// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import VoteSessionQuery from '../graphql/VoteSession.graphql';
import Header from '../components/common/header';
import Section from '../components/common/section';
import Proposals from '../components/voteSession/proposals';
import { getPhaseId } from '../utils/timeline';
import withLoadingIndicator from '../components/common/withLoadingIndicator';

type voteSessionPageProps = {
  title: string,
  subTitle: string,
  headerImageUrl: string,
  instructionsSectionTitle: string,
  instructionsSectionContent: string,
  modules: Array<Object>,
  propositionsSectionTitle: string,
  proposals: Array<Object>
};

const DumbVoteSession = ({
  title,
  subTitle,
  headerImageUrl,
  instructionsSectionTitle,
  instructionsSectionContent,
  propositionsSectionTitle,
  proposals,
  modules
}: voteSessionPageProps) => (
  <div className="votesession-page">
    <Header title={title} subtitle={subTitle} imgUrl={headerImageUrl} additionalHeaderClasses="left" />
    <Grid fluid>
      <Section title={instructionsSectionTitle}>
        <Row>
          <Col mdOffset={3} md={8} smOffset={1} sm={10}>
            <div dangerouslySetInnerHTML={{ __html: instructionsSectionContent }} className="vote-instructions" />
            {/* INSERT THE TOKENS HERE */}
          </Col>
        </Row>
      </Section>
      <Section title={propositionsSectionTitle}>
        <Row>
          <Col mdOffset={1} md={10} smOffset={1} sm={10}>
            <Proposals modules={modules} proposals={proposals} />
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

export { DumbVoteSession };

export default compose(
  connect(mapStateToProps),
  graphql(VoteSessionQuery, {
    options: ({ debate, lang }) => ({
      variables: { discussionPhaseId: getPhaseId(debate.debateData.timeline, 'voteSession'), lang: lang }
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
      const {
        title,
        subTitle,
        headerImage,
        instructionsSectionTitle,
        instructionsSectionContent,
        propositionsSectionTitle,
        modules, // TODO: remove this and use the modules from proposals
        proposals
      } = data.voteSession;

      return {
        loading: data.loading,
        headerImageUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage,
        title: title,
        subTitle: subTitle,
        instructionsSectionTitle: instructionsSectionTitle,
        instructionsSectionContent: instructionsSectionContent,
        propositionsSectionTitle: propositionsSectionTitle,
        modules: modules,
        proposals: proposals
      };
    }
  }),
  withLoadingIndicator()
)(DumbVoteSession);