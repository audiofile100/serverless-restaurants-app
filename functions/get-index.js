'use strict';

const co = require("co");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const Mustache = require("mustache");
const http = require("superagent-promise")(require("superagent"), Promise);
const aws4 = require("aws4");
const URL = require("url");

// restaurants_api url is defined in serverless.yml in environments for get-index
const restaurantsApiRoot = process.env.restaurants_api
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let html;

// take advantage of container re-use and avoid loading content, or creating DB connection pools on every invocation
function* loadHtml() {
    if (!html) {
        html = yield fs.readFileAsync("static/index.html", "utf-8");
    }
    return html;
}

function* getRestaurants() {
    let url = new URL.URL(restaurantsApiRoot);
    let opts = {
        host: url.hostname,
        path: url.pathname
    };
    aws4.sign(opts);    // sign & add headers to opts

    return (yield http
            .get(restaurantsApiRoot)
            .set("Host", opts.headers["Host"])
            .set("X-Amz-Date", opts.headers["X-Amz-Date"])
            .set("Authorization", opts.headers["Authorization"])
            .set("X-Amz-Security-Token", opts.headers["X-Amz-Security-Token"])
    ).body;
}

module.exports.handler = co.wrap(function* (event, context, callback) {
    let template = yield loadHtml();
    let restaurants = yield getRestaurants();
    let day = days[new Date().getDay()];
    let html = Mustache.render(template, { day, restaurants });
    const response = {
        statusCode: 200,
        body: html,         // we normally use s3 & cloudfront for static content, but for the purpose of this tutorial...
        headers: {
            "Content-Type": "text/html; charset=UTF-8"
        }
    };

    callback(null, response);
});
