const MySQLEvents = require('../MySQLEvents/MySQLEvents');

/**
 * @param {Object|Connection|String} connection
 * @param {Object} options
 */
class SocketsHandler {
    constructor(DBConnection,ioConnection) {
        this.instance = new MySQLEvents(DBConnection, {
            startAtEnd: true
        });
        this.ioConnection = ioConnection;
    }

    /**
     * @return {{BINLOG, TRIGGER_ERROR, CONNECTION_ERROR}}
     * @constructor
     */
    async start() {
        await this.instance.start();
    }
    async addTrigger(trigger) {

        const onEventMiddleware = (data) => {
            let cleanData = trigger.onEvent(data);

            let socketRoom = cleanData?.[0];
            let eventName = cleanData?.[1];
            let eventData = cleanData?.[2];

            console.log("NIV",socketRoom,eventName);
            this.ioConnection.to(socketRoom).emit(eventName,eventData);
        }

        trigger.onMysqlEvent = onEventMiddleware;

        this.instance.addTrigger(trigger);
    }

    onError(fn) {
        this.instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, fn);
    }

}

module.exports = SocketsHandler;
