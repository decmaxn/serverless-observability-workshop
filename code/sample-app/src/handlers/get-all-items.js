const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const { Unit } = require("aws-embedded-metrics")
const { logMetricEMF } = require('../lib/logging/logger')

let _cold_start = true


exports.getAllItemsHandler = async (event, context) => {
    let response
    try {
        if (_cold_start) {
            //Metrics
            await logMetricEMF(name = 'ColdStart', unit = Unit.Count, value = 1, { service: 'item_service', function_name: context.functionName })
            _cold_start = false
        }
        if (event.httpMethod !== 'GET') {
            await logMetricEMF(name = 'UnsupportedHTTPMethod', unit = Unit.Count, value = 1, { service: 'item_service', operation: 'get-all-items' })
            throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`)
        }

        const items = await getAllItems()
        response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(items)
        }
        //Metrics
        await logMetricEMF(name = 'SuccessfulGetAllItems', unit = Unit.Count, value = 1, { service: 'item_service', operation: 'get-all-items' })
    } catch (err) {
        //Metrics
        await logMetricEMF(name = 'FailedGetAllItems', unit = Unit.Count, value = 1, { service: 'item_service', operation: 'get-all-items' })
        response = {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(err)
        }
    }
    return response
}


const getAllItems = async () => {
    let response
    try {
        var params = {
            TableName: process.env.SAMPLE_TABLE
        }
        response = await docClient.scan(params).promise()
    } catch (err) {
        throw err
    }
    return response
}