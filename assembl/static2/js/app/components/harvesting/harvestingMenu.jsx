// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import { I18n } from 'react-redux-i18n';
import ARange from 'annotator_range'; // eslint-disable-line
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line

type LeftSideHarvestingButtonProps = {
  label: string,
  handleClick: Function,
  handleMouseDown: Function,
  children: Array<*>
};

const LeftSideHarvestingButton = ({ label, handleClick, handleMouseDown, children }: LeftSideHarvestingButtonProps) => (
  <div className="left-side-harvesting-button">
    <div className="left-side-harvesting-button__label">{label}</div>
    <div
      className="left-side-harvesting-button__button"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="left-side-harvesting-button__button__inside">{children}</div>
    </div>
  </div>
);

type ConfirmHarvestButtonProps = {
  handleClick: Function,
  handleMouseDown: Function
};

const ConfirmHarvestButton = ({ handleClick, handleMouseDown }: ConfirmHarvestButtonProps) => (
  <LeftSideHarvestingButton
    handleClick={handleClick}
    handleMouseDown={handleMouseDown}
    label={I18n.t('harvesting.harvestSelection')}
  >
    <span className="confirm-harvest-button assembl-icon-catch">&nbsp;</span>
  </LeftSideHarvestingButton>
);

type HarvestingMenuProps = {
  positionX: number,
  positionY: number
};

const HarvestingMenu = ({ positionX, positionY }: HarvestingMenuProps) => {
  const style = {
    position: 'absolute',
    left: `${positionX}px`,
    top: `${positionY}px`
  };
  const handleMouseDown = (ev) => {
    // This would otherwise clear the selection
    ev.preventDefault();
    return false;
  };
  const handleClick = () => {
    const selection = window.getSelection();
    const browserRange = ARange.sniff(selection.getRangeAt(0));
    const serialized = browserRange.serialize(document, 'annotation');
    console.log(serialized); // eslint-disable-line
    // elements should be in serialized.{start, end, startOffset, endOffset}
  };
  return (
    <div className="harvesting-menu" style={style}>
      <ConfirmHarvestButton handleClick={handleClick} handleMouseDown={handleMouseDown} handle />
    </div>
  );
};

const harvestingMenuContainerUniqueId = 'harvesting-menu-container';

export const removeHarvestingMenu = () => {
  const harvestingMenuContainer = document.getElementById(harvestingMenuContainerUniqueId);
  if (harvestingMenuContainer && harvestingMenuContainer.parentNode) {
    harvestingMenuContainer.parentNode.removeChild(harvestingMenuContainer);
  }
};

export const handleMouseUpWhileHarvesting = (evt: SyntheticMouseEvent) => {
  const selObj = window.getSelection();
  const selectedText = selObj.toString();
  if (!selectedText || selectedText.length === 0) {
    removeHarvestingMenu();
    return;
  }

  let harvestingMenuContainer = document.getElementById(harvestingMenuContainerUniqueId);
  if (!harvestingMenuContainer) {
    harvestingMenuContainer = document.createElement('div');
    harvestingMenuContainer.id = harvestingMenuContainerUniqueId;
    document.getElementsByTagName('body')[0].appendChild(harvestingMenuContainer);
  }

  const iconSize = 44;
  const positionX = (window.innerWidth - 600) / 2 - iconSize - 50;
  const positionY = evt.pageY - iconSize / 2;

  ReactDOM.render(<HarvestingMenu positionX={positionX} positionY={positionY} />, harvestingMenuContainer);
};