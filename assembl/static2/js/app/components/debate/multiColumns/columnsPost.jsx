import React from 'react';
import { compose, graphql } from 'react-apollo';

import Attachments from '../../common/attachments';
import ProfileLine from '../../common/profileLine';
import PostTranslate from '../common/translations/postTranslate';
import PostActions from '../common/postActions';
import EditPostForm from '../common/editPostForm';
import DeletedPost from '../common/deletedPost';
import PostQuery from '../../../graphql/PostQuery.graphql';
import { DeletedPublicationStates, PublicationStates } from '../../../constants';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';
import { EmptyPost } from '../thread/post';
import { transformLinksInHtml } from '../../../utils/linkify';

class ColumnsPost extends EmptyPost {
  render() {
    const {
      id,
      bodyMimeType,
      creator,
      modificationDate,
      sentimentCounts,
      mySentiment,
      publicationState,
      attachments
    } = this.props.data.post;
    const {
      originalLocale,
      contentLocale,
      lang,
      refetchIdea,
      creationDate,
      numChildren,
      routerParams,
      debateData,
      colColor,
      identifier
    } = this.props;
    const translate = contentLocale !== originalLocale;
    const { body, originalBody } = this.getBodyAndSubject(translate);

    if (publicationState in DeletedPublicationStates) {
      return <DeletedPost id={id} deletedBy={publicationState === PublicationStates.DELETED_BY_USER ? 'user' : 'admin'} />;
    }

    if (this.state.mode === 'edit') {
      return (
        <div className="posts column-post">
          <div className="answer-form" id={id}>
            <EditPostForm
              attachments={attachments}
              id={id}
              body={originalBody}
              refetchIdea={refetchIdea}
              goBackToViewMode={this.goBackToViewMode}
              readOnly={!!this.props.parentId}
              originalLocale={originalLocale}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="posts column-post" id={id}>
        <div className="box" style={{ borderLeftColor: colColor }}>
          <div className="post-row">
            <div className="post-left">
              {creator && (
                <ProfileLine
                  userId={creator.userId}
                  userName={creator.name}
                  creationDate={creationDate}
                  locale={lang}
                  modified={modificationDate !== null}
                />
              )}
              {debateData.translationEnabled ? (
                <PostTranslate
                  contentLocale={contentLocale}
                  id={id}
                  lang={lang}
                  originalLocale={originalLocale}
                  translate={translate}
                />
              ) : null}
              <div
                className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`}
                dangerouslySetInnerHTML={{ __html: transformLinksInHtml(body) }}
                ref={this.recomputeTreeHeightOnImagesLoad}
              />
              <Attachments attachments={attachments} />
            </div>
            <div className="post-right">
              <PostActions
                creatorUserId={creator.userId}
                postId={id}
                handleEditClick={this.handleEditClick}
                sentimentCounts={sentimentCounts}
                mySentiment={mySentiment}
                numChildren={numChildren}
                routerParams={routerParams}
                debateData={debateData}
                identifier={identifier}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default compose(graphql(PostQuery), withLoadingIndicator())(ColumnsPost);