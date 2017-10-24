import React from 'react';
import BoxWithHyphen from '../../common/boxWithHyphen';
import TopPostForm from '../common/topPostForm';
import { multiColumnMapping } from '../../../utils/mapping';
import { hexColorToRgba } from '../../../utils/color';
import { COLUMN_OPACITY_GAIN } from '../../../constants';

const Synthesis = ({ classifier, synthesisTitle, synthesisBody, hyphenStyle }) => {
  return (
    <div id={`synthesis-${classifier}`} className="box synthesis">
      <BoxWithHyphen
        additionalContainerClassNames="column-synthesis"
        title={synthesisTitle}
        body={synthesisBody}
        hyphenStyle={hyphenStyle}
      />
    </div>
  );
};

export default ({ synthesis, ideaId, ideaTitle, refetchIdea }) => {
  const mapping = multiColumnMapping(ideaTitle).createTopPost;
  return (
    <div className="column-header">
      {false && <Synthesis {...synthesis} />}
      <div
        style={{
          backgroundColor: synthesis.hyphenStyle && hexColorToRgba(synthesis.hyphenStyle.borderTopColor, COLUMN_OPACITY_GAIN)
        }}
      >
        <div className="start-discussion-container">
          <div className="start-discussion-icon">
            <span className="assembl-icon-discussion color" />
          </div>
          <div className={'start-discussion start-discussion-multicol'}>
            <h3 className="dark-title-3 no-margin">
              {mapping[synthesis.classifier]}
            </h3>
          </div>
          <div className="clear" />
        </div>
        <TopPostForm ideaId={ideaId} refetchIdea={refetchIdea} ideaOnColumn messageClassifier={synthesis.classifier || null} />
        <div className="clear" />
      </div>
    </div>
  );
};