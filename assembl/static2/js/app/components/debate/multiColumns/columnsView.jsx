import React from 'react';
import TabbedColumns from './tabbedColumns';
import MultiColumns from './multiColumns';
import hashLinkScroll from '../../../utils/hashLinkScroll';
import { MIN_WIDTH_COLUMN, APP_CONTAINER_MAX_WIDTH } from '../../../constants';

const screenWidth = () => {
  return window.innerWidth;
};

export default class ColumnsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screenWidth: screenWidth()
    };
  }
  componentDidMount() {
    hashLinkScroll();
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }
  updateDimensions = () => {
    this.setState({
      screenWidth: screenWidth()
    });
  };
  shouldShowTabs = (columnsCount) => {
    return columnsCount * MIN_WIDTH_COLUMN > Math.min(this.state.screenWidth, APP_CONTAINER_MAX_WIDTH);
  };
  render = () => {
    const { messageColumns: columns, identifier, debateData } = this.props;
    if (!Array.isArray(columns)) return null;
    const showSynthesis = columns.some((column) => {
      return !!column.header;
    });
    return (
      <div className="max-container">
        {this.shouldShowTabs(columns.length)
          ? <TabbedColumns {...this.props} showSynthesis={showSynthesis} identifier={identifier} debateData={debateData} />
          : <MultiColumns
            {...this.props}
            width={`${100 / columns.length}%`}
            showSynthesis={showSynthesis}
            identifier={identifier}
            debateData={debateData}
          />}
      </div>
    );
  };
}