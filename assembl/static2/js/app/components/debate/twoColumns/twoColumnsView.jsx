import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

class TwoColumnsView extends React.Component {
  orderPostsByMessageClassifier(posts) {
    const columnsArray = {};
    let keyName = '';
    posts.forEach((post) => {
      keyName = post.node.messageClassifier;
      columnsArray[keyName] = [];
    });

    posts.forEach((post) => {
      keyName = post.node.messageClassifier;
      columnsArray[keyName].push({ ...post });
    });

    return columnsArray;
  }
  render() {
    const { posts } = this.props;
    const columnsArray = this.orderPostsByMessageClassifier(posts);
    return (
      <Grid fluid className="background-light">
        <div className="max-container">
          <Row>
            {Object.keys(columnsArray).map(() => {
              return (
                <Col xs={12} md={12 / Object.keys(columnsArray).length}>
                  2colonnes
                </Col>
              );
            })}
          </Row>
        </div>
      </Grid>
    );
  }
}

export default TwoColumnsView;