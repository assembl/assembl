// @flow
import * as React from 'react';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';
import HarvestingBadge from './harvestingBadge';
import { getAnnotationData } from '../../utils/extract';

type Props = {
  extracts: Array<Extract>,
  postId: string,
  lang: string,
  displayHarvestingBox: boolean,
  displayHarvestingAnchor: boolean,
  harvestingAnchorPosition: Object,
  setHarvestingBoxDisplay: Function,
  handleClickAnchor: Function,
  cancelHarvesting: Function,
  refetchPost: Function,
  isAuthorAccountDeleted: boolean,
  showNuggetAction: boolean
};

type State = {
  displayExtractsBox: boolean,
  activeExtractIndex: ?number
};

class HarvestingMenu extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    const { extracts } = props;
    const { activeExtractIndex } = state;
    const { hash } = window.location;
    if (activeExtractIndex === null && hash !== '') {
      const hashExtractId = hash.split('#')[1];
      let isHashMatchId = false;
      let newActiveExtractIndex = null;
      extracts.forEach((extract, index) => {
        if (hashExtractId === extract.id) {
          isHashMatchId = true;
          newActiveExtractIndex = index;
        }
      });
      if (!isHashMatchId) return null;
      return { displayExtractsBox: true, activeExtractIndex: newActiveExtractIndex };
    }
    return null;
  }

  state = { displayExtractsBox: false, activeExtractIndex: null };

  toggleExtractsBox = (): void => {
    this.setState(prevState => ({ displayExtractsBox: !prevState.displayExtractsBox }));
  };

  handleMouseDown = (event: SyntheticMouseEvent<>) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  setActiveExtract = (extractIndex: number): void => {
    this.setState({ activeExtractIndex: extractIndex, displayExtractsBox: true });
  };

  render() {
    const {
      setHarvestingBoxDisplay,
      displayHarvestingBox,
      displayHarvestingAnchor,
      postId,
      handleClickAnchor,
      extracts,
      harvestingAnchorPosition,
      refetchPost,
      cancelHarvesting,
      isAuthorAccountDeleted,
      showNuggetAction,
      lang
    } = this.props;
    const selection = window.getSelection();
    const annotation = getAnnotationData(selection);
    const hasAnnotation = !!annotation;
    const hasExtracts = extracts && extracts.length > 0;
    const { displayExtractsBox, activeExtractIndex } = this.state;
    const showHarvestingBadge = !displayExtractsBox && hasExtracts;
    const showBoxWithExtracts = displayExtractsBox && hasExtracts && !displayHarvestingBox;
    const showBoxInHarvestingMode = displayHarvestingBox && hasAnnotation;
    const showHarvestingAnchor = displayHarvestingAnchor && hasAnnotation;
    return (
      <div>
        {showHarvestingBadge && <HarvestingBadge toggleExtractsBox={this.toggleExtractsBox} extractsNumber={extracts.length} />}
        <div className="harvesting-container">
          {showBoxWithExtracts && (
            <HarvestingBox
              postId={postId}
              key={`extracts-${postId}`}
              extracts={extracts}
              activeExtractIndex={activeExtractIndex || 0}
              isAuthorAccountDeleted={isAuthorAccountDeleted}
              displayHarvestingBox={displayHarvestingBox}
              refetchPost={refetchPost}
              cancelHarvesting={cancelHarvesting}
              setHarvestingBoxDisplay={setHarvestingBoxDisplay}
              showNuggetAction={showNuggetAction}
              toggleExtractsBox={this.toggleExtractsBox}
            />
          )}
          {showBoxInHarvestingMode && (
            <HarvestingBox
              postId={postId}
              key={`harvesting-${postId}`}
              onAdd={this.setActiveExtract}
              annotation={annotation}
              lang={lang}
              displayHarvestingBox={displayHarvestingBox}
              refetchPost={refetchPost}
              cancelHarvesting={cancelHarvesting}
              setHarvestingBoxDisplay={setHarvestingBoxDisplay}
              showNuggetAction={showNuggetAction}
            />
          )}
          {showHarvestingAnchor && (
            <HarvestingAnchor
              displayHarvestingBox={displayHarvestingBox}
              handleMouseDown={this.handleMouseDown}
              anchorPosition={harvestingAnchorPosition}
              handleClickAnchor={handleClickAnchor}
            />
          )}
        </div>
      </div>
    );
  }
}

export default HarvestingMenu;