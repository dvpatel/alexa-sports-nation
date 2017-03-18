#!/bin/sh

cp config.json.aws config.json

npm install

zip -r ./homerunking.zip config.json HomerunKingLambda.js my_modules/ node_modules/

aws lambda create-function \
--region us-east-1 \
--function-name homerunking \
--zip-file fileb:///Users/dipesh/Development/workspace/alexa-baseball/lambda/homerunking.zip \
--role arn:aws:iam::723307513402:role/AlexaLambda \
--handler HomerunKingLambda.handler \
--timeout 10 \
--runtime nodejs4.3 

cp config.json.local config.json
