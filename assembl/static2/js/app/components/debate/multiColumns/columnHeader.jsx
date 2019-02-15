// @flow

import * as React from 'react';
import TopPostForm from '../common/topPostForm';
import { hexToRgb } from '../../../utils/globalFunctions';
import { COLUMN_OPACITY_GAIN } from '../../../constants';

const ColumnHeader = ({
  color,
  classifier,
  title,
  ideaId,
  refetchIdea,
  withColumnHeader
}: {
  color: string,
  classifier: string,
  title: string,
  ideaId: string,
  refetchIdea: Function,
  withColumnHeader: boolean
}) => (
  <div className="column-header">
    <div
      style={{
        backgroundColor: color && `rgba(${hexToRgb(color)},${COLUMN_OPACITY_GAIN})`
      }}
    >
      <div className="start-discussion-container">
        <div className="start-discussion-icon">
          <span className="assembl-icon-discussion color" />
        </div>
        <div className={'start-discussion start-discussion-multicol'}>
          <h3 className="dark-title-3 no-margin">{title}</h3>
        </div>
        <div className="clear" />
      </div>
      {withColumnHeader ? (
        <TopPostForm ideaId={ideaId} refetchIdea={refetchIdea} ideaOnColumn messageClassifier={classifier} scrollOffset={240} />
      ) : null}
      <div className="clear" />
    </div>
  </div>
);

export default ColumnHeader;