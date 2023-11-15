const { createServer } = require("http");
const { Server } = require("socket.io");
const prisma = require("./lib/prisma");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", async (socket) => {
  var map = await prisma.map.findMany();
  updateMap();

  async function updateMap() {
    var tempMap = await prisma.map.findMany();
    if (tempMap === map) {
      // console.log("No change");
      return;
    }
    // console.log("Change");
    map = tempMap;
    const newMap = tempMap.map((item) => ({
      coords: [item.x, item.y],
      colorHex: item.colorHex,
    }));
    socket.emit("update", newMap);
  }

  io.on("change", async (data) => {
    console.log(data);
    await prisma.map.update({
      where: {
        x: data.coords[0],
        y: data.coords[1],
      },
      data: {
        colorHex: data.colorHex,
      },
    });
  });

  const interval = setInterval(updateMap, 5000);

  socket.on("disconnect", () => {
    clearInterval(interval);
  });
});

httpServer.listen(4000);