// @flow
import React from 'react';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Map } from 'immutable';
import shuffle from 'lodash/shuffle';

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
import { getIfPhaseCompletedById } from '../utils/timeline';
import { promptForLoginOr, displayAlert, displayModal } from '../utils/utilityManager';
import { transformLinksInHtml } from '../utils/linkify';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import MessagePage from '../components/common/messagePage';

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
    numParticipants: number,
    participants: Array<?{|
      // The ID of the object.
      id: string,
      userId: number,
      displayName: ?string
    |}>
  |}
|};

type Props = {
  title: string,
  subTitle: string,
  seeCurrentVotes: boolean,
  headerImageUrl: string,
  instructionsSectionTitle: string,
  instructionsSectionContent: string,
  isPhaseCompleted: boolean,
  modules: Array<VoteSpecification>,
  propositionsSectionTitle: string,
  proposals: Array<Proposal>,
  randomProposals: Array<Proposal>,
  addGaugeVote: Function,
  addTokenVote: Function,
  refetchVoteSession: Function
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
    if (!this.props.isPhaseCompleted) {
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

  updateWindowWidth = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

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

  setAvailableTokensSticky = () => {
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
  };

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
    const { addTokenVote, addGaugeVote, refetchVoteSession } = this.props;
    this.setState({ submitting: true });
    this.state.userTokenVotes.forEach((voteSpecs, proposalId) => {
      voteSpecs.forEach((tokenCategories, voteSpecId) => {
        tokenCategories.forEach((voteValue, tokenCategoryId) => {
          addTokenVote({
            variables: {
              voteSpecId: voteSpecId,
              proposalId: proposalId,
              tokenCategoryId: tokenCategoryId,
              voteValue: voteValue
            }
          })
            .then(() => {
              displayModal(null, I18n.t('debate.voteSession.postSuccess'), true, null, null);
              refetchVoteSession();
            })
            .catch((error) => {
              displayAlert('danger', error.message);
            });
        });
      });
    });
    this.state.userGaugeVotes.forEach((voteSpecs, proposalId) => {
      voteSpecs.forEach((voteValue, voteSpecId) => {
        addGaugeVote({
          variables: {
            voteSpecId: voteSpecId,
            proposalId: proposalId,
            voteValue: voteValue
          }
        })
          .then(() => {
            displayModal(null, I18n.t('debate.voteSession.postSuccess'), true, null, null);
          })
          .catch((error) => {
            displayAlert('danger', error.message);
          });
      });
    });
  };

  getStatElements = () => {
    let numParticipations = 0;
    let participantsIds = [];
    this.props.proposals.forEach((p) => {
      participantsIds = participantsIds
        .concat(
          p.voteResults.participants.map((participant) => {
            if (participant) {
              return participant.id;
            }

            return null;
          })
        )
        .filter(item => item !== null);
      numParticipations += p.modules.reduce((acc, m) => acc + m.numVotes, 0);
    });

    const numParticipants = new Set(participantsIds).size;
    return [statParticipations(numParticipations), statParticipants(numParticipants)];
  };

  render() {
    const {
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
      isPhaseCompleted
    } = this.props;

    const { availableTokensSticky, windowWidth, hasChanged } = this.state;

    if (!title || title.length === 0) {
      return (
        <MessagePage
          title={I18n.t('debate.voteSession.noVoteSession.title')}
          text={I18n.t('debate.voteSession.noVoteSession.text')}
        />
      );
    }

    const tokenVoteModule = findTokenVoteModule(modules);
    const remainingTokensByCategory = this.getRemainingTokensByCategory(tokenVoteModule);
    const subTitleToShow = !isPhaseCompleted ? subTitle : I18n.t('debate.voteSession.isCompleted');
    const propositionsSectionTitleToShow = !isPhaseCompleted
      ? propositionsSectionTitle
      : I18n.t('debate.voteSession.voteResultsPlusTitle', { title: propositionsSectionTitle });

    return (
      <div className="votesession-page">
        <Header title={title} subtitle={subTitleToShow} imgUrl={headerImageUrl} type="voteSession">
          <HeaderStatistics statElements={this.getStatElements()} />
        </Header>
        {!isPhaseCompleted ? (
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
                  <div
                    dangerouslySetInnerHTML={{ __html: transformLinksInHtml(instructionsSectionContent) }}
                    className="vote-instructions"
                  />
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
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  timeline: state.timeline,
  debate: state.debate,
  lang: state.i18n.locale,
  isPhaseCompleted: getIfPhaseCompletedById(state.timeline, ownProps.phaseId)
});

export { DumbVoteSession };

export default compose(
  connect(mapStateToProps),
  graphql(VoteSessionQuery, {
    options: ({ lang, discussionPhaseId }) => ({
      variables: { discussionPhaseId: discussionPhaseId, lang: lang }
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

      if (!data.voteSession) {
        return {
          loading: data.loading,
          title: '',
          seeCurrentVotes: false,
          subTitle: '',
          headerImageUrl: '',
          instructionsSectionTitle: '',
          instructionsSectionContent: '',
          modules: [],
          propositionsSectionTitle: '',
          proposals: []
        };
      }

      const {
        title,
        subTitle,
        seeCurrentVotes,
        headerImage,
        instructionsSectionTitle,
        instructionsSectionContent,
        propositionsSectionTitle,
        modules, // we still need to get templates here for AvailableTokens component
        proposals
      } = data.voteSession;

      return {
        loading: data.loading,
        headerImageUrl: headerImage ? headerImage.externalUrl : defaultHeaderImage,
        title: title,
        seeCurrentVotes: seeCurrentVotes,
        subTitle: subTitle,
        instructionsSectionTitle: instructionsSectionTitle,
        instructionsSectionContent: instructionsSectionContent,
        propositionsSectionTitle: propositionsSectionTitle,
        modules: modules,
        proposals: proposals,
        randomProposals: shuffle(proposals),
        noVoteSession: false,
        refetchVoteSession: data.refetch
      };
    }
  }),
  graphql(AddGaugeVoteMutation, {
    name: 'addGaugeVote'
  }),
  graphql(AddTokenVoteMutation, {
    name: 'addTokenVote'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbVoteSession);