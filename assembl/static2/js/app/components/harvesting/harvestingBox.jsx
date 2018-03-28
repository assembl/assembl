// @flow
import React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql';
import { displayAlert } from '../../utils/utilityManager';

type Props = {
  extract: ?Object, // TODO change type
  index: number,
  postId: string,
  contentLocale: string,
  selection: ?Object,
  cancelHarvesting: Function,
  addPostExtract: Function
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
    const { postId, selection, contentLocale, addPostExtract } = this.props;
    if (!selection) {
      return;
    }
    // console.log('selection', selection);
    const selectionText = selection.toString();
    // console.log('ARange', ARange);
    const annotatorRange = ARange.sniff(selection.getRangeAt(0));
    if (!annotatorRange) {
      return;
    }
    // console.log('annotatorRange', annotatorRange);
    const serializedAnnotatorRange = annotatorRange.serialize(document, 'annotation');
    if (!serializedAnnotatorRange) {
      return;
    }
    // console.log('serializedAnnotatorRange', serializedAnnotatorRange);

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
    // console.log('variables', variables);

    addPostExtract({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('debate.thread.postSuccess')); // TODO: use another i18n key
        this.setState({
          disabled: false,
          checkIsActive: true
        });
        window.getSelection().removeAllRanges();
        // TODO: should we refresh the view of the harvested message?
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { selection, cancelHarvesting, extract, index } = this.props;
    const { disabled, checkIsActive, isNugget } = this.state;
    const isExtract = extract !== null;
    const selectionText = selection ? selection.toString() : '';

    return (
      <div
        className={classnames('theme-box', 'harvesting-box', { 'active-box': checkIsActive })}
        style={{ marginTop: `${20 + 180 * index}px` }} // TODO fix the position
      >
        <div className="harvesting-box-header">
          <div className="profil">
            <span className="assembl-icon-profil grey" />
            <span className="username">Pauline Thomas</span>
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
        </div>
        <div className="harvesting-box-body">
          <div>
            {disabled ? (
              <div className="harvesting-in-progress">
                <span className="confirm-harvest-button assembl-icon-catch" />&nbsp;<Translate value="harvesting.inProgress" />
              </div>
            ) : (
              <div className="validated-harvesting">
                <span className="confirm-harvest-button assembl-icon-catch" />
                &nbsp;
                <Translate value="harvesting.validatedHarvesting" />
              </div>
            )}
          </div>
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

export default compose(connect(mapStateToProps), graphql(addPostExtractMutation, { name: 'addPostExtract' }))(HarvestingBox);