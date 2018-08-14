// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

// Components for the main project should be created in the component folder in static2/js/app/components
// Stories for the main project should be created in the stories folder in static2/js/app/stories
// The import path used below is only used as an example for instruction purpose
import Button101 from './components/button101';

type Props = {};

class Index extends Component<Props> {
  buttonTappedHandler = () => {
    /* eslint-disable */
    console.log('It\'s working !');
    /* eslint-enable */
  }

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

            <h2>Instruction to follow when creating a component</h2>
            <p>The instruction below uses `static2/js/app/integration/101/components/button101.jsx` example</p>
            <ol>
              <li>Create the new component in `static2/js/app/components` (e.g. button101.jsx)</li>
              <li>Display the new component in a page (created in the previous section for instance)</li>
              <li>Create or update its SCSS style from `static2/css/components`</li>
              <li>Create the new story in `static2/js/app/stories` (e.g. button101.stories.jsx)</li>
              <li>Edit config.js in `static2/.storybook` and add the new story in `loadStories` </li>
              <li>Display the component in the page</li>
              <li>Run `yarn test storybook.test.js` to snapshot the different component stories</li>
            </ol>
            <p className="text-center">
              <Button101 buttonTappedHandler={this.buttonTappedHandler} />
            </p>

            <h2>Instruction to create unit test on components</h2>
            <p>The instruction below uses `static2/js/app/integration/101/components/button101.spec.jsx` example</p>
            <ol>
              <li>Create a new component spec file in `static2/tests/unit/components`</li>
              <li>In the spec file, import the dummy data created from the stories file instead of creating or duplicating a set of data</li>
              <li>Write your spec to only test component inputs and outputs</li>
              <li>Run `yarn test static2/tests/unit/components/[your_spec_file]` to validate your unit tests</li>
            </ol>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default Index;