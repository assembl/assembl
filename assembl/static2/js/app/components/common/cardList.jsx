// @flow
import React from 'react';
import { Row, Col } from 'react-bootstrap';

class CardList extends React.Component {
  render() {
    const { data, CardItem, itemClassName, classNameGenerator } = this.props;
    return (
      <Row className="no-margin">
        {data.map((cardData, index) => {
          return (
            <Col
              xs={12}
              sm={6}
              md={3}
              className={classNameGenerator ? classNameGenerator(itemClassName, index) : itemClassName}
              key={index}
            >
              <CardItem {...cardData} index={index} />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default CardList;