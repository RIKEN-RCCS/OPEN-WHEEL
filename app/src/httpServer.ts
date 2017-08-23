import http = require('http');
import fs = require('fs');
import url = require('url');
import path = require('path');
import util = require('util');
import qs = require('querystring');
import logger = require('./logger');

/**
 * HTTP server class
 */
class HttpServer {

    /**
     * HTTP server instance
     */
    private static server;

    /**
     * default port number
     */
    private static portNumber: number = process.env.port || 1337;

    /**
     * encoding string
     */
    private static readonly encoding: string = 'UTF-8';

    /**
     * HTTP response header options
     */
    private static headers: { [extension: string]: any } = {
        '.htm': { 'Content-Type': 'text/html', charset: HttpServer.encoding },
        '.html': { 'Content-Type': 'text/html', charset: HttpServer.encoding },
        '.css': { 'Content-Type': 'text/css', charset: HttpServer.encoding },
        '.js': { 'Content-Type': 'text/javascript', charset: HttpServer.encoding },
        '.json': { 'Content-Type': 'text/javascript', charset: HttpServer.encoding },
        '.jpg': { 'Content-Type': 'text/jpeg' },
        '.jpeg': { 'Content-Type': 'text/jpeg' },
        '.png': { 'Content-Type': 'text/png' }
    };

    /**
     * start HTTP server
     * @param port port number
     * @return http server
     */
    public static start(port?: number): http.Server {

        if (port != null) {
            this.portNumber = port;
        }

        this.server = http.createServer(requestListener);
        this.server.listen(this.portNumber);
        logger.info(`start http server. port=${this.portNumber}.`);

        return this.server;

        function requestListener(request: http.IncomingMessage, response: http.ServerResponse) {
            const requestUrl = url.parse(request.url, true);
            const pathname = requestUrl.pathname;
            const filename = HttpServer.convertReqpathToFilepath(pathname);

            fs.readFile(filename, readFileCallback);

            function readFileCallback(err: NodeJS.ErrnoException, data: Buffer) {
                if (err) {
                    logger.error(err);
                    response.writeHead(404, { 'Content-Type': 'text/plain' });
                    response.end('not found');
                    return;
                }

                const extension = path.extname(pathname);

                if (request.method === 'GET') {
                    response.writeHead(200, HttpServer.headers[extension]);
                    response.end(data);
                }
                else if (request.method === 'POST') {
                    const body: (string | Buffer)[] = [];
                    request.on('data', (data) => {
                        body.push(data);
                    });
                    request.on('end', () => {
                        const post = qs.parse(body.join());
                        const cookies: string[] = Object.keys(post).map(key => `${key}=${encodeURIComponent(path.normalize(post[key]))}`);
                        response.setHeader('Set-Cookie', cookies);
                        response.writeHead(200, HttpServer.headers[extension]);
                        response.end(data.toString());
                    });
                }
            }
        }
    }

    /**
     * convert request path to file path
     * @param requestPath request path
     * @return converted file path
     */
    private static convertReqpathToFilepath(requestPath: string): string {
        if (requestPath === '/') {
            requestPath = '/swf/home.html';
        }
        return path.join(__dirname, 'public', requestPath);
    }
}

export = HttpServer;