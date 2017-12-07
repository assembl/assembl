// @flow
import React from 'react';
import { Row, Col } from 'react-bootstrap';

type CardListProps = {
  data: Array<Object>,
  itemClassName: string,
  classNameGenerator: Function,
  CardItem: Function | ReactClass<*>
};

class CardList extends React.Component<void, CardListProps, void> {
  props: CardListProps;

  render() {
    const { data, CardItem, itemClassName, classNameGenerator } = this.props;
    return (
      <Row className="no-margin">
        {data.map((cardData, index) => (
          <Col
            xs={12}
            sm={6}
            md={3}
            className={classNameGenerator ? classNameGenerator(itemClassName, index) : itemClassName}
            key={cardData.id || index}
          >
            <CardItem {...cardData} index={index} />
          </Col>
        ))}
      </Row>
    );
  }
}

export default CardList;