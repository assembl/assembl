Updating Fonts and Icons in Assembl
===================================

There are currently (as of 06/28/2017) two methods in using fontello in order to update icons and fonts
in Assembl.


Assembl Version 1
-----------------

To add icons to Fontello, first run ``fab devenv start_edit_fontello_fonts``.
This will open a web page on Fontello with our icons preselected, and initialize a local ID.
Select more icons on this page, upload SVG files, and name them as "name" not "icon-name". When you are done, run ``fab devenv compile_fontello_fonts``. The updated fonts will be in ``assembl/static/css/fonts``, add them with git.
You need to add them on _icon.scss with the right unicode. You have to clear the cache to see them on Chrome.

To edit the svg paths themselves, take the SVG paths in config.json and edit them in a svg editor, such as http://svg-edit.googlecode.com/svn/branches/stable/editor/svg-editor.html


Assembl Version 2
-----------------

To add icons to Fontello_, visit the website first. Create the environment that Assembl currently has on the platform
by uploading the :download:`assembl/static2/config.json` file.

After updating icons on Fontello, re-download the icons and update the following:

- Copy/paste to override the :download:`assembl/static2/config.json` with the latest version of this file
- Copy/paste to override the fonts files (\*\.woff, \*\.woff2, \*\.ttf, \*\.eot, etc) files to the files hosted under ``assembl/static2/fonts/`` folder.
- Update :download:`assembl/static2/css/components/assembl-glyph.scss` in order to have the latest CSS versions of the icons available to you. An example is shown below.
  You should update the hash in the font urls to force the browser to download the new fonts.
- Add your icons name in the icons variable at the top of the :download:`assembl/static2/js/app/components/styleguide/icons.jsx` file.

.. code-block:: scss

	// Add a new line similar in fashion to the template shown below
	// .assembl-icon-<icon-name>:before { content: <Icon Bytecode>; } /* <Shape of the icon> */
	// For example:

	.assembl-icon-google:before { content: '\f1a0'; } /* '' */

.. note::

	Be careful if you decide to change this directory, as you must also update the Webpack process in order to accomodate the new location for the fonts. The fonts directory, which is consumed in the stylesheets is defined in ``assembl/static2/css/variables.scss``. The definition is shown below.

.. code-block:: scss

	$fonts-dir: '/static2/fonts';

.. _Fontello: http://fontello.com
