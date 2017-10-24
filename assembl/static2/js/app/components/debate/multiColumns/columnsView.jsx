import React from 'react';
import TabbedColumns from './tabbedColumns';
import MultiColumns from './multiColumns';
import hashLinkScroll from '../../../utils/hashLinkScroll';

const MAX_COLUMN_WIDTH = 380;

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
    return columnsCount * MAX_COLUMN_WIDTH > this.state.screenWidth;
  };
  render = () => {
    const { messageColumns: columns } = this.props;
    if (!Array.isArray(columns)) return null;
    return (
      <div>
        {this.shouldShowTabs(columns.length)
          ? <TabbedColumns {...this.props} />
          : <MultiColumns {...this.props} width={`${100 / columns.length}%`} />}
      </div>
    );
  };
}