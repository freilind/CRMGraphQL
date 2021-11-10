const { gql } = require('apollo-server');

//schema
const typeDefs = gql`

    type User {
        id: ID
        name: String
        lastname: String
        email: String
        created: String
    }

    input UserInput {
        name: String!
        lastname: String!
        email: String!
        password: String!
    }

    type Token {
        token: String
    }

    input AuthenticationInput {
        email: String!
        password: String!
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        created: String
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        client: Client
        seller: ID
        created: String
        status: OrderStatus
    }

    type OrderGroup {
        id: ID
        quantity: Int
        name: String
        price: Float
    }

    input OrderProductInput {
        id: ID
        quantity: Int
        name: String
        price: Float
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        client: ID
        status: OrderStatus
    }

    enum OrderStatus {
        PENDING
        DONE
        CANCEL
    }

    type Client {
        id: ID
        name: String
        lastname: String
        company: String
        email: String
        phone: String
        seller: ID
        created: String
    }

    input ClientInput {
        name: String!
        lastname: String!
        company: String!
        email: String!
        phone: String
    }

    type TopClient {
        total: Float
        client: [Client]
    }

    type TopSeller {
        total: Float
        seller: [User]
    }

    type Query{
        # Users
        getUser: User

        # Products
        getProducts: [Product]
        getProduct(id: ID! ) : Product

        # Clients
        getClients: [Client]
        getClientsSeller: [Client]
        getClient(id: ID!): Client

        # Orders
        getOrders: [Order]
        getOrdersSeller: [Order]
        getOrder(id: ID!): Order
        getOrderStatus(status: String!): [Order]

        # advanced query
        topClients: [TopClient]
        topSellers: [TopSeller]
        searchProduct(text: String! ) : [Product]
    }

    type Mutation {
        # Users
        newUser(input: UserInput) : User
        authentication(input: AuthenticationInput ) : Token

        # Products
        newProduct(input: ProductInput) : Product
        updateProduct(id: ID!, input: ProductInput) : Product
        deleteProduct(id: ID!) : String

        # Clients
        newClient(input: ClientInput) : Client
        updateClient(id: ID!, input: ClientInput) : Client
        deleteClient(id: ID!) : String

        # Orders
        newOrder(input: OrderInput) : Order
        updateOrder(id: ID!, input: OrderInput) : Order
        deleteOrder(id: ID!) : String
    }
`;

module.exports = typeDefs;
