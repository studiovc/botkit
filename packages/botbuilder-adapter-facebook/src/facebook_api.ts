/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as request from 'request';
import * as crypto from 'crypto';

/**
 * A simple API client for the Facebook API.  Automatically signs requests with the access token and app secret proof.
 * It can be used to call any API provided by Facebook.
 *
 */
export class FacebookAPI {
    private token: string;
    private secret: string;
    private api_host: string;
    private api_version: string;

    /**
     * Create a FacebookAPI client.
     * ```
     * let api = new FacebookAPI(TOKEN, SECRET);
     * await api.callAPI('/some/api','POST', {some_options});
     * ```
     * @param token a page access token
     * @param secret an app secret
     * @param api_host optional root hostname for constructing api calls, defaults to graph.facebook.com
     * @param api_version optional api version used when constructing api calls, defaults to v3.2
     */
    public constructor(token: string, secret: string, api_host: string = 'graph.facebook.com', api_version: string = 'v3.2') {
        if (!token) {
            throw new Error('Token is required!');
        }
        this.token = token;
        this.secret = secret;
        this.api_host = api_host;
        this.api_version = api_version;
    }

    /**
     * Call one of the Facebook APIs
     * @param path Path to the API endpoint, for example `/me/messages`
     * @param method HTTP method, for example POST, GET, DELETE or PUT.
     * @param payload An object to be sent as parameters to the API call.
     */
    public async callAPI(path: string, method: string = 'POST', payload: any = {}, query: any = {}): Promise<any> {
        const proof = this.getAppSecretProof(this.token, this.secret);

        let queryString = '?';

        for(const key in query) {
            queryString = queryString + `${key}=${query[key]}&`;
        }

        return new Promise((resolve, reject) => {
            request({
                method: method,
                json: true,
                body: payload,
                uri: `https://${this.api_host}/${this.api_version}${path}${queryString}access_token=${this.token}&appsecret_proof=${proof}`
            }, (err, res, body) => {
                if (err) {
                    reject(err);
                } else if (body.error) {
                    reject(body.error.message);
                } else {
                    resolve(body);
                }
            });
        });
    }

    /**
     * Make get to a path with a query
     *
     * @param {string} path
     * @param {*} query
     * @returns {Promise<any>}
     * @memberof FacebookAPI
     */
    public async get(path: string, query: any): Promise<any> {
        return this.callAPI(path, 'GET', {}, query);
    }

    /**
     * Make post to a path with a body
     *
     * @param {string} path
     * @param {*} body
     * @param {*} query
     * @returns {Promise<any>}
     * @memberof FacebookAPI
     */
    public async post(path: string, body: any, query: any): Promise<any> {
        return this.callAPI(path, 'POST', body, query);
    }

    /**
     * Generate the app secret proof used to increase security on calls to the graph API
     * @param access_token a page access token
     * @param app_secret an app secret
     */
    private getAppSecretProof(access_token, app_secret): string {
        var hmac = crypto.createHmac('sha256', app_secret || '');
        return hmac.update(access_token).digest('hex');
    }
}
