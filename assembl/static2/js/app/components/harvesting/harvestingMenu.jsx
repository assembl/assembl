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
  harvestingMenuPosition: number,
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
    const { postId, cancelHarvesting, isHarvesting, extracts, harvestingMenuPosition } = this.props;
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
              displayHarvestingBox={this.displayHarvestingBox}
              previousExtractId={extracts[index - 1] ? extracts[index - 1].id : null}
              harvestingBoxPosition={null}
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
              previousExtractId={null}
              harvestingBoxPosition={harvestingMenuPosition}
            />
          )}
        {isHarvesting && (
          <HarvestingAnchor
            displayHarvestingBox={this.displayHarvestingBox}
            handleMouseDown={this.handleMouseDown}
            anchorPosition={harvestingMenuPosition}
          />
        )}
      </div>
    );
  }
}

export default HarvestingMenu;