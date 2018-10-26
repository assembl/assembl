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