// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import VoteSessionQuery from '../graphql/VoteSession.graphql';
import Header from '../components/common/header';
import Section from '../components/common/section';
import AvailableTokens from '../components/voteSession/availableTokens';
import Proposals from '../components/voteSession/proposals';
import { getDomElementOffset } from '../utils/globalFunctions';
import { getPhaseId } from '../utils/timeline';
import withLoadingIndicator from '../components/common/withLoadingIndicator';

export type TokenCategory = {|
  id: string,
  totalNumber: number,
  typename: string,
  title: ?string,
  titleEntries: ?Array<?LangStringEntryInput>,
  color: ?string
|};

export type VoteSpecification =
  | tokenVoteSpecificationFragment
  | numberGaugeVoteSpecificationFragment
  | gaugeVoteSpecificationFragment;

export type Proposal = {|
  id: string,
  title: ?string,
  description: ?string,
  titleEntries: ?Array<?LangStringEntryInput>,
  descriptionEntries: ?Array<?LangStringEntryInput>,
  order: ?number,
  modules: ?Array<VoteSpecification>
|};

type Props = {
  title: string,
  subTitle: string,
  headerImageUrl: string,
  instructionsSectionTitle: string,
  instructionsSectionContent: string,
  modules: Array<VoteSpecification>,
  propositionsSectionTitle: string,
  proposals: Array<Proposal>
};

export type RemainingTokensByCategory = Map<string, number>;

export type TokenVotesForProposal = Map<string, number>;

export type UserTokenVotes = Map<string, TokenVotesForProposal>;

type State = {
  userTokenVotes: UserTokenVotes,
  availableTokensSticky: boolean
};

// $FlowFixMe: if voteType === 'token_vote_specification', we know it is a tokenVoteSpecificationFragment
type FindTokenVoteModule = (Array<VoteSpecification>) => ?tokenVoteSpecificationFragment;
export const findTokenVoteModule: FindTokenVoteModule = modules => modules.find(m => m.voteType === 'token_vote_specification');

class DumbVoteSession extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  availableTokensContainerRef: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      availableTokensSticky: false,
      userTokenVotes: Map()
    };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.setAvailableTokensSticky);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.setAvailableTokensSticky);
  }

  setAvailableTokensSticky = () => {
    if (this.availableTokensContainerRef) {
      const availableTokensDivOffset = getDomElementOffset(this.availableTokensContainerRef).top;
      if (availableTokensDivOffset <= window.scrollY) {
        this.setState({ availableTokensSticky: true });
      } else {
        this.setState({ availableTokensSticky: false });
      }
    }
  };

  voteForProposal = (proposalId: string, categoryId: string, value: number): void => {
    this.setState({
      userTokenVotes: this.state.userTokenVotes.setIn([proposalId, categoryId], value)
    });
  };

  getRemainingTokensByCategory: (?tokenVoteSpecificationFragment) => RemainingTokensByCategory = (module) => {
    let remainingTokensByCategory = Map();
    if (module && module.tokenCategories) {
      module.tokenCategories.forEach((category) => {
        if (category) {
          remainingTokensByCategory = remainingTokensByCategory.set(category.id, category.totalNumber);
        }
      });
    }
    const proposalsVotes = this.state.userTokenVotes.valueSeq().toList();
    remainingTokensByCategory = remainingTokensByCategory.mergeWith((x, y) => x - y, ...proposalsVotes);

    return remainingTokensByCategory;
  };

  setAvailableTokensRef = (el: HTMLDivElement) => {
    this.availableTokensContainerRef = el;
  };

  render() {
    const {
      title,
      subTitle,
      headerImageUrl,
      instructionsSectionTitle,
      instructionsSectionContent,
      propositionsSectionTitle,
      proposals,
      modules
    } = this.props;
    const tokenVoteModule = findTokenVoteModule(modules);
    const remainingTokensByCategory = this.getRemainingTokensByCategory(tokenVoteModule);
    return (
      <div className="votesession-page">
        <Header title={title} subtitle={subTitle} imgUrl={headerImageUrl} additionalHeaderClasses="left" />
        <Grid fluid>
          <Section
            title={instructionsSectionTitle}
            containerAdditionalClassNames={this.state.availableTokensSticky ? ['no-margin'] : null}
          >
            <Row>
              <Col
                mdOffset={!this.state.availableTokensSticky ? 3 : null}
                smOffset={!this.state.availableTokensSticky ? 1 : null}
                md={8}
                sm={10}
                className="no-padding"
              >
                <div dangerouslySetInnerHTML={{ __html: instructionsSectionContent }} className="vote-instructions" />
                {tokenVoteModule &&
                  tokenVoteModule.tokenCategories && (
                    <div ref={this.setAvailableTokensRef}>
                      <AvailableTokens
                        sticky={this.state.availableTokensSticky}
                        remainingTokensByCategory={remainingTokensByCategory}
                        tokenCategories={tokenVoteModule.tokenCategories}
                      />
                    </div>
                  )}
              </Col>
            </Row>
          </Section>
          <Section title={propositionsSectionTitle} className={this.state.availableTokensSticky ? 'extra-margin-top' : null}>
            <Row>
              <Col mdOffset={1} md={10} smOffset={1} sm={10}>
                <Proposals
                  modules={modules}
                  proposals={proposals}
                  remainingTokensByCategory={remainingTokensByCategory}
                  tokenVotes={this.state.userTokenVotes}
                  voteForProposal={this.voteForProposal}
                />
              </Col>
            </Row>
          </Section>
        </Grid>
      </div>
    );
  }
}

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