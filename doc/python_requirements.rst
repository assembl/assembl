Python Requirements
===================

We use `pip` to install python requirements, as specified in `requirements.txt`. This file is generated from a set of base requirements, both to limit what is installed on production servers and to alleviate version tracking. So developers define a set of base required python modules in files of the form `requirements-*.in`. There are many such files, according to a subsets of tasks: production, testing, documentation generation, changes router (`requirements-chrouter.in` corresponds to requirements for task `assembl/processes/changes_router.py`). From these, the fabric task `app_compile` will do the following:

1. In a given `config.rc` file, we define a set of such `.in` modules in the `_requirement_inputs` config variable. This combination is converted to a set of frozen requirements, including all dependencies, through `pip-compile`, part of `pip-tools`_. The frozen requirements are stored in one of the files `requirements-*.frozen.txt`, whose precise name is given in the `frozen_requirements` config variable. This compilation step is done for one given file in the `generate_new_requirements` fabric task, and globally in the `generate_frozen_requirements` fabric task.

2. The frozen requirement file (specified by `frozen_requirements`) is copied to `requirements.txt` (in the `ensure_requirements` fabric task).

3. This is used by `pip` to install requirements (in `update_pip_requirements` fabric task), and is referred to again by `setup.py`.

Note: `pip-tools` is still dependent on `pip<10`, though in theory it can coexist with `pip>=10`.

So as a developer, the main task is to keep `requirements-*.in` files up to date; and when you update them, you'll run the `generate_frozen_requirements` task to regenerate the frozen requirements, and commit those as well.

.. _`pip-tools`: https://github.com/jazzband/pip-tools
