// @flow
import * as React from 'react';
import { MenuItem } from 'react-bootstrap';

type Props = {
  children: React.Node
};

class DumbPostsFilterButtons extends React.Component<Props> {
  handleClick = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    const { children } = this.props;
    return <MenuItem onClick={this.handleClick}>{children}</MenuItem>;
  }
}

export default DumbPostsFilterButtons;