// @flow

import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type PostsFilterButtonProps = {
  id: string,
  i18nTitle: string,
  onClick: () => void
};

class DumbPostsFilterButton extends React.Component<PostsFilterButtonProps> {
  render() {
    const { id, onClick, i18nTitle, ...buttonProps } = this.props;
    return (
      <Button id={id} onClick={onClick} {...buttonProps}>
        <Translate value={i18nTitle} />
      </Button>
    );
  }
}

export default DumbPostsFilterButton;