// @flow
import * as React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';
import moment from 'moment';
import update from 'immutability-helper';
import debounce from 'lodash/debounce';
import get from 'lodash/get';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql';
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql';
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql';
import confirmExtractMutation from '../../graphql/mutations/confirmExtract.graphql';
import updateExtractTagsMutation from '../../graphql/mutations/updateExtractTags.graphql';
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';
import { getConnectedUserId, getConnectedUserName } from '../../utils/globalFunctions';
import AvatarImage from '../common/avatarImage';
import TaxonomyOverflowMenu from './taxonomyOverflowMenu';
import FormControlWithLabel from '../common/formControlWithLabel';
import { displayAlert, displayModal, closeModal } from '../../utils/utilityManager';
import { connectedUserIsAdmin } from '../../utils/permissions';
import { editExtractTooltip, deleteExtractTooltip, nuggetExtractTooltip, qualifyExtractTooltip } from '../common/tooltips';
import { NatureIcons, ActionIcons, type Annotation } from '../../utils/extract';
import { ExtractStates, harvestingColorsMapping, EMPTY_EXTRACT_BODY } from '../../constants';
import Tags, { type TagsData } from './tags';
import TagsForm from './tagsForm';

import { addTaxonomy } from '../../actions/taxonomyActions';

type Props = {
  extracts?: Array<Extract>,
  postId: string,
  contentLocale: string,
  lang?: string,
  annotation: ?Annotation,
  harvestingDate?: string,
  isAuthorAccountDeleted?: boolean,
  showNuggetAction?: boolean,
  displayHarvestingBox: boolean,
  activeExtractIndex: number,
  onAdd: (extractIndex: number) => void,
  setHarvestingBoxDisplay: Function,
  cancelHarvesting: Function,
  addPostExtract: Function,
  updateExtract: Function,
  confirmExtract: Function,
  deleteExtract: Function,
  refetchPost: Function,
  toggleExtractsBox?: Function,
  updateTags: Function,
  onAddTaxonomy: Function
};

type State = {
  currentExtractIndex: number,
  disabled: boolean,
  extractIsValidated: boolean,
  isNugget: boolean,
  isEditable: boolean,
  editableExtract: string,
  extractNature: ?string,
  extractAction: ?string,
  menuTarget: HTMLElement | null,
  overflowMenu: ?HTMLElement,
  overflowMenuTop: number
};

type Taxonomies = {
  nature: ?string,
  action: ?string
};

type UpdateTags = {
  postId: string,
  id: string,
  tags: Array<string>
};

const ACTIONS = {
  create: 'create', // create a new extract
  edit: 'edit', // edit an extract
  confirm: 'confirm' // confirm a submitted extract
};

// TODO define stargateParams type
const heyStargate = (stargateParams: any, onAddTaxonomy: Function) => {
  onAddTaxonomy(stargateParams);
};

function updateTagsMutation({ mutate }) {
  return ({ postId, id, tags }: UpdateTags) =>
    mutate({
      variables: {
        id: id,
        tags: tags
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateExtractTags: {
          __typename: 'UpdateExtractTags',
          tags: tags.map(tag => ({ __typename: 'Tag', value: tag, id: tag }))
        }
      },
      updateQueries: {
        // Update the Post query
        Post: (prev, { queryVariables, mutationResult }) => {
          if (queryVariables.id !== postId) return false;
          const currentExtract = prev.post.extracts.filter(ex => ex.id === id)[0];
          if (!currentExtract) return false;
          const indexExtract = prev.post.extracts.indexOf(currentExtract);
          const newExtract = update(currentExtract, {
            tags: { $set: mutationResult.data.updateExtractTags.tags }
          });
          return update(prev, {
            post: {
              extracts: {
                $splice: [[indexExtract, 1, newExtract]]
              }
            }
          });
        }
      }
    });
}

class DumbHarvestingBox extends React.Component<Props, State> {
  menu: any;

  actions: any;

  static defaultProps = {
    activeExtractIndex: 0,
    harvestingDate: null,
    isAuthorAccountDeleted: false,
    showNuggetAction: true
  };

  constructor(props: Props) {
    super(props);
    const { extracts, cancelHarvesting, activeExtractIndex } = this.props;
    const hasExtracts = extracts ? extracts.length > 0 : false;
    const extract = this.getCurrentExtractByIndex(activeExtractIndex);
    const isNugget = extract ? extract.important : false;
    this.state = {
      currentExtractIndex: activeExtractIndex,
      disabled: !hasExtracts,
      extractIsValidated: hasExtracts,
      isNugget: isNugget,
      isEditable: false,
      editableExtract: extract ? extract.body : '',
      extractNature: extract && extract.extractNature ? extract.extractNature.split('.')[1] : null,
      extractAction: extract && extract.extractAction ? extract.extractAction.split('.')[1] : null,
      menuTarget: null,
      overflowMenu: null,
      overflowMenuTop: 25
    };
    // actions props
    this.actions = {
      [ACTIONS.create]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: cancelHarvesting },
          { id: 'validate', title: 'harvesting.submit', className: 'button-submit', onClick: null }
        ]
      },
      [ACTIONS.edit]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: this.setEditMode },
          {
            id: 'validate',
            title: 'harvesting.submit',
            className: 'button-submit',
            onClick: this.updateHarvestingBody
          }
        ]
      },
      [ACTIONS.confirm]: {
        buttons: [
          { id: 'reject', title: 'harvesting.reject', className: 'button-cancel', onClick: this.deleteHarvesting },
          { id: 'confirm', title: 'harvesting.confirm', className: 'button-submit', onClick: this.confirmHarvesting }
        ]
      }
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.updateOverflowMenuPosition);
  }

  componentDidUpdate(prevProps: Props) {
    const { activeExtractIndex } = this.props;
    if (activeExtractIndex !== prevProps.activeExtractIndex) {
      this.goToExtract(activeExtractIndex);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateOverflowMenuPosition);
  }

  getCurrentExtractById = (extractId: string) => {
    const { extracts } = this.props;
    return extracts && extracts.length > 0 ? extracts.find(extract => extract.id === extractId) : null;
  };

  getCurrentExtractByIndex = (extractIndex: number) => {
    const { extracts } = this.props;
    return extracts && extracts.length > 0 ? extracts[extractIndex] : null;
  };

  setEditMode = (): void => {
    const { isEditable } = this.state;
    this.setState({ isEditable: !isEditable });
  };

  editExtract = (value: string): void => {
    this.setState({ editableExtract: value });
  };

  qualifyExtract = (taxonomies: Taxonomies): void => {
    this.setState({ menuTarget: null });
    const { nature, action } = taxonomies;
    const { updateExtract, refetchPost, onAddTaxonomy } = this.props;
    const { isNugget, currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const variables = {
      extractId: extract ? extract.id : null,
      important: isNugget,
      extractNature: nature,
      extractAction: action
    };
    displayAlert('success', I18n.t('loading.wait'));
    updateExtract({ variables: variables })
      .then(() => {
        this.setState({ extractNature: nature, extractAction: action });
        displayAlert('success', I18n.t('harvesting.harvestingSuccess'));
        refetchPost();

        const colorsOf = get(harvestingColorsMapping, nature, null);
        const stargateParams = {
          idea_title: extract ? extract.body : EMPTY_EXTRACT_BODY,
          parent_idea_id: 1307052139,
          map_id: 1307052139,
          text_color: colorsOf.text.replace('#', ''),
          background_color: colorsOf.background.replace('#', '')
        };
        heyStargate(stargateParams, onAddTaxonomy);
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  updateHarvestingNugget = (): void => {
    const { updateExtract, refetchPost } = this.props;
    const { isNugget, extractNature, extractAction, currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const variables = {
      extractId: extract ? extract.id : null,
      important: !isNugget,
      extractNature: extractNature,
      extractAction: extractAction
    };
    displayAlert('success', I18n.t('loading.wait'));
    updateExtract({ variables: variables })
      .then(() => {
        this.setState({
          isNugget: !isNugget
        });
        displayAlert('success', I18n.t('harvesting.harvestingSuccess'));
        refetchPost();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  updateHarvestingBody = (): void => {
    const { updateExtract, refetchPost } = this.props;
    const { editableExtract, isNugget, extractNature, extractAction, currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const variables = {
      extractId: extract ? extract.id : null,
      body: editableExtract,
      important: isNugget,
      extractNature: extractNature,
      extractAction: extractAction
    };
    displayAlert('success', I18n.t('loading.wait'));
    updateExtract({ variables: variables })
      .then(() => {
        this.setState({
          isEditable: false
        });
        displayAlert('success', I18n.t('harvesting.harvestingSuccess'));
        refetchPost();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  confirmHarvestingDeletion = (): void => {
    const modalTitle = <Translate value="harvesting.deleteExtract" />;
    const body = <Translate value="harvesting.confirmDeleteExtract" />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button key="delete" onClick={this.deleteHarvesting} className="button-submit button-dark">
        <Translate value="validate" />
      </Button>
    ];
    return displayModal(modalTitle, body, true, footer);
  };

  deleteHarvesting = (): void => {
    const { deleteExtract, refetchPost } = this.props;
    const { currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const variables = {
      extractId: extract ? extract.id : null
    };
    closeModal();
    displayAlert('success', I18n.t('loading.wait'));
    deleteExtract({ variables: variables })
      .then(() => {
        refetchPost().then(() => {
          displayAlert('success', I18n.t('harvesting.harvestingDeleted'));
          this.changeCurrentExtract();
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  validateHarvesting = (data: TagsData): void => {
    const { postId, annotation, contentLocale, lang, addPostExtract, setHarvestingBoxDisplay, refetchPost, onAdd } = this.props;
    if (!annotation) {
      return;
    }
    const tags = data.tags.map(tag => tag.label);
    const variables = {
      contentLocale: contentLocale,
      postId: postId,
      important: false,
      lang: lang,
      tags: tags,
      ...annotation
    };
    displayAlert('success', I18n.t('loading.wait'));
    addPostExtract({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.harvestingValidated'));
        refetchPost().then(({ data: { post: { extracts } } }) => {
          this.setState({
            disabled: false,
            extractIsValidated: true
          });
          setHarvestingBoxDisplay();
          window.getSelection().removeAllRanges();
          if (onAdd) onAdd(extracts.length - 1);
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  confirmHarvesting = (): void => {
    const { confirmExtract, refetchPost } = this.props;
    const { currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const variables = {
      extractId: extract ? extract.id : null
    };
    closeModal();
    displayAlert('success', I18n.t('loading.wait'));
    confirmExtract({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.harvestingConfirmed'));
        refetchPost();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  showValidatedHarvesting = (nature: ?string, action: ?string) => {
    if (nature && action) {
      return (
        <div className="harvesting-taxonomy-label">
          {`${I18n.t(`search.taxonomy_nature.${nature}`)} + ${I18n.t(`search.taxonomy_action.${action}`)}`}
        </div>
      );
    } else if (nature) {
      return <div className="harvesting-taxonomy-label">{I18n.t(`search.taxonomy_nature.${nature}`)}</div>;
    }
    return action ? <div className="harvesting-taxonomy-label">{I18n.t(`search.taxonomy_action.${action}`)}</div> : null;
  };

  updateOverflowMenu = (node: HTMLElement) => {
    if (node) {
      this.setState({ overflowMenu: node });
    }
  };

  updateOverflowMenuPosition = debounce(() => {
    const { overflowMenu } = this.state;
    if (overflowMenu) {
      const height = overflowMenu.clientHeight;
      const bottomScroll = window.pageYOffset + height;
      const windowHeight = document.body && document.body.scrollHeight;
      const isBottomReached = windowHeight && bottomScroll >= windowHeight - window.innerHeight;
      if (isBottomReached) {
        this.setState({ overflowMenuTop: -320 });
      } else {
        this.setState({ overflowMenuTop: 25 });
      }
    }
  }, 100);

  changeCurrentExtract = (step: ?number): void => {
    const { currentExtractIndex } = this.state;
    const idx = step ? currentExtractIndex + step : 0;
    this.goToExtract(idx);
  };

  goToExtract = (idx: number): void => {
    const extract = this.getCurrentExtractByIndex(idx);
    const isNugget = extract ? extract.important : false;
    this.setState({
      currentExtractIndex: idx,
      isNugget: isNugget,
      extractNature: extract && extract.extractNature ? extract.extractNature.split('.')[1] : null,
      extractAction: extract && extract.extractAction ? extract.extractAction.split('.')[1] : null,
      editableExtract: extract ? extract.body : '',
      menuTarget: null
    });
  };

  updateTags = (tags: Array<string>, callback: () => void) => {
    const { currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    if (extract) {
      const { updateTags, postId } = this.props;
      // Update the extract tags with an optimistic response
      updateTags({
        postId: postId,
        id: extract.id,
        tags: tags
      })
        .then(callback)
        .catch((error) => {
          displayAlert('danger', `${error}`);
        });
    }
  };

  renderFooter = () => {
    const { disabled, isEditable, currentExtractIndex } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const extractState = extract && extract.extractState;
    const isSubmitted = extractState === ExtractStates.SUBMITTED;
    const actionId = isEditable ? ACTIONS.edit : (disabled && ACTIONS.create) || (isSubmitted && ACTIONS.confirm);
    if (!actionId) return null;
    const action = this.actions[actionId];
    if (disabled) {
      // Render the Tags form only if it is the create action
      return (
        <TagsForm
          onSubmit={this.validateHarvesting}
          renderFooter={({ handleSubmit }) => (
            <div className="harvesting-box-footer">
              {action.buttons.map(button => (
                <Button key={button.id} className={`${button.className} button-dark`} onClick={button.onClick || handleSubmit}>
                  {I18n.t(button.title)}
                </Button>
              ))}
            </div>
          )}
        />
      );
    }
    return (
      <div className="harvesting-box-footer">
        {action.buttons.map(button => (
          <Button key={button.id} className={`${button.className} button-dark`} onClick={button.onClick}>
            {I18n.t(button.title)}
          </Button>
        ))}
      </div>
    );
  };

  render() {
    const {
      annotation,
      contentLocale,
      harvestingDate,
      isAuthorAccountDeleted,
      showNuggetAction,
      extracts,
      toggleExtractsBox,
      displayHarvestingBox,
      cancelHarvesting
    } = this.props;
    const {
      disabled,
      extractIsValidated,
      isNugget,
      isEditable,
      editableExtract,
      extractNature,
      extractAction,
      menuTarget,
      overflowMenuTop,
      currentExtractIndex
    } = this.state;
    const extract = this.getCurrentExtractByIndex(currentExtractIndex);
    const selectionText = annotation ? annotation.body : '';
    const harvesterUserName =
      extract && extract.creator && extract.creator.displayName ? extract.creator.displayName : getConnectedUserName();
    const extractState = extract && extract.extractState;
    const isSubmitted = extractState === ExtractStates.SUBMITTED;
    const userName = isAuthorAccountDeleted ? I18n.t('deletedUser') : harvesterUserName;
    const harvesterUserId = extract && extract.creator && extract.creator.userId ? extract.creator.userId : getConnectedUserId();
    const menuDisabled = disabled || isSubmitted;
    const hasFooter = disabled || isEditable || isSubmitted;
    const tags = extract && extract.tags ? extract.tags.map(tag => tag.id) : [];
    tags.sort();
    return (
      <div className={isSubmitted ? 'submitted-harvesting' : ''}>
        <div>
          <div className="harvesting-close-button" onClick={displayHarvestingBox ? cancelHarvesting : toggleExtractsBox}>
            <span className="assembl-icon-cancel grey" />
          </div>
        </div>
        {(extractNature || extractAction) && (
          <div>
            <div className="box-icon">
              {extractNature && <NatureIcons qualifier={extractNature} />}
              {extractAction && !extractNature && <ActionIcons qualifier={extractAction} backgroundColor="#fff" color="#000" />}
            </div>
            {extractNature &&
              extractAction && (
                <div className="box-icon box-icon-2">
                  <ActionIcons qualifier={extractAction} backgroundColor="#fff" color="#000" />
                </div>
              )}
          </div>
        )}
        <div
          className={classnames('theme-box', 'harvesting-box', {
            'active-box': extractIsValidated
          })}
        >
          <div className="harvesting-box-header">
            {extracts && (
              <div className="extracts-nb-msg">
                <Translate count={extracts.length} value="harvesting.harvestedExtractNumbers" extractNumber={extracts.length} />
              </div>
            )}
            <div className="harvesting-status">
              {disabled ? (
                <div className="harvesting-in-progress">
                  <div className="harvesting-status-label">
                    <Translate value="harvesting.inProgress" />
                  </div>
                </div>
              ) : (
                <div>
                  {extractNature || extractAction ? (
                    <div className="validated-harvesting">{this.showValidatedHarvesting(extractNature, extractAction)}</div>
                  ) : (
                    !isSubmitted && (
                      <div className="validated-harvesting">
                        <div className="harvesting-status-label">
                          <Translate value="harvesting.validated" />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="button-bar">
              <OverlayTrigger placement="top" overlay={editExtractTooltip}>
                <Button disabled={menuDisabled} onClick={this.setEditMode} className={classnames({ active: isEditable })}>
                  <span className="assembl-icon-edit grey" />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={deleteExtractTooltip}>
                <Button disabled={menuDisabled} onClick={this.confirmHarvestingDeletion}>
                  <span className="assembl-icon-delete grey" />
                </Button>
              </OverlayTrigger>
              {showNuggetAction && (
                <OverlayTrigger placement="top" overlay={nuggetExtractTooltip}>
                  <Button
                    disabled={menuDisabled}
                    onClick={this.updateHarvestingNugget}
                    className={classnames({ active: isNugget })}
                  >
                    <span className="assembl-icon-pepite grey" />
                  </Button>
                </OverlayTrigger>
              )}
              <OverlayTrigger placement="top" overlay={qualifyExtractTooltip}>
                <Button
                  disabled={menuDisabled}
                  className="taxonomy-menu-btn"
                  onClick={(e) => {
                    this.setState({ menuTarget: !menuTarget ? e.target : null });
                  }}
                >
                  <span className="assembl-icon-ellipsis-vert grey" />
                </Button>
              </OverlayTrigger>
              {menuTarget && (
                <TaxonomyOverflowMenu
                  innerRef={this.updateOverflowMenu}
                  handleClick={this.qualifyExtract}
                  extractNature={extractNature}
                  extractAction={extractAction}
                  target={menuTarget}
                  onCloseClick={() => {
                    this.setState({ menuTarget: null });
                  }}
                  top={overflowMenuTop}
                />
              )}
            </div>
            <div className="profile">
              <AvatarImage userId={harvesterUserId} userName={userName} />
              <div className="harvesting-infos">
                <div className="username">{userName}</div>
                {extract &&
                  extract.creationDate && (
                    <div className="harvesting-date" title={extract.creationDate}>
                      {harvestingDate ||
                        moment(extract.creationDate)
                          .locale(contentLocale)
                          .fromNow()}
                    </div>
                  )}
                {!extract && (
                  <div className="harvesting-date">
                    <Translate value="harvesting.now" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {isSubmitted && (
            <div className="harvesting-submitted-message">
              <span className="confirm-harvest-button assembl-icon-catch" />
              <Translate value="harvesting.harvestingSubmitted" />
            </div>
          )}
          <div className="harvesting-box-body">
            {extract &&
              !isEditable && (
                <div className="body-container">
                  <div className="previous-extract">
                    {currentExtractIndex > 0 && (
                      <div
                        onClick={() => {
                          this.changeCurrentExtract(-1);
                        }}
                      >
                        <span className="assembl-icon-angle-left grey" />
                      </div>
                    )}
                  </div>
                  <div className="extract-body">{extract.body}</div>
                  <div className="next-extract">
                    {extracts &&
                      currentExtractIndex < extracts.length - 1 && (
                        <div
                          onClick={() => {
                            this.changeCurrentExtract(1);
                          }}
                        >
                          <span className="assembl-icon-angle-right grey" />
                        </div>
                      )}
                  </div>
                </div>
              )}

            {extract && isEditable ? (
              <FormControlWithLabel
                label=""
                componentClass="textarea"
                className="text-area"
                value={editableExtract}
                onChange={e => this.editExtract(e.target.value)}
              />
            ) : null}
            {!extract && selectionText ? <div className="selection-body">{selectionText}</div> : null}
          </div>
          {extracts &&
            extracts.length > 1 && (
              <div className="extracts-numbering">
                {currentExtractIndex + 1}/{extracts.length}
              </div>
            )}
          {extract && !hasFooter ? (
            <Tags
              canEdit={connectedUserIsAdmin()}
              key={extract.id + tags.join('')}
              contextId={extract.id}
              initialValues={extract.tags ? extract.tags.map(tag => ({ value: tag.id, label: tag.value })) : []}
              updateTags={this.updateTags}
            />
          ) : null}
          {hasFooter ? this.renderFooter() : null}
        </div>
      </div>
    );
  }
}

export { DumbHarvestingBox };

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  onAddTaxonomy: taxonomy => dispatch(addTaxonomy(taxonomy))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(addPostExtractMutation, {
    name: 'addPostExtract'
  }),
  graphql(updateExtractMutation, {
    name: 'updateExtract'
  }),
  graphql(deleteExtractMutation, {
    name: 'deleteExtract'
  }),
  graphql(confirmExtractMutation, {
    name: 'confirmExtract'
  }),
  graphql(updateExtractTagsMutation, {
    props: function (props) {
      return {
        updateTags: updateTagsMutation(props)
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbHarvestingBox);