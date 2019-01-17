// @flow
import React from 'react';
// Component imports
import Loader, { LOADER_TYPE } from '../../../components/common/loader/loader';
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';
import TitleWithTooltip from '../../../components/common/titleWithTooltip/titleWithTooltip';

const SemanticAnalysis = () => {
  const tooltip = (
    <div>
      <p>
        <strong>Occurence :</strong> nombre de fois où le mot clé apparaît dans le débat ou dans les discussions relatives à la
        thématique en question.
      </p>
      <p>
        <strong>Pertinence :</strong> qualifie l′importance du mot clé pour comprendre le sens général du texte analysé. Le score
        varie de 0 à 1, de faible à fort.
      </p>
    </div>
  );

  return (
    <div className="semantic-analysis">
      <Loader type={LOADER_TYPE.LOADING} />
      <Loader type={LOADER_TYPE.ERROR} />
      <ToolbarSlider defaultValue={50} onSliderChange={() => {}} />
      <TitleWithTooltip level={1} titleContent="Informations mots-clés" tooltipContent={tooltip} />
    </div>
  );
};

export default SemanticAnalysis;