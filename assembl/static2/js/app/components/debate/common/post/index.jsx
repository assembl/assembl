// @flow
import classnames from 'classnames';
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import type { OperationComponent } from 'react-apollo';

import EditPostForm from '../editPostForm';
import DeletedPost from '../deletedPost';
import PostView from './postView';
import PostQuery from '../../../../graphql/PostQuery.graphql';
import manageErrorAndLoading from '../../../common/manageErrorAndLoading';
import { DeletedPublicationStates, PublicationStates } from '../../../../constants';
import hashLinkScroll from '../../../../utils/hashLinkScroll';
import NuggetsManager from '../../../common/nuggetsManager';
import { IsHarvestingContext } from '../../../../app';

const getSubjectPrefixString = fullLevel =>
  fullLevel && (
    <span className="subject-prefix">
      {`Rep. ${fullLevel
        .split('-')
        .map(level => `${Number(level) + 1}`)
        .join('.')}: `}
    </span>
  );

export type Response = {
  post: PostQuery,
  refetch: () => void
};

export type Props = {
  timeline: Timeline,
  borderLeftColor: ?string,
  contentLocale: string,
  creationDate: string,
  data: Response,
  debateData: DebateData,
  editable: boolean,
  fullLevel: string,
  id: string,
  dbId: number,
  ideaId: string,
  phaseId: string,
  isHarvesting: boolean,
  lang: string,
  measureTreeHeight: Function,
  multiColumns: boolean,
  nuggetsManager: NuggetsManager,
  numChildren: number,
  originalLocale: string,
  parentId: string,
  refetchIdea: Function,
  routerParams: RouterParams,
  rowIndex: number
};

type State = {
  mode: 'edit' | 'view'
};

type bodyAndSubject = { body: string, subject: string, originalBody: string, originalSubject: string };

export class DumbPost extends React.PureComponent<Props, State> {
  static defaultProps = {
    isHarvesting: false,
    multiColumns: false
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      mode: 'view'
    };
  }

  componentDidMount() {
    this.props.measureTreeHeight(400);
    // If we have a hash in url and the post id match it, scroll to it.
    const postId = this.props.data.post.id;
    const { hash } = window.location;
    if (hash !== '') {
      const hashPostId = hash.split('#')[1].split('?')[0];
      if (hashPostId === postId) {
        // Wait an extra 2s to be sure that all previous posts are loaded
        // and measureTreeHeight finished.
        setTimeout(() => {
          hashLinkScroll(hashPostId);
        }, 2000);
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { body } = this.getBodyAndSubject(false);
    if (body && body.indexOf('<img src')) {
      this.props.measureTreeHeight(200);
    }

    if (this.props.lang !== prevProps.lang || this.props.data.post.publicationState !== prevProps.data.post.publicationState) {
      this.props.measureTreeHeight(200);
    }
  }

  getBodyAndSubject = (translate: boolean): bodyAndSubject => {
    const { subjectEntries, bodyEntries } = this.props.data.post;

    let body;
    let subject;
    let originalBody;
    let originalSubject;
    if (bodyEntries.length > 1) {
      // first entry is the translated version, example localeCode "fr-x-mtfrom-en"
      // second entry is the original, example localeCode "en"
      body = translate ? bodyEntries[0].value : bodyEntries[1].value;
      originalBody = bodyEntries[1].value;
    } else {
      // translation is not enabled or the message is already in the desired locale
      body = bodyEntries[0].value;
      originalBody = bodyEntries[0].value;
    }
    if (subjectEntries.length > 1) {
      subject = translate ? subjectEntries[0].value : subjectEntries[1].value;
      originalSubject = subjectEntries[1].value;
    } else {
      subject = subjectEntries[0].value;
      originalSubject = subjectEntries[0].value;
    }

    return {
      body: body,
      subject: subject,
      originalBody: originalBody,
      originalSubject: originalSubject
    };
  };

  handleEditClick = () => {
    this.setState({ mode: 'edit' }, this.props.measureTreeHeight);
  };

  goBackToViewMode = () => {
    this.setState({ mode: 'view' }, this.props.measureTreeHeight);
  };

  render() {
    const { publicationState } = this.props.data.post;
    const {
      contentLocale,
      fullLevel,
      id,
      isHarvesting,
      multiColumns,
      originalLocale,
      parentId,
      refetchIdea,
      timeline
    } = this.props;
    const translate = contentLocale !== originalLocale;
    const { body, subject, originalBody, originalSubject } = this.getBodyAndSubject(translate);

    const modifiedSubject = (
      <span>
        {getSubjectPrefixString(fullLevel)}
        {subject ? subject.replace('Re: ', '') : ''}
      </span>
    );

    if (publicationState in DeletedPublicationStates) {
      return (
        <DeletedPost
          id={id}
          subject={modifiedSubject}
          deletedBy={publicationState === PublicationStates.DELETED_BY_USER ? 'user' : 'admin'}
        />
      );
    }

    const divClassnames = classnames('posts', { 'column-post': multiColumns });
    const modifiedOriginalSubject = (
      <span>
        {getSubjectPrefixString(fullLevel)}
        {originalSubject && originalSubject.replace('Re: ', '')}
      </span>
    );
    return (
      <div className={divClassnames} id={id}>
        {this.state.mode === 'edit' ? (
          <div className="answer-form">
            <EditPostForm
              id={id}
              body={originalBody}
              subject={originalSubject}
              refetchIdea={refetchIdea}
              goBackToViewMode={this.goBackToViewMode}
              readOnly={!!parentId}
              modifiedOriginalSubject={modifiedOriginalSubject}
              originalLocale={originalLocale}
            />
          </div>
        ) : (
          <PostView
            {...this.props}
            isHarvesting={isHarvesting}
            body={body}
            subject={subject}
            handleEditClick={this.handleEditClick}
            modifiedSubject={modifiedSubject}
            timeline={timeline}
          />
        )}
      </div>
    );
  }
}

const PostWithContext = props => (
  <IsHarvestingContext.Consumer>
    {isHarvesting => <DumbPost {...props} isHarvesting={isHarvesting} />}
  </IsHarvestingContext.Consumer>
);

const withData: OperationComponent<Response> = graphql(PostQuery);

// Absolutely don't use redux connect here to avoid performance issue.
// Please pass the needed props from Tree component.
export default compose(withData, manageErrorAndLoading({ displayLoader: true }))(PostWithContext);