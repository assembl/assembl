// @flow
import * as React from 'react';
import Select from 'react-select';
import { I18n } from 'react-redux-i18n';

type Props = {
  hashtags?: string[],
  selectedHashtag: string,
  setPostsFilterHashtags: (hashtags: string[]) => void,
}

export class DumbHashtagsFilter extends React.Component<Props> {

  selectHashtagValue(hashtag: string | null) {
    if (!hashtag) {
      this.props.setPostsFilterHashtags([]);
    } else {
      this.props.setPostsFilterHashtags([hashtag]);
    }
  }

  render() {
    const { hashtags, selectedHashtag } = this.props;

    const options = (hashtags || []).map(hashtag => ({ label: `#${hashtag}`, value: hashtag }));
    const value = selectedHashtag ? { label: `#${selectedHashtag}`, value: selectedHashtag } : null;

    return (
      <Select
        options={options}
        isSearchable
        placeholder={I18n.t('debate.thread.hashtagsFilter.noOption')}
        closeMenuOnSelect
        isClearable
        value={value}
        onChange={selectedOption => this.selectHashtagValue(selectedOption ? selectedOption.value : null)}
      />
    );
  }
}


export default DumbHashtagsFilter;