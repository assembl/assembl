import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

class Index extends Component {
  render() {
    return (
      <Grid className="integration">
        <Row>
          <Col xs={12}>
            <h1>HTML/CSS/React components integration 101</h1>

            <h2>Prerequisites</h2>
            <p>Make sure the following commands work on your local machine</p>
            <ol>
              <li>`yarn test` from `static2`</li>
              <li>`yarn run storybook` from `static2`</li>
              <li>`open http://localhost:9001/` should open Storybook homepage</li>
              <li>`open http://localhost:6543/integration` should open the integration homepage</li>
            </ol>

            <h2>Instruction to follow when creating a page</h2>
            <p>The instruction below uses `static2/js/app/integration/101/index.jsx` example</p>

            <ol>
              <li>Edit index.jsx in `static2/js/app/integration` and add your new entry (e.g. index.jsx)</li>
              <li>Edit routes.json in `static2` and add your new entry (e.g. integration/101/index)</li>
              <li>
                <ul>
                  <li>Edit routes.jsx in `static2/js/app`</li>
                  <li>Import the page you created in `static2/js/app/integration` (e.g. Int101Page)</li>
                  <li>Add the new integration route (e.g. Int101Page)</li>
                </ul>
              </li>
              <li>
                <ul>
                  <li>Edit views.py in `views/discussion`, in `def includeme(config)`</li>
                  <li>Add your new entry in `config.add_route` (e.g. integration_101)</li>
                  <li>Add your new entry in `react_routes` array (e.g. integration_101)</li>
                </ul>
              </li>
            </ol>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Index;