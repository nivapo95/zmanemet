const mysql = require('mysql2');
// const MySQLEvents = require('./lib');
const ZmanEmet = require('./lib');
const MySQLEvents = require("./lib/MySQLEvents/MySQLEvents");

// users.fullName -> users.id -> {"user.fullName",user.id}
// leads.email -> lead.userIdAssigned -> {"lead.email",lead.id}

// 1. Columns to listen to (col to listen, cols)
// 2. Handle event
// 3. Pass data to socket based on event


// 1. Listen to leads.email
// 1.5 Process data
// 2. Send socket to leads.userIdAssigned

const replacePlaceholder = (template, placeholders) => {
    //if there is no placeholder, return.
    if (template.indexOf('{') === -1) return template;
    //get the string inside the {}
    let toReplace = template.slice(
        template.indexOf('{'),
        template.indexOf('}') + 1
    );

    let stripped = toReplace?.replace("{","")?.replace("}","");

    return placeholders?.[stripped] || stripped;
};

const handleEvent = (data) => {
    console.log("===");
    console.log(data);
    // console.log(data?.affectedRows?.[0]?.after);

    let listener = {
        table:"leads",
        column:"email",
        to:(data)=> {
            return "user id"
        },
        action:(data)=>{

            return {
                email:"email"
            }
        }
    }


    console.log("listener");

    let row = data?.affectedRows?.[0]?.after;
    listener.to = row?.[listener.to];
    listener.action = replacePlaceholder(listener.action,row);

    console.log("---",listener);
}

const program = async () => {
    const DBConnection = mysql.createConnection({
        host: "127.0.0.1",
        user: "nivtest",
        password: "password",
    });

    const zman = new ZmanEmet(DBConnection);
    zman.start();

    zman.onError(console.error);

    let trigger = {
        name: 'TEST',
        expression: '*',
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: (event) => {
            console.log("event: ",event);

            return ["user_3003","niv",{"a":"b"}];
        },
    };

    await zman.addTrigger(trigger);
}


program()
    .then(() => console.log('Waiting for database events...'))
    .catch(console.error);