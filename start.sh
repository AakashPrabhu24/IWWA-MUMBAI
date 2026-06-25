#!/bin/bash
# =============================================================================
# IWWA Mumbai Web Server Startup Script
# Works on CachyOS / Arch Linux
# =============================================================================

PORT=3000

# Go to the script directory
cd "$(dirname "$0")"

echo "================================================="
echo "        IWWA Mumbai Web Server Installer"
echo "================================================="
echo "Checking for available server environment..."

if command -v python3 &>/dev/null; then
    echo "Using Python 3 static file server..."
    echo "Access your website at: http://localhost:$PORT"
    echo "Press Ctrl+C to stop the server."
    echo "-------------------------------------------------"
    python3 -m http.server $PORT
elif command -v python &>/dev/null; then
    echo "Using Python static file server..."
    echo "Access your website at: http://localhost:$PORT"
    echo "Press Ctrl+C to stop the server."
    echo "-------------------------------------------------"
    python -m http.server $PORT
elif command -v npx &>/dev/null; then
    echo "Using Node npx http-server..."
    echo "Access your website at: http://localhost:$PORT"
    echo "Press Ctrl+C to stop the server."
    echo "-------------------------------------------------"
    npx http-server -p $PORT
else
    # Check for local Node share binary from Zed if available
    ZED_NODE="$HOME/.local/share/zed/node/node-v24.11.0-linux-x64/bin/node"
    if [ -f "$ZED_NODE" ]; then
        echo "Using local Node.js engine file server..."
        echo "Access your website at: http://localhost:$PORT"
        echo "Press Ctrl+C to stop the server."
        echo "-------------------------------------------------"
        "$ZED_NODE" -e "
            const http = require('http');
            const fs = require('fs');
            const path = require('path');
            http.createServer((req, res) => {
                let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
                filePath = filePath.split('?')[0]; // Remove query params
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        let ext = path.extname(filePath);
                        let contentType = 'text/html';
                        if (ext === '.js') contentType = 'text/javascript';
                        if (ext === '.css') contentType = 'text/css';
                        if (ext === '.png') contentType = 'image/png';
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(data);
                    }
                });
            }).listen($PORT);
        "
    else
        echo "Error: No Python or Node.js runtime was found on your system."
        echo "Please install Python ('sudo pacman -S python') or Node.js."
        exit 1
    fi
fi
