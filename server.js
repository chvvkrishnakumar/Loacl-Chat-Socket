const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

const chatSchema = new mongoose.Schema({
    messages: [
        {
            userId: String,
            userName: String,
            message: String,
            profileImg: String,
            time: { type: Date, default: Date.now },
        },
    ],
});

const Chat = mongoose.model("Chat", chatSchema, "chats");

mongoose
    .connect("mongodb://localhost:27017/LocalChat", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

io.on("connection", async (socket) => {
    console.log("A user connected");

    const messages = await getAllMessages();
    io.emit("allMessages", messages);

    socket.on("chatMessage", async (data) => {
        if (data.message.length > 0) {
            await Chat.findOneAndUpdate(
                {},
                {
                    $push: {
                        messages: {
                            userId: data.userId,
                            userName: data.userName,
                            message: data.message,
                            profileImg: data.profileImg,
                            time: Date.now(),
                        },
                    },
                },
                { upsert: true, new: true }
            );
        }
        const updatedMessages = await getAllMessages();
        console.log(updatedMessages);
        io.emit("allMessages", updatedMessages);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

async function getAllMessages() {
    try {
        const chatDocument = await Chat.findOne({});
        return chatDocument ? chatDocument.messages : [];
    } catch (error) {
        console.error("Error retrieving messages from the database:", error);
        return [];
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
