import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Tree from '../../common/tree';
import { MIN_WIDTH_COLUMN } from '../../../constants';

class ColumnsView extends React.Component {
  orderPostsByMessageClassifier() {
    const { messageColumns, posts } = this.props;
    const columnsArray = {};
    let keyName = '';
    messageColumns.forEach((col) => {
      keyName = col.messageClassifier;
      columnsArray[keyName] = [];
      posts.forEach((post) => {
        if (post.messageClassifier === keyName) {
          columnsArray[keyName].push({ ...post });
        }
      });
    });

    return columnsArray;
  }
  render() {
    const {
      contentLocaleMapping,
      lang,
      initialRowIndex,
      InnerComponent,
      InnerComponentFolded,
      noRowsRenderer,
      SeparatorComponent,
      isColumnViewInline
    } = this.props;
    const columnsArray = this.orderPostsByMessageClassifier();
    return (
      <Grid fluid className="background-grey no-padding">
        <div className="max-container">
          <div className="columns-view">
            <Row className={isColumnViewInline ? 'columns-view-inline' : ''}>
              {Object.keys(columnsArray).map((classifier, index) => {
                return (
                  <Col
                    xs={12}
                    md={12 / Object.keys(columnsArray).length}
                    key={`col-${index}`}
                    style={isColumnViewInline ? { width: `${MIN_WIDTH_COLUMN}px` } : {}}
                  >
                    <Tree
                      contentLocaleMapping={contentLocaleMapping}
                      lang={lang}
                      data={columnsArray[classifier]}
                      initialRowIndex={initialRowIndex}
                      InnerComponent={InnerComponent}
                      InnerComponentFolded={InnerComponentFolded}
                      noRowsRenderer={noRowsRenderer}
                      SeparatorComponent={SeparatorComponent}
                    />
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>
      </Grid>
    );
  }
}

export default ColumnsView;