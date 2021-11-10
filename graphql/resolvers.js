const User = require('../models/User');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Order = require('../models/Order');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'env/dev.env'});


const createToken = (user, secret, expiresIn) => {
    const { id, name, lastname, email } = user;
    return jwt.sign({id, name, lastname, email }, secret, { expiresIn });
};

const resolvers = {
    Query: {
        getUser: async (_, {}, ctx) => {
            return ctx.user;
        },
        getProducts: async () => {
            try {
                const products = await Product.find();
                return products;
            } catch (err) {
                console.log(err);
            }
        },
        getProduct: async (_, { id }) => {
            const product = await Product.findById(id);
            if(!product) {
                throw new Error('product not exist');
            }
            return product;
        },
        getClients: async () => {
            try {
                const clients = await Client.find();
                return clients;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getClientsSeller: async (_, {}, ctx) => {
            try {
                if(!ctx.user) {
                    return null;
                }
                const clients = await Client.find({ seller: ctx.user.id.toString()});
                return clients;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getClient: async (_, { id }, ctx) => {
            try {
                const client = await Client.findById(id);
                if(!client) {
                    throw new Error('client not exist');
                }

                if(client.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }
                return client;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getOrders: async () => {
            try {
                const orders = await Order.find();
                return orders;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getOrdersSeller: async (_, {}, ctx) => {
            try {
                const orders = await Order.find({ seller: ctx.user.id}).populate('client');
                return orders;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getOrder: async (_, { id }, ctx) => {
            try {
                const order = await Order.findById(id);
                if(!order) {
                    throw new Error('order not exist');
                }

                if(order.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }
                return order;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        getOrderStatus: async (_, { status }, ctx) => {
            try {
                return await Order.find({ seller: ctx.user.id, status});
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        topClients: async () => {
            try {
                return await Order.aggregate([
                    { $match : { status: 'DONE'}},
                    { $group : {
                        _id: '$client',
                        total: { $sum : '$total'}
                    }},
                    {
                        $lookup : {
                            from: 'clients',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'client'
                        }
                    },
                    {
                        $limit: 5
                    },
                    {
                        $sort: { total: -1 }
                    }
                ]);
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        topSellers: async () => {
            try {
                return await Order.aggregate([
                    { $match : { status: 'DONE'}},
                    { $group : {
                        _id: '$seller',
                        total: { $sum : '$total'}
                    }},
                    {
                        $lookup: {
                            from: 'users',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'seller'
                        }
                    },
                    {
                        $limit: 3
                    },
                    {
                        $sort: { total: -1 }
                    }
                ]);
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        searchProduct: async (_, { text }) => {
            try {
                return await Product.find({
                    $text: 
                        { 
                            $search: text
                        }
                }).limit(10);
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
    },
    Mutation: {
        newUser: async (_, { input }) => {
            try {
                const { email, password } = input;

                //check if user exist
                const existUser = await User.findOne({email});
                if(existUser) {
                    throw new Error('user already exist');
                }

                //hash pass
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt)

                //save in db
                const user = new User(input);
                user.save();
                return user;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        authentication: async (_, { input }) => {
            const { email, password } = input;

            //check if user not exist
            const existUser = await User.findOne({email});
            if(!existUser) {
                throw new Error('user not exist');
            }

             //check if pass is correct
             const passwordCorrect = await bcryptjs.compare(password, existUser.password);
             if(!passwordCorrect) {
                throw new Error('password incorrect');
             }

             return {
                 token: createToken(existUser, process.env.HASHPHRASE, '24h' )
             }
        },
        newProduct: async (_, { input }) => {
            try {
                const product = new Product(input);
                const result = await product.save();
                return result;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        updateProduct: async (_, { id, input }) => {
            try {
                let product = await Product.findById(id);
                if(!product) {
                    throw new Error('product not exist');
                }

                product = await Product.findOneAndUpdate({ _id: id}, input, { new: true });
                return product;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        deleteProduct: async (_, { id }) => {
            try {
                let product = await Product.findById(id);
                if(!product) {
                    throw new Error('product not exist');
                }

                await Product.findOneAndDelete({ _id: id});
                return 'product deleted';
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        newClient: async (_, { input }, ctx) => {
            try {
                const { email, company } = input;
                let emailExist = await Client.findOne({email});
                let companyExist = await Client.findOne({company});
                if(emailExist) {
                    throw new Error('Email exist');
                }
                if(companyExist) {
                    throw new Error('Company exist');
                }

                const client = new Client(input);
                client.seller = ctx.user.id;
                return await client.save();
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        updateClient: async (_, { id, input }, ctx) => {
            try {
                let client = await Client.findById(id);
                if(!client) {
                    throw new Error('client not exist');
                }

                if(client.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }

                client = await Client.findOneAndUpdate({ _id: id}, input, { new: true });
                return client;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        deleteClient: async (_, { id }, ctx) => {
            try {
                let client = await Client.findById(id);
                if(!client) {
                    throw new Error('client not exist');
                }

                if(client.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }

                await Client.findOneAndDelete({ _id: id});
                return 'Client deleted';
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        newOrder: async (_, { input }, ctx) => {
            try {
                const { client } = input;
                let clientExist = await Client.findById(client);
                if(!clientExist) {
                    throw new Error('client not exist');
                }

                if(clientExist.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }

                for await (const article of input.order) {
                    const {id} = article;
                    const product = await Product.findById(id);

                    if (article.quantity > product.stock) {
                        throw new Error(`The article: ${product.name} exceeds the quantity available`);
                    } else {
                        product.stock = product.stock - article.quantity;
                        await product.save();
                    }
                }

                const newOrder = new Order(input);

                newOrder.seller = ctx.user.id;
                return await newOrder.save();
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        updateOrder: async (_, { id, input }, ctx) => {
            try {
                const { client } = input;
                const order = await Order.findById(id);
                if(!order) {
                    throw new Error('order not exist');
                }

                const clientExist = await Client.findById(client);
                if(!clientExist) {
                    throw new Error('client not exist');
                }

                if(clientExist.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }

                if(input.order) {
                    for await (const article of input.order) {
                        const { id } = article;
                        const product = await Product.findById(id);

                        if (article.quantity > product.stock) {
                            throw new Error(`The article: ${product.name} exceeds the quantity available`);
                        } else {
                            product.stock = product.stock - article.quantity;
                            await product.save();
                        }
                    }
                }

                return await Order.findOneAndUpdate({ _id: id}, input, { new: true });
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        deleteOrder: async (_, { id }, ctx) => {
            try {
                let order = await Order.findById(id);
                if(!order) {
                    throw new Error('order not exist');
                }

                if(order.seller.toString() !== ctx.user.id) {
                    throw new Error('you dont have permision');
                }

                await Order.findOneAndDelete({ _id: id});
                return 'Order deleted';
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
    }
}


module.exports = resolvers;

