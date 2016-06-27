"""List icons defined in Fontello"""
# to run: python assembl/scripts/list_css_icons.py

import json


def main():
    with open('assembl/static/css/fonts/config.json') as data_file:
        data = json.load(data_file)
        l = [i["css"] for i in data["glyphs"]]
        print(l)

if __name__ == '__main__':
    main()
