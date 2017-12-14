// @flow
import React from 'react';

import BoxWithHyphen from '../../common/boxWithHyphen';

export type Props = {
  classifier: string,
  synthesisTitle: string,
  synthesisBody: string,
  hyphenStyle: Object
};

const ColumnSynthesis = ({ classifier, synthesisTitle, synthesisBody, hyphenStyle }: Props) => (
  <div id={`synthesis-${classifier}`} className="box synthesis background-grey">
    <BoxWithHyphen
      additionalContainerClassNames="column-synthesis"
      subject={synthesisTitle}
      body={synthesisBody}
      hyphenStyle={hyphenStyle}
    />
  </div>
);

export default ColumnSynthesis;