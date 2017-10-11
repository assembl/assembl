// @flow
import classnames from 'classnames';
import React from 'react';
import { Localize } from 'react-redux-i18n';

type BoxWithHyphenProps = {
  additionalContainerClassNames: string,
  body: string,
  date: string, // TODO:  date iso format type checking
  href: string,
  subject: string,
  title: string
};

const BoxWithHyphen = ({ additionalContainerClassNames, body, date, href, subject, title }: BoxWithHyphenProps) => {
  const containerClassNames = classnames([additionalContainerClassNames, 'box-with-hyphen']);
  return (
    <div className={containerClassNames}>
      <a href={href}>
        <div className="insert-box">
          <h3 className="dark-title-4 ellipsis">
            <div>
              {title}
            </div>
            <div className="ellipsis margin-xs">
              {subject}
            </div>
          </h3>
          <div className="box-hyphen">&nbsp;</div>
          <div className="date">
            {date ? <Localize value={date} dateFormat="date.format2" /> : null}
          </div>
          <div className="insert-content margin-s">
            <p dangerouslySetInnerHTML={{ __html: body }} />
          </div>
        </div>
      </a>
    </div>
  );
};

BoxWithHyphen.defaultProps = {
  additionalContainerClassNames: '',
  date: '',
  href: ''
};

export default BoxWithHyphen;