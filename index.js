const { createServer } = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://place.pierregueroult.dev", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 4000;
const dataBaseUri = process.env.DATABASE_URL || "";

io.on("connection", async (socket) => {
  console.log("Nouvelle connexion");
  const client = new MongoClient(dataBaseUri);
  await client.connect();
  const db = client.db("pplace");
  // we look for a change in the map collection and we emit the change to the client

  const changeStream = db.collection("Map").watch();
  const changeStreamMessage = db.collection("Message").watch();

  changeStream.on("change", async (change) => {
    console.log("Changement de la map");
    const maps = await db.collection("Map").find().toArray();
    socket.emit("update", maps);
  });

  changeStreamMessage.on("change", async (change) => {
    console.log("Nouveau Message");
    if (!change.fullDocument) return;
    const message = {
      text: change.fullDocument.text,
      username: change.fullDocument.username,
    };
    socket.emit("new-message", message);
  });

  // we end the connection with the client when he disconnects
  socket.on("disconnect", () => {
    console.log("Déconnexion");
  });
});

httpServer.on("request", (req, res) => {
  if (req.url === "/health") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);
    res.end();
  }
});

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
