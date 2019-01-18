// @flow
import React from 'react';
// Component imports
import Loader, { LOADER_TYPE } from '../../../components/common/loader/loader';
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';
import TitleWithTooltip from '../../../components/common/titleWithTooltip/titleWithTooltip';
import ResponsiveWordCloud from '../../../components/common/wordCloud/responsiveWordCloud';
import KeywordInfo from '../../../components/common/keywordInfo/keywordInfo';
import fakeData from '../data.json';

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
      <ResponsiveWordCloud keywords={fakeData.keywords} />
      <KeywordInfo keyword={{ text: 'test', relevance: '0.57', count: 5 }} />
    </div>
  );
};

export default SemanticAnalysis;