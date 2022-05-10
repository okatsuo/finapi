const express = require('express')
const { randomUUID } = require('crypto')

const app = express()
app.use(express.json())

const customers = []

const responseOk = ({ response, data } = {}) => response.json({ data: data })
const responseCreated = ({ response, data } = {}) => {
  if (!data) return response.status(201).send()
  return response.status(201).json({ data: data })
}
const responseBadRequest = ({ response, message } = {}) => response.status(400).json({ error: { message } })

const verifyIfExistsAccountCPF = (request, response, next) => {
  const { cpf } = request.headers
  const customer = customers.find(customer => customer.cpf === cpf)
  if (!customer) return response.status(404).json({ error: { message: "You don't have permission to be here!" } })
  request.customer = customer
  return next()
}

const getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)
  return balance
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
  if (customerAlreadyExists) return responseBadRequest({ response, message: 'Customer already exists!' })
  const newCustomer = { id: randomUUID(), name, cpf, statement: [] }
  customers.push(newCustomer)
  return responseCreated({ response, data: newCustomer })
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return responseOk({ response, data: customer.statement })
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  if (!amount) return responseBadRequest({ response, message: 'amount field is required.' })
  const { customer } = request
  const statementOperation = {
    description: description ?? null,
    amount,
    created_at: new Date(),
    type: "credit"
  }
  customer.statement.push(statementOperation)
  return responseCreated({ response })
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request
  if (!amount) return responseBadRequest({ response, message: 'amount field is required.' })
  const balance = getBalance(customer.statement)
  if (balance < amount) {
    return responseBadRequest({ response, message: 'Insufficient funds!' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation)
  return responseCreated({ response })
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query
  const dateFormat = new Date(date)
  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
  return responseOk({ response, data: statement })
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name
  return responseCreated({ response, data: customer })
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return responseOk({ response, data: customer })
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const removedCustomer = customers.splice(customer, 1)
  return responseOk({ response, data: removedCustomer[0] })
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const balance = getBalance(customer.statement)
  return responseOk({ response, data: balance })
})

const port = 3333
app.listen(port, () => console.log(`Server running at: http://localhost:${port}`))