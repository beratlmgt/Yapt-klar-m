let chats = [
    {
        title: "Yeni sohbet",
        messages: [
            { sender: "bot", text: "Merhaba gardaşım, ben BertoAI. Ne yapıyoruz bugün?" }
        ]
    }
];

let activeChatIndex = 0;

function renderChat() {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    chats[activeChatIndex].messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.sender}`;
        div.textContent = msg.text;
        chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderHistory() {
    const chatHistory = document.getElementById("chatHistory");
    chatHistory.innerHTML = "";

    chats.forEach((chat, index) => {
        const item = document.createElement("div");
        item.className = "history-item" + (index === activeChatIndex ? " active" : "");
        item.innerHTML = `
            <span>${chat.title}</span>
            <button class="delete-btn" onclick="deleteChat(${index}, event)">🗑️</button>
        `;

        item.onclick = () => {

            activeChatIndex = index;

            renderChat();
            renderHistory();

            if(window.innerWidth <= 768){
                document.querySelector(".sidebar").classList.add("hidden");
            }

        };

        item.addEventListener("touchstart", () => {

            if(window.innerWidth <= 768){
            document.querySelector(".sidebar").classList.add("hidden");
            }

        });

        chatHistory.appendChild(item);
    });
}

async function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (message === "") return;

    if (chats[activeChatIndex].title === "Yeni sohbet") {
        chats[activeChatIndex].title =
            message.length > 22 ? message.slice(0, 22) + "..." : message;
    }

    chats[activeChatIndex].messages.push({ sender: "user", text: message });
    input.value = "";

    renderChat();
    renderHistory();

    chats[activeChatIndex].messages.push({ sender: "bot", text: "Yazıyor..." });
    renderChat();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: message})
        });

        const data = await response.json();

        chats[activeChatIndex].messages[chats[activeChatIndex].messages.length - 1].text = data.response;
    } catch (error) {
        chats[activeChatIndex].messages[chats[activeChatIndex].messages.length - 1].text =
            "Gardaşım sistemde ufak hata var, API kotasını kontrol et.";
    }

    renderChat();
}

function newChat() {
    chats.unshift({
        title: "Yeni sohbet",
        messages: [
            { sender: "bot", text: "Merhaba gardaşım, ben BertoAI. Ne yapıyoruz bugün?" }
        ]
    });

    activeChatIndex = 0;
    renderChat();
    renderHistory();
}

document.getElementById("messageInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function deleteChat(index, event) {

    event.stopPropagation();

    if (chats.length === 1) {
        alert("Son sohbet silinemez gardaşım.");
        return;
    }

    fetch("/delete_chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
        title: chats[index].title
        })
    });

    chats.splice(index, 1);

    if (activeChatIndex >= chats.length) {
        activeChatIndex = chats.length - 1;
    }

    renderHistory();
    renderChat();
    saveCurrentChat();
}

document.getElementById("searchInput").addEventListener("input", function(){
    const searchText = this.value.toLowerCase();

    document.querySelectorAll(".history-item").forEach(item => {
        const title = item.innerText.toLowerCase();

        if(title.includes(searchText)){
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
});

const sidebar = document.querySelector(".sidebar");

document.getElementById("menuToggle").addEventListener("click", () => {

    sidebar.classList.toggle("hidden");

    if(sidebar.classList.contains("hidden")){
        
    }else{
        
    }

});

if(window.innerWidth <= 768){
    document.querySelector(".sidebar").classList.add("hidden");
}

function closeSidebar(){

    if(window.innerWidth <= 768){
        document.querySelector(".sidebar").classList.add("hidden");
    }

}

async function saveCurrentChat(){
    const chat = chats[activeChatIndex];

    await fetch("/save_chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            title: chat.title,
            messages: chat.messages
        })
    });
}

async function loadChatsFromDB(){

    const res = await fetch("/load_chats");
    const data = await res.json();

    if(data.length > 0){

        chats = data;

        activeChatIndex = 0;

        renderHistory();
        renderChat();
    }

}

loadChatsFromDB();



renderChat();
saveCurrentChat();
renderHistory();