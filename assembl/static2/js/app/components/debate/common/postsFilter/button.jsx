// @flow

import * as React from 'react';
import { Button, MenuItem } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type PostsFilterButtonProps = {
  i18nTitle: string,
  onClick: () => void
};

class DumbPostsFilterButton extends React.Component<PostsFilterButtonProps> {
  handleClick = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    const { onClick, i18nTitle, ...buttonProps } = this.props;
    return (
      <MenuItem onClick={this.handleClick}>
        <Button onClick={onClick} {...buttonProps}>
          <Translate value={i18nTitle} />
        </Button>
      </MenuItem>
    );
  }
}

export default DumbPostsFilterButton;