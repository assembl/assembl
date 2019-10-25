// @flow
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { graphql } from 'react-apollo';

import HashtagsQuery from '../../../../../graphql/HashtagsQuery.graphql';
import HashtagsFilter from '../hashtagFilter';
import { setQuestionPostsFilterHashtags } from '../../../../../actions/questionFilterActions';

const mapStateToProps = (state) => {
  const { postsFiltersStatus } = state.questionFilter;
  return {
    selectedHashtag: postsFiltersStatus.hashtags[0]
  };
};
const mapDispatchToProps = dispatch => ({
  setPostsFilterHashtags: (hashtags: string[]) => dispatch(setQuestionPostsFilterHashtags(hashtags))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
  graphql(HashtagsQuery, {
    options: props => ({
      variables: {
        ideaId: props.questionId || (props.params && props.params.questionId) || ''
      }
    }),
    props: ({ data }) => ({ hashtags: data.hashtags })
  })
)(HashtagsFilter);