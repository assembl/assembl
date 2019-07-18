// @flow
import * as React from 'react';
import { MenuItem } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

function noop(event) {
  event.preventDefault();
  event.stopPropagation();
}

type Props = {
  labelMsgId: string
};

class DumbPostsLabelMenuItem extends React.Component<Props> {
  render() {
    return (
      <MenuItem onClick={noop} disabled>
        <strong>
          <Translate value={this.props.labelMsgId} />
        </strong>
      </MenuItem>
    );
  }
}

export default DumbPostsLabelMenuItem;