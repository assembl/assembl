import os
import json

# prod_clients_json = '{"prod_clients": [{"client_name": "sncf","hostname": "preprod-assembl.bluenove.com"},{"client_name": "edf","hostname": "preprod-assembl.bluenove.com"}]}'

prod_clients_json = os.environ.get('PROD_CLIENTS')

prod_clients = json.loads(prod_clients_json)

for client in prod_clients["prod_clients"]:
    print(client["hostname"])
