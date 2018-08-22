// @flow
import * as React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';
import moment from 'moment';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql';
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql';
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql';
import confirmExtractMutation from '../../graphql/mutations/confirmExtract.graphql';
import withLoadingIndicator from '../../components/common/withLoadingIndicator';
import { getConnectedUserId, getConnectedUserName } from '../../utils/globalFunctions';
import AvatarImage from '../common/avatarImage';
import TaxonomyOverflowMenu from './taxonomyOverflowMenu';
import FormControlWithLabel from '../common/formControlWithLabel';
import { displayAlert, displayModal, closeModal } from '../../utils/utilityManager';
import { editExtractTooltip, deleteExtractTooltip, nuggetExtractTooltip, qualifyExtractTooltip } from '../common/tooltips';
import { NatureIcons, ActionIcons } from '../../utils/extractQualifier';
import { ExtractStates } from '../../constants';

type Props = {
  extract: ?Extract,
  postId: string,
  contentLocale: string,
  lang?: string,
  selection: ?Object,
  setHarvestingBoxDisplay: Function,
  cancelHarvesting: Function,
  addPostExtract: Function,
  updateExtract: Function,
  confirmExtract: Function,
  deleteExtract: Function,
  refetchPost: Function,
  harvestingDate?: string,
  isAuthorAccountDeleted?: boolean,
  isMultiColumns?: boolean
};

type State = {
  disabled: boolean,
  extractIsValidated: boolean,
  isNugget: boolean,
  isEditable: boolean,
  editableExtract: string,
  extractNature: ?string,
  extractAction: ?string,
  showOverflowMenu: boolean,
  overflowMenu: ?HTMLElement,
  overflowMenuTop: number
};

type Taxonomies = {
  nature: ?string,
  action: ?string
};

const ACTIONS = {
  create: 'create', // create a new extract
  edit: 'edit', // edit an extract
  confirm: 'confirm' // confirm a submitted extract
};

class DumbHarvestingBox extends React.Component<Props, State> {
  menu: any;

  actions: any;

  static defaultProps = {
    harvestingDate: null,
    isAuthorAccountDeleted: false
  };

  constructor(props: Props) {
    super(props);
    const { extract, cancelHarvesting } = this.props;
    const isExtract = extract !== null;
    const isNugget = extract ? extract.important : false;
    this.state = {
      disabled: !isExtract,
      extractIsValidated: isExtract,
      isNugget: isNugget,
      isEditable: false,
      editableExtract: extract ? extract.body : '',
      extractNature: extract && extract.extractNature ? extract.extractNature.split('.')[1] : null,
      extractAction: extract && extract.extractAction ? extract.extractAction.split('.')[1] : null,
      showOverflowMenu: false,
      overflowMenu: null,
      overflowMenuTop: 25
    };
    // actions props
    this.actions = {
      [ACTIONS.create]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: cancelHarvesting },
          { id: 'validate', title: 'common.attachFileForm.submit', className: 'button-submit', onClick: this.validateHarvesting }
        ]
      },
      [ACTIONS.edit]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: this.setEditMode },
          {
            id: 'validate',
            title: 'common.attachFileForm.submit',
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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateOverflowMenuPosition);
  }

  setEditMode = (): void => {
    const { isEditable } = this.state;
    this.setState({ isEditable: !isEditable });
  };

  editExtract = (value: string): void => {
    this.setState({ editableExtract: value });
  };

  qualifyExtract = (taxonomies: Taxonomies): void => {
    this.setState({ showOverflowMenu: false });
    const { nature, action } = taxonomies;
    const { extract, updateExtract, refetchPost } = this.props;
    const { isNugget } = this.state;
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
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  updateHarvestingNugget = (): void => {
    const { extract, updateExtract, refetchPost } = this.props;
    const { isNugget, extractNature, extractAction } = this.state;
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
    const { extract, updateExtract, refetchPost } = this.props;
    const { editableExtract, isNugget, extractNature, extractAction } = this.state;
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
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };

  deleteHarvesting = (): void => {
    const { extract, deleteExtract, refetchPost } = this.props;
    const variables = {
      extractId: extract ? extract.id : null
    };
    closeModal();
    displayAlert('success', I18n.t('loading.wait'));
    deleteExtract({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.harvestingDeleted'));
        refetchPost();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  validateHarvesting = (): void => {
    const { postId, selection, contentLocale, lang, addPostExtract, setHarvestingBoxDisplay, refetchPost } = this.props;
    if (!selection) {
      return;
    }
    const selectionText = selection.toString();
    const annotatorRange = ARange.sniff(selection.getRangeAt(0));
    if (!annotatorRange) {
      return;
    }
    const serializedAnnotatorRange = annotatorRange.serialize(document, 'annotation');
    if (!serializedAnnotatorRange) {
      return;
    }
    const variables = {
      contentLocale: contentLocale,
      postId: postId,
      body: selectionText,
      important: false,
      lang: lang,
      xpathStart: serializedAnnotatorRange.start,
      xpathEnd: serializedAnnotatorRange.end,
      offsetStart: serializedAnnotatorRange.startOffset,
      offsetEnd: serializedAnnotatorRange.endOffset
    };
    displayAlert('success', I18n.t('loading.wait'));
    addPostExtract({ variables: variables })
      .then(() => {
        this.setState({
          disabled: false,
          extractIsValidated: true
        });
        setHarvestingBoxDisplay();
        window.getSelection().removeAllRanges();
        refetchPost();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  confirmHarvesting = (): void => {
    const { extract, confirmExtract, refetchPost } = this.props;
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

  updateOverflowMenuPosition = () => {
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
  };

  renderFooter = () => {
    const { extract } = this.props;
    const { disabled, isEditable } = this.state;
    const extractState = extract && extract.extractState;
    const isSubmitted = extractState === ExtractStates.SUBMITTED;
    const actionId = isEditable ? ACTIONS.edit : (disabled && ACTIONS.create) || (isSubmitted && ACTIONS.confirm);
    if (!actionId) return null;
    const action = this.actions[actionId];
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
    const { selection, extract, contentLocale, harvestingDate, isAuthorAccountDeleted, isMultiColumns } = this.props;
    const {
      disabled,
      extractIsValidated,
      isNugget,
      isEditable,
      editableExtract,
      extractNature,
      extractAction,
      showOverflowMenu,
      overflowMenuTop
    } = this.state;
    const isExtract = extract !== null;
    const selectionText = selection ? selection.toString() : '';
    const harvesterUserName =
      extract && extract.creator && extract.creator.displayName ? extract.creator.displayName : getConnectedUserName();
    const extractState = extract && extract.extractState;
    const isSubmitted = extractState === ExtractStates.SUBMITTED;
    const userName = isAuthorAccountDeleted ? I18n.t('deletedUser') : harvesterUserName;
    const harvesterUserId = extract && extract.creator && extract.creator.userId ? extract.creator.userId : getConnectedUserId();
    const menuDisabled = disabled || isSubmitted;
    const hasFooter = disabled || isEditable || isSubmitted;
    return (
      <div className={isSubmitted ? 'submitted-harvesting' : ''}>
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
              {!isMultiColumns && (
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
                  onClick={() => {
                    this.setState({ showOverflowMenu: !showOverflowMenu });
                  }}
                >
                  <span className="assembl-icon-ellipsis-vert grey" />
                </Button>
              </OverlayTrigger>
              {showOverflowMenu && (
                <TaxonomyOverflowMenu
                  innerRef={this.updateOverflowMenu}
                  handleClick={this.qualifyExtract}
                  extractNature={extractNature}
                  extractAction={extractAction}
                  onCloseClick={() => {
                    this.setState({ showOverflowMenu: false });
                  }}
                  top={overflowMenuTop}
                />
              )}
            </div>
            <div className="profile">
              <AvatarImage userId={harvesterUserId} userName={userName} />
              <div className="harvesting-infos">
                <div className="username">{userName}</div>
                {isExtract &&
                  extract &&
                  extract.creationDate && (
                    <div className="harvesting-date" title={extract.creationDate}>
                      {harvestingDate ||
                        moment(extract.creationDate)
                          .locale(contentLocale)
                          .fromNow()}
                    </div>
                  )}
                {!isExtract && (
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
            {isExtract && extract && !isEditable && <div>{extract.body}</div>}
            {isExtract &&
              extract &&
              isEditable && (
                <FormControlWithLabel
                  label=""
                  componentClass="textarea"
                  className="text-area"
                  value={editableExtract}
                  onChange={e => this.editExtract(e.target.value)}
                />
              )}
            {!isExtract && <div>{selectionText}</div>}
          </div>
          {hasFooter && this.renderFooter()}
        </div>
      </div>
    );
  }
}

export { DumbHarvestingBox };

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
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
  withLoadingIndicator()
)(DumbHarvestingBox);