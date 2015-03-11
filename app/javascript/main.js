// Get room from the browser url, create a room if one does not exist
var room = url.room;

if(typeof room === "undefined" || room === null) {
	room = chance.hammertime();
	location.href = location.href + "?room=" + room;
}

// Get the localVideo and remoteVideo elements
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

//Create an instance of Respoke
var client = new respoke.createClient({
	appId: "41dac36d-37d4-4c07-b92d-588b084266ce",
	developmentMode: true
});

// Setup some Respoke event handlers
client.listen("connect", function(e) {
	console.log("client.listen#connect", e);

	client.join({
		id: room,

		onSuccess: function(group) {
			this.group = group;

			group.listen("join", function(e) {
				console.log("group.listen#join");
			});

			group.listen("leave", function(e) {
				console.log("group.listen#leave");
			});

			group.getMembers({
				onSuccess: function(connections) {
					console.log("group.getMembers#onSuccess", connections);

					if(connections.length > 2) {
						console.log("connections.length > 2");

						var url = location.href.replace(/(room=)[^\&]+/, '$1' + chance.hammertime());
						var message = "Sorry, that room is full. Share this URL to video chat: ";

						document.getElementById("altMessage").innerHTML = message;
						document.getElementById("altUrl").innerHTML = url;
					} else {
						connections.forEach(function(connection){
							if(connection.endpointId !== client.endpointId) {
								startVideoCall(connection.endpointId);
							}
						});
					}
				}
			});
		}
	});
});

client.listen("disconnect", function(e) {
	console.log("client.listen#disconnect", e);
});

client.listen("call", function(e) {
	console.log("client.listen#call", e);

	call = e.call;

	if(call.caller !== true) {
		call.answer({
			videoLocalElement: localVideo,
			videoRemoteElement: remoteVideo
		});
	}

	call.listen("hangup", function(e) {
		console.log("call.listen#hangup", e);
		call = null;
	});
});

client.listen("message", function(e) {
	console.log("client.listen#message: ", e);
	handleMessages(e);
});

// Connect to Respoke
client.connect({
	endpointId: chance.email()
});


// Start video call with remote user
function startVideoCall(remoteEndpointId) {
	var remoteEndpoint = client.getEndpoint({
		id: remoteEndpointId
	});

	this.call = remoteEndpoint.startVideoCall({
		videoLocalElement: localVideo,
		videoRemoteElement: remoteVideo
	});
}

// Handle messages from remote user to update local user Instagram filter
function handleMessages(e) {
	console.log("handleMessages", e);

	var message = e.message.message;

	setFilter.apply(this, message);
}

// Instagram filter controls
var ul = document.getElementsByClassName("filters");

for(var i=0;i<ul.length;i++){
	ul[i].addEventListener("click", function(e) {
	  console.log("ul.addEventListener#click: ", e.target);

	  var idArray = e.target.id.split("-");

	  setFilter.apply(this, idArray);

	  group.sendMessage({message: idArray});
	});
}

function setFilter(person, filter) {
	var video = (person === "Me"? localVideo : remoteVideo);
	var on = document.getElementById(person + "-" + filter);
	var filterList = on.parentNode.children;

	for (var i=0;i<filterList.length;i++) {
		filterList[i].className="";
	}

	on.className = "on";
	video.className = "ig-" + filter.toLowerCase();
}
