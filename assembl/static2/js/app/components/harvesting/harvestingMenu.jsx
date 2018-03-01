// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import { I18n } from 'react-redux-i18n';

type LeftSideHarvestingButtonProps = {
  handleClick: Function,
  children: Array<*>
};

const LeftSideHarvestingButton = ({ handleClick, children }: LeftSideHarvestingButtonProps) => (
  <div className="left-side-harvesting-button" role="button" tabIndex={0} onClick={handleClick}>
    <div className="left-side-harvesting-button-inside">{children}</div>
  </div>
);

type ConfirmHarvestButtonProps = {
  handleClick: Function
};

const ConfirmHarvestButton = ({ handleClick }: ConfirmHarvestButtonProps) => (
  <LeftSideHarvestingButton handleClick={handleClick}>
    <span className="confirm-harvest-button assembl-icon-catch" title={I18n.t('harvesting.harvestSelection')}>
      &nbsp;
    </span>
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
  const handleClick = () => {
    // TODO in next story
  };
  return (
    <div className="harvesting-menu" style={style}>
      <ConfirmHarvestButton handleClick={handleClick} />
    </div>
  );
};

const handleMouseUpWhileHarvesting = (evt) => {
  const selObj = window.getSelection();
  const selectedText = selObj.toString();
  let element = document.getElementById('annotation');
  if (!selectedText || selectedText.length === 0) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    return;
  }

  if (!element) {
    element = document.createElement('div');
    element.id = 'annotation';
    document.getElementsByTagName('body')[0].appendChild(element);
  }

  ReactDOM.render(<HarvestingMenu positionY={evt.pageY} positionX={10} />, document.getElementById('annotation'));
};

export const enableHarvestingMode = () => {
  if (document.body) {
    document.body.onmouseup = handleMouseUpWhileHarvesting;
  }
};