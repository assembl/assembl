// @flow
import React from 'react';
import TabbedColumns from './tabbedColumns';
import MultiColumns from './multiColumns';
import hashLinkScroll from '../../../utils/hashLinkScroll';
import { MIN_WIDTH_COLUMN, APP_CONTAINER_MAX_WIDTH } from '../../../constants';
import { withScreenWidth } from '../../common/screenDimensions';

class ColumnsView extends React.Component {
  componentDidMount() {
    hashLinkScroll();
  }

  shouldShowTabs = columnsCount => columnsCount * MIN_WIDTH_COLUMN > Math.min(this.props.screenWidth, APP_CONTAINER_MAX_WIDTH);

  render = () => {
    const { messageColumns: columns, identifier, debateData } = this.props;
    if (!Array.isArray(columns)) return null;
    const showSynthesis = columns.some(column => !!column.header);
    return (
      <div className="max-container">
        {this.shouldShowTabs(columns.length) ? (
          <TabbedColumns {...this.props} showSynthesis={showSynthesis} identifier={identifier} debateData={debateData} />
        ) : (
          <MultiColumns
            {...this.props}
            width={`${100 / columns.length}%`}
            showSynthesis={showSynthesis}
            identifier={identifier}
            debateData={debateData}
          />
        )}
      </div>
    );
  };
}

export default withScreenWidth(ColumnsView);