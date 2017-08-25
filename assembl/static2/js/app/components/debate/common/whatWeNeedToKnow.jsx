import React from 'react';
import { Translate } from 'react-redux-i18n';

const style = {
  top: '0px',
  height: '300px',
  width: '300px'
};

const titleStyle = {
  'text-transform': 'uppercase'
};

const childStyle = {
  overflow: 'scroll',
  height: '180px'
};

export default ({ longTitle }) => {
  return longTitle
    ? <div className="insert-box" style={style}>
      <h3 className="dark-title-3" style={titleStyle}>
        <Translate value="debate.whatWeNeedToKnow" />
      </h3>
      <div className="box-hyphen" />
      <div style={childStyle}>
        {<p dangerouslySetInnerHTML={{ __html: longTitle }} />}
      </div>
    </div>
    : null;
};