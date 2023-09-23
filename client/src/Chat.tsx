import { gql, useMutation, useSubscription} from '@apollo/client';
import { Button, Container, Flex, Input } from '@chakra-ui/react';
import { useState } from 'react';

const GET_MESSAGES = gql`
	subscription {
		messages {
			id
			content
			user
		}
	}
`

const POST_MESSAGE = gql`
	mutation ($user: String!, $content: String!) {
		postMessage(user: $user, content: $content)
	}
`

const Messages = ({ user }: { user: string }) => {
	// const { data } = useQuery(GET_MESSAGES)
	const {data} = useSubscription(GET_MESSAGES)
	if (!data) {
		return null
	}
	return (
		<>
			{
				data.messages.map((message:any) => (
					<div
						style={{
							display: 'flex',
							justifyContent: user === message.user ? 'flex-end' : 'flex-start',
							paddingBottom: '1em',
						}}
						key={message.id}
					>
						{user !== message.user && (
							<div
								style={{
									height: 50,
									width: 50,
									marginRight: '0.5em',
									border: '2px solid #e5e6ea',
									borderRadius: 25,
									textAlign: 'center',
									fontSize: '18pt',
									paddingTop: 5,
								}}
							>
								{message.user.slice(0, 2).toUpperCase()}
							</div>
						)}
						<div
							style={{
								background: user === message.user ? '#58bf56' : '#e5e6ea',
								color: user === message.user ? 'white' : 'black',
								padding: '1em',
								borderRadius: '1em',
								maxWidth: '60%',
							}}
						>
							{message.content}
						</div>
					</div>
				))
			}
		</>
	)
}

const Chat = () => {
	const [state, setState] = useState({
		user: 'Jack',
		content: '',
	})

	const [postMessage] = useMutation(POST_MESSAGE)

	const onSend = () => {
		if (state.content.trim().length === 0) {
			return
		}

		postMessage({
			variables: state,
			// refetchQueries: [{ query: GET_MESSAGES }]
		})

		setState({
			...state,
			content: ''
		})
	}

	return (
		<Container>
			<Messages user={state.user} />
			<Flex columnGap={5}>
				<Input
					width='30%'
					placeholder='User'
					value={state.user}
					onChange={(evt) => setState({
						...state,
						user: evt.target.value					
					})}
				/>
				<Input
					placeholder='Content'
					value={state.content}
					onChange={(evt) => setState({
						...state,
						content: evt.target.value					
					})}
					onKeyUp={(evt) => {
						if (evt.key === 'Enter') {
							onSend()
						}
					}}
				/>
				<Button colorScheme='blue' onClick={() => onSend()}>Send</Button>
			</Flex>
		</Container>
	)
}

export default Chat
