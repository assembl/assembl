// @flow
import React from 'react';
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';

type Props = {
  extracts: Array<Extract>,
  postId: string,
  isHarvesting: boolean,
  cancelHarvesting: Function
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

  displayHarvestingBox = (): void => {
    this.setState({
      showHarvestingBox: !this.state.showHarvestingBox
    });
  };

  handleMouseDown = (event: SyntheticMouseEvent) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  render() {
    const { postId, cancelHarvesting, isHarvesting, extracts } = this.props;
    const { showHarvestingBox } = this.state;
    const selection = window.getSelection();
    return (
      <div>
        {extracts && extracts.length > 0 && isHarvesting
          ? extracts.map((extract, index) => (
            <HarvestingBox
              postId={postId}
              key={extract.id}
              cancelHarvesting={cancelHarvesting}
              extract={extract}
              index={index}
              displayHarvestingBox={this.displayHarvestingBox}
            />
          ))
          : null}
        {showHarvestingBox &&
          isHarvesting && (
            <HarvestingBox
              postId={postId}
              selection={selection}
              cancelHarvesting={cancelHarvesting}
              extract={null}
              index={0}
              displayHarvestingBox={this.displayHarvestingBox}
            />
          )}
        {isHarvesting && (
          <HarvestingAnchor displayHarvestingBox={this.displayHarvestingBox} handleMouseDown={this.handleMouseDown} />
        )}
      </div>
    );
  }
}

export default HarvestingMenu;