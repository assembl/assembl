// @flow
import React from 'react';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Map } from 'immutable';
import shuffle from 'lodash/shuffle';
import debounce from 'lodash/debounce';

import { renderRichtext } from '../utils/linkify';
import VoteSessionQuery from '../graphql/VoteSession.graphql';
import AddTokenVoteMutation from '../graphql/mutations/addTokenVote.graphql';
import AddGaugeVoteMutation from '../graphql/mutations/addGaugeVote.graphql';
import Header from '../components/common/header';
import HeaderStatistics, { statParticipants, statParticipations } from '../components/common/headerStatistics';
import Section from '../components/common/section';
import AvailableTokens from '../components/voteSession/availableTokens';
import Proposals from '../components/voteSession/proposals';
import ProposalsResults from '../components/voteSession/proposalsResults';
import { getDomElementOffset, isMobile } from '../utils/globalFunctions';
import { getIsPhaseCompletedById } from '../utils/timeline';
import { closeModal, displayAlert, displayModal, promptForLoginOr } from '../utils/utilityManager';
import { manageErrorOnly } from '../components/common/manageErrorAndLoading';
import Loader from '../components/common/loader';

export type TokenCategory = {|
  id: string,
  totalNumber: number,
  typename: string,
  title: ?string,
  titleEntries: ?Array<?LangStringEntryInput>,
  color: ?string
|};

export type TokenVoteSpecification = { ...tokenVoteSpecificationFragment, ...tokenVoteSpecificationResultsFragment };
export type NumberGaugeVoteSpecification = {
  ...numberGaugeVoteSpecificationFragment,
  ...numberGaugeVoteSpecificationResultsFragment
};
export type GaugeVoteSpecification = { ...gaugeVoteSpecificationFragment, ...gaugeVoteSpecificationResultsFragment };

export type VoteSpecification = TokenVoteSpecification | NumberGaugeVoteSpecification | GaugeVoteSpecification;

export type Proposal = {|
  id: string,
  title: ?string,
  description: ?string,
  titleEntries: ?Array<?LangStringEntryInput>,
  descriptionEntries: ?Array<?LangStringEntryInput>,
  order: ?number,
  modules: Array<VoteSpecification>,
  voteResults: {|
    numParticipants: number
  |}
|};

type Props = {
  addGaugeVote: Object => Promise<void>,
  addTokenVote: Object => Promise<void>,
  headerImageUrl: string,
  instructionsSectionContent: string,
  instructionsSectionTitle: string,
  id: string,
  isPhaseCompleted: boolean,
  lang: string,
  loading: boolean,
  modules: Array<VoteSpecification>,
  numParticipants: number,
  phaseId: string,
  proposals: Array<Proposal>,
  propositionsSectionTitle: string,
  randomProposals: Array<Proposal>,
  seeCurrentVotes: boolean,
  subTitle: string,
  title: string
};

export type RemainingTokensByCategory = Map<string, number>;

export type UserTokenVotesForVoteSpec = Map<string, number>; // key is tokenCategoryId
export type UserTokenVotesForProposal = Map<string, UserTokenVotesForVoteSpec>; // key is voteSpecId
export type UserGaugeVotesForProposal = Map<string, number>; // key is voteSpecId

export type UserTokenVotes = Map<string, UserTokenVotesForProposal>; // key is proposalId
export type UserGaugeVotes = Map<string, UserGaugeVotesForProposal>; // key is proposalId

type State = {
  submitting: boolean,
  availableTokensSticky: boolean,
  userTokenVotes: UserTokenVotes,
  userGaugeVotes: UserGaugeVotes,
  windowWidth: number,
  hasChanged: boolean
};

// $FlowFixMe: if voteType === 'token_vote_specification', we know it is a TokenVoteSpecification
type FindTokenVoteModule = (Array<VoteSpecification>) => ?TokenVoteSpecification;
export const findTokenVoteModule: FindTokenVoteModule = modules => modules.find(m => m.voteType === 'token_vote_specification');

// We sort the proposal modules by their voteSpecTemplateId to have the same order between proposals.
const moduleComparator = (module1, module2) => {
  if (!module1.voteSpecTemplateId || !module2.voteSpecTemplateId) {
    return -1;
  }
  if (module1.voteSpecTemplateId < module2.voteSpecTemplateId) {
    return -1;
  }
  if (module1.voteSpecTemplateId === module2.voteSpecTemplateId) {
    return 0;
  }
  return 1;
};

// $FlowFixMe: if voteType === 'gauge_vote_specification', we know it is a GaugeVoteSpecification
type FilterGaugeVoteModules = (Array<VoteSpecification>) => Array<GaugeVoteSpecification>;
export const filterGaugeVoteModules: FilterGaugeVoteModules = modules =>
  modules.filter(module => module.voteType === 'gauge_vote_specification').sort(moduleComparator);

// $FlowFixMe: if voteType === 'number_gauge_vote_specification', we know it is a NumberGaugeVoteSpecification
type FilterNumberGaugeVoteModules = (Array<VoteSpecification>) => Array<NumberGaugeVoteSpecification>;
export const filterNumberGaugeVoteModules: FilterNumberGaugeVoteModules = modules =>
  modules.filter(module => module.voteType === 'number_gauge_vote_specification').sort(moduleComparator);

class DumbVoteSession extends React.Component<Props, State> {
  availableTokensContainerRef: ?HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      submitting: true,
      hasChanged: false,
      availableTokensSticky: false,
      userTokenVotes: Map(),
      userGaugeVotes: Map(),
      windowWidth: window.innerWidth
    };
  }

  componentWillMount() {
    window.addEventListener('resize', this.updateWindowWidth);
    if (!this.props.isPhaseCompleted && !this.props.loading) {
      // When the VoteSession query was already done, we go to another page
      // and go back to the vote session page.
      window.addEventListener('scroll', this.setAvailableTokensSticky);
      this.setMyVotes();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.props.isPhaseCompleted && !this.props.loading && prevProps.loading) {
      window.addEventListener('scroll', this.setAvailableTokensSticky);
      this.setMyVotes();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowWidth);
    if (!this.props.isPhaseCompleted) {
      window.removeEventListener('scroll', this.setAvailableTokensSticky);
    }
  }

  updateWindowWidth = debounce(() => {
    this.setState({ windowWidth: window.innerWidth });
  }, 100);

  setMyVotes() {
    const { proposals } = this.props;
    let userTokenVotes = Map();
    let userGaugeVotes = Map();
    const propos = proposals || [];
    propos.forEach((proposal) => {
      const tokenModules = proposal.modules
        ? proposal.modules.filter(module => module.voteType === 'token_vote_specification')
        : [];
      const gaugeModules = proposal.modules
        ? proposal.modules.filter(module => module.voteType !== 'token_vote_specification')
        : [];
      tokenModules.forEach((tokenModule) => {
        tokenModule.myVotes.forEach((myVote) => {
          // $FlowFixMe: issue with generated type, myVote can be {} from the generated type, but not in reality.
          userTokenVotes = userTokenVotes.setIn([myVote.proposalId, tokenModule.id, myVote.tokenCategoryId], myVote.voteValue);
        });
      });
      gaugeModules.forEach((gaugeModule) => {
        gaugeModule.myVotes.forEach((myVote) => {
          // $FlowFixMe: issue with generated type, myVote can be {} from the generated type, but not in reality.
          userGaugeVotes = userGaugeVotes.setIn([myVote.proposalId, gaugeModule.id], myVote.selectedValue);
        });
      });
    });
    this.setState({
      userTokenVotes: userTokenVotes,
      userGaugeVotes: userGaugeVotes
    });
  }

  setAvailableTokensSticky = debounce(() => {
    if (this.availableTokensContainerRef && !isMobile.any()) {
      const availableTokensDivOffset = getDomElementOffset(this.availableTokensContainerRef).top;
      if (availableTokensDivOffset <= window.pageYOffset) {
        if (!this.state.availableTokensSticky) {
          // setting setState triggers a rerender even if the state doesn't change
          this.setState({ availableTokensSticky: true });
        }
      } else if (this.state.availableTokensSticky) {
        this.setState({ availableTokensSticky: false });
      }
    }
  }, 100);

  voteForProposalToken = (proposalId: string, tokenVoteModuleId: string, categoryId: string, value: number): void => {
    const setVote = () =>
      this.setState({
        userTokenVotes: this.state.userTokenVotes.setIn([proposalId, tokenVoteModuleId, categoryId], value),
        submitting: false,
        hasChanged: true
      });
    promptForLoginOr(setVote)();
  };

  voteForProposalGauge = (proposalId: string, voteSpecificationId: string, value: ?number): void => {
    const setVote = () =>
      this.setState({
        userGaugeVotes: this.state.userGaugeVotes.setIn([proposalId, voteSpecificationId], value),
        submitting: false,
        hasChanged: true
      });
    promptForLoginOr(setVote)();
  };

  getRemainingTokensByCategory: (?TokenVoteSpecification) => RemainingTokensByCategory = (module) => {
    let remainingTokensByCategory = Map();
    if (module && module.tokenCategories) {
      module.tokenCategories.forEach((category) => {
        if (category) {
          remainingTokensByCategory = remainingTokensByCategory.set(category.id, category.totalNumber);
        }
      });
    }
    this.state.userTokenVotes.forEach((voteSpecs) => {
      voteSpecs.forEach((tokenCategories) => {
        tokenCategories.forEach((voteValue, tokenCategoryId) => {
          remainingTokensByCategory = remainingTokensByCategory.updateIn([tokenCategoryId], val => val - voteValue);
        });
      });
    });
    return remainingTokensByCategory;
  };

  setAvailableTokensRef = (el: ?HTMLDivElement) => {
    this.availableTokensContainerRef = el;
  };

  submitVotes = () => {
    const { addGaugeVote, addTokenVote, id, lang } = this.props;
    const { userTokenVotes, userGaugeVotes } = this.state;
    this.setState({ submitting: true });
    const refetchQueries = [
      {
        query: VoteSessionQuery,
        variables: { ideaId: id, lang: lang }
      }
    ];
    const okButton = (
      <Button key="ok" onClick={closeModal} className="button-submit">
        OK
      </Button>
    );
    userTokenVotes.forEach((voteSpecs, proposalId) => {
      voteSpecs.forEach((tokenCategories, voteSpecId) => {
        tokenCategories.forEach((voteValue, tokenCategoryId) => {
          addTokenVote({
            refetchQueries: refetchQueries,
            variables: {
              voteSpecId: voteSpecId,
              proposalId: proposalId,
              tokenCategoryId: tokenCategoryId,
              voteValue: voteValue
            }
          })
            .then(() => {
              displayModal(null, I18n.t('debate.voteSession.postSuccess'), true, [okButton], null);
            })
            .catch((error) => {
              displayAlert('danger', error.message);
            });
        });
      });
    });
    userGaugeVotes.forEach((voteSpecs, proposalId) => {
      voteSpecs.forEach((voteValue, voteSpecId) => {
        addGaugeVote({
          refetchQueries: refetchQueries,
          variables: {
            voteSpecId: voteSpecId,
            proposalId: proposalId,
            voteValue: voteValue
          }
        })
          .then(() => {
            displayModal(null, I18n.t('debate.voteSession.postSuccess'), true, [okButton], null);
          })
          .catch((error) => {
            displayAlert('danger', error.message);
          });
      });
    });
  };

  getStatElements = () => {
    let numParticipations = 0;
    const numParticipants = this.props.numParticipants;
    this.props.proposals.forEach((p: Proposal) => {
      numParticipations += p.modules.reduce((acc, m) => acc + m.numVotes, 0);
    });
    return [statParticipations(numParticipations), statParticipants(numParticipants)];
  };

  render() {
    const {
      loading,
      title,
      seeCurrentVotes,
      subTitle,
      headerImageUrl,
      instructionsSectionTitle,
      instructionsSectionContent,
      propositionsSectionTitle,
      proposals,
      randomProposals,
      modules,
      isPhaseCompleted,
      phaseId
    } = this.props;

    const { availableTokensSticky, windowWidth, hasChanged } = this.state;
    const tokenVoteModule = findTokenVoteModule(modules);
    const remainingTokensByCategory = this.getRemainingTokensByCategory(tokenVoteModule);
    const subTitleToShow = !isPhaseCompleted ? subTitle : I18n.t('debate.voteSession.isCompleted');
    const propositionsSectionTitleToShow = !isPhaseCompleted
      ? propositionsSectionTitle
      : I18n.t('debate.voteSession.voteResultsPlusTitle', { title: propositionsSectionTitle });

    return (
      <div className="votesession-page">
        <Header title={title} subtitle={subTitleToShow} imgUrl={headerImageUrl} type="voteSession" phaseId={phaseId}>
          <HeaderStatistics statElements={this.getStatElements()} />
        </Header>
        {loading ? <Loader /> : null}
        {!loading && !isPhaseCompleted ? (
          <Grid fluid className="background-light">
            <Section title={instructionsSectionTitle} containerAdditionalClassNames={availableTokensSticky ? ['no-margin'] : ''}>
              <Row>
                <Col
                  mdOffset={!availableTokensSticky ? 3 : null}
                  smOffset={!availableTokensSticky ? 1 : null}
                  md={8}
                  sm={10}
                  className="no-padding"
                >
                  <div className="vote-instructions">{renderRichtext(instructionsSectionContent)}</div>
                  {tokenVoteModule &&
                    tokenVoteModule.tokenCategories && (
                      <div ref={this.setAvailableTokensRef}>
                        <AvailableTokens
                          sticky={availableTokensSticky}
                          remainingTokensByCategory={remainingTokensByCategory}
                          tokenCategories={tokenVoteModule.tokenCategories}
                          windowWidth={windowWidth}
                        />
                      </div>
                    )}
                </Col>
              </Row>
            </Section>
          </Grid>
        ) : null}
        {!loading ? (
          <Grid fluid className="background-grey">
            <Section title={propositionsSectionTitleToShow} className={availableTokensSticky ? 'extra-margin-top' : ''}>
              <Row>
                <Col mdOffset={1} md={10} smOffset={1} sm={10}>
                  {!isPhaseCompleted ? (
                    <Proposals
                      proposals={randomProposals}
                      remainingTokensByCategory={remainingTokensByCategory}
                      seeCurrentVotes={seeCurrentVotes}
                      userGaugeVotes={this.state.userGaugeVotes}
                      userTokenVotes={this.state.userTokenVotes}
                      voteForProposalToken={this.voteForProposalToken}
                      voteForProposalGauge={this.voteForProposalGauge}
                    />
                  ) : (
                    <ProposalsResults proposals={proposals} />
                  )}
                </Col>
              </Row>
              {!isPhaseCompleted ? (
                <Row className="form-actions center">
                  <Col mdOffset={1} md={10} smOffset={1} sm={10}>
                    {hasChanged ? (
                      <Button className="button-submit button-dark" onClick={this.submitVotes} disabled={this.state.submitting}>
                        <Translate value="debate.voteSession.submit" />
                      </Button>
                    ) : null}
                  </Col>
                </Row>
              ) : null}
            </Section>
          </Grid>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  timeline: state.timeline,
  debate: state.debate,
  lang: state.i18n.locale,
  isPhaseCompleted: ownProps.phaseId && getIsPhaseCompletedById(state.timeline, ownProps.phaseId)
});

export { DumbVoteSession };

export default compose(
  connect(mapStateToProps),
  graphql(VoteSessionQuery, {
    options: ({ lang, id }) => ({
      variables: { ideaId: id, lang: lang }
    }),
    props: ({ data, ownProps }) => {
      const minimalProps = {
        error: data.error,
        loading: data.loading,
        headerImageUrl: ownProps.headerImgUrl,
        title: ownProps.title,
        seeCurrentVotes: false,
        subTitle: ownProps.description,
        instructionsSectionTitle: ownProps.announcement.title,
        instructionsSectionContent: ownProps.announcement.body,
        propositionsSectionTitle: '',
        numParticipants: 0,
        modules: [],
        proposals: [],
        randomProposals: []
      };
      if (data.error || data.loading) {
        return minimalProps;
      }

      if (!data.voteSession) {
        return minimalProps;
      }
      const {
        seeCurrentVotes,
        propositionsSectionTitle,
        modules, // we still need to get templates here for AvailableTokens component
        numParticipants,
        proposals
      } = data.voteSession;
      return {
        error: data.error,
        loading: data.loading,
        headerImageUrl: ownProps.headerImgUrl,
        title: ownProps.title,
        seeCurrentVotes: seeCurrentVotes,
        subTitle: ownProps.description,
        instructionsSectionTitle: ownProps.announcement.title,
        instructionsSectionContent: ownProps.announcement.body,
        propositionsSectionTitle: propositionsSectionTitle,
        modules: modules,
        numParticipants: numParticipants,
        proposals: proposals,
        randomProposals: shuffle(proposals)
      };
    }
  }),
  graphql(AddGaugeVoteMutation, {
    name: 'addGaugeVote'
  }),
  graphql(AddTokenVoteMutation, {
    name: 'addTokenVote'
  }),
  manageErrorOnly
)(DumbVoteSession);