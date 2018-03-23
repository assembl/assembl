// @flow
import React from 'react';
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './HarvestingAnchor';
import HarvestingBox from './HarvestingBox';

type State = {
  showHarvestingBox: boolean
};

class HarvestingMenu extends React.Component<void, *, State> {
  state: State;

  constructor() {
    super();
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

  render() {
    const { showHarvestingBox } = this.state;
    return (
      <div>
        {showHarvestingBox && <HarvestingBox extract={window.getSelection().toString()} />}
        <HarvestingAnchor handleClick={this.handleClick} handleMouseDown={this.handleMouseDown} />
      </div>
    );
  }
}

export default HarvestingMenu;