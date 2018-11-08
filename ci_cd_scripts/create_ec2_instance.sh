#!/bin/sh

aws ec2 run-instances   \
    --image-id ami-00035f41c82244dab    \
    --instance-type t2.nano \
    --count 1   \
    --placement AvailabilityZone=eu-west-1a \
    --key-name victor   \
    --security-group-ids "sg-0b6c0251567043d03" \
    --associate-public-ip-address   \
    --user-data file://~/assembl/ci_cd_scripts/user-data.txt

aws rds create-db-instance  \
    --engine postgres   \
    --db-instance-class db.t2.micro \
    --no-multi-az   \
    --storage-type gp2  \
    --allocated-storage 20  \
    --db-instance-identifier test-instance \
    --master-username master    \
    --master-user-password secret99 \
    --db-subnet-group-name default  \
    --no-publicly-accessible    \
    --availability-zone eu-west-1a  \
    --vpc-security-group-ids "sg-0b6c0251567043d03" \
    --db-name rd_test   \
    --port 5432 \
    --db-parameter-group-name default.postgres10    \
    --option-group-name default:postgres-10 \
    --enable-iam-database-authentication    \
    --backup-retention-period 7 \
    --preferred-backup-window 02:00-03:00   \
    --monitoring-interval 0 \
    --preferred-maintenance-window Mon:03:00-Mon:04:00  \
    --no-deletion-protection