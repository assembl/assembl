import React from 'react';

const style = {
  top: '0px',
  height: '300px',
  width: '300px'
};

const childStyle = {
  overflow: 'scroll',
  height: '180px',
  width: '100%'
};

export default ({ longTitle }) => {
  return longTitle
    ? <div className="insert-box" style={style}>
      <h3 className="dark-title-3">What we need to know:</h3>
      <div className="box-hyphen" />
      <div style={childStyle}>
        {<p dangerouslySetInnerHTML={{ __html: longTitle }} />}
          qi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi
          uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud
          uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq
          siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi
          usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi duqi usdq siud uqsdi uqsi du
        </div>
    </div>
    : null;
};