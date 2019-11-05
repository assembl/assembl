// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Button, FormGroup } from 'react-bootstrap';
import { I18n, Translate } from 'react-redux-i18n';
import classNames from 'classnames';
import { EditorState } from 'draft-js';

import { MESSAGE_VIEW, PublicationStates } from '../../../constants';
import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import { convertContentStateToHTML, editorStateIsEmpty, uploadNewAttachments } from '../../../utils/draftjs';
import { getDomElementOffset } from '../../../utils/globalFunctions';
import { displayAlert, promptForLoginOr } from '../../../utils/utilityManager';
import { TextInputWithRemainingChars } from '../../common/textInputWithRemainingChars';
import RichTextEditor from '../../common/richTextEditor';
import { connectedUserIsModerator } from '../../../utils/permissions';
import { DebateContext } from '../../../app';
import HashtagsQuery from '../../../graphql/HashtagsQuery.graphql';

export const TEXT_INPUT_MAX_LENGTH = 140;
export const NO_BODY_LENGTH = 0;

export type Props = {
  contentLocale: string,
  createPost: Function,
  ideaId: string,
  refetchIdea: Function,
  uploadDocument: Function,
  ideaOnColumn: boolean,
  messageClassifier: string,
  scrollOffset: number,
  onDisplayForm: Function,
  fillBodyLabelMsgId?: string,
  bodyPlaceholderMsgId?: string,
  postSuccessMsgId?: string,
  draftable?: boolean,
  draftSuccessMsgId?: ?string,
  isDebateModerated: boolean,
  messageViewOverride: string
};

type State = {
  body: EditorState,
  isActive: boolean,
  subject: string,
  submitting: boolean
};

export const submittingState = (value: boolean) => ({
  submitting: value
});

export const getClassNames = (ideaOnColumn: boolean, submitting: boolean) =>
  classNames([
    'button-submit',
    'button-dark',
    'btn',
    'btn-default',
    'right',
    !ideaOnColumn ? 'margin-l' : 'margin-m',
    submitting && 'cursor-wait'
  ]);

export class DumbTopPostForm extends React.Component<Props, State> {
  formContainer: ?HTMLDivElement;

  static defaultProps = {
    scrollOffset: 125,
    onDisplayForm: () => {},
    fillBodyLabelMsgId: 'debate.thread.fillBody',
    bodyPlaceholderMsgId: 'debate.insert',
    postSuccessMsgId: 'debate.thread.postSuccess',
    draftable: false,
    draftSuccessMsgId: null
  };

  constructor() {
    super();
    this.state = {
      body: EditorState.createEmpty(),
      isActive: false,
      subject: '',
      submitting: false
    };
  }

  displayForm = (isActive: boolean): void => {
    this.props.onDisplayForm(isActive);
    this.setState(
      {
        isActive: isActive
      },
      () => {
        if (this.formContainer) {
          const elmOffset = getDomElementOffset(this.formContainer).top - this.props.scrollOffset;
          window.scroll({ top: elmOffset, left: 0, behavior: 'smooth' });
        }
      }
    );
  };

  resetForm = () => {
    this.displayForm(false);
    this.setState({ subject: '' });
    this.setState({ body: EditorState.createEmpty() });
  };

  getWarningMessageToDisplay = (publicationState: string, subject: string, bodyIsEmpty: boolean, ideaOnColumn: boolean) => {
    if (publicationState === PublicationStates.DRAFT && (!subject && bodyIsEmpty)) {
      return 'debate.brightMirror.fillEitherTitleContent';
    } else if (!subject && !ideaOnColumn) {
      return 'debate.thread.fillSubject';
    } else if (bodyIsEmpty) {
      return this.props.fillBodyLabelMsgId;
    }
    return null;
  };

  createTopPost = (publicationState: string) => {
    const {
      contentLocale,
      createPost,
      ideaId,
      refetchIdea,
      uploadDocument,
      messageClassifier,
      postSuccessMsgId,
      ideaOnColumn,
      draftSuccessMsgId,
      messageViewOverride
    } = this.props;
    const { body, subject } = this.state;
    this.setState(submittingState(true));
    const bodyIsEmpty = editorStateIsEmpty(body);
    if (
      ((subject || ideaOnColumn) && !bodyIsEmpty) ||
      (publicationState === PublicationStates.DRAFT && (subject || !bodyIsEmpty))
    ) {
      displayAlert('success', I18n.t('loading.wait'), false, 10000);

      // first, we upload each attachment
      const uploadDocumentsPromise = uploadNewAttachments(body, uploadDocument);
      uploadDocumentsPromise
        .then((result) => {
          const variables = {
            contentLocale: contentLocale,
            ideaId: ideaId,
            subject:
              subject ||
              (messageViewOverride === MESSAGE_VIEW.brightMirror ? I18n.t('debate.brightMirror.draftEmptyTitle') : null),
            messageClassifier: messageClassifier || null,
            // use the updated content state with new entities
            body: convertContentStateToHTML(result.contentState),
            attachments: result.documentIds,
            publicationState: publicationState
          };

          createPost({ variables: variables })
            .then(() => {
              refetchIdea();
              let successMessage;
              switch (publicationState) {
              case PublicationStates.DRAFT:
                successMessage = draftSuccessMsgId;
                break;
              case PublicationStates.SUBMITTED_AWAITING_MODERATION:
                successMessage = 'debate.thread.postToBeValidated';
                break;
              default:
                successMessage = postSuccessMsgId;
              }
              if (successMessage) {
                displayAlert('success', I18n.t(successMessage), false, 10000);
              }
              this.resetForm();
              this.setState(submittingState(false), () => {
                if (ideaOnColumn) {
                  window.scrollTo({ top: 1300, left: 0, behavior: 'smooth' });
                }
              });
            })
            .catch((error) => {
              displayAlert('danger', error.message.replace('GraphQL error: ', ''));
              this.setState(submittingState(false));
            });
        })
        .catch((error) => {
          displayAlert('danger', error.message.replace('GraphQL error: ', ''));
          this.setState(submittingState(false));
        });
    } else {
      const warningMessage = this.getWarningMessageToDisplay(publicationState, subject, bodyIsEmpty, ideaOnColumn);
      if (warningMessage) displayAlert('warning', I18n.t(warningMessage));
      this.setState(submittingState(false));
    }
  };

  handleInputFocus = promptForLoginOr(() => this.displayForm(true));

  updateBody = (newValue: Object) => {
    this.setState({
      body: newValue
    });
  };

  handleSubjectChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      subject: e.target.value
    });
  };

  setFormContainerRef = (el: ?HTMLDivElement): void => {
    this.formContainer = el;
  };

  render() {
    const { ideaOnColumn, bodyPlaceholderMsgId, draftable, isDebateModerated, messageViewOverride } = this.props;
    const { subject, body, isActive, submitting } = this.state;
    const userIsModerator = connectedUserIsModerator();
    const isBrightMirror = messageViewOverride === MESSAGE_VIEW.brightMirror;
    const publicationState =
      !userIsModerator && isDebateModerated && !isBrightMirror
        ? PublicationStates.SUBMITTED_AWAITING_MODERATION
        : PublicationStates.PUBLISHED;
    return (
      <div className="form-container" ref={this.setFormContainerRef}>
        <FormGroup>
          {!ideaOnColumn ? (
            <TextInputWithRemainingChars
              value={subject}
              label={I18n.t('debate.subject')}
              maxLength={TEXT_INPUT_MAX_LENGTH}
              handleTxtChange={this.handleSubjectChange}
              handleInputFocus={this.handleInputFocus}
              isActive={isActive}
              name="top-post-title"
            />
          ) : null}
          {isActive || ideaOnColumn ? (
            <div className="margin-m">
              <RichTextEditor
                editorState={body}
                handleInputFocus={this.handleInputFocus}
                onChange={this.updateBody}
                placeholder={I18n.t(bodyPlaceholderMsgId)}
                withAttachmentButton
              />
              <div className="clear" />
              {!ideaOnColumn ? (
                <Button className="button-cancel button-dark btn btn-default left margin-l" onClick={this.resetForm}>
                  <Translate value="cancel" />
                </Button>
              ) : null}
              <Button
                className={getClassNames(ideaOnColumn, submitting)}
                onClick={() => this.createTopPost(publicationState)}
                style={{ marginBottom: '30px' }}
                disabled={submitting}
              >
                <Translate value="debate.post" />
              </Button>
              {draftable ? (
                <Button
                  className={`${getClassNames(ideaOnColumn, submitting)} btn-draft`}
                  onClick={() => this.createTopPost(PublicationStates.DRAFT)}
                  disabled={submitting}
                >
                  <Translate value="debate.brightMirror.saveDraft" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </FormGroup>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

const TopPostFormWithContext = props => (
  <DebateContext.Consumer>
    {({ isDebateModerated, messageViewOverride }) => (
      <DumbTopPostForm {...props} isDebateModerated={isDebateModerated} messageViewOverride={messageViewOverride} />
    )}
  </DebateContext.Consumer>
);

export default compose(
  connect(mapStateToProps),
  graphql(createPostMutation, {
    name: 'createPost',
    options: props => ({
      refetchQueries: [{
        query: HashtagsQuery,
        variables: { ideaId: props.ideaId }
      }]
    })
  }),
  graphql(uploadDocumentMutation, { name: 'uploadDocument' })
)(TopPostFormWithContext);