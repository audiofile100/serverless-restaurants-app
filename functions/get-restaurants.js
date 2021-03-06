"use strict";

const co = require("co");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const defaultRestaurants = process.env.defaultRestaurants || 8;
const tableName = process.env.restaurants_table;

function* getRestaurants(count) {
    let req = {
        TableName: tableName,
        Limit: count
    };
    let resp = yield dynamodb.scan(req).promise();
    return resp.Items;
}

module.exports.handler = co.wrap(function* (event, context, callback) {
    let restaurants = yield getRestaurants(defaultRestaurants);
    const response = {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    };

    callback(null, response);
});