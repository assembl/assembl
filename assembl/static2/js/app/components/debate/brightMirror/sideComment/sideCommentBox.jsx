// @flow
import * as React from 'react';
import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';
import moment from 'moment';
import activeHtml from 'react-active-html';
import { EditorState } from 'draft-js';

import addPostExtractMutation from '../../../../graphql/mutations/addPostExtract.graphql';
import addExtractCommentMutation from '../../../../graphql/mutations/addExtractComment.graphql';
import manageErrorAndLoading from '../../../../components/common/manageErrorAndLoading';
import { getConnectedUserId, getConnectedUserName } from '../../../../utils/globalFunctions';
import AvatarImage from '../../../common/avatarImage';
import { displayAlert } from '../../../../utils/utilityManager';
import { postBodyReplacementComponents } from '../../common/post/postBody';
import RichTextEditor from '../../../common/richTextEditor';
import { FICTION_COMMENT_MAX_LENGTH, COMMENT_BOX_OFFSET } from '../../../../constants';
import { convertContentStateToHTML, editorStateIsEmpty } from '../../../../utils/draftjs';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';

export type Props = {
  extracts: Array<FictionExtractFragment>,
  postId: string,
  submitting: boolean,
  contentLocale: string,
  lang?: string,
  selection?: ?Object,
  setCommentBoxDisplay: Function,
  cancelSubmit: Function,
  addPostExtract: Function,
  addExtractComment: Function,
  refetchPost: Function,
  toggleCommentsBox?: Function,
  clearHighlights: Function,
  position: Object,
  setPositionToExtract: Function
};

type State = {
  extractIndex: number,
  body: EditorState,
  submitting: boolean,
  selectionText: ?string,
  serializedAnnotatorRange: ?Object
};

const ACTIONS = {
  create: 'create', // create a new comment
  confirm: 'confirm' // confirm a comment
};

class DumbSideCommentBox extends React.Component<Props, State> {
  menu: any;

  actions: any;

  constructor(props: Props) {
    super(props);
    const { cancelSubmit, submitting, selection } = props;
    const annotatorRange = selection && ARange.sniff(selection.getRangeAt(0));

    this.state = {
      extractIndex: 0,
      body: EditorState.createEmpty(),
      submitting: submitting,
      selectionText: selection && selection.toString(),
      serializedAnnotatorRange: annotatorRange && annotatorRange.serialize(document, 'annotation')
    };

    // actions props
    this.actions = {
      [ACTIONS.create]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: cancelSubmit },
          { id: 'validate', title: 'common.attachFileForm.submit', className: 'button-submit', onClick: this.submit }
        ]
      }
    };
  }

  componentDidMount() {
    const { submitting } = this.state;
    if (submitting) this.wrapSelectedText();
  }

  wrapSelectedText = () => {
    const { selection } = this.props;
    if (selection && selection.toString().length > 0) {
      const selectionRange = selection.getRangeAt(0);
      const selectedText = selectionRange.extractContents();
      const span = document.createElement('span');
      span.classList.add('selection-highlight');
      span.appendChild(selectedText);
      selectionRange.insertNode(span);
    }
  };

  changeCurrentExtract = (step: ?number): void => {
    const { setPositionToExtract } = this.props;
    this.setState((prevState) => {
      const next = step ? prevState.extractIndex + step : 0;
      setPositionToExtract(this.getCurrentExtract(next));
      return {
        extractIndex: next
      };
    });
  };

  getCurrentExtract = (extractIndex: number) => {
    const { extracts } = this.props;
    return extracts && extracts.length > 0 ? extracts[extractIndex] : null;
  };

  submit = (): void => {
    const { postId, contentLocale, lang, addPostExtract, addExtractComment, setCommentBoxDisplay, refetchPost } = this.props;
    const { body, selectionText, serializedAnnotatorRange } = this.state;
    if (!selectionText || !serializedAnnotatorRange) {
      return;
    }

    const bodyIsEmpty = editorStateIsEmpty(body);
    if (bodyIsEmpty) {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
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
      .then((result) => {
        const postVars = {
          extractId: result.data.addPostExtract.extract.id,
          body: convertContentStateToHTML(body.getCurrentContent()),
          contentLocale: contentLocale
        };
        addExtractComment({ variables: postVars }).then(() => {
          this.setState({
            submitting: false
          });
          setCommentBoxDisplay();
          window.getSelection().removeAllRanges();
          displayAlert('success', I18n.t('harvesting.harvestingValidated'));
          refetchPost();
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  hightlightExtract = (extract: FictionExtractFragment) => {
    const { clearHighlights } = this.props;
    clearHighlights();
    const extractElement = document.getElementById(`${extract.id}`);
    if (extractElement) extractElement.classList.add('active-extract');
  };

  updateBody = (newValue: EditorState) => {
    this.setState({
      body: newValue
    });
  };

  renderFooter = () => {
    const { submitting } = this.state;
    const actionId = submitting ? ACTIONS.create : ACTIONS.confirm;
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
    const { contentLocale, extracts, cancelSubmit, position, toggleCommentsBox } = this.props;
    const { submitting, extractIndex, body } = this.state;
    const currentExtract = this.getCurrentExtract(extractIndex);
    if (!submitting && currentExtract) {
      this.hightlightExtract(currentExtract);
    }

    const currentComment = currentExtract && currentExtract.comment;
    const commentUsername =
      currentComment && currentComment.creator && !currentComment.creator.isDeleted
        ? currentComment.creator.displayName
        : I18n.t('deletedUser');
    const userName = submitting ? getConnectedUserName() : commentUsername;
    const userId = submitting ? getConnectedUserId() : currentComment && currentComment.creator && currentComment.creator.userId;
    const renderRichtext = text => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());
    return (
      <div
        className={classnames('side-comment-box')}
        style={{
          top: `${position ? position.y : 0}px`,
          left: `${position ? position.x + COMMENT_BOX_OFFSET : 0}px`
        }}
      >
        <div className="arrow-left" />
        <div>
          <div className="harvesting-close-button" onClick={submitting ? cancelSubmit : toggleCommentsBox}>
            <span className="assembl-icon-cancel grey" />
          </div>
        </div>
        <div
          className={classnames('theme-box', 'harvesting-box', {
            'active-box': !submitting
          })}
        >
          <div className="harvesting-box-header">
            {!submitting && (
              <div className="extracts-nb-msg">
                <Translate value="debate.brightMirror.commentersParticipation" count={extracts.length} />
              </div>
            )}
            <div className="profile">
              <AvatarImage userId={userId} userName={userName} />
              <div className="harvesting-infos">
                <div className="username">{userName}</div>
                {!submitting &&
                  currentComment &&
                  currentComment.creationDate && (
                    <div className="harvesting-date" title={currentComment.creationDate}>
                      {moment(currentComment.creationDate)
                        .locale(contentLocale)
                        .fromNow()}
                    </div>
                  )}
                {submitting && (
                  <div className="harvesting-date">
                    <Translate value="harvesting.now" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="harvesting-box-body">
            {!submitting &&
              extracts && (
                <div className="body-container">
                  <div className="previous-extract">
                    {extractIndex > 0 && (
                      <div
                        onClick={() => {
                          this.changeCurrentExtract(-1);
                        }}
                      >
                        <span className="assembl-icon-down-open grey" />
                      </div>
                    )}
                  </div>
                  <div className="extract-body">{currentComment && renderRichtext(currentComment.body)}</div>
                  <div className="next-extract">
                    {extracts &&
                      extractIndex < extracts.length - 1 && (
                        <div
                          onClick={() => {
                            this.changeCurrentExtract(1);
                          }}
                        >
                          <span className="assembl-icon-down-open grey" />
                        </div>
                      )}
                  </div>
                </div>
              )}
            {submitting && (
              <div className="submit-comment">
                <RichTextEditor
                  editorState={body}
                  maxLength={FICTION_COMMENT_MAX_LENGTH}
                  onChange={this.updateBody}
                  placeholder={I18n.t('debate.brightMirror.commentLabel')}
                  withAttachmentButton
                />
              </div>
            )}
          </div>
          {!submitting &&
            extracts &&
            extracts.length > 1 && (
              <div className="extracts-numbering">
                {extractIndex + 1}/{extracts.length}
              </div>
            )}
          {submitting && this.renderFooter()}
        </div>
      </div>
    );
  }
}

export { DumbSideCommentBox };

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(addPostExtractMutation, {
    name: 'addPostExtract'
  }),
  graphql(addExtractCommentMutation, {
    name: 'addExtractComment'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbSideCommentBox);