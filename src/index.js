const express = require('express');
const { v4: uuidv4 } = require("uuid");
// v4 gera numero rondomicos 

const app = express();

app.use(express.json());

const users = [];

// middleware
function verifyIfExistsAccountEmail(request, response, next) {
    const { email } = request.headers;

    const user = users.find(user => user.email === email);
    
    if(!user){
        return response.status(400).json({error: "User not found"});
    }

    request.user = user;

    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'deposit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

// criacao de conta
app.post("/account", (request, response) => {
    const {email, password} = request.body;

    const userAlreadyExists = users.some(
        (user) => user.email === email
    );

    if(userAlreadyExists){
        return response.status(400).json({error: "User already exists!"});
    }
    
    users.push({
        email,
        password,
        id: uuidv4(),
        statement: [],
    });

    return response.status(201).send();
})

// app.use(verifyIfExistsAccountEmail); utilizado quando for usado o middleware em todas as rotas

// buscar o saldo do cliente
app.get("/statement", verifyIfExistsAccountEmail, (request, response) => {
    const { user } = request;
    return response.json(user.statement);
})

app.post("/deposit", verifyIfExistsAccountEmail, (request, response) =>{
    const { description, amount} = request.body;

    const { user } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "deposit"
    }

    user.statement.push(statementOperation);

    return response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountEmail, (request, response) => {
    const { description, amount} = request.body;

    const { user } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "withdraw"
    }

    user.statement.push(statementOperation);

    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountEmail, (request, response) => {
    const { user } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = user.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return response.json(statement);
})

app.put("/account", verifyIfExistsAccountEmail, (request, response) => {
    const { password } = request.body;
    const { user } = request;

    user.password = password;

    return response.status(201).send();
})

app.get("/account", verifyIfExistsAccountEmail, (request, response) => {
    const { user } = request;

    return response.json(user);
});

app.delete("/account", verifyIfExistsAccountEmail, (request, response) => {
    const { user } = request;

    users.splice(user, 1);

    return response.status(200).json(users);
})

app.get("/balance", verifyIfExistsAccountEmail, (request, response) => {
    const { user } = request;

    const balance = getBalance(user.statement);

    return response.json(balance);
})

app.listen(3333);