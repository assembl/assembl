// @flow
import React from 'react';
import { connect } from 'react-redux';
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';

type Props = {
  isHarvestingMode: boolean
};

type State = {
  showHarvestingBox: boolean
};

class HarvestingMenu extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      showHarvestingBox: false
    };
  }

  handleClick = (): void => {
    this.setState({
      showHarvestingBox: true
    });
  };

  handleMouseDown = (event: SyntheticMouseEvent) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  cancelHarvesting = (): void => {
    this.setState({ showHarvestingBox: false });
  };

  render() {
    const { showHarvestingBox } = this.state;
    const { isHarvestingMode } = this.props;
    const extract = window.getSelection().toString();
    return (
      <div>
        {showHarvestingBox && <HarvestingBox extract={extract} cancelHarvesting={this.cancelHarvesting} />}
        {isHarvestingMode && <HarvestingAnchor handleClick={this.handleClick} handleMouseDown={this.handleMouseDown} />}
      </div>
    );
  }
}

const mapStateToProps = ({ context }) => ({
  isHarvestingMode: context.isHarvesting
});

export default connect(mapStateToProps)(HarvestingMenu);