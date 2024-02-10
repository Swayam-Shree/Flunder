export default function ChatBubble({ message, fromSelf }) {
	return (<div>
		{
			fromSelf ? (<div>
				<div className="text-red-400" >{message}</div>
			</div>) : (<div>
				<div className="text-blue-400" >{message}</div>
			</div>)
		}
	</div>);
}