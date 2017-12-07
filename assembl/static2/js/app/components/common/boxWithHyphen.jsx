// @flow
import classnames from 'classnames';
import React from 'react';
import { Localize } from 'react-redux-i18n';

type BoxProps = {
  body: string,
  date: string, // TODO:  date iso format type checking
  hyphenStyle: Object,
  subject: string,
  title: string
};

type BoxWithHyphenProps = {
  additionalContainerClassNames: string,
  body: string,
  date: string, // TODO:  date iso format type checking
  href: string,
  hyphenStyle: Object,
  subject: string,
  title: string
};

const Box = ({ body, date, hyphenStyle, subject, title }: BoxProps) => (
  <div className="insert-box">
    <h3 className="dark-title-4 ellipsis">
      <div>{title}</div>
      <div className="ellipsis margin-xs">{subject}</div>
    </h3>
    <div className="box-hyphen" style={hyphenStyle}>
      &nbsp;
    </div>
    <div className="date">{date ? <Localize value={date} dateFormat="date.format2" /> : null}</div>
    <div className="insert-content margin-s">
      <p dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  </div>
);

class BoxWithHyphen extends React.Component<*, BoxWithHyphenProps, *> {
  render() {
    const { additionalContainerClassNames, href, ...otherProps } = this.props;
    const containerClassNames = classnames([additionalContainerClassNames, 'box-with-hyphen']);
    return (
      <div className={containerClassNames}>
        {href.length > 1 ? (
          <a href={href}>
            <Box {...otherProps} />
          </a>
        ) : (
          <Box {...otherProps} />
        )}
      </div>
    );
  }
}

BoxWithHyphen.defaultProps = {
  additionalContainerClassNames: '',
  date: '',
  href: '',
  hyphenStyle: {}
};

export default BoxWithHyphen;