// @flow
import * as React from 'react';
import { connect } from 'react-redux';

import HashtagsFilter from '../hashtagFilter';
import { setThreadPostsFilterHashtags } from '../../../../../actions/threadFilterActions';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { graphql } from 'react-apollo';
import HashtagsQuery from '../../../../../graphql/HashtagsQuery.graphql';

type Props = {
  hashtags: string[];
  selectedHashtag: string,
  screenHeight: number,
  setPostsFilterHashtags: (hashtags: string[]) => void,
  stickyOffset: number
};

export class DumbThreadHashtagsFilter extends React.Component<Props> {
  render() {
    return (
      <HashtagsFilter
        {...this.props}
      />
    );
  }
}

const mapStateToProps = (state) => {
  const { postsFiltersStatus } = state.threadFilter;
  return {
    selectedHashtag: postsFiltersStatus.hashtags[0]
  };
};
const mapDispatchToProps = dispatch => ({
  setPostsFilterHashtags: (hashtags: string[]) => dispatch(setThreadPostsFilterHashtags(hashtags))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
  graphql(HashtagsQuery, {
    options: props => ({
      variables: {
        ideaId: props.themeId || (props.params && props.params.themeId) || ''
      }
    }),
    props: ({ data }) => ({ hashtags: data.hashtags })
  })
)(DumbThreadHashtagsFilter);