export default function ChatBubble({ message, fromSelf }) {
	return (<div>
		{
			fromSelf ? (<div>
				<div className="bg-slate-50 text-red-400 text-right px-[10px]" >{message}</div>
			</div>) : (<div>
				<div className="bg-slate-50 text-blue-400 text-left px-[10px]" >{message}</div>
			</div>)
		}
	</div>);
}