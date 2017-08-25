import React from 'react';

export default ({ longTitle }) => {
  return longTitle
    ? <div className="synthesis-container">
      <div className="insert-box">
        <h3 className="dark-title-4">What we need to know:</h3>
        <div className="box-hyphen">&nbsp;</div>
        <div className="insert-content margin-s">
          {<p dangerouslySetInnerHTML={{ __html: longTitle }} />}
        </div>
      </div>
    </div>
    : null;
};