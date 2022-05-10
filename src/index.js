const express = require('express')
const { randomUUID } = require('crypto')

const app = express()
app.use(express.json())

const customers = []

const verifyIfExistsAccountCPF = (request, response, next) => {
  const { cpf } = request.headers
  const customer = customers.find(customer => customer.cpf === cpf)
  if (!customer) return response.status(400).json({ error: { message: 'Customer not found...' } })
  request.customer = customer
  return next()
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return response.status(400).json({ error: { message: 'Customer already exists!' } })
  }

  const newCustomer = { id: randomUUID(), name, cpf, statement: [] }
  customers.push(newCustomer)
  return response.status(201).json({ data: newCustomer })
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.json({ data: customer.statement })
})

const port = 3333
app.listen(port, () => console.log(`Server running at: http://localhost:${port}`))