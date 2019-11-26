// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  labelMsgId: string
};

class FiltersCategoryLabel extends React.Component<Props> {
  render() {
    const categoryLabelStyle = {
      fontWeight: 'bold',
      textAlign: 'left',
      fontSize: '14px',
      padding: '20px 0 5px 20px',
      color: '#777'
    };
    return (
      <div style={categoryLabelStyle}>
        <strong>
          <Translate value={this.props.labelMsgId} />
        </strong>
      </div>
    );
  }
}

export default FiltersCategoryLabel;