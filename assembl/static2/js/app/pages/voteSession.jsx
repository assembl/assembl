// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import VoteSessionQuery from '../graphql/VoteSession.graphql';
import Header from '../components/common/header';
import Section from '../components/common/section';
import { getPhaseId } from '../utils/timeline';

type voteSessionPageProps = {
  title: string,
  subTitle: string,
  headerImageUrl: string,
  instructionsSectionTitle: string,
  instructionsSectionContent: string,
  propositionsSectionTitle: string
};

const VoteSession = ({
  title,
  subTitle,
  headerImageUrl,
  instructionsSectionTitle,
  instructionsSectionContent,
  propositionsSectionTitle
}: voteSessionPageProps) => (
  <div className="votesession-page">
    <Header title={title} subtitle={subTitle} imgUrl={headerImageUrl} additionalHeaderClasses="left" />
    <Grid fluid>
      <Section title={instructionsSectionTitle}>
        <Row>
          <Col mdOffset={3} md={8} smOffset={1} sm={10}>
            <div dangerouslySetInnerHTML={{ __html: instructionsSectionContent }} className="vote-instructions" />
            {/* INSÉRER LES JETONS ICI */}
          </Col>
        </Row>
      </Section>
      <Section title={propositionsSectionTitle}>
        <Row>
          <Col mdOffset={3} md={8} smOffset={1} sm={10}>
            {/* INSÉRER LES PROPOSITIONS ICI */}
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
        propositionsSectionTitle
      } = data.voteSession;
      return {
        headerImageUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage,
        title: title,
        subTitle: subTitle,
        instructionsSectionTitle: instructionsSectionTitle,
        instructionsSectionContent: instructionsSectionContent,
        propositionsSectionTitle: propositionsSectionTitle
      };
    }
  })
)(VoteSession);