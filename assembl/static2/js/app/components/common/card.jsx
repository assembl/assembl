// @flow
import React from 'react';

type CardProps = {
  className: string,
  imgUrl: string,
  children: Array<*>
};

class Card extends React.Component<void, CardProps, void> {
  props: CardProps;

  render() {
    const { className, imgUrl, children } = this.props;
    return (
      <div className={`illustration-box ${className || ''}`}>
        <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
        {children}
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default Card;