// @flow

import * as React from 'react';
import { Translate } from 'react-redux-i18n';

type FiltersDropdownItemProps = {
  inputName: string,
  inputType: 'radio' | 'checkbox',
  item: PostsFilterItem, // FIXME: why PostsFilterMenuItem does not work ?
  onSelectItem: (PostsFilterItem, selected?: boolean) => void,
  selected: boolean
};

class FiltersDropdownItem extends React.Component<FiltersDropdownItemProps> {
  handleClick = (event: any) => {
    this.props.onSelectItem(this.props.item, !this.props.selected);
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    const { inputName, inputType, item, selected } = this.props;

    const FiltersItemStyle = {
      textAlign: 'left',
      padding: '0 20px',
      fontSize: '14px'
    };

    const FilterItemsLabelStyle = {
      paddingLeft: '5px'
    };

    return (
      <div id={`postsFilterItem-${item.id}`} onClick={this.handleClick} style={FiltersItemStyle}>
        {selected}
        <input id={`postsFilterItem-${item.id}-input`} type={inputType} name={inputName} checked={selected} />
        <label htmlFor={`postsFilterItem-${item.id}-input`} style={FilterItemsLabelStyle}>
          <Translate value={item.labelMsgId} />
        </label>
      </div>
    );
  }
}

export default FiltersDropdownItem;