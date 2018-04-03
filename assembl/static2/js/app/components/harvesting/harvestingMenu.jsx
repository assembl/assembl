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
  harvestingAnchorPosition: Object,
  ideaId: string,
  cancelHarvesting: Function,
  refetchPost: Function
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
    const { postId, cancelHarvesting, isHarvesting, extracts, harvestingAnchorPosition, ideaId, refetchPost } = this.props;
    const { showHarvestingBox } = this.state;
    const selection = window.getSelection();
    return (
      <div className="harvesting-container">
        {extracts && extracts.length > 0 && isHarvesting
          ? extracts.map(extract => (
            <HarvestingBox
              postId={postId}
              key={extract.id}
              cancelHarvesting={cancelHarvesting}
              extract={extract}
              displayHarvestingBox={this.displayHarvestingBox}
              harvestingBoxPosition={null}
              ideaId={ideaId}
              refetchPost={refetchPost}
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
              displayHarvestingBox={this.displayHarvestingBox}
              refetchPost={refetchPost}
            />
          )}
        {isHarvesting &&
          selection.toString().length > 0 && (
            <HarvestingAnchor
              displayHarvestingBox={this.displayHarvestingBox}
              handleMouseDown={this.handleMouseDown}
              anchorPosition={harvestingAnchorPosition}
            />
          )}
      </div>
    );
  }
}

export default HarvestingMenu;