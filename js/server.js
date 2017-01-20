var mongo = require('mongodb').MongoClient,
    client = require('socket.io').listen(8080).sockets;

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

mongo.connect('mongodb://192.168.137.1/chat', function(err, db) {
    if(err) throw err;

    client.on('connection', function(socket) {

        var col = db.collection('messages'),
            total = col.find(),
            toDisp = total - 50,
            sendStatus = function(s) {
                socket.emit('status', s);
            };

        // Emit all messages

        col.find().sort({$natural: -1}).limit(50).toArray(function(err, res) {
            if(err) throw err;
            socket.emit('output', res);
        });

        // wait for input
        socket.on('input', function(data) {
            var name = data.name,
                message = data.message
                whitespacePattern = /^\s*$/;

            if(whitespacePattern.test(name) || whitespacePattern.test(message)){
                sendStatus('Name and message is required!');
            } else {
                col.insert({name: name, message:message}, function() {
                    // emit all latest messages
                    client.emit('output', [data]);
                    localStorage.setItem('name', data.name);

                    sendStatus({
                        message: "Message sent!",
                        clear: true
                    });
                });
            }
        });
    });
});

