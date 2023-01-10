// Element bindings
const connectBtn = document.querySelector("#connect");
const connectionIdInput = document.querySelector("#connectionIdInput");
const nameInput = document.querySelector("#nameInput");
const sendMessageBtn = document.querySelector("#sendMessage");
const messageInput = document.querySelector("#messageInput");
const messagesBox = document.querySelector(".messages");
const peerIdEl = document.querySelector(".myId");
const connectionListEl = document.querySelector(".connectionList");


function showMessage(message, connection = { peer: "" })
{
	const messageEl = document.createElement("div");
	messageEl.classList.add("message");

	const userEl = document.createElement("span");
	userEl.classList.add("user");
	userEl.title = connection.peer || "";
	userEl.append(message.user || connection.peer || "");

	messageEl.append(userEl, message.text);

	messagesBox.append(messageEl);
}

const connections = {};

const peer = new Peer();

peer.on("open", peerId =>
{
	console.log(`Got ID: ${ peerId }`);
	peerIdEl.innerHTML = "";
	peerIdEl.append(peerId);
});

peer.on("connection", conn =>
{
	bindNewConnectionEvents(conn);
});

function connect(userId)
{
	if (connections[userId])
		return;

	const conn = peer.connect(userId);
	bindNewConnectionEvents(conn);
}

function bindNewConnectionEvents(conn)
{
	let connectionEl = null;

	conn.on("open", () =>
	{
		connections[conn.peer] = conn;
		showMessage({ text: `${ conn.peer } joined the chat` });

		conn.send({ connections: Object.keys(connections) });

		connectionEl = document.createElement("div");
		connectionEl.append(conn.peer);
		connectionListEl.append(connectionEl);
	});

	conn.on("close", () =>
	{
		delete connections[conn.peer];
		showMessage({ text: `${ conn.peer } left the chat` });
		connectionEl.remove();
	});

	conn.on("data", data =>
	{
		// If recieved client list
		if (data.connections)
		{
			for (const connId of data.connections)
			{
				connect(connId);
			}

			return;
		}
		
		showMessage(data, conn);
	});
}

sendMessageBtn.addEventListener("click", () =>
{
	const messageTxt = messageInput.value;
	messageInput.value = "";

	if (!messageTxt)
		return;

	for (const connId in connections)
	{
		const conn = connections[connId];

		conn.send({ text: messageTxt, user: nameInput.value || "Anonymous" });
	}

	showMessage({ text: messageTxt }, { peer: "Me" });

});

connectBtn.addEventListener("click", () =>
{
	const connId = connectionIdInput.value.trim();
	connectionIdInput.value = "";

	if (!connId)
		return;

	connect(connId);
});
