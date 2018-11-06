// @flow
import * as React from 'react';

import ARange from 'annotator_range'; // eslint-disable-line
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import classnames from 'classnames';
import { EditorState } from 'draft-js';

import addPostExtractMutation from '../../../../graphql/mutations/addPostExtract.graphql';
import createPostMutation from '../../../../graphql/mutations/createPost.graphql';
import updatePostMutation from '../../../../graphql/mutations/updatePost.graphql';
import manageErrorAndLoading from '../../../../components/common/manageErrorAndLoading';
import { getConnectedUserId, getConnectedUserName } from '../../../../utils/globalFunctions';
import { displayAlert } from '../../../../utils/utilityManager';
import { COMMENT_BOX_OFFSET } from '../../../../constants';
import { convertContentStateToHTML, editorStateIsEmpty, convertToEditorState } from '../../../../utils/draftjs';
import ReplyToCommentButton from '../../common/replyToCommentButton';
import InnerBoxSubmit from './innerBoxSubmit';
import InnerBoxView from './innerBoxView';

export type Props = {
  extracts: Array<FictionExtractFragment>,
  postId: string,
  ideaId: string,
  submitting: boolean,
  contentLocale: string,
  lang?: string,
  selection?: ?Object,
  setCommentBoxDisplay: () => void,
  cancelSubmit: () => void,
  addPostExtract: Function,
  createPost: Function,
  refetchPost: Function,
  toggleCommentsBox?: () => void,
  clearHighlights: () => void,
  position: { x: number, y: number },
  setPositionToExtract: FictionExtractFragment => void,
  userCanReply: boolean
};

type State = {
  extractIndex: number,
  body: EditorState,
  submitting: boolean,
  replying: boolean,
  selectionText: ?string,
  serializedAnnotatorRange: ?Object,
  editComment: boolean,
  editingPostId: string
};

const ACTIONS = {
  create: 'create', // create a new comment
  confirm: 'confirm' // confirm a comment
};

class DumbSideCommentBox extends React.Component<Props, State> {
  actions: {
    [x: string]: {
      buttons: {
        id: string,
        title: string,
        className: string,
        onClick: Function
      }[]
    }
  };

  constructor(props: Props) {
    super(props);
    const { cancelSubmit, submitting, selection } = props;
    const annotatorRange = selection && ARange.sniff(selection.getRangeAt(0));

    this.state = {
      extractIndex: 0,
      body: EditorState.createEmpty(),
      submitting: submitting,
      replying: false,
      selectionText: selection && selection.toString(),
      serializedAnnotatorRange: annotatorRange && annotatorRange.serialize(document, 'annotation'),
      editComment: false,
      editingPostId: null
    };

    // actions props
    this.actions = {
      [ACTIONS.create]: {
        buttons: [
          { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: cancelSubmit },
          { id: 'validate', title: 'harvesting.submit', className: 'button-submit', onClick: this.submit }
        ]
      },
      [ACTIONS.confirm]: {
        buttons: [
          { id: 'reject', title: 'harvesting.reject', className: 'button-cancel', onClick: cancelSubmit },
          { id: 'confirm', title: 'harvesting.confirm', className: 'button-submit', onClick: this.submit }
        ]
      }
    };
  }

  componentDidMount() {
    const { submitting, extractIndex } = this.state;
    if (submitting) {
      this.wrapSelectedText();
    } else {
      const currentExtract = this.getCurrentExtract(extractIndex);
      if (currentExtract) {
        this.hightlightExtract(currentExtract);
      }
    }
  }

  componentDidUpdate() {
    const { submitting, extractIndex } = this.state;
    if (!submitting) {
      const currentExtract = this.getCurrentExtract(extractIndex);
      if (currentExtract) {
        this.hightlightExtract(currentExtract);
      }
    }
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

  getCurrentComment = (extract: FictionExtractFragment) => {
    const topComments = extract && extract.comments && extract.comments.filter(post => post.parentId === null);
    return (topComments && topComments[0]) || null;
  };

  getCurrentCommentReply = (extract: FictionExtractFragment, comment: ExtractComment) => {
    const replies = extract && comment && extract.comments.filter(post => post.parentId === comment.id);
    return (replies && replies[0]) || null;
  };

  submit = (): void => {
    const { ideaId, postId, contentLocale, lang, addPostExtract, createPost, setCommentBoxDisplay, refetchPost } = this.props;
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
          ideaId: ideaId,
          extractId: result.data.addPostExtract.extract.id,
          body: convertContentStateToHTML(body.getCurrentContent()),
          contentLocale: contentLocale
        };
        createPost({ variables: postVars }).then(() => {
          this.setState(
            {
              submitting: false
            },
            () => {
              setCommentBoxDisplay();
              window.getSelection().removeAllRanges();
              displayAlert('success', I18n.t('debate.brightMirror.sideCommentSuccessMsg'));
              refetchPost();
            }
          );
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  submitReply = (): void => {
    const { ideaId, contentLocale, createPost, refetchPost } = this.props;
    const { body, extractIndex } = this.state;
    const currentExtract = this.getCurrentExtract(extractIndex);
    const currentComment = this.getCurrentComment(currentExtract);

    const bodyIsEmpty = editorStateIsEmpty(body);
    if (bodyIsEmpty) {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
      return;
    }

    const postVars = {
      ideaId: ideaId,
      extractId: currentExtract.id,
      parentId: currentComment.id,
      body: convertContentStateToHTML(body.getCurrentContent()),
      contentLocale: contentLocale
    };
    createPost({ variables: postVars }).then(() => {
      this.setState(
        {
          replying: false
        },
        () => {
          window.getSelection().removeAllRanges();
          displayAlert('success', I18n.t('debate.brightMirror.sideCommentSuccessMsg'));
          refetchPost();
        }
      );
    });
  };

  editPost = () => {
    const { contentLocale, refetchPost, updatePost } = this.props;
    const { body, editingPostId } = this.state;

    const bodyIsEmpty = editorStateIsEmpty(body);
    if (bodyIsEmpty) {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
    }

    const postVars = {
      postId: editingPostId,
      body: convertContentStateToHTML(body.getCurrentContent()),
      contentLocale: contentLocale
    };
    updatePost({ variables: postVars }).then(() => {
      this.setState({
        editComment: false
      });
      displayAlert('success', I18n.t('debate.brightMirror.sideCommentEditSuccessMsg'));
      refetchPost();
    });
  };

  hightlightExtract = (extract: FictionExtractFragment) => {
    const { clearHighlights } = this.props;
    clearHighlights();
    const extractElement = document.getElementById(extract.id);
    if (extractElement) extractElement.classList.add('active-extract');
  };

  updateBody = (newValue: EditorState) => {
    this.setState({
      body: newValue
    });
  };

  renderSubmitFooter = () => {
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

  toggleReplying = () => {
    this.setState(state => ({ replying: !state.replying }));
  };

  setCommentEditMode = (postId, body) => {
    this.setState({ editComment: true, editingPostId: postId, body: convertToEditorState(body) });
  };

  cancelEditMode = () => {
    this.setState({ editComment: false });
  };

  renderActionFooter = () => {
    const { userCanReply } = this.props;
    const { extractIndex } = this.state;
    const currentExtract = this.getCurrentExtract(extractIndex);
    const currentComment = this.getCurrentComment(currentExtract);
    const hasReply = !!this.getCurrentCommentReply(currentExtract, currentComment);

    return (
      <div className="action-box-footer">
        {userCanReply && <ReplyToCommentButton onClickCallback={this.toggleReplying} disabled={hasReply} />}
      </div>
    );
  };

  render() {
    const { contentLocale, extracts, cancelSubmit, position, toggleCommentsBox } = this.props;
    const { submitting, extractIndex, body, replying, editComment } = this.state;
    const currentExtract = this.getCurrentExtract(extractIndex);
    const currentComment = this.getCurrentComment(currentExtract);
    const currentReply = this.getCurrentCommentReply(currentExtract, currentComment);
    const hasReply = !!currentReply;

    if (!submitting && !currentComment) return null;

    let commentView;

    if (submitting) {
      commentView = (
        <InnerBoxSubmit
          userId={getConnectedUserId()}
          userName={getConnectedUserName()}
          body={body}
          updateBody={this.updateBody}
          submit={this.submit}
          cancelSubmit={cancelSubmit}
        />
      );
    } else if (editComment) {
      commentView = (
        <InnerBoxSubmit
          userId={getConnectedUserId()}
          userName={getConnectedUserName()}
          body={body}
          updateBody={this.updateBody}
          submit={this.editPost}
          cancelSubmit={this.cancelEditMode}
        />
      );
    } else {
      commentView = (
        <InnerBoxView
          contentLocale={contentLocale}
          extractIndex={extractIndex}
          extracts={extracts}
          comment={currentComment}
          changeCurrentExtract={this.changeCurrentExtract}
          setEditMode={this.setCommentEditMode}
        />
      );
    }
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
          {!submitting && (
            <div className="extracts-nb-msg">
              <Translate value="debate.brightMirror.commentersParticipation" count={extracts.length} />
            </div>
          )}
          {commentView}
          {!submitting &&
            !editComment &&
            extracts &&
            extracts.length > 1 && (
              <div className="extracts-numbering">
                {extractIndex + 1}/{extracts.length}
              </div>
            )}
          {!submitting && this.renderActionFooter()}
          {replying && (
            <InnerBoxSubmit
              userId={getConnectedUserId()}
              userName={getConnectedUserName()}
              body={body}
              updateBody={this.updateBody}
              submit={this.submitReply}
              cancelSubmit={this.toggleReplying}
            />
          )}
          {!submitting &&
            hasReply && <InnerBoxView contentLocale={contentLocale} extractIndex={extractIndex} comment={currentReply} />}
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
  graphql(createPostMutation, {
    name: 'createPost'
  }),
  graphql(updatePostMutation, {
    name: 'updatePost'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbSideCommentBox);