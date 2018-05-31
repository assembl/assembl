// @flow
import * as React from 'react';

import { hexToRgb } from '../../../utils/globalFunctions';
import { COLUMN_OPACITY_GAIN } from '../../../constants';

type Props = {
  children: any,
  messageColumns: IdeaMessageColumns
};

type State = {
  activeKey: ?string
};

export default class TabbedColumns extends React.Component<Props, State> {
  state = {
    activeKey: null
  };

  render() {
    const { messageColumns, children } = this.props;
    const activeKey = this.state.activeKey || messageColumns[0].messageClassifier;
    const style = { width: `${100 / messageColumns.length}%` };
    const inactiveTabColor = 'lightgrey';
    return (
      <div className="tab-selector">
        <div className="tab-selector-buttons">
          {messageColumns.map((messageColumn) => {
            const classifier = messageColumn.messageClassifier;
            const isActive = classifier === activeKey;
            return (
              <div key={classifier} className={`${isActive ? 'active ' : ''}button-container`} style={style}>
                <button
                  style={{
                    backgroundColor: isActive ? `rgba(${hexToRgb(messageColumn.color)},${COLUMN_OPACITY_GAIN})` : inactiveTabColor
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    return this.setState({ activeKey: classifier });
                  }}
                  disabled={isActive}
                >
                  {messageColumn.name}
                </button>
              </div>
            );
          })}
        </div>
        <div className="tab-content">{children.filter(child => child.key === activeKey)}</div>
      </div>
    );
  }
}