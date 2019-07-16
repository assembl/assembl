// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { EditorState } from 'draft-js';
import classNames from 'classnames';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import { displayAlert, promptForLoginOr } from '../../../utils/utilityManager';
import { convertContentStateToHTML, editorStateIsEmpty, uploadNewAttachments } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import { getIsPhaseCompletedById } from '../../../utils/timeline';
import { getPostPublicationState } from '../../../utils/globalFunctions';
import { connectedUserIsModerator } from '../../../utils/permissions';
import { DebateContext } from '../../../app';
import { browserHistory } from '../../../router';
import { get } from '../../../utils/routeMap';

type Props = {
  contentLocale: string,
  createPost: Function,
  hideAnswerForm: Function,
  ideaId: string,
  parentId: string,
  refetchIdea: Function,
  textareaRef: Function,
  uploadDocument: Function,
  timeline: Timeline,
  phaseId: string,
  handleAnswerClick: Function,
  isDebateModerated: boolean,
  routerParams: RouterParams
};

type State = {
  body: EditorState,
  submitting: boolean,
  isHidden: boolean
};

export class DumbAnswerForm extends React.PureComponent<Props, State> {
  constructor() {
    super();
    this.state = {
      body: EditorState.createEmpty(),
      submitting: false,
      isHidden: false
    };
  }

  componentWillMount() {
    const { phaseId, timeline } = this.props;
    const isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
    if (isPhaseCompleted) this.setState({ isHidden: true });
  }

  handleCancel = () => {
    const { hideAnswerForm } = this.props;
    this.setState({ body: EditorState.createEmpty() }, hideAnswerForm);
  };

  updateBody = (newValue: EditorState) => {
    this.setState({
      body: newValue
    });
  };

  handleInputFocus = () => {
    const { handleAnswerClick } = this.props;
    promptForLoginOr(handleAnswerClick)();
  };

  handleSubmit = () => {
    const {
      createPost,
      contentLocale,
      parentId,
      ideaId,
      refetchIdea,
      hideAnswerForm,
      uploadDocument,
      isDebateModerated,
      routerParams
    } = this.props;
    const { body } = this.state;
    this.setState({ submitting: true });
    const bodyIsEmpty = !body || editorStateIsEmpty(body);
    if (!bodyIsEmpty) {
      // first we upload the new documents
      const uploadDocumentsPromise = uploadNewAttachments(body, uploadDocument);
      uploadDocumentsPromise
        .then((result) => {
          if (!result.contentState) {
            return;
          }
          const userIsModerator = connectedUserIsModerator();
          const publicationState = getPostPublicationState(isDebateModerated, userIsModerator);
          const variables = {
            contentLocale: contentLocale,
            ideaId: ideaId,
            parentId: parentId,
            body: convertContentStateToHTML(result.contentState),
            attachments: result.documentIds,
            publicationState: publicationState
          };
          displayAlert('success', I18n.t('loading.wait'), false, 10000);
          createPost({ variables: variables })
            .then((res) => {
              const postId = res.data.createPost.post.id;
              const redirectToNewPost = () => {
                browserHistory.push(
                  get('post', {
                    slug: routerParams.slug,
                    phase: routerParams.phase,
                    themeId: routerParams.themeId,
                    postId: postId
                  })
                );
              };
              this.setState({ submitting: false, body: EditorState.createEmpty() }, () => {
                hideAnswerForm();
                // Execute refetchIdea after the setState otherwise we can get a
                // warning setState called on unmounted component.
                refetchIdea().then(() => {
                  // The thread may have moved because it became the latest active,
                  // we need to scroll to the created post.
                  // setTimeout is needed to be sure the element exist in the DOM
                  setTimeout(() => {
                    const createdPostElement = document.getElementById(postId);
                    if (createdPostElement) {
                      redirectToNewPost();
                    }
                  });
                });
              });
              const successMessage = isDebateModerated && !userIsModerator ? 'postToBeValidated' : 'postSuccess';
              displayAlert('success', I18n.t(`debate.thread.${successMessage}`), false, 10000);
            })
            .catch((error) => {
              displayAlert('danger', error.message.replace('GraphQL error: ', ''));
              this.setState({ submitting: false });
            });
        })
        .catch((error) => {
          displayAlert('danger', error.message.replace('GraphQL error: ', ''));
          this.setState({ submitting: false });
        });
    } else {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
      this.setState({ submitting: false });
    }
  };

  getClassNames() {
    const { submitting } = this.state;
    return classNames(['button-submit', 'button-dark', 'btn', 'btn-default', 'right', submitting && 'cursor-wait']);
  }

  render() {
    const { textareaRef } = this.props;
    const { isHidden } = this.state;
    return (
      <Row>
        {!isHidden ? (
          <Col xs={12} md={12}>
            <div className="answer-form-inner">
              <FormGroup>
                <RichTextEditor
                  editorState={this.state.body}
                  handleInputFocus={this.handleInputFocus}
                  placeholder={I18n.t('debate.toAnswer')}
                  onChange={this.updateBody}
                  textareaRef={textareaRef}
                  withAttachmentButton
                />
                <div className="button-container">
                  <Button className="button-cancel button-dark btn btn-default left" onClick={this.handleCancel}>
                    <Translate value="cancel" />
                  </Button>
                  <Button className={this.getClassNames()} onClick={this.handleSubmit} disabled={this.state.submitting}>
                    <Translate value="debate.post" />
                  </Button>
                </div>
              </FormGroup>
            </div>
          </Col>
        ) : null}
      </Row>
    );
  }
}

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale,
  timeline: state.timeline
});

const DumbAnswerFormWithContext = props => (
  <DebateContext.Consumer>
    {({ isDebateModerated }) => <DumbAnswerForm {...props} isDebateModerated={isDebateModerated} />}
  </DebateContext.Consumer>
);

export default compose(
  connect(mapStateToProps),
  graphql(createPostMutation, { name: 'createPost' }),
  graphql(uploadDocumentMutation, { name: 'uploadDocument' })
)(DumbAnswerFormWithContext);