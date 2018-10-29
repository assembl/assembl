import os
import json

prod_clients_json = os.environ.get('PROD_CLIENTS')

print(prod_clients_json)

prod_clients = json.load(prod_clients_json)
for client in prod_clients.prod_clients:
    print(client.hostname)
