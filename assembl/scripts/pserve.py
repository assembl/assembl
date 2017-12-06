import os
import sys
import traceback

from pyramid.scripts.pserve import PServeCommand


def main(argv=sys.argv, quiet=False):
    command = PServeCommand(argv, quiet)
    try:
        os.environ["NODE_ENV"] = "development"
        return command.run()
    except Exception:
        traceback.print_exc()
        import pdb; pdb.post_mortem()


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main() or 0)
