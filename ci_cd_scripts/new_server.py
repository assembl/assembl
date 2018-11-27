#!/usr/bin/env python

import boto3
import json
import sys


def create_ec2():
    ec2 = boto3.resource('ec2')
    with open(sys.argv[1]) as f:
        config = json.load(f)
    with open(sys.argv[2], 'r') as f:
        user_data = f.read()
    ec2.create_instances(
        ImageId=config["ec2"]["image_id"],
        InstanceType=config["ec2"]["instance_type"],
        KeyName=config["ec2"]["key_name"],
        MaxCount=1,
        MinCount=1,
        Placement={
            'AvailabilityZone': config["ec2"]["availability_zone"]
        },
        SecurityGroupIds=[
            config["ec2"]["security_group_ids"]
        ],
        UserData=user_data
    )


def create_rds():
    rds = boto3.client('rds')
    with open(sys.argv[1]) as f:
        config = json.load(f)
    rds.create_db_instance(
        DBName=config['rds']['db_name'],
        DBInstanceIdentifier=config['rds']['db_instance_identifier'],
        AllocatedStorage=config['rds']['allocated_storage'],
        DBInstanceClass=config['rds']['db_instance_class'],
        Engine=config['rds']['engine'],
        MasterUsername=config['rds']['master_username'],
        MasterUserPassword=config['rds']['master_user_password'],
        VpcSecurityGroupIds=[
            config['rds']['security_group_ids']
        ],
        AvailabilityZone=config['rds']['availability_zone'],
        DBSubnetGroupName=config['rds']['db_subnet_group_name'],
        PreferredMaintenanceWindow='Mon:03:00-Mon:04:00',
        DBParameterGroupName=config['rds']['db_parameter_group_name'],
        BackupRetentionPeriod=7,
        PreferredBackupWindow='02:00-03:00',
        Port=config['rds']['port'],
        MultiAZ=False,
        EngineVersion='10.5',
        OptionGroupName=config['rds']['option_group_name'],
        PubliclyAccessible=False,
        StorageType='gp2',
        MonitoringInterval=0,
        EnableIAMDatabaseAuthentication=True,
        DeletionProtection=False
    )


def check_argv():
    # check number of args
    if len(sys.argv) != 3:
        print "Usage: %s <path_to_new_server_json> <path_to_user_data_file>" % (__file__)
        sys.exit(1)
    # try to open the file given as first arg
    try:
        open(sys.argv[1])
    except IOError:
        print "Could not open file %s" % (sys.argv[1])
        sys.exit(1)
    # try to open the file given as second arg
    try:
        open(sys.argv[2], 'r')
    except IOError:
        print "Could not open file %s" % (sys.argv[2])
        sys.exit(1)


def new_server():
    check_argv()
    create_ec2()
    create_rds()


if __name__ == "__main__":
    new_server()
