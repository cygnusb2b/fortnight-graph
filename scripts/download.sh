#!/bin/zsh

rm -rf dump/
mongodump --host rs01.aquaria.parameter1.com --username $USER --password $PASSWORD --authenticationDatabase admin -d fortnight
mongodump --host rs01.aquaria.parameter1.com --username $USER --password $PASSWORD --authenticationDatabase admin -d fortnight-example
mongorestore --host localhost:8101 --drop
