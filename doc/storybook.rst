Documenting components with storybook
=====================================

Official documentation: `https://storybook.js.org`_

Configuration
-------------

The storybook config files lies in ``assembl/static2/.storybook/``. The main config file is ``config.js``. If you need to, you can extend storybook webpack config by updating ``.storybook/webpack.config.js`` (see `custom webpack config`_ in storybook documentation).
If you want to add new stories files, you have to add an entry in ``loadStories`` function in ``config.js``.

View the storybook
------------------

Run storybook::

    $ cd assembl/static2
    $ yarn run storybook

Access the storybook at `http://localhost:9001`_

When you create a new component, please add stories for it in ``assembl/static2/js/app/stories/``.

Write a story
-------------

A story is simply a javascript function that returns a React element.

Example::

    storiesOf('Loader', module)
    .add('with text', () => <Loader textHidden={false} />)
    .add('with text and color', () => <Loader color="#891" />)
    .add('with text hidden', () => <Loader textHidden />)
    .add('with text hidden and color', () => <Loader color="#933" textHidden />);

Please read storybook documentation for more details and advanced features, especially `writing stories`_ and `react guide`_ sections.

.. _`http://localhost:9001`: http://localhost:9001
.. _`https://storybook.js.org`: https://storybook.js.org/basics/introduction/
.. _`custom webpack config`: https://storybook.js.org/configurations/custom-webpack-config/
.. _`react guide`: https://storybook.js.org/basics/guide-react/
.. _`writing stories`: https://storybook.js.org/basics/writing-stories/
