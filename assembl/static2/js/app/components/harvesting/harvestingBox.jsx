// @flow
import React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import moment from 'moment';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql';
import withLoadingIndicator from '../../components/common/withLoadingIndicator';
import { displayAlert } from '../../utils/utilityManager';
import { getConnectedUserId, getConnectedUserName } from '../../utils/globalFunctions';
import AvatarImage from '../common/avatarImage';

type Props = {
  extract: ?Extract,
  index: number,
  postId: string,
  contentLocale: string,
  selection: ?Object,
  cancelHarvesting: Function,
  addPostExtract: Function,
  displayHarvestingBox: Function
};

type State = {
  disabled: boolean,
  checkIsActive: boolean,
  isNugget: boolean
};

class HarvestingBox extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    const { extract } = this.props;
    const isExtract = extract !== null;
    const isNugget = extract ? extract.important : false;
    this.state = {
      disabled: !isExtract,
      checkIsActive: isExtract,
      isNugget: isNugget
    };
  }

  validateHarvesting = (): void => {
    const { postId, selection, contentLocale, addPostExtract, displayHarvestingBox } = this.props;
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

    addPostExtract({ variables: variables })
      .then(() => {
        this.setState({
          disabled: false,
          checkIsActive: true
        });
        displayHarvestingBox();
        window.getSelection().removeAllRanges();
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { selection, cancelHarvesting, extract, index, contentLocale } = this.props;
    const { disabled, checkIsActive, isNugget } = this.state;
    const isExtract = extract !== null;
    const selectionText = selection ? selection.toString() : '';
    const harvesterUserName =
      extract && extract.creator && extract.creator.displayName ? extract.creator.displayName : getConnectedUserName();
    const harvesterUserId = extract && extract.creator && extract.creator.userId ? extract.creator.userId : getConnectedUserId();

    return (
      <div
        className={classnames('theme-box', 'harvesting-box', { 'active-box': checkIsActive })}
        style={{ marginTop: `${20 + 180 * index}px` }} // TODO fix the position
      >
        <div className="harvesting-box-header">
          <div className="harvesting-status">
            {disabled ? (
              <div className="harvesting-in-progress">
                <span className="confirm-harvest-button assembl-icon-catch" />
                <div className="harvesting-status-label">
                  <Translate value="harvesting.inProgress" />
                </div>
              </div>
            ) : (
              <div className="validated-harvesting">
                <span className="confirm-harvest-button assembl-icon-catch" />
                <div className="harvesting-status-label">
                  <Translate value="harvesting.validatedHarvesting" />
                </div>
              </div>
            )}
          </div>
          <div className="button-bar">
            <Button disabled={disabled} className={classnames({ active: checkIsActive })}>
              <span className="assembl-icon-check grey" />
            </Button>
            <Button disabled={disabled}>
              <span className="assembl-icon-edit grey" />
            </Button>
            <Button disabled={disabled}>
              <span className="assembl-icon-delete grey" />
            </Button>
            <Button disabled={disabled} className={classnames({ active: isNugget })}>
              <span className="assembl-icon-pepite grey" />
            </Button>
          </div>
          <div className="profil">
            <AvatarImage userId={harvesterUserId} userName={harvesterUserName} />
            <div className="harvesting-infos">
              <div className="username">{harvesterUserName}</div>
              {isExtract &&
                extract &&
                extract.creationDate && (
                  <div className="harvesting-date" title={extract.creationDate}>
                    {moment(extract.creationDate)
                      .locale(contentLocale)
                      .fromNow()}
                  </div>
                )}
            </div>
          </div>
        </div>
        <div className="harvesting-box-body">
          {isExtract && extract && <div>{extract.body}</div>}
          {!isExtract && <div>{selectionText}</div>}
        </div>
        {disabled && (
          <div className="harvesting-box-footer">
            <Button className="button-submit button-dark" onClick={this.validateHarvesting}>
              <Translate value="common.attachFileForm.submit" />
            </Button>
            <Button className="button-cancel button-dark" onClick={cancelHarvesting}>
              <Translate value="debate.confirmDeletionButtonCancel" />
            </Button>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(addPostExtractMutation, {
    name: 'addPostExtract'
  }),
  withLoadingIndicator()
)(HarvestingBox);