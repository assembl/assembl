import os
import json

prod_clients_json = os.environ['PROD_CLIENTS']

prod_clients = json.loads(prod_clients_json)

for client in prod_clients["prod_clients"]:
    # We just print a fake list of hostnames for now
    print(client["hostname"])
    # Eventually, we want to launch the deployment for each server using the required arguments for each of them
