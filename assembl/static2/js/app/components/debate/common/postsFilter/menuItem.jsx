// @flow

import * as React from 'react';
import { MenuItem } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type PostsFilterMenuItemProps = {
  inputName: string,
  inputType: 'radio' | 'checkbox',
  item: PostsFilterItem, // FIXME: why PostsFilterMenuItem does not work ?
  onSelectItem: (PostsFilterItem, selected?: boolean) => void,
  selected: boolean
};

class DumbPostsFilterMenuItem extends React.Component<PostsFilterMenuItemProps> {
  handleClick = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onSelectItem(this.props.item, !this.props.selected);
  };

  render() {
    const { inputName, inputType, item, selected } = this.props;
    return (
      <MenuItem id={`postsFilterItem-${item.id}`} onClick={this.handleClick}>
        <input id={`postsFilterItem-${item.id}-input`} type={inputType} readOnly name={inputName} checked={selected} />&nbsp;
        <label htmlFor={`postsFilterItem-${item.id}-input`}>
          <Translate value={item.labelMsgId} />
        </label>
      </MenuItem>
    );
  }
}

export default DumbPostsFilterMenuItem;