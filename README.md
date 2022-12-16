# ZmanEmet - realtime communication between MySQL & Socket.io client
[![CircleCI](https://img.shields.io/github/languages/top/nivapo95/zmanemet)](https://circleci.com/gh/rodrigogs/mysql-events)
![GitHub issues](https://img.shields.io/github/issues/nivapo95/zmanemet)

A [node.js](https://nodejs.org) package for Real-Time update between your MySQL server and the user interface.
The package listens to event on an MySQL database and updates the user in real time.

This package is based on the [original ZongJi](https://github.com/nevill/zongji) and the [original mysql-events](https://github.com/spencerlambert/mysql-events) modules.

Written by [Niv Apo](https://github.com/nivapo95)

## Install
```sh
npm install zmanemet
```

## Quick Start
```javascript
const mysql = require('mysql');
const ZmanEmet = require('zmanemet');
const { Server } = require("socket.io");

const program = async () => {
    
    // Create a connection to your DB
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
    });
    
    // Create a socket.IO server
    const io = new Server(3000);
    
    // Create a ZmanEmet instance and pass your db & socket.io connections
    const instance = new ZmanEmet(connection,io);
    
    // Start your instance
    await instance.start();
    
    // Create a trigger for an event
    let trigger = {
        name: 'TEST',
        expression: 'MY_SCHEMA.users.name',
        statement: "UPDATE", // see MySQLEvents.STATEMENTS.ALL for full list of options
        onEvent: (event) => {
            // Process the event and return the data to send to the client
            let {before,after} = event.affectedRows[0];

            let user_id = after.id;
            let room_id = `user_${user_id}`; // The socket room to send the update
            let event_name = "user.update"; // The event name in the sockets on the client side

            // The data that will be sent to the socket
            let data = {
                user_id:user_id,
                new_name:after.name
            }
            
            // Optional - send an update to the client via socket.io server
            return [room_id,event_name,data];
        },
    };
    zman.addTrigger(trigger);
  
    // Add a listener for connection issues
    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
};

program()
  .then(() => console.log('Waiting for database events...'))
  .catch(console.error);
```

## Usage
  ### #constructor(dbConnection, socketsConnection)

  - Instantiate and create a database connection using a preexisting connection
    ```javascript
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'username',
      password: 'password',
    });

    const myInstance = new ZmanEmet(connection,io);
    ```
  ### #start()
  - start function ensures that MySQL is connected before resolving its promise
    ```javascript
    myInstance.start()
      .then(() => console.log('I\'m running!'))
      .catch(err => console.error('Something bad happened', err));
    ```
  ### #stop()
  - stop function terminates MySQL connection and stops ZongJi before resolving its promise
    ```javascript
    myInstance.stop()
      .then(() => console.log('I\'m stopped!'))
      .catch(err => console.error('Something bad happened', err));
    ```
  ### #pause()
  - pause function pauses MySQL connection until `#resume()` is called, this it useful when you're receiving more data than you can handle at the time
    ```javascript
    myInstance.pause();
    ```
  ### #resume()
  - resume function resumes a paused MySQL connection, so it starts to generate binlog events again
    ```javascript
    myInstance.resume();
    ```
  ### #addTrigger({ name, expression, statement, onEvent })
  - Adds a trigger for the given expression/statement and calls the `onEvent` function when the event happens
    ```javascript
    instance.addTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.MY_TABLE.MY_COLUMN',
      statement: MySQLEvents.STATEMENTS.INSERT,
      onEvent: async (event) => {
        // Here you will get the events for the given expression/statement.
        // This function executes after a trigger has fired from the DB and before the data was sent to the sockets.
        // You can process the data and send just what you want to the socket.io
        
        let socket_room = "";
        let event_name = "";
        let event_data = "";
    
        return [socket_room,event_name,event_data];
      },
    });
    ```
  - The `name` argument must be unique for each expression/statement, it will be user later if you want to remove a trigger
    ```javascript
    instance.addTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.*',
      statement: MySQLEvents.STATEMENTS.ALL,
      ...
    });

    instance.removeTrigger({
      name: 'MY_TRIGGER',
      expression: 'MY_SCHEMA.*',
      statement: MySQLEvents.STATEMENTS.ALL,
    });
    ```
  - The `expression` argument is very dynamic, you can replace any step by `*` to make it wait for any schema, table or column events
    ```javascript
    instance.addTrigger({
      name: 'Name updates from table USERS at SCHEMA2',
      expression: 'SCHEMA2.USERS.name',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events',
      expression: '*',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All events from SCHEMA2',
      expression: 'SCHEMA2.*',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events for table USERS',
      expression: '*.USERS',
      ...
    });
    ```
    ```javascript
    instance.addTrigger({
      name: 'All database events for table USERS',
      expression: '*.USERS',
      ...
    });
    ```
  - The `statement` argument indicates in which database operation an event should be triggered
    ```javascript
    instance.addTrigger({
      ...
      statement: MySQLEvents.STATEMENTS.ALL,
      ...
    });
    ```
    [Allowed statements](https://github.com/nivapo95/zmanemet/blob/master/lib/STATEMENTS.enum.js)
  - The `onEvent` argument is a function where the trigger events should be threated
    ```javascript
    instance.addTrigger({
      ...
      onEvent: (event) => {
        console.log(event); // { type, schema, table, affectedRows: [], affectedColumns: [], timestamp, }
      },
      ...
    });
    ```
  ### #removeTrigger({ name, expression, statement })
  - Removes a trigger from the current instance
    ```javascript
    instance.removeTrigger({
      name: 'My previous created trigger',
      expression: '',
      statement: MySQLEvents.STATEMENTS.INSERT,
    });
    ```
## Tigger event object
It has the following structure:
```javascript
{
  type: 'INSERT | UPDATE | DELETE',
  schema: 'SCHEMA_NAME',
  table: 'TABLE_NAME',
  affectedRows: [{
    before: {
      column1: 'A',
      column2: 'B',
      column3: 'C',
      ...
    },
    after: {
      column1: 'D',
      column2: 'E',
      column3: 'F',
      ...
    },
  }],
  affectedColumns: [
    'column1',
    'column2',
    'column3',
  ],
  timestamp: 1530645380029,
  nextPosition: 1343,
  binlogName: 'bin.001',
}
```

**Make sure the database user has the privilege to read the binlog on database that you want to watch on.**

## LICENSE
[MIT](https://github.com/nivapo95/zmanemet/blob/master/LICENSE) © Niv Apo
