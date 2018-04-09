// @flow
import React from 'react';
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
import withLoadingIndicator from '../../components/common/withLoadingIndicator';
import { getConnectedUserId, getConnectedUserName } from '../../utils/globalFunctions';
import AvatarImage from '../common/avatarImage';
import TaxonomyOverflowMenu from './taxonomyOverflowMenu';
import FormControlWithLabel from '../common/formControlWithLabel';
import { displayAlert, displayModal, closeModal } from '../../utils/utilityManager';
import { editExtractTooltip, deleteExtractTooltip, nuggetExtractTooltip, qualifyExtractTooltip } from '../common/tooltips';
import { NatureIcons, ActionIcons } from '../../utils/extractQualifier';

type Props = {
  extract: ?Extract,
  postId: string,
  contentLocale: string,
  selection: ?Object,
  setHarvestingBoxDisplay: Function,
  cancelHarvesting: Function,
  addPostExtract: Function,
  updateExtract: Function,
  deleteExtract: Function,
  refetchPost: Function,
  harvestingDate?: string
};

type State = {
  disabled: boolean,
  extractIsValidated: boolean,
  isNugget: boolean,
  isEditable: boolean,
  editableExtract: string,
  extractNature: ?string,
  extractAction: ?string
};

class DumbHarvestingBox extends React.Component<Object, Props, State> {
  props: Props;

  state: State;

  menu: any;

  static defaultProps = {
    harvestingDate: null
  };

  constructor(props: Props) {
    super(props);
    const { extract } = this.props;
    const isExtract = extract !== null;
    const isNugget = extract ? extract.important : false;
    this.state = {
      disabled: !isExtract,
      extractIsValidated: isExtract,
      isNugget: isNugget,
      isEditable: false,
      editableExtract: extract ? extract.body : '',
      extractNature: extract && extract.extractNature ? extract.extractNature.split('.')[1] : null,
      extractAction: extract && extract.extractAction ? extract.extractAction.split('.')[1] : null
    };
  }

  setEditMode = (): void => {
    const { isEditable } = this.state;
    this.setState({ isEditable: !isEditable });
  };

  editExtract = (value: string): void => {
    this.setState({ editableExtract: value });
  };

  qualifyExtract = (category: string, qualifier: string): void => {
    this.menu.hide();
    const { extract, updateExtract, refetchPost } = this.props;
    const { isNugget } = this.state;
    const variables = {
      extractId: extract ? extract.id : null,
      important: isNugget,
      extractNature: category === 'nature' ? qualifier : null,
      extractAction: category === 'action' ? qualifier : null
    };
    displayAlert('success', I18n.t('loading.wait'));
    updateExtract({ variables: variables })
      .then(() => {
        if (category === 'nature') {
          this.setState({ extractNature: qualifier, extractAction: null });
        } else if (category === 'action') {
          this.setState({ extractNature: null, extractAction: qualifier });
        }
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
    const { postId, selection, contentLocale, addPostExtract, setHarvestingBoxDisplay, refetchPost } = this.props;
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

  render() {
    const { selection, cancelHarvesting, extract, contentLocale, harvestingDate } = this.props;
    const { disabled, extractIsValidated, isNugget, isEditable, editableExtract, extractNature, extractAction } = this.state;
    const isExtract = extract !== null;
    const selectionText = selection ? selection.toString() : '';
    const harvesterUserName =
      extract && extract.creator && extract.creator.displayName ? extract.creator.displayName : getConnectedUserName();
    const harvesterUserId = extract && extract.creator && extract.creator.userId ? extract.creator.userId : getConnectedUserId();
    return (
      <div>
        {(extractNature || extractAction) && (
          <div className="box-icon">
            {extractNature ? <NatureIcons qualifier={extractNature} /> : null}
            {extractAction ? <ActionIcons qualifier={extractAction} backgroundColor="#fff" color="#000" /> : null}
          </div>
        )}
        <div className={classnames('theme-box', 'harvesting-box', { 'active-box': extractIsValidated })}>
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
                    <div className="validated-harvesting">
                      {extractNature && (
                        <div className="harvesting-taxonomy-label">{I18n.t(`search.taxonomy_nature.${extractNature}`)}</div>
                      )}
                      {extractAction && (
                        <div className="harvesting-taxonomy-label">{I18n.t(`search.taxonomy_action.${extractAction}`)}</div>
                      )}
                    </div>
                  ) : (
                    <div className="validated-harvesting">
                      <div className="harvesting-status-label">
                        <Translate value="harvesting.validated" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="button-bar">
              <OverlayTrigger placement="top" overlay={editExtractTooltip}>
                <Button disabled={disabled} onClick={this.setEditMode} className={classnames({ active: isEditable })}>
                  <span className="assembl-icon-edit grey" />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={deleteExtractTooltip}>
                <Button disabled={disabled} onClick={this.confirmHarvestingDeletion}>
                  <span className="assembl-icon-delete grey" />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={nuggetExtractTooltip}>
                <Button disabled={disabled} onClick={this.updateHarvestingNugget} className={classnames({ active: isNugget })}>
                  <span className="assembl-icon-pepite grey" />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                ref={(m) => {
                  this.menu = m;
                }}
                trigger="click"
                rootClose
                placement="right"
                overlay={TaxonomyOverflowMenu(this.qualifyExtract, extractNature, extractAction)}
              >
                <OverlayTrigger placement="top" overlay={qualifyExtractTooltip}>
                  <Button disabled={disabled} className="taxonomy-menu-btn">
                    <span className="assembl-icon-ellipsis-vert grey" />
                  </Button>
                </OverlayTrigger>
              </OverlayTrigger>
            </div>
            <div className="profile">
              <AvatarImage userId={harvesterUserId} userName={harvesterUserName} />
              <div className="harvesting-infos">
                <div className="username">{harvesterUserName}</div>
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
          <div className="harvesting-box-body">
            {isExtract && extract && !isEditable && <div>{extract.body}</div>}
            {isExtract &&
              extract &&
              isEditable && (
                <FormControlWithLabel
                  componentClass="textarea"
                  className="text-area"
                  value={editableExtract}
                  onChange={e => this.editExtract(e.target.value)}
                />
              )}
            {!isExtract && <div>{selectionText}</div>}
          </div>
          {(disabled || isEditable) && (
            <div className="harvesting-box-footer">
              <Button className="button-cancel button-dark" onClick={isEditable ? this.setEditMode : cancelHarvesting}>
                <Translate value="debate.confirmDeletionButtonCancel" />
              </Button>
              <Button
                className="button-submit button-dark"
                onClick={isEditable ? this.updateHarvestingBody : this.validateHarvesting}
              >
                <Translate value="common.attachFileForm.submit" />
              </Button>
            </div>
          )}
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
  withLoadingIndicator()
)(DumbHarvestingBox);