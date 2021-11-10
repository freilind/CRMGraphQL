const { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const connectDB = require('./config/db');

connectDB();

//server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const token = req.headers['authorization'] || '';
        if(token) {
            try {
                const user = jwt.verify(token.replace('Bearer ', ''), process.env.HASHPHRASE);
                return {
                    user
                }
            } catch (error) {
                console.log(error);
            }
        }
    },
    formatError: (err) => {
        return err;
    }
});

server.listen({ port: process.env.PORT || 4000 }).then( url => {
    console.log(`Server running in ${url}`); 
});
