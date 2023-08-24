const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY_HERE';

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new user', (name) => {
        if (!users.some(user => user.id === socket.id)) { // Check if user isn't already added
            users.push({
                id: socket.id,
                name: name
            });
            io.emit('update users', users.map(user => user.name)); // Emit only names, not socket IDs
        }
    });

    socket.on('chat message', async (msg) => {
        // Check for calculator command
        const calcCommand = msg.text.match(/^\/calc\((.*?)\)$/);
        if (calcCommand) {
            try {
                // WARNING: Using eval can be risky! Ensure input is sanitized.
                let result = eval(calcCommand[1]);
                socket.emit('chat message', {
                    name: 'Calculator Bot',
                    text: `Result: ${result}`
                });
            } catch (error) {
                socket.emit('chat message', {
                    name: 'Calculator Bot',
                    text: 'Invalid calculation.'
                });
            }
        } else if (msg.text === '/news') {
            try {
                const response = await axios.get(NEWS_API_ENDPOINT);
                const articles = response.data.articles;
        
                if (articles.length) {
                    socket.emit('chat message', {
                        name: 'News Bot',
                        text: articles[0].title + ' - ' + articles[0].description
                    });
                } else {
                    socket.emit('chat message', {
                        name: 'News Bot',
                        text: 'No news available at the moment.'
                    });
                }
            } catch (error) {
                socket.emit('chat message', {
                    name: 'News Bot',
                    text: 'Error fetching news. Please try again later.'
                });
            }
        } else {
            io.emit('chat message', msg);
        }
    });
    

    socket.on('disconnect', () => {
        users = users.filter(user => user.id !== socket.id);
        io.emit('update users', users.map(user => user.name)); // Emit only names, not socket IDs
        console.log('A user disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('http://localhost:3000/');
});
