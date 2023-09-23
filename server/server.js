const { createSchema, createYoga, createPubSub, pipe, Repeater, map } = require('graphql-yoga')
const { createServer } = require('http')
const { WebSocketServer } = require('ws')
const {useServer} = require('graphql-ws/lib/use/ws')

const messages = []
const pubSub = createPubSub()

const schema = createSchema({
	typeDefs: `
		type Message {
				id: ID!
				user: String!
				content: String!
		}

		type Query {
				messages: [Message!]
		}

		type Mutation {
			postMessage(user: String!, content: String!): ID!
		}

		type Subscription {
			messages: [Message!]
		}
	`,
	resolvers: {
		Query: {
			messages: () => messages
		},
		Mutation: {
			postMessage: (parent, { user, content }) => {
				const id = Math.random().toString(36).substring(2)
				messages.push({
					id,
					user,
					content
				})
				pubSub.publish('messages')
				return id
			}
		},
		Subscription: {
			messages: {
				subscribe: (parent, args) =>
					pipe(
						Repeater.merge([
							undefined,
							pubSub.subscribe('messages')
						]),
						map(() => messages)
					),
				resolve: payload => payload
					// const channel = Math.random().toString(36).substring(2)
					// return pubSub.asyncIterator(channel)
					// pubSub.subscribe('message')				
			}
		}
	}
})

const yoga = createYoga({
	schema, graphiql: {
		subscriptionsProtocol: 'ws',
	}
})

const server = createServer(yoga)

const wsServer = new WebSocketServer({
	server,
	path: yoga.graphqlEndpoint
})

useServer(
  {
    execute: (args) => args.rootValue.execute(args),
    subscribe: (args) => args.rootValue.subscribe(args),
    onSubscribe: async (ctx, msg) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } = yoga.getEnveloped({
        ...ctx,
        req: ctx.extra.request,
        socket: ctx.extra.socket,
        params: msg.payload
      })
 
      const args = {
        schema,
        operationName: msg.payload.operationName,
        document: parse(msg.payload.query),
        variableValues: msg.payload.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe
        }
      }
 
      const errors = validate(args.schema, args.document)
      if (errors.length) return errors
      return args
    }
  },
  wsServer
)


server.listen(4000, () => {
	console.log('Server is running on http://localhost:4000')
})