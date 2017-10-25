import React from 'react';
import TopPostForm from '../common/topPostForm';
import { multiColumnMapping } from '../../../utils/mapping';
import { hexToRgb } from '../../../utils/globalFunctions';
import { COLUMN_OPACITY_GAIN } from '../../../constants';

export default ({ color, classifier, ideaId, ideaTitle, refetchIdea }) => {
  const mapping = multiColumnMapping(ideaTitle).createTopPost;
  return (
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
            <h3 className="dark-title-3 no-margin">
              {mapping[classifier]}
            </h3>
          </div>
          <div className="clear" />
        </div>
        <TopPostForm ideaId={ideaId} refetchIdea={refetchIdea} ideaOnColumn messageClassifier={classifier} />
        <div className="clear" />
      </div>
    </div>
  );
};