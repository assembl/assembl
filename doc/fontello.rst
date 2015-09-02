Fontello
--------

To add icons to Fontello, first run ``fab devenv start_edit_fontello_fonts``.
This will open a web page on Fontello with our icons preselected, and initialize a local ID.
Select more icons on this page, upload SVG files, etc. When you are done, run ``fab devenv compile_fontello_fonts``. The updated fonts will be in ``assembl/static/css/fonts``, add them with git.

To edit the svg paths themselves, take the SVG paths in config.json and edit them in a svg editor, such as http://svg-edit.googlecode.com/svn/branches/stable/editor/svg-editor.html
